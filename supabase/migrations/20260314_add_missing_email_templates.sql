-- Migration: Add missing email templates for 6 notification types
-- These types have email_enabled=true in notification_settings but no template,
-- causing sendNotification() to silently fail when trying to load the template.
--
-- NOTE: notification_settings uses 'notification_type' column (not 'type')
-- NOTE: notification_templates uses 'type' column
-- NOTE: notification_templates does NOT have a unique constraint on (type, channel),
--       so we use INSERT with a WHERE NOT EXISTS guard to prevent duplicate rows.

BEGIN;

-- 1. appointment_reminder email template
-- (SMS template already exists from Phase 8 seed)
INSERT INTO notification_templates (name, type, channel, subject_template, html_template, text_template, variables, is_active)
SELECT
  'Appointment Reminder Email',
  'appointment_reminder',
  'email',
  '{{pet_name}}''s Grooming Appointment Tomorrow',
  'appointment_reminder_email',
  NULL,
  '["customer_name", "pet_name", "service_name", "appointment_date", "appointment_time"]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM notification_templates WHERE type = 'appointment_reminder' AND channel = 'email'
);

-- 2. appointment_cancelled email template
INSERT INTO notification_templates (name, type, channel, subject_template, html_template, text_template, variables, is_active)
SELECT
  'Appointment Cancelled Email',
  'appointment_cancelled',
  'email',
  '{{pet_name}}''s Appointment Has Been Cancelled',
  'appointment_cancelled_email',
  NULL,
  '["customer_name", "pet_name", "service_name", "appointment_date", "appointment_time", "cancellation_reason", "cancelled_by", "rebook_url"]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM notification_templates WHERE type = 'appointment_cancelled' AND channel = 'email'
);

-- 3. appointment_rescheduled email template
-- (notification_settings row already exists from prior seed)
INSERT INTO notification_templates (name, type, channel, subject_template, html_template, text_template, variables, is_active)
SELECT
  'Appointment Rescheduled Email',
  'appointment_rescheduled',
  'email',
  '{{pet_name}}''s Appointment Has Been Rescheduled',
  'appointment_rescheduled_email',
  NULL,
  '["customer_name", "pet_name", "service_name", "original_date", "original_time", "new_date", "new_time"]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM notification_templates WHERE type = 'appointment_rescheduled' AND channel = 'email'
);

INSERT INTO notification_templates (name, type, channel, subject_template, html_template, text_template, variables, is_active)
SELECT
  'Appointment Rescheduled SMS',
  'appointment_rescheduled',
  'sms',
  NULL,
  NULL,
  'appointment_rescheduled_sms',
  '["pet_name", "new_date", "new_time"]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM notification_templates WHERE type = 'appointment_rescheduled' AND channel = 'sms'
);

-- 4. review_request email template
-- (notification_settings row already exists from prior seed)
INSERT INTO notification_templates (name, type, channel, subject_template, html_template, text_template, variables, is_active)
SELECT
  'Review Request Email',
  'review_request',
  'email',
  'How Was {{pet_name}}''s Grooming Experience?',
  'review_request_email',
  NULL,
  '["customer_name", "pet_name", "service_name", "review_url", "rebook_url"]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM notification_templates WHERE type = 'review_request' AND channel = 'email'
);

-- 5. waitlist_added email template
INSERT INTO notification_templates (name, type, channel, subject_template, html_template, text_template, variables, is_active)
SELECT
  'Waitlist Added Email',
  'waitlist_added',
  'email',
  '{{pet_name}} is on the Waitlist!',
  'waitlist_added_email',
  NULL,
  '["customer_name", "pet_name", "service_name", "requested_date", "time_preference", "position"]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM notification_templates WHERE type = 'waitlist_added' AND channel = 'email'
);

-- waitlist_added SMS template
INSERT INTO notification_templates (name, type, channel, subject_template, html_template, text_template, variables, is_active)
SELECT
  'Waitlist Added SMS',
  'waitlist_added',
  'sms',
  NULL,
  NULL,
  'waitlist_added_sms',
  '["pet_name", "service_name", "requested_date", "position"]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM notification_templates WHERE type = 'waitlist_added' AND channel = 'sms'
);

-- 6. waitlist_available email template (SMS template already exists from Phase 8 seed)
INSERT INTO notification_templates (name, type, channel, subject_template, html_template, text_template, variables, is_active)
SELECT
  'Waitlist Available Email',
  'waitlist_available',
  'email',
  'A Spot Opened Up for {{pet_name}}!',
  'waitlist_available_email',
  NULL,
  '["customer_name", "pet_name", "available_date", "available_time", "claim_link", "expiration_hours"]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM notification_templates WHERE type = 'waitlist_available' AND channel = 'email'
);

-- Update existing notification_settings rows to link email_template_id
-- for the types that now have email templates
UPDATE notification_settings
SET email_template_id = nt.id,
    updated_at = now()
FROM notification_templates nt
WHERE notification_settings.notification_type = nt.type
  AND nt.channel = 'email'
  AND notification_settings.notification_type IN (
    'appointment_reminder',
    'appointment_cancelled',
    'appointment_rescheduled',
    'review_request',
    'waitlist_added',
    'waitlist_available'
  )
  AND notification_settings.email_template_id IS NULL;

-- Update sms_template_id for types with new SMS templates
UPDATE notification_settings
SET sms_template_id = nt.id,
    sms_enabled = true,
    updated_at = now()
FROM notification_templates nt
WHERE notification_settings.notification_type = nt.type
  AND nt.channel = 'sms'
  AND notification_settings.notification_type IN (
    'appointment_rescheduled',
    'waitlist_added'
  )
  AND notification_settings.sms_template_id IS NULL;

COMMIT;
