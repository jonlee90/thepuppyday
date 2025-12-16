-- =============================================
-- Phase 8: Notification System Database Schema
-- Tasks: 0078-0079
-- =============================================
-- Description: Creates tables, indexes, functions, and triggers for the notification system
-- including templates, settings, version history, and enhancements to notifications_log

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: notification_templates
-- =============================================
-- Stores email and SMS notification templates with variable substitution
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT NOT NULL, -- 'booking_confirmation', 'appointment_reminder', etc.
  trigger_event TEXT NOT NULL, -- 'appointment_created', 'appointment_24h_reminder', etc.
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  subject_template TEXT, -- For email only
  html_template TEXT, -- For email only
  text_template TEXT NOT NULL, -- For SMS or email plain text
  variables JSONB DEFAULT '[]'::jsonb, -- Array of {name, description, required, max_length}
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE public.notification_templates IS 'Stores email and SMS notification templates with variable substitution';
COMMENT ON COLUMN public.notification_templates.variables IS 'JSON array of variable definitions: [{name, description, required, max_length}]';
COMMENT ON COLUMN public.notification_templates.type IS 'Notification type identifier (e.g., booking_confirmation, appointment_reminder)';
COMMENT ON COLUMN public.notification_templates.trigger_event IS 'Event that triggers this notification (e.g., appointment_created, appointment_24h_reminder)';
COMMENT ON COLUMN public.notification_templates.channel IS 'Delivery channel: email or sms';
COMMENT ON COLUMN public.notification_templates.version IS 'Template version number, auto-incremented on content changes';

-- =============================================
-- TABLE: notification_settings
-- =============================================
-- Configuration and statistics for each notification type
CREATE TABLE IF NOT EXISTS public.notification_settings (
  notification_type TEXT PRIMARY KEY, -- 'booking_confirmation', 'appointment_reminder', etc.
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT true,
  email_template_id UUID REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  sms_template_id UUID REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  schedule_cron TEXT, -- For scheduled notifications (e.g., '0 9 * * *')
  schedule_enabled BOOLEAN DEFAULT false,
  max_retries INTEGER NOT NULL DEFAULT 2, -- Issue #7: Added NOT NULL
  retry_delays_seconds INTEGER[] NOT NULL DEFAULT ARRAY[30, 300], -- Issue #7: Added NOT NULL, [30s, 5min]
  last_sent_at TIMESTAMPTZ,
  total_sent_count BIGINT DEFAULT 0,
  total_failed_count BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Issue #6: Fixed 1:1 relationship between array length and max_retries
  CONSTRAINT retry_delays_valid CHECK (
    (max_retries = 0 AND array_length(retry_delays_seconds, 1) = 0) OR
    (max_retries > 0 AND array_length(retry_delays_seconds, 1) = max_retries)
  )
);

-- Add table comment
COMMENT ON TABLE public.notification_settings IS 'Configuration and statistics for each notification type';
COMMENT ON COLUMN public.notification_settings.schedule_cron IS 'Cron expression for scheduled notifications (e.g., 0 9 * * * for daily at 9 AM)';
COMMENT ON COLUMN public.notification_settings.retry_delays_seconds IS 'Array of delay seconds between retries (e.g., [30, 300] = 30s, then 5min)';
COMMENT ON COLUMN public.notification_settings.max_retries IS 'Maximum number of retry attempts for failed notifications';
COMMENT ON COLUMN public.notification_settings.last_sent_at IS 'Timestamp of last successfully sent notification of this type';
COMMENT ON COLUMN public.notification_settings.total_sent_count IS 'Total count of successfully sent notifications of this type';
COMMENT ON COLUMN public.notification_settings.total_failed_count IS 'Total count of failed notifications of this type';

-- =============================================
-- TABLE: notification_template_history
-- =============================================
-- Version history for notification template changes
CREATE TABLE IF NOT EXISTS public.notification_template_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES public.notification_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  channel TEXT NOT NULL,
  subject_template TEXT,
  html_template TEXT,
  text_template TEXT NOT NULL,
  variables JSONB,
  changed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, version)
);

-- Add table comment
COMMENT ON TABLE public.notification_template_history IS 'Version history for notification template changes';
COMMENT ON COLUMN public.notification_template_history.version IS 'Template version number at time of this snapshot';
COMMENT ON COLUMN public.notification_template_history.changed_by IS 'User who made the changes to this version';
COMMENT ON COLUMN public.notification_template_history.change_reason IS 'Optional description of why the template was changed';

-- =============================================
-- ALTER: notifications_log (existing table)
-- =============================================
-- Add new columns to existing notifications_log table
ALTER TABLE public.notifications_log
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_data JSONB, -- Variable values used for rendering
  ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retry_after TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS message_id TEXT; -- Provider message ID (Resend/Twilio)

-- Add UNIQUE constraint to message_id (Issue #1)
ALTER TABLE public.notifications_log
  ADD CONSTRAINT IF NOT EXISTS unique_message_id UNIQUE (message_id);

-- Add foreign key constraint for type to notification_settings (Issue #3)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_notifications_log_type'
  ) THEN
    ALTER TABLE public.notifications_log
      ADD CONSTRAINT fk_notifications_log_type
      FOREIGN KEY (type)
      REFERENCES public.notification_settings(notification_type)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- Add column comments
COMMENT ON COLUMN public.notifications_log.template_id IS 'Reference to the template used to generate this notification';
COMMENT ON COLUMN public.notifications_log.template_data IS 'JSON object containing variable values used to render the template';
COMMENT ON COLUMN public.notifications_log.retry_count IS 'Number of retry attempts made for this notification';
COMMENT ON COLUMN public.notifications_log.retry_after IS 'Timestamp when next retry should be attempted';
COMMENT ON COLUMN public.notifications_log.is_test IS 'Flag indicating if this is a test notification';
COMMENT ON COLUMN public.notifications_log.message_id IS 'Provider message ID from Resend or Twilio for tracking (unique)';

-- =============================================
-- INDEXES: notification_templates
-- =============================================
CREATE INDEX IF NOT EXISTS idx_notification_templates_type
  ON public.notification_templates(type);

CREATE INDEX IF NOT EXISTS idx_notification_templates_trigger
  ON public.notification_templates(trigger_event);

CREATE INDEX IF NOT EXISTS idx_notification_templates_channel
  ON public.notification_templates(channel);

CREATE INDEX IF NOT EXISTS idx_notification_templates_active
  ON public.notification_templates(is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_notification_templates_type_channel
  ON public.notification_templates(type, channel)
  WHERE is_active = true;

-- =============================================
-- INDEXES: notification_template_history
-- =============================================
CREATE INDEX IF NOT EXISTS idx_notification_template_history_template
  ON public.notification_template_history(template_id);

CREATE INDEX IF NOT EXISTS idx_notification_template_history_version
  ON public.notification_template_history(template_id, version DESC);

CREATE INDEX IF NOT EXISTS idx_notification_template_history_changed_by
  ON public.notification_template_history(changed_by)
  WHERE changed_by IS NOT NULL;

-- =============================================
-- INDEXES: notifications_log (new columns)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_notifications_log_template
  ON public.notifications_log(template_id)
  WHERE template_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_log_retry
  ON public.notifications_log(retry_after, retry_count)
  WHERE retry_after IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_log_status_type
  ON public.notifications_log(status, type);

CREATE INDEX IF NOT EXISTS idx_notifications_log_test
  ON public.notifications_log(is_test)
  WHERE is_test = true;

CREATE INDEX IF NOT EXISTS idx_notifications_log_message_id
  ON public.notifications_log(message_id)
  WHERE message_id IS NOT NULL;

-- =============================================
-- FUNCTION: update_notification_stats
-- =============================================
-- Updates statistics in notification_settings when notifications are sent or fail
-- Issue #2: Fixed race condition with atomic increment operations
CREATE OR REPLACE FUNCTION update_notification_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip test notifications for statistics (Issue #2)
  IF COALESCE(NEW.is_test, false) = true THEN
    RETURN NEW;
  END IF;

  -- Update notification_settings statistics when a notification is sent
  -- Use atomic increments to prevent race conditions (Issue #2)
  IF NEW.status = 'sent' AND (OLD.status IS NULL OR OLD.status != 'sent') THEN
    UPDATE public.notification_settings
    SET
      total_sent_count = total_sent_count + 1, -- Atomic increment
      last_sent_at = GREATEST(last_sent_at, COALESCE(NEW.sent_at, NOW())), -- Monotonic increase
      updated_at = NOW()
    WHERE notification_type = NEW.type;
  END IF;

  -- Update failure count atomically (Issue #2)
  IF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    UPDATE public.notification_settings
    SET
      total_failed_count = total_failed_count + 1, -- Atomic increment
      updated_at = NOW()
    WHERE notification_type = NEW.type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_notification_stats() IS 'Automatically updates notification statistics with atomic operations to prevent race conditions';

-- =============================================
-- TRIGGER: trigger_update_notification_stats
-- =============================================
DROP TRIGGER IF EXISTS trigger_update_notification_stats ON public.notifications_log;

CREATE TRIGGER trigger_update_notification_stats
  AFTER INSERT OR UPDATE OF status ON public.notifications_log
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_stats();

COMMENT ON TRIGGER trigger_update_notification_stats ON public.notifications_log IS 'Updates notification statistics when status changes';

-- =============================================
-- FUNCTION: save_template_version
-- =============================================
-- Saves previous version to history when template content is updated
-- Issue #5: Fixed race condition using advisory locks
CREATE OR REPLACE FUNCTION save_template_version()
RETURNS TRIGGER AS $$
DECLARE
  v_lock_key BIGINT;
  v_lock_acquired BOOLEAN;
BEGIN
  -- Save previous version to history when template is updated
  -- Only save if actual template content changed
  IF TG_OP = 'UPDATE' AND (
    OLD.subject_template IS DISTINCT FROM NEW.subject_template OR
    OLD.html_template IS DISTINCT FROM NEW.html_template OR
    OLD.text_template IS DISTINCT FROM NEW.text_template OR
    OLD.variables IS DISTINCT FROM NEW.variables
  ) THEN
    -- Issue #5: Use advisory lock to prevent concurrent version updates
    -- Convert UUID to BIGINT for advisory lock (use first 8 bytes)
    v_lock_key := ('x' || substring(OLD.id::text, 1, 16))::bit(64)::bigint;

    -- Try to acquire advisory lock (will wait if locked)
    v_lock_acquired := pg_try_advisory_xact_lock(v_lock_key);

    IF NOT v_lock_acquired THEN
      RAISE EXCEPTION 'Could not acquire lock for template versioning: %', OLD.id;
    END IF;

    -- Insert into history table
    INSERT INTO public.notification_template_history (
      template_id,
      version,
      name,
      description,
      type,
      trigger_event,
      channel,
      subject_template,
      html_template,
      text_template,
      variables,
      changed_by,
      created_at
    ) VALUES (
      OLD.id,
      OLD.version,
      OLD.name,
      OLD.description,
      OLD.type,
      OLD.trigger_event,
      OLD.channel,
      OLD.subject_template,
      OLD.html_template,
      OLD.text_template,
      OLD.variables,
      NEW.updated_by,
      OLD.updated_at
    )
    ON CONFLICT (template_id, version) DO NOTHING; -- Prevent duplicate history entries

    -- Increment version number
    NEW.version = OLD.version + 1;
    NEW.updated_at = NOW();

    -- Lock is automatically released at end of transaction (pg_try_advisory_xact_lock)
  ELSIF TG_OP = 'UPDATE' THEN
    -- Non-content updates (name, description, is_active, etc.)
    NEW.updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION save_template_version() IS 'Automatically saves template versions to history when content changes (uses advisory locks to prevent race conditions)';

-- =============================================
-- TRIGGER: trigger_save_template_version
-- =============================================
DROP TRIGGER IF EXISTS trigger_save_template_version ON public.notification_templates;

CREATE TRIGGER trigger_save_template_version
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION save_template_version();

COMMENT ON TRIGGER trigger_save_template_version ON public.notification_templates IS 'Saves template version history before updates';

-- =============================================
-- FUNCTION: update_updated_at_column
-- =============================================
-- Generic function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS: Auto-update updated_at timestamps
-- =============================================
DROP TRIGGER IF EXISTS trigger_notification_settings_updated_at ON public.notification_settings;

CREATE TRIGGER trigger_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SECURITY DEFINER FUNCTION PERMISSIONS (Issue #8)
-- =============================================
-- Revoke public access and grant specific permissions for SECURITY DEFINER functions
-- This prevents privilege escalation attacks

-- update_notification_stats function
REVOKE ALL ON FUNCTION update_notification_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_notification_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION update_notification_stats() TO service_role;

-- save_template_version function
REVOKE ALL ON FUNCTION save_template_version() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION save_template_version() TO authenticated;
GRANT EXECUTE ON FUNCTION save_template_version() TO service_role;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================
-- Enable RLS on all new tables
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_template_history ENABLE ROW LEVEL SECURITY;

-- notification_templates policies
CREATE POLICY "admins_all_access_notification_templates"
  ON public.notification_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "authenticated_read_active_templates"
  ON public.notification_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- notification_settings policies
CREATE POLICY "admins_all_access_notification_settings"
  ON public.notification_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "authenticated_read_notification_settings"
  ON public.notification_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- notification_template_history policies
CREATE POLICY "admins_all_access_template_history"
  ON public.notification_template_history
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =============================================
-- RLS POLICIES: notifications_log (Issue #9)
-- =============================================
-- Enhanced RLS policies for notifications_log table

-- Service role has full access (for system operations)
CREATE POLICY "service_role_all_access_notifications_log"
  ON public.notifications_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admins can view all notifications
CREATE POLICY "admins_read_all_notifications_log"
  ON public.notifications_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admins can insert/update notifications (for manual sends, testing)
CREATE POLICY "admins_insert_notifications_log"
  ON public.notifications_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "admins_update_notifications_log"
  ON public.notifications_log
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Customers can view their own notifications
CREATE POLICY "customers_view_own_notifications_log"
  ON public.notifications_log
  FOR SELECT
  TO authenticated
  USING (
    recipient_id = auth.uid() OR
    -- Allow viewing notifications related to their appointments
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.customer_id = auth.uid()
      AND (
        notifications_log.type LIKE 'booking_%' OR
        notifications_log.type LIKE 'appointment_%' OR
        notifications_log.type LIKE 'status_%' OR
        notifications_log.type LIKE 'report_card_%'
      )
    )
  );

-- =============================================
-- HELPER VIEWS
-- =============================================
-- View to see template statistics
CREATE OR REPLACE VIEW public.notification_template_stats AS
SELECT
  nt.id,
  nt.name,
  nt.type,
  nt.channel,
  nt.is_active,
  nt.version,
  COUNT(DISTINCT nl.id) as total_sent,
  COUNT(DISTINCT CASE WHEN nl.status = 'sent' THEN nl.id END) as successful_sent,
  COUNT(DISTINCT CASE WHEN nl.status = 'failed' THEN nl.id END) as failed_sent,
  MAX(nl.sent_at) as last_used_at,
  COUNT(DISTINCT nth.version) as version_count
FROM public.notification_templates nt
LEFT JOIN public.notifications_log nl ON nl.template_id = nt.id AND nl.is_test = false
LEFT JOIN public.notification_template_history nth ON nth.template_id = nt.id
GROUP BY nt.id, nt.name, nt.type, nt.channel, nt.is_active, nt.version;

COMMENT ON VIEW public.notification_template_stats IS 'Statistics view for notification templates showing usage metrics';

-- Grant access to views
GRANT SELECT ON public.notification_template_stats TO authenticated;

-- =============================================
-- COMPLETE
-- =============================================
-- Migration completed successfully
