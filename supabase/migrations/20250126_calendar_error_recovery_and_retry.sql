-- Migration: Google Calendar Error Recovery and Retry System
-- Phase: Integration & Polish (Phase 10)
-- Description: Add retry queue, quota tracking, and error handling for Google Calendar sync

-- ==============================================================================
-- CALENDAR SYNC RETRY QUEUE TABLE
-- ==============================================================================
-- Stores failed calendar operations for automatic retry with exponential backoff

CREATE TABLE IF NOT EXISTS public.calendar_sync_retry_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Appointment reference
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,

  -- Operation details
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),

  -- Retry tracking
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ NOT NULL,

  -- Error information for debugging
  error_details JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient retry processing
-- Only index items that still need retrying (retry_count < 3)
CREATE INDEX idx_retry_queue_next_retry
  ON public.calendar_sync_retry_queue(next_retry_at)
  WHERE retry_count < 3;

-- Index for looking up retries by appointment
CREATE INDEX idx_retry_queue_appointment
  ON public.calendar_sync_retry_queue(appointment_id);

-- Index for monitoring retry counts
CREATE INDEX idx_retry_queue_retry_count
  ON public.calendar_sync_retry_queue(retry_count);

COMMENT ON TABLE public.calendar_sync_retry_queue IS 'Queue for retrying failed Google Calendar sync operations';
COMMENT ON COLUMN public.calendar_sync_retry_queue.operation IS 'Type of calendar operation: create, update, or delete';
COMMENT ON COLUMN public.calendar_sync_retry_queue.retry_count IS 'Number of retry attempts (max 3)';
COMMENT ON COLUMN public.calendar_sync_retry_queue.next_retry_at IS 'When to attempt next retry (exponential backoff)';
COMMENT ON COLUMN public.calendar_sync_retry_queue.error_details IS 'JSON object with error code, message, and context';

-- ==============================================================================
-- CALENDAR API QUOTA TABLE
-- ==============================================================================
-- Tracks daily Google Calendar API usage to prevent quota exhaustion

CREATE TABLE IF NOT EXISTS public.calendar_api_quota (
  date DATE PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Automatically clean up old quota records (keep last 30 days)
CREATE INDEX idx_quota_date ON public.calendar_api_quota(date);

COMMENT ON TABLE public.calendar_api_quota IS 'Daily quota tracking for Google Calendar API requests';
COMMENT ON COLUMN public.calendar_api_quota.request_count IS 'Number of API requests made today';
COMMENT ON COLUMN public.calendar_api_quota.last_updated IS 'Last time quota was incremented';

-- ==============================================================================
-- MODIFY CALENDAR_CONNECTIONS TABLE
-- ==============================================================================
-- Add error tracking and auto-pause functionality

ALTER TABLE public.calendar_connections
  ADD COLUMN IF NOT EXISTS consecutive_failures INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_sync_paused BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pause_reason TEXT;

-- Index for finding paused connections that need admin attention
CREATE INDEX IF NOT EXISTS idx_calendar_connections_paused
  ON public.calendar_connections(auto_sync_paused, paused_at)
  WHERE auto_sync_paused = true;

-- Index for monitoring failure rates
CREATE INDEX IF NOT EXISTS idx_calendar_connections_failures
  ON public.calendar_connections(consecutive_failures)
  WHERE consecutive_failures > 0;

COMMENT ON COLUMN public.calendar_connections.consecutive_failures IS 'Number of consecutive sync failures (resets on success)';
COMMENT ON COLUMN public.calendar_connections.auto_sync_paused IS 'Whether auto-sync is paused due to repeated failures';
COMMENT ON COLUMN public.calendar_connections.paused_at IS 'When auto-sync was paused';
COMMENT ON COLUMN public.calendar_connections.pause_reason IS 'Human-readable reason for pause (e.g., "Invalid token", "Quota exceeded")';

-- ==============================================================================
-- DATABASE FUNCTION: INCREMENT QUOTA
-- ==============================================================================
-- Safely increment daily API quota count

CREATE OR REPLACE FUNCTION public.increment_quota(target_date DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.calendar_api_quota (date, request_count, last_updated)
  VALUES (target_date, 1, now())
  ON CONFLICT (date)
  DO UPDATE SET
    request_count = public.calendar_api_quota.request_count + 1,
    last_updated = now();
END;
$$;

COMMENT ON FUNCTION public.increment_quota IS 'Increment API quota counter for given date (upserts if needed)';

-- ==============================================================================
-- DATABASE FUNCTION: CLEANUP OLD RETRY QUEUE ENTRIES
-- ==============================================================================
-- Remove old completed or failed retry attempts (run daily via cron)

CREATE OR REPLACE FUNCTION public.cleanup_retry_queue()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete entries older than 7 days that have either:
  -- 1. Exceeded retry limit (retry_count >= 3)
  -- 2. Associated appointment no longer exists (handled by CASCADE)
  DELETE FROM public.calendar_sync_retry_queue
  WHERE created_at < now() - INTERVAL '7 days'
    AND retry_count >= 3;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_retry_queue IS 'Delete retry queue entries older than 7 days that exceeded retry limit';

-- ==============================================================================
-- DATABASE FUNCTION: CLEANUP OLD QUOTA RECORDS
-- ==============================================================================
-- Remove quota records older than 30 days (run daily via cron)

CREATE OR REPLACE FUNCTION public.cleanup_quota_records()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.calendar_api_quota
  WHERE date < CURRENT_DATE - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_quota_records IS 'Delete quota records older than 30 days';

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

-- Enable RLS on new tables
ALTER TABLE public.calendar_sync_retry_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_api_quota ENABLE ROW LEVEL SECURITY;

-- Retry Queue Policies
-- Only admins can view retry queue
CREATE POLICY "Admins can view retry queue" ON public.calendar_sync_retry_queue
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can manage retry queue (via service role)
-- No policy needed - service role bypasses RLS

-- API Quota Policies
-- Only admins can view quota
CREATE POLICY "Admins can view quota" ON public.calendar_api_quota
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- HELPFUL VIEWS
-- ==============================================================================

-- View for monitoring retry queue health
CREATE OR REPLACE VIEW public.retry_queue_summary AS
SELECT
  operation,
  COUNT(*) as total_entries,
  AVG(retry_count) as avg_retries,
  MAX(retry_count) as max_retries,
  COUNT(*) FILTER (WHERE retry_count >= 3) as exceeded_limit,
  COUNT(*) FILTER (WHERE retry_count < 3) as pending_retries,
  MIN(next_retry_at) as next_retry_time
FROM public.calendar_sync_retry_queue
GROUP BY operation;

GRANT SELECT ON public.retry_queue_summary TO authenticated;

CREATE POLICY "Admins can view retry queue summary" ON public.retry_queue_summary
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- View for monitoring calendar connection health
CREATE OR REPLACE VIEW public.calendar_health_summary AS
SELECT
  COUNT(*) as total_connections,
  COUNT(*) FILTER (WHERE auto_sync_paused = true) as paused_connections,
  COUNT(*) FILTER (WHERE consecutive_failures > 0) as connections_with_failures,
  AVG(consecutive_failures) as avg_failures,
  MAX(consecutive_failures) as max_failures
FROM public.calendar_connections;

GRANT SELECT ON public.calendar_health_summary TO authenticated;

CREATE POLICY "Admins can view calendar health summary" ON public.calendar_health_summary
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
