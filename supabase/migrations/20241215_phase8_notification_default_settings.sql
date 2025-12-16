-- =============================================
-- Phase 8: Default Notification Settings & Templates
-- Task: 0080
-- =============================================
-- Description: Seeds default notification settings and starter templates
-- for all notification types in The Puppy Day system

-- =============================================
-- MIGRATION DEPENDENCY CHECK (Issue #10)
-- =============================================
-- Verify that schema migration has run before settings migration
DO $$
BEGIN
  -- Check if notification_templates table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'notification_templates'
  ) THEN
    RAISE EXCEPTION 'Required table notification_templates does not exist. Please run 20241215_phase8_notification_system_schema.sql first.';
  END IF;

  -- Check if notification_settings table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'notification_settings'
  ) THEN
    RAISE EXCEPTION 'Required table notification_settings does not exist. Please run 20241215_phase8_notification_system_schema.sql first.';
  END IF;

  -- Check if notification_template_history table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'notification_template_history'
  ) THEN
    RAISE EXCEPTION 'Required table notification_template_history does not exist. Please run 20241215_phase8_notification_system_schema.sql first.';
  END IF;

  -- Check if notifications_log has new columns from schema migration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notifications_log'
    AND column_name = 'template_id'
  ) THEN
    RAISE EXCEPTION 'Required column notifications_log.template_id does not exist. Please run 20241215_phase8_notification_system_schema.sql first.';
  END IF;

  RAISE NOTICE 'Migration dependency check passed: All required schema objects exist.';
END $$;

-- =============================================
-- SEED: Default Notification Settings
-- =============================================
-- Insert default notification settings for all notification types
INSERT INTO public.notification_settings (
  notification_type,
  email_enabled,
  sms_enabled,
  schedule_enabled,
  schedule_cron,
  max_retries,
  retry_delays_seconds
) VALUES
  -- Booking & Appointment Notifications
  ('booking_confirmation', true, true, false, NULL, 2, ARRAY[30, 300]),
  ('appointment_reminder', false, true, true, '0 * * * *', 2, ARRAY[30, 300]), -- Hourly check for 24h reminders
  ('appointment_cancelled', true, true, false, NULL, 1, ARRAY[30]),
  ('appointment_rescheduled', true, true, false, NULL, 1, ARRAY[30]),

  -- Status Update Notifications
  ('status_checked_in', false, true, false, NULL, 1, ARRAY[30]),
  ('status_in_progress', false, true, false, NULL, 1, ARRAY[30]),
  ('status_ready', false, true, false, NULL, 1, ARRAY[30]),
  ('status_completed', false, true, false, NULL, 1, ARRAY[30]),

  -- Report Card Notifications
  ('report_card_ready', true, true, false, NULL, 2, ARRAY[30, 300]),

  -- Waitlist Notifications
  ('waitlist_added', true, true, false, NULL, 1, ARRAY[30]),
  ('waitlist_available', false, true, false, NULL, 2, ARRAY[30, 300]), -- High priority

  -- Retention & Marketing Notifications
  ('retention_reminder', true, true, true, '0 9 * * *', 2, ARRAY[30, 300]), -- Daily at 9 AM
  ('birthday_greeting', true, false, true, '0 8 * * *', 1, ARRAY[300]), -- Daily at 8 AM
  ('review_request', true, false, false, NULL, 1, ARRAY[300]),

  -- Payment Notifications
  ('payment_success', true, false, false, NULL, 1, ARRAY[30]),
  ('payment_failed', true, false, false, NULL, 0, ARRAY[]::INTEGER[]),
  ('payment_reminder', true, false, false, NULL, 0, ARRAY[]::INTEGER[]),
  ('refund_processed', true, false, false, NULL, 1, ARRAY[30]),

  -- Membership Notifications
  ('membership_activated', true, false, false, NULL, 1, ARRAY[30]),
  ('membership_expiring', true, false, true, '0 9 * * *', 1, ARRAY[300]), -- Daily at 9 AM
  ('membership_expired', true, false, false, NULL, 1, ARRAY[30]),
  ('membership_cancelled', true, false, false, NULL, 1, ARRAY[30]),

  -- Admin Notifications
  ('admin_new_booking', false, false, false, NULL, 1, ARRAY[30]),
  ('admin_cancellation', false, false, false, NULL, 1, ARRAY[30]),
  ('admin_no_show', false, false, false, NULL, 1, ARRAY[30])

ON CONFLICT (notification_type) DO NOTHING;

-- =============================================
-- SEED: Starter Email Templates
-- =============================================
-- Booking Confirmation Email Template
INSERT INTO public.notification_templates (
  name,
  description,
  type,
  trigger_event,
  channel,
  subject_template,
  html_template,
  text_template,
  variables,
  is_active
) VALUES (
  'Booking Confirmation Email',
  'Email sent when customer books an appointment',
  'booking_confirmation',
  'appointment_created',
  'email',
  'Appointment Confirmed - {{date}} at {{time}}',
  '<html><body><h1>Hi {{customer_name}},</h1><p>Your appointment for <strong>{{pet_name}}</strong> has been confirmed!</p><h2>Appointment Details:</h2><ul><li><strong>Date:</strong> {{date}}</li><li><strong>Time:</strong> {{time}}</li><li><strong>Service:</strong> {{service_name}}</li><li><strong>Price:</strong> {{price}}</li></ul><p>We look forward to pampering {{pet_name}}!</p><p>Best regards,<br>The Puppy Day Team</p><p><small>14936 Leffingwell Rd, La Mirada, CA 90638<br>(657) 252-2903</small></p></body></html>',
  'Hi {{customer_name}}, your appointment for {{pet_name}} is confirmed on {{date}} at {{time}}. Service: {{service_name}}. Price: {{price}}. See you soon! - The Puppy Day',
  '[
    {"name": "customer_name", "description": "Customer first name", "required": true, "max_length": 50},
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50},
    {"name": "date", "description": "Appointment date", "required": true, "max_length": 20},
    {"name": "time", "description": "Appointment time", "required": true, "max_length": 20},
    {"name": "service_name", "description": "Service name", "required": true, "max_length": 100},
    {"name": "price", "description": "Total price", "required": true, "max_length": 20}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO NOTHING;

-- Appointment Reminder SMS Template
INSERT INTO public.notification_templates (
  name,
  description,
  type,
  trigger_event,
  channel,
  subject_template,
  html_template,
  text_template,
  variables,
  is_active
) VALUES (
  'Appointment Reminder SMS',
  'SMS sent 24 hours before appointment',
  'appointment_reminder',
  'appointment_24h_reminder',
  'sms',
  NULL,
  NULL,
  'Hi {{customer_name}}! Reminder: {{pet_name}}''s grooming appointment is tomorrow at {{time}}. Reply CONFIRM to confirm or call us at (657) 252-2903. - The Puppy Day',
  '[
    {"name": "customer_name", "description": "Customer first name", "required": true, "max_length": 50},
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50},
    {"name": "time", "description": "Appointment time", "required": true, "max_length": 20}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO NOTHING;

-- Report Card Ready Email Template
INSERT INTO public.notification_templates (
  name,
  description,
  type,
  trigger_event,
  channel,
  subject_template,
  html_template,
  text_template,
  variables,
  is_active
) VALUES (
  'Report Card Ready Email',
  'Email sent when grooming report card is ready',
  'report_card_ready',
  'report_card_created',
  'email',
  '{{pet_name}}''s Grooming Report Card is Ready!',
  '<html><body><h1>Hi {{customer_name}},</h1><p>{{pet_name}} had a great grooming session today!</p><p>View the full report card with before/after photos:</p><p><a href="{{report_url}}" style="background-color: #434E54; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View Report Card</a></p><p>{{groomer_notes}}</p><p>Next recommended grooming: {{next_grooming_date}}</p><p>Thank you for trusting us with {{pet_name}}!</p><p>Best regards,<br>The Puppy Day Team</p></body></html>',
  'Hi {{customer_name}}, {{pet_name}}''s grooming report card is ready! View it here: {{report_url}}. Next grooming: {{next_grooming_date}}. - The Puppy Day',
  '[
    {"name": "customer_name", "description": "Customer first name", "required": true, "max_length": 50},
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50},
    {"name": "report_url", "description": "URL to report card", "required": true, "max_length": 500},
    {"name": "groomer_notes", "description": "Groomer notes", "required": false, "max_length": 500},
    {"name": "next_grooming_date", "description": "Next recommended grooming date", "required": false, "max_length": 20}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO NOTHING;

-- Status Ready SMS Template
INSERT INTO public.notification_templates (
  name,
  description,
  type,
  trigger_event,
  channel,
  subject_template,
  html_template,
  text_template,
  variables,
  is_active
) VALUES (
  'Ready for Pickup SMS',
  'SMS sent when pet is ready for pickup',
  'status_ready',
  'appointment_status_ready',
  'sms',
  NULL,
  NULL,
  'Hi {{customer_name}}! {{pet_name}} is all done and ready for pickup! Come by anytime. We can''t wait to show you how great they look! - The Puppy Day',
  '[
    {"name": "customer_name", "description": "Customer first name", "required": true, "max_length": 50},
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO NOTHING;

-- Waitlist Available SMS Template
INSERT INTO public.notification_templates (
  name,
  description,
  type,
  trigger_event,
  channel,
  subject_template,
  html_template,
  text_template,
  variables,
  is_active
) VALUES (
  'Waitlist Spot Available SMS',
  'SMS sent when a waitlist spot becomes available',
  'waitlist_available',
  'waitlist_spot_opened',
  'sms',
  NULL,
  NULL,
  'Great news {{customer_name}}! A spot just opened up on {{date}} at {{time}}. Book now: {{booking_url}} - First come, first served! - The Puppy Day',
  '[
    {"name": "customer_name", "description": "Customer first name", "required": true, "max_length": 50},
    {"name": "date", "description": "Available date", "required": true, "max_length": 20},
    {"name": "time", "description": "Available time", "required": true, "max_length": 20},
    {"name": "booking_url", "description": "Direct booking URL", "required": true, "max_length": 500}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO NOTHING;

-- Retention Reminder Email Template
INSERT INTO public.notification_templates (
  name,
  description,
  type,
  trigger_event,
  channel,
  subject_template,
  html_template,
  text_template,
  variables,
  is_active
) VALUES (
  'Retention Reminder Email',
  'Email sent to customers who haven''t booked in a while',
  'retention_reminder',
  'customer_inactive_30d',
  'email',
  'We Miss {{pet_name}}! Special Offer Inside',
  '<html><body><h1>Hi {{customer_name}},</h1><p>It''s been a while since we''ve seen {{pet_name}}, and we miss that adorable face!</p><p>It''s time for {{pet_name}}''s grooming appointment. Book now and get <strong>{{discount_amount}} off</strong> your next visit!</p><p><a href="{{booking_url}}" style="background-color: #434E54; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Book Appointment</a></p><p>Use code: <strong>{{promo_code}}</strong></p><p>We can''t wait to pamper {{pet_name}} again!</p><p>Best regards,<br>The Puppy Day Team</p></body></html>',
  'Hi {{customer_name}}, we miss {{pet_name}}! Book your next grooming and get {{discount_amount}} off with code {{promo_code}}. Book here: {{booking_url}} - The Puppy Day',
  '[
    {"name": "customer_name", "description": "Customer first name", "required": true, "max_length": 50},
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50},
    {"name": "discount_amount", "description": "Discount amount", "required": true, "max_length": 20},
    {"name": "promo_code", "description": "Promotional code", "required": true, "max_length": 20},
    {"name": "booking_url", "description": "Booking URL", "required": true, "max_length": 500}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO NOTHING;

-- Review Request Email Template
INSERT INTO public.notification_templates (
  name,
  description,
  type,
  trigger_event,
  channel,
  subject_template,
  html_template,
  text_template,
  variables,
  is_active
) VALUES (
  'Review Request Email',
  'Email requesting customer review after appointment',
  'review_request',
  'appointment_completed_24h',
  'email',
  'How Did {{pet_name}} Like Their Grooming?',
  '<html><body><h1>Hi {{customer_name}},</h1><p>We hope {{pet_name}} loved their recent grooming session!</p><p>We''d love to hear about your experience. Your feedback helps us continue providing the best care for your furry friends.</p><p><a href="{{review_url}}" style="background-color: #434E54; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Leave a Review</a></p><p>Thank you for choosing The Puppy Day!</p><p>Best regards,<br>The Puppy Day Team</p></body></html>',
  'Hi {{customer_name}}, we hope {{pet_name}} loved their grooming! Please share your experience: {{review_url}}. Thank you! - The Puppy Day',
  '[
    {"name": "customer_name", "description": "Customer first name", "required": true, "max_length": 50},
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50},
    {"name": "review_url", "description": "Review form URL", "required": true, "max_length": 500}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO NOTHING;

-- Payment Failed Email Template
INSERT INTO public.notification_templates (
  name,
  description,
  type,
  trigger_event,
  channel,
  subject_template,
  html_template,
  text_template,
  variables,
  is_active
) VALUES (
  'Payment Failed Email',
  'Email sent when payment fails',
  'payment_failed',
  'payment_failure',
  'email',
  'Payment Issue - Action Required',
  '<html><body><h1>Hi {{customer_name}},</h1><p>We encountered an issue processing your payment for {{pet_name}}''s grooming appointment.</p><h3>Payment Details:</h3><ul><li><strong>Amount:</strong> {{amount}}</li><li><strong>Date:</strong> {{date}}</li><li><strong>Reason:</strong> {{failure_reason}}</li></ul><p>Please update your payment method to avoid service interruption:</p><p><a href="{{payment_url}}" style="background-color: #434E54; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Update Payment</a></p><p>If you have questions, please call us at (657) 252-2903.</p><p>Best regards,<br>The Puppy Day Team</p></body></html>',
  'Hi {{customer_name}}, we had trouble processing your payment of {{amount}}. Please update your payment method: {{payment_url}}. Call (657) 252-2903 if you need help. - The Puppy Day',
  '[
    {"name": "customer_name", "description": "Customer first name", "required": true, "max_length": 50},
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50},
    {"name": "amount", "description": "Payment amount", "required": true, "max_length": 20},
    {"name": "date", "description": "Payment date", "required": true, "max_length": 20},
    {"name": "failure_reason", "description": "Reason for failure", "required": false, "max_length": 200},
    {"name": "payment_url", "description": "Payment update URL", "required": true, "max_length": 500}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO NOTHING;

-- =============================================
-- UPDATE: Link Templates to Settings
-- =============================================
-- Update notification_settings to reference the newly created templates
UPDATE public.notification_settings ns
SET
  email_template_id = (
    SELECT id FROM public.notification_templates
    WHERE type = ns.notification_type AND channel = 'email' AND is_active = true
    LIMIT 1
  ),
  sms_template_id = (
    SELECT id FROM public.notification_templates
    WHERE type = ns.notification_type AND channel = 'sms' AND is_active = true
    LIMIT 1
  ),
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM public.notification_templates
  WHERE type = ns.notification_type
);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================
-- Issue #4: HTML escaping function to prevent XSS attacks
CREATE OR REPLACE FUNCTION escape_html(p_text TEXT)
RETURNS TEXT AS $$
BEGIN
  IF p_text IS NULL THEN
    RETURN NULL;
  END IF;

  -- Escape HTML special characters
  RETURN REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(p_text, '&', '&amp;'),
        '<', '&lt;'),
      '>', '&gt;'),
    '"', '&quot;'),
  '''', '&#x27;');
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

COMMENT ON FUNCTION escape_html IS 'Escapes HTML special characters to prevent XSS attacks';

-- Function to get active template for notification type and channel
CREATE OR REPLACE FUNCTION get_active_template(
  p_notification_type TEXT,
  p_channel TEXT
)
RETURNS UUID AS $$
DECLARE
  v_template_id UUID;
BEGIN
  SELECT id INTO v_template_id
  FROM public.notification_templates
  WHERE type = p_notification_type
    AND channel = p_channel
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN v_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_active_template IS 'Returns the active template ID for a given notification type and channel';

-- Function to render template with variables
-- Issue #4: Updated to use HTML escaping for HTML templates
CREATE OR REPLACE FUNCTION render_template(
  p_template_id UUID,
  p_variables JSONB
)
RETURNS TABLE(
  subject TEXT,
  html_content TEXT,
  text_content TEXT
) AS $$
DECLARE
  v_template RECORD;
  v_subject TEXT;
  v_html TEXT;
  v_text TEXT;
  v_var RECORD;
  v_var_value TEXT;
  v_var_value_escaped TEXT;
BEGIN
  -- Get template
  SELECT * INTO v_template
  FROM public.notification_templates
  WHERE id = p_template_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found: %', p_template_id;
  END IF;

  -- Start with template content
  v_subject := v_template.subject_template;
  v_html := v_template.html_template;
  v_text := v_template.text_template;

  -- Replace each variable
  FOR v_var IN SELECT * FROM jsonb_array_elements(v_template.variables)
  LOOP
    -- Check if required variable is missing
    IF (v_var.value->>'required')::boolean = true AND
       NOT p_variables ? (v_var.value->>'name') THEN
      RAISE EXCEPTION 'Required variable missing: %', v_var.value->>'name';
    END IF;

    -- Replace variable in all templates
    IF p_variables ? (v_var.value->>'name') THEN
      v_var_value := p_variables->>(v_var.value->>'name');

      -- Issue #4: Escape HTML for HTML template only
      v_var_value_escaped := escape_html(v_var_value);

      -- Subject and text: use raw value
      v_subject := REPLACE(v_subject, '{{' || (v_var.value->>'name') || '}}', v_var_value);
      v_text := REPLACE(v_text, '{{' || (v_var.value->>'name') || '}}', v_var_value);

      -- HTML: use escaped value
      IF v_html IS NOT NULL THEN
        v_html := REPLACE(v_html, '{{' || (v_var.value->>'name') || '}}', v_var_value_escaped);
      END IF;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_subject, v_html, v_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION render_template IS 'Renders a template by replacing variables with provided values (HTML-escaped for HTML templates)';

-- =============================================
-- SECURITY DEFINER FUNCTION PERMISSIONS (Issue #8)
-- =============================================
-- Revoke public access and grant specific permissions for SECURITY DEFINER functions

-- escape_html function
REVOKE ALL ON FUNCTION escape_html(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION escape_html(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION escape_html(TEXT) TO service_role;

-- get_active_template function
REVOKE ALL ON FUNCTION get_active_template(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_active_template(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_template(TEXT, TEXT) TO service_role;

-- render_template function
REVOKE ALL ON FUNCTION render_template(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION render_template(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION render_template(UUID, JSONB) TO service_role;

-- =============================================
-- COMPLETE
-- =============================================
-- Migration completed successfully
