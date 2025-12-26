-- Migration: Google Calendar Integration
-- Phase: Calendar Integration Phase 1
-- Tasks: 0002-database-migration
-- Description: Add tables for Google Calendar OAuth, event mapping, and sync logging

-- ==============================================================================
-- TABLE: calendar_connections
-- Description: Stores OAuth tokens and Google Calendar metadata for admin connections
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- OAuth tokens (encrypted at rest using AES-256-GCM)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,

  -- Google Calendar metadata
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  calendar_email TEXT NOT NULL,

  -- Webhook channel info for push notifications
  webhook_channel_id TEXT,
  webhook_resource_id TEXT,
  webhook_expiration TIMESTAMPTZ,

  -- Connection status
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints: Only one connection per admin (business-wide)
  CONSTRAINT uq_calendar_connections_admin_id UNIQUE(admin_id)
);

-- Index for active connection lookups
CREATE INDEX IF NOT EXISTS idx_calendar_connections_active
  ON public.calendar_connections(admin_id)
  WHERE is_active = true;

-- Index for webhook expiration checks
CREATE INDEX IF NOT EXISTS idx_calendar_connections_webhook_expiry
  ON public.calendar_connections(webhook_expiration)
  WHERE webhook_expiration IS NOT NULL;

-- Enable RLS
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- TABLE: calendar_event_mapping
-- Description: Maps appointments to Google Calendar event IDs for bidirectional sync
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.calendar_event_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.calendar_connections(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,

  -- Sync metadata
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('push', 'pull')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints: One mapping per appointment per connection
  CONSTRAINT uq_calendar_event_mapping_appointment UNIQUE(appointment_id, connection_id),
  CONSTRAINT uq_calendar_event_mapping_google_event UNIQUE(google_event_id, connection_id)
);

-- Index for appointment lookups (frequent: check if appointment is synced)
CREATE INDEX IF NOT EXISTS idx_calendar_event_mapping_appointment
  ON public.calendar_event_mapping(appointment_id);

-- Index for Google event lookups (webhook processing)
CREATE INDEX IF NOT EXISTS idx_calendar_event_mapping_google_event
  ON public.calendar_event_mapping(google_event_id);

-- Index for connection-based queries
CREATE INDEX IF NOT EXISTS idx_calendar_event_mapping_connection
  ON public.calendar_event_mapping(connection_id);

-- Enable RLS
ALTER TABLE public.calendar_event_mapping ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- TABLE: calendar_sync_log
-- Description: Audit trail of all sync operations for debugging and monitoring
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES public.calendar_connections(id) ON DELETE SET NULL,

  -- Sync details
  sync_type TEXT NOT NULL CHECK (sync_type IN ('push', 'pull', 'bulk', 'webhook')),
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete', 'import')),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  google_event_id TEXT,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  error_code TEXT,

  -- Metadata (JSONB for flexible additional context)
  details JSONB,
  duration_ms INTEGER,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for recent sync history queries (DESC for latest first)
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_created_at
  ON public.calendar_sync_log(created_at DESC);

-- Index for error tracking and monitoring
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_failed
  ON public.calendar_sync_log(status)
  WHERE status = 'failed';

-- Index for appointment history lookups
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_appointment
  ON public.calendar_sync_log(appointment_id)
  WHERE appointment_id IS NOT NULL;

-- Index for connection-based queries
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_connection
  ON public.calendar_sync_log(connection_id)
  WHERE connection_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.calendar_sync_log ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- SETTINGS: Calendar Sync Preferences
-- Description: Insert default calendar sync settings into settings table
-- ==============================================================================

-- Insert default calendar sync settings if not exists
INSERT INTO public.settings (key, value)
VALUES (
  'calendar_sync_settings',
  '{
    "sync_statuses": ["confirmed", "checked_in"],
    "auto_sync_enabled": true,
    "sync_past_appointments": false,
    "sync_completed_appointments": false,
    "notification_preferences": {
      "send_success_notifications": false,
      "send_failure_notifications": true
    }
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- RLS POLICIES: Admin-Only Access
-- Description: Only admin users can access calendar integration tables
-- ==============================================================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for calendar_connections
DROP POLICY IF EXISTS "Admin users can view calendar connections" ON public.calendar_connections;
CREATE POLICY "Admin users can view calendar connections"
  ON public.calendar_connections
  FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admin users can insert calendar connections" ON public.calendar_connections;
CREATE POLICY "Admin users can insert calendar connections"
  ON public.calendar_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin() AND admin_id = auth.uid());

DROP POLICY IF EXISTS "Admin users can update their calendar connections" ON public.calendar_connections;
CREATE POLICY "Admin users can update their calendar connections"
  ON public.calendar_connections
  FOR UPDATE
  TO authenticated
  USING (is_admin() AND admin_id = auth.uid());

DROP POLICY IF EXISTS "Admin users can delete their calendar connections" ON public.calendar_connections;
CREATE POLICY "Admin users can delete their calendar connections"
  ON public.calendar_connections
  FOR DELETE
  TO authenticated
  USING (is_admin() AND admin_id = auth.uid());

-- RLS Policies for calendar_event_mapping
DROP POLICY IF EXISTS "Admin users can view event mappings" ON public.calendar_event_mapping;
CREATE POLICY "Admin users can view event mappings"
  ON public.calendar_event_mapping
  FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admin users can manage event mappings" ON public.calendar_event_mapping;
CREATE POLICY "Admin users can manage event mappings"
  ON public.calendar_event_mapping
  FOR ALL
  TO authenticated
  USING (is_admin());

-- RLS Policies for calendar_sync_log
DROP POLICY IF EXISTS "Admin users can view sync logs" ON public.calendar_sync_log;
CREATE POLICY "Admin users can view sync logs"
  ON public.calendar_sync_log
  FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admin users can insert sync logs" ON public.calendar_sync_log;
CREATE POLICY "Admin users can insert sync logs"
  ON public.calendar_sync_log
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- ==============================================================================
-- TRIGGER: Updated At Timestamp
-- Description: Automatically update updated_at column on row updates
-- ==============================================================================

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to calendar_connections
DROP TRIGGER IF EXISTS update_calendar_connections_updated_at ON public.calendar_connections;
CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON public.calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to calendar_event_mapping
DROP TRIGGER IF EXISTS update_calendar_event_mapping_updated_at ON public.calendar_event_mapping;
CREATE TRIGGER update_calendar_event_mapping_updated_at
  BEFORE UPDATE ON public.calendar_event_mapping
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- COMMENTS: Table and Column Documentation
-- ==============================================================================

COMMENT ON TABLE public.calendar_connections IS 'Stores OAuth tokens and Google Calendar metadata for admin calendar connections';
COMMENT ON COLUMN public.calendar_connections.access_token IS 'Encrypted OAuth access token (AES-256-GCM)';
COMMENT ON COLUMN public.calendar_connections.refresh_token IS 'Encrypted OAuth refresh token (AES-256-GCM)';
COMMENT ON COLUMN public.calendar_connections.webhook_channel_id IS 'Google Calendar push notification channel ID';
COMMENT ON COLUMN public.calendar_connections.webhook_resource_id IS 'Google Calendar push notification resource ID';

COMMENT ON TABLE public.calendar_event_mapping IS 'Maps appointments to Google Calendar event IDs for bidirectional sync';
COMMENT ON COLUMN public.calendar_event_mapping.sync_direction IS 'Direction of sync: push (app to calendar) or pull (calendar to app)';

COMMENT ON TABLE public.calendar_sync_log IS 'Audit trail of all calendar sync operations';
COMMENT ON COLUMN public.calendar_sync_log.sync_type IS 'Type of sync: push, pull, bulk, or webhook';
COMMENT ON COLUMN public.calendar_sync_log.details IS 'Additional context in JSON format (e.g., changed fields)';

-- ==============================================================================
-- ROLLBACK SCRIPT (stored in comments for reference)
-- ==============================================================================

/*
-- To rollback this migration, execute the following SQL:

-- Drop RLS policies
DROP POLICY IF EXISTS "Admin users can delete their calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Admin users can update their calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Admin users can insert calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Admin users can view calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Admin users can insert sync logs" ON public.calendar_sync_log;
DROP POLICY IF EXISTS "Admin users can view sync logs" ON public.calendar_sync_log;
DROP POLICY IF EXISTS "Admin users can manage event mappings" ON public.calendar_event_mapping;
DROP POLICY IF EXISTS "Admin users can view event mappings" ON public.calendar_event_mapping;

-- Drop triggers
DROP TRIGGER IF EXISTS update_calendar_event_mapping_updated_at ON public.calendar_event_mapping;
DROP TRIGGER IF EXISTS update_calendar_connections_updated_at ON public.calendar_connections;

-- Drop tables (cascade will remove indexes and constraints)
DROP TABLE IF EXISTS public.calendar_sync_log CASCADE;
DROP TABLE IF EXISTS public.calendar_event_mapping CASCADE;
DROP TABLE IF EXISTS public.calendar_connections CASCADE;

-- Drop helper function
DROP FUNCTION IF EXISTS public.is_admin();

-- Remove calendar sync settings
DELETE FROM public.settings WHERE key = 'calendar_sync_settings';
*/
