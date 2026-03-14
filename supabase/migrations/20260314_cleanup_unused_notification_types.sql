-- Migration: Remove 8 unused notification types
-- These types were seeded in Phase 8 but never implemented:
-- No email templates, no trigger functions, no SMS templates, no log entries
--
-- NOTE: notification_settings uses 'notification_type' column (not 'type')
-- NOTE: notification_templates uses 'type' column

BEGIN;

-- Delete notification_settings rows
-- (notification_settings primary key is notification_type)
DELETE FROM notification_settings
WHERE notification_type IN (
  'status_checked_in',
  'status_in_progress',
  'status_completed',
  'status_ready',
  'membership_activated',
  'membership_renewed',
  'membership_expiring',
  'membership_cancelled'
);

-- Delete notification_templates rows for unused types
-- (Only status_checked_in and status_ready have template rows; others never had any)
DELETE FROM notification_templates
WHERE type IN (
  'status_checked_in',
  'status_in_progress',
  'status_completed',
  'status_ready',
  'membership_activated',
  'membership_renewed',
  'membership_expiring',
  'membership_cancelled'
);

COMMIT;
