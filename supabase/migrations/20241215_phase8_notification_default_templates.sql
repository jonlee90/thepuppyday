-- =============================================
-- Phase 8: Default Notification Templates
-- Tasks: 0098-0104
-- =============================================
-- Description: Complete email and SMS notification templates for The Puppy Day
-- This migration adds production-ready templates for all notification types
--
-- TEMPLATE PLACEHOLDER SYSTEM:
-- - Uses simple {variable} syntax (NOT Handlebars {variable})
-- - All variables are HTML-escaped before insertion to prevent XSS
-- - Variables are replaced via string replacement in TypeScript code
-- - Conditional logic must be handled in code before template rendering
-- - All SQL string literals use doubled single quotes ('') for proper escaping
--
-- SECURITY NOTES:
-- - All user-provided content is sanitized before template rendering
-- - URLs are validated and encoded
-- - HTML special characters are escaped: < > & " '
-- - Template engine does NOT execute code, only string replacement
--
-- =============================================
-- MIGRATION DEPENDENCY CHECK
-- =============================================
DO $$
BEGIN
  -- Check if required tables exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'notification_templates'
  ) THEN
    RAISE EXCEPTION 'Required table notification_templates does not exist. Please run 20241215_phase8_notification_system_schema.sql first.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'notification_settings'
  ) THEN
    RAISE EXCEPTION 'Required table notification_settings does not exist. Please run 20241215_phase8_notification_system_schema.sql first.';
  END IF;

  RAISE NOTICE 'Migration dependency check passed: All required schema objects exist.';
END $$;

-- =============================================
-- TASK 0098: BOOKING CONFIRMATION TEMPLATES
-- =============================================
-- Booking Confirmation Email Template (Enhanced)
-- All variables in this template will be HTML-escaped during rendering
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
  'Booking Confirmation Email - Enhanced',
  'Professional email sent when customer books an appointment',
  'booking_confirmation',
  'appointment_created',
  'email',
  'Appointment Confirmed for {pet_name} - {appointment_date}',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Confirmed</title>
</head>
<body style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #434E54; background-color: #F8EEE5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(67, 78, 84, 0.1);">
    <!-- Header -->
    <div style="background-color: #434E54; color: #FFFFFF; padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Appointment Confirmed!</h1>
    </div>

    <!-- Body -->
    <div style="padding: 32px 24px;">
      <p style="font-size: 18px; margin: 0 0 24px;">Hi {customer_name},</p>

      <p style="font-size: 16px; margin: 0 0 24px; line-height: 1.8;">
        Great news! We have confirmed your grooming appointment for <strong>{pet_name}</strong>.
        We can''t wait to pamper your furry friend!
      </p>

      <!-- Appointment Details Card -->
      <div style="background-color: #FFFBF7; border-left: 4px solid #434E54; padding: 20px; margin: 24px 0; border-radius: 8px;">
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #434E54;">Appointment Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6B7280;">Date:</td>
            <td style="padding: 8px 0;">{appointment_date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6B7280;">Time:</td>
            <td style="padding: 8px 0;">{appointment_time}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6B7280;">Service:</td>
            <td style="padding: 8px 0;">{service_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6B7280;">Total Price:</td>
            <td style="padding: 8px 0; font-size: 18px; font-weight: 700; color: #434E54;">{total_price}</td>
          </tr>
        </table>
      </div>

      <!-- What to Expect -->
      <div style="margin: 24px 0;">
        <h3 style="font-size: 18px; margin: 0 0 12px; color: #434E54;">What to Expect</h3>
        <ul style="margin: 0; padding-left: 20px; color: #6B7280;">
          <li style="margin-bottom: 8px;">Please arrive on time or a few minutes early</li>
          <li style="margin-bottom: 8px;">Bring any special grooming instructions or medical notes</li>
          <li style="margin-bottom: 8px;">We''ll send you a text when {pet_name} is ready for pickup</li>
        </ul>
      </div>

      <!-- Cancellation Policy -->
      <div style="background-color: #FEF3C7; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400E;">
          <strong>Cancellation Policy:</strong> Please notify us at least 24 hours in advance if you need to reschedule.
          Call us at (657) 252-2903 or reply to this email.
        </p>
      </div>

      <p style="font-size: 16px; margin: 24px 0 0;">
        Thank you for trusting us with {pet_name}!
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #EAE0D5; padding: 24px; text-align: center; color: #6B7280; font-size: 14px;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #434E54;">The Puppy Day</p>
      <p style="margin: 0 0 4px;">14936 Leffingwell Rd, La Mirada, CA 90638</p>
      <p style="margin: 0 0 4px;">(657) 252-2903</p>
      <p style="margin: 0;">
        <a href="mailto:puppyday14936@gmail.com" style="color: #434E54; text-decoration: none;">puppyday14936@gmail.com</a>
      </p>
      <p style="margin: 16px 0 0; font-size: 12px;">
        Monday-Saturday, 9:00 AM - 5:00 PM
      </p>
    </div>
  </div>
</body>
</html>',
  'Hi {customer_name},

Your grooming appointment for {pet_name} has been confirmed!

APPOINTMENT DETAILS:
Date: {appointment_date}
Time: {appointment_time}
Service: {service_name}
Total Price: {total_price}

WHAT TO EXPECT:
- Please arrive on time or a few minutes early
- Bring any special grooming instructions or medical notes
- We''ll text you when {pet_name} is ready for pickup

CANCELLATION POLICY:
Please notify us at least 24 hours in advance if you need to reschedule.

Thank you for trusting us with {pet_name}!

The Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903
puppyday14936@gmail.com
Hours: Monday-Saturday, 9:00 AM - 5:00 PM',
  '[
    {"name": "customer_name", "description": "Customer first name", "required": true, "max_length": 50},
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50},
    {"name": "appointment_date", "description": "Appointment date (formatted)", "required": true, "max_length": 50},
    {"name": "appointment_time", "description": "Appointment time", "required": true, "max_length": 20},
    {"name": "service_name", "description": "Service name", "required": true, "max_length": 100},
    {"name": "total_price", "description": "Total price with currency symbol", "required": true, "max_length": 20}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  html_template = EXCLUDED.html_template,
  text_template = EXCLUDED.text_template,
  subject_template = EXCLUDED.subject_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Booking Confirmation SMS Template
-- All variables will be escaped/sanitized before replacement
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
  'Booking Confirmation SMS',
  'Concise SMS sent when customer books an appointment',
  'booking_confirmation',
  'appointment_created',
  'sms',
  NULL,
  NULL,
  '{pet_name}''s grooming confirmed for {appointment_date} at {appointment_time}. Total: {total_price}. Questions? Call (657) 252-2903 - Puppy Day',
  '[
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50},
    {"name": "appointment_date", "description": "Appointment date (short format)", "required": true, "max_length": 20},
    {"name": "appointment_time", "description": "Appointment time", "required": true, "max_length": 20},
    {"name": "total_price", "description": "Total price with currency symbol", "required": true, "max_length": 20}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  text_template = EXCLUDED.text_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- =============================================
-- TASK 0099: APPOINTMENT REMINDER TEMPLATE
-- =============================================
-- Appointment Reminder SMS Template (Enhanced)
-- All variables will be sanitized before replacement to prevent injection
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
  'Appointment Reminder SMS - 24h',
  'SMS sent 24 hours before appointment',
  'appointment_reminder',
  'appointment_24h_reminder',
  'sms',
  NULL,
  NULL,
  'Reminder: {pet_name}''s grooming tomorrow at {appointment_time}. Need to cancel? Call (657) 252-2903. See you soon! - Puppy Day',
  '[
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50},
    {"name": "appointment_time", "description": "Appointment time", "required": true, "max_length": 20}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  text_template = EXCLUDED.text_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- =============================================
-- TASK 0100: APPOINTMENT STATUS TEMPLATES
-- =============================================
-- Status: Checked In SMS Template
-- All variables will be sanitized before replacement to prevent injection
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
  'Status: Checked In SMS',
  'SMS sent when pet is checked in for grooming',
  'status_checked_in',
  'appointment_status_checked_in',
  'sms',
  NULL,
  NULL,
  'We''ve got {pet_name}! They''re settling in nicely. We''ll text you when they''re ready for pickup. - Puppy Day, 14936 Leffingwell Rd',
  '[
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  text_template = EXCLUDED.text_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Status: Ready for Pickup SMS Template (Enhanced)
-- All variables will be sanitized before replacement to prevent injection
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
  'Status: Ready for Pickup SMS',
  'SMS sent when pet is ready for pickup',
  'status_ready',
  'appointment_status_ready',
  'sms',
  NULL,
  NULL,
  '{pet_name} is ready for pickup! Come by anytime. We can''t wait to show you how great they look! - Puppy Day, 14936 Leffingwell Rd',
  '[
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  text_template = EXCLUDED.text_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- =============================================
-- TASK 0101: REPORT CARD NOTIFICATION TEMPLATES
-- =============================================
-- Report Card Ready Email Template (Enhanced)
-- All variables will be HTML-escaped before replacement
-- Conditional sections (groomer_notes_section, next_grooming_section) are pre-built in code
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
  'Report Card Ready Email - Enhanced',
  'Email sent when grooming report card is ready with before/after photos',
  'report_card_ready',
  'report_card_created',
  'email',
  '{pet_name}''s Grooming Report Card is Ready!',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report Card Ready</title>
</head>
<body style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #434E54; background-color: #F8EEE5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(67, 78, 84, 0.1);">
    <!-- Header -->
    <div style="background-color: #434E54; color: #FFFFFF; padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 600;">{pet_name} Looks Amazing!</h1>
    </div>

    <!-- Body -->
    <div style="padding: 32px 24px;">
      <p style="font-size: 18px; margin: 0 0 24px;">Hi {customer_name},</p>

      <p style="font-size: 16px; margin: 0 0 24px; line-height: 1.8;">
        {pet_name} had a wonderful grooming session today! We''ve completed their report card with before and after photos.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="{report_card_url}" style="display: inline-block; background-color: #434E54; color: #FFFFFF; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 8px rgba(67, 78, 84, 0.2);">
          View Report Card
        </a>
      </div>

      <!-- Before/After Placeholder Section -->
      <div style="background-color: #FFFBF7; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 16px; font-size: 14px; color: #6B7280; font-weight: 600;">BEFORE & AFTER PHOTOS INSIDE</p>
        <p style="margin: 0; font-size: 14px; color: #6B7280;">Click the button above to see {pet_name}''s transformation!</p>
      </div>

      <!-- Groomer Notes Section (conditionally included via code) -->
      {groomer_notes_section}

      <!-- Next Grooming Reminder Section (conditionally included via code) -->
      {next_grooming_section}

      <!-- Review Request -->
      <div style="margin: 32px 0; text-align: center;">
        <p style="font-size: 16px; margin: 0 0 16px; color: #434E54;">
          Love how {pet_name} looks? We''d appreciate your review!
        </p>
        <a href="{review_url}" style="display: inline-block; color: #434E54; text-decoration: underline; font-size: 14px; font-weight: 600;">
          Leave a Review on Google
        </a>
      </div>

      <p style="font-size: 16px; margin: 24px 0 0;">
        Thank you for trusting us with {pet_name}!
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #EAE0D5; padding: 24px; text-align: center; color: #6B7280; font-size: 14px;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #434E54;">The Puppy Day</p>
      <p style="margin: 0 0 4px;">14936 Leffingwell Rd, La Mirada, CA 90638</p>
      <p style="margin: 0 0 4px;">(657) 252-2903</p>
      <p style="margin: 0;">
        <a href="mailto:puppyday14936@gmail.com" style="color: #434E54; text-decoration: none;">puppyday14936@gmail.com</a>
      </p>
    </div>
  </div>
</body>
</html>',
  'Hi {customer_name},

{pet_name} had a great grooming session today!

VIEW REPORT CARD (with before/after photos):
{report_card_url}

{groomer_notes_text}

{next_grooming_text}

We''d love your review! {review_url}

Thank you for trusting us with {pet_name}!

The Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903',
  '[
    {"name": "customer_name", "description": "Customer first name - will be HTML escaped", "required": true, "max_length": 50},
    {"name": "pet_name", "description": "Pet name - will be HTML escaped", "required": true, "max_length": 50},
    {"name": "report_card_url", "description": "URL to view report card - will be URL encoded", "required": true, "max_length": 500},
    {"name": "groomer_notes_section", "description": "Complete HTML section with groomer notes or empty string", "required": false, "max_length": 1000},
    {"name": "groomer_notes_text", "description": "Plain text groomer notes section or empty string", "required": false, "max_length": 600},
    {"name": "next_grooming_section", "description": "Complete HTML section with next grooming date or empty string", "required": false, "max_length": 500},
    {"name": "next_grooming_text", "description": "Plain text next grooming section or empty string", "required": false, "max_length": 200},
    {"name": "review_url", "description": "Google review URL - will be URL encoded", "required": true, "max_length": 500}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  html_template = EXCLUDED.html_template,
  text_template = EXCLUDED.text_template,
  subject_template = EXCLUDED.subject_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Report Card Ready SMS Template
-- All variables will be sanitized before replacement to prevent injection
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
  'Report Card Ready SMS',
  'Concise SMS with report card link',
  'report_card_ready',
  'report_card_created',
  'sms',
  NULL,
  NULL,
  '{pet_name}''s grooming report card is ready with before/after photos! View it here: {report_card_url} - Puppy Day',
  '[
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50},
    {"name": "report_card_url", "description": "Short URL to report card", "required": true, "max_length": 200}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  text_template = EXCLUDED.text_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- =============================================
-- TASK 0102: WAITLIST NOTIFICATION TEMPLATE
-- =============================================
-- Waitlist Spot Available SMS Template (Enhanced)
-- All variables will be sanitized before replacement to prevent injection
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
  'SMS sent when waitlist spot opens (2-hour expiration)',
  'waitlist_available',
  'waitlist_spot_opened',
  'sms',
  NULL,
  NULL,
  'Great news {customer_name}! Spot available {available_date} at {available_time}. Book now (expires in 2hrs): {booking_url} - Puppy Day',
  '[
    {"name": "customer_name", "description": "Customer first name", "required": true, "max_length": 50},
    {"name": "available_date", "description": "Available appointment date (short format)", "required": true, "max_length": 20},
    {"name": "available_time", "description": "Available appointment time", "required": true, "max_length": 20},
    {"name": "booking_url", "description": "Direct booking URL (short link)", "required": true, "max_length": 200}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  text_template = EXCLUDED.text_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- =============================================
-- TASK 0103: RETENTION REMINDER TEMPLATES
-- =============================================
-- Retention Reminder Email Template (Enhanced)
-- All variables will be HTML-escaped before replacement
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
  'Retention Reminder Email - Enhanced',
  'Email sent to customers who haven''t booked in recommended timeframe',
  'retention_reminder',
  'customer_inactive_30d',
  'email',
  'Time for {pet_name}''s Grooming! We Miss You',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We Miss You</title>
</head>
<body style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #434E54; background-color: #F8EEE5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(67, 78, 84, 0.1);">
    <!-- Header -->
    <div style="background-color: #434E54; color: #FFFFFF; padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 600;">We Miss {pet_name}!</h1>
    </div>

    <!-- Body -->
    <div style="padding: 32px 24px;">
      <p style="font-size: 18px; margin: 0 0 24px;">Hi {customer_name},</p>

      <p style="font-size: 16px; margin: 0 0 16px; line-height: 1.8;">
        It''s been <strong>{weeks_since_last} weeks</strong> since we last saw {pet_name}, and we really miss that adorable face!
      </p>

      <p style="font-size: 16px; margin: 0 0 24px; line-height: 1.8;">
        For {breed_name}s, we recommend grooming every {recommended_weeks} weeks to keep their coat healthy and beautiful.
      </p>

      <!-- Reminder Card -->
      <div style="background-color: #FFFBF7; border-left: 4px solid #434E54; padding: 20px; margin: 24px 0; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">It''s Time For</p>
        <p style="margin: 0; font-size: 24px; font-weight: 700; color: #434E54;">{pet_name}''s Grooming</p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="{booking_url}" style="display: inline-block; background-color: #434E54; color: #FFFFFF; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 8px rgba(67, 78, 84, 0.2);">
          Book Appointment Now
        </a>
      </div>

      <!-- Benefits -->
      <div style="margin: 24px 0;">
        <h3 style="font-size: 18px; margin: 0 0 12px; color: #434E54;">Why Regular Grooming Matters</h3>
        <ul style="margin: 0; padding-left: 20px; color: #6B7280;">
          <li style="margin-bottom: 8px;">Prevents matting and skin issues</li>
          <li style="margin-bottom: 8px;">Early detection of health problems</li>
          <li style="margin-bottom: 8px;">Reduces shedding and allergens</li>
          <li style="margin-bottom: 8px;">Keeps {pet_name} comfortable and happy</li>
        </ul>
      </div>

      <p style="font-size: 16px; margin: 24px 0 0;">
        We can''t wait to see {pet_name} again!
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #EAE0D5; padding: 24px; text-align: center; color: #6B7280; font-size: 14px;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #434E54;">The Puppy Day</p>
      <p style="margin: 0 0 4px;">14936 Leffingwell Rd, La Mirada, CA 90638</p>
      <p style="margin: 0 0 4px;">(657) 252-2903</p>
      <p style="margin: 0;">
        <a href="mailto:puppyday14936@gmail.com" style="color: #434E54; text-decoration: none;">puppyday14936@gmail.com</a>
      </p>
    </div>
  </div>
</body>
</html>',
  'Hi {customer_name},

It''s been {weeks_since_last} weeks since we last saw {pet_name}, and we miss that adorable face!

For {breed_name}s, we recommend grooming every {recommended_weeks} weeks.

IT''S TIME FOR {pet_name}''S GROOMING!

Book now: {booking_url}

WHY REGULAR GROOMING MATTERS:
- Prevents matting and skin issues
- Early detection of health problems
- Reduces shedding and allergens
- Keeps {pet_name} comfortable and happy

We can''t wait to see {pet_name} again!

The Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903',
  '[
    {"name": "customer_name", "description": "Customer first name", "required": true, "max_length": 50},
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50},
    {"name": "weeks_since_last", "description": "Weeks since last appointment", "required": true, "max_length": 10},
    {"name": "breed_name", "description": "Pet breed name", "required": true, "max_length": 100},
    {"name": "recommended_weeks", "description": "Recommended grooming frequency in weeks", "required": true, "max_length": 10},
    {"name": "booking_url", "description": "Direct booking URL", "required": true, "max_length": 500}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  html_template = EXCLUDED.html_template,
  text_template = EXCLUDED.text_template,
  subject_template = EXCLUDED.subject_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Retention Reminder SMS Template
-- All variables will be sanitized before replacement to prevent injection
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
  'Retention Reminder SMS',
  'Concise SMS reminder for overdue grooming',
  'retention_reminder',
  'customer_inactive_30d',
  'sms',
  NULL,
  NULL,
  'Hi {customer_name}! It''s been {weeks_since_last} weeks since {pet_name}''s last grooming. Time to book! {booking_url} - Puppy Day',
  '[
    {"name": "customer_name", "description": "Customer first name", "required": true, "max_length": 50},
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50},
    {"name": "weeks_since_last", "description": "Weeks since last appointment", "required": true, "max_length": 10},
    {"name": "booking_url", "description": "Short booking URL", "required": true, "max_length": 200}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  text_template = EXCLUDED.text_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- =============================================
-- TASK 0104: PAYMENT NOTIFICATION TEMPLATES
-- =============================================
-- Payment Failed Email Template (Enhanced)
-- All variables will be HTML-escaped before replacement
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
  'Email sent when payment processing fails',
  'payment_failed',
  'payment_failure',
  'email',
  'Payment Issue - Action Required for {pet_name}',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Issue</title>
</head>
<body style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #434E54; background-color: #F8EEE5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(67, 78, 84, 0.1);">
    <!-- Header -->
    <div style="background-color: #DC2626; color: #FFFFFF; padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Payment Issue</h1>
    </div>

    <!-- Body -->
    <div style="padding: 32px 24px;">
      <p style="font-size: 18px; margin: 0 0 24px;">Hi {customer_name},</p>

      <p style="font-size: 16px; margin: 0 0 24px; line-height: 1.8;">
        We encountered an issue processing your payment for {pet_name}''s grooming service.
      </p>

      <!-- Payment Details Card -->
      <div style="background-color: #FEE2E2; border-left: 4px solid #DC2626; padding: 20px; margin: 24px 0; border-radius: 8px;">
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #DC2626;">Payment Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6B7280;">Amount Due:</td>
            <td style="padding: 8px 0; font-size: 18px; font-weight: 700; color: #DC2626;">{amount_due}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6B7280;">Reason:</td>
            <td style="padding: 8px 0;">{failure_reason}</td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="{retry_link}" style="display: inline-block; background-color: #434E54; color: #FFFFFF; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 8px rgba(67, 78, 84, 0.2);">
          Update Payment Method
        </a>
      </div>

      <!-- What to Do -->
      <div style="margin: 24px 0;">
        <h3 style="font-size: 18px; margin: 0 0 12px; color: #434E54;">What to Do Next</h3>
        <ul style="margin: 0; padding-left: 20px; color: #6B7280;">
          <li style="margin-bottom: 8px;">Click the button above to update your payment method</li>
          <li style="margin-bottom: 8px;">Or call us at (657) 252-2903 to pay by phone</li>
          <li style="margin-bottom: 8px;">Contact your bank if you need help with card issues</li>
        </ul>
      </div>

      <!-- Customer Service -->
      <div style="background-color: #DBEAFE; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #1E40AF;">
          <strong>Need Help?</strong> Contact us at (657) 252-2903 or
          <a href="mailto:puppyday14936@gmail.com" style="color: #1E40AF;">puppyday14936@gmail.com</a>
        </p>
      </div>

      <p style="font-size: 16px; margin: 24px 0 0;">
        Thank you for your prompt attention to this matter.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #EAE0D5; padding: 24px; text-align: center; color: #6B7280; font-size: 14px;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #434E54;">The Puppy Day</p>
      <p style="margin: 0 0 4px;">14936 Leffingwell Rd, La Mirada, CA 90638</p>
      <p style="margin: 0 0 4px;">(657) 252-2903</p>
      <p style="margin: 0;">
        <a href="mailto:puppyday14936@gmail.com" style="color: #434E54; text-decoration: none;">puppyday14936@gmail.com</a>
      </p>
    </div>
  </div>
</body>
</html>',
  'Hi {customer_name},

We encountered an issue processing your payment for {pet_name}''s grooming.

PAYMENT DETAILS:
Amount Due: {amount_due}
Reason: {failure_reason}

WHAT TO DO:
Update your payment method: {retry_link}
Or call us at (657) 252-2903

Need help? Contact us:
Phone: (657) 252-2903
Email: puppyday14936@gmail.com

Thank you for your prompt attention.

The Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638',
  '[
    {"name": "customer_name", "description": "Customer first name", "required": true, "max_length": 50},
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50},
    {"name": "amount_due", "description": "Amount due with currency symbol", "required": true, "max_length": 20},
    {"name": "failure_reason", "description": "Reason for payment failure", "required": true, "max_length": 200},
    {"name": "retry_link", "description": "URL to retry payment", "required": true, "max_length": 500}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  html_template = EXCLUDED.html_template,
  text_template = EXCLUDED.text_template,
  subject_template = EXCLUDED.subject_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Payment Reminder Email Template
-- All variables will be HTML-escaped before replacement
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
  'Payment Reminder Email',
  'Email reminder for upcoming payment charge',
  'payment_reminder',
  'payment_upcoming',
  'email',
  'Upcoming Payment for {pet_name} - {charge_date}',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder</title>
</head>
<body style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #434E54; background-color: #F8EEE5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(67, 78, 84, 0.1);">
    <!-- Header -->
    <div style="background-color: #434E54; color: #FFFFFF; padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Payment Reminder</h1>
    </div>

    <!-- Body -->
    <div style="padding: 32px 24px;">
      <p style="font-size: 18px; margin: 0 0 24px;">Hi {customer_name},</p>

      <p style="font-size: 16px; margin: 0 0 24px; line-height: 1.8;">
        This is a friendly reminder that we''ll be processing a payment for {pet_name}''s grooming service.
      </p>

      <!-- Payment Info Card -->
      <div style="background-color: #FFFBF7; border-left: 4px solid #434E54; padding: 20px; margin: 24px 0; border-radius: 8px;">
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #434E54;">Payment Information</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6B7280;">Charge Date:</td>
            <td style="padding: 8px 0;">{charge_date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6B7280;">Amount:</td>
            <td style="padding: 8px 0; font-size: 18px; font-weight: 700; color: #434E54;">{amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6B7280;">Payment Method:</td>
            <td style="padding: 8px 0;">{payment_method}</td>
          </tr>
        </table>
      </div>

      <!-- Action Required (if applicable) -->
      <div style="background-color: #FEF3C7; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400E;">
          <strong>Need to update your payment method?</strong> Please do so before the charge date to avoid service interruption.
        </p>
      </div>

      <!-- Customer Service -->
      <div style="text-align: center; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #6B7280;">
          Questions? Contact us at (657) 252-2903 or
          <a href="mailto:puppyday14936@gmail.com" style="color: #434E54;">puppyday14936@gmail.com</a>
        </p>
      </div>

      <p style="font-size: 16px; margin: 24px 0 0;">
        Thank you for being a valued customer!
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #EAE0D5; padding: 24px; text-align: center; color: #6B7280; font-size: 14px;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #434E54;">The Puppy Day</p>
      <p style="margin: 0 0 4px;">14936 Leffingwell Rd, La Mirada, CA 90638</p>
      <p style="margin: 0 0 4px;">(657) 252-2903</p>
      <p style="margin: 0;">
        <a href="mailto:puppyday14936@gmail.com" style="color: #434E54; text-decoration: none;">puppyday14936@gmail.com</a>
      </p>
    </div>
  </div>
</body>
</html>',
  'Hi {customer_name},

Reminder: We''ll be processing a payment for {pet_name}''s grooming service.

PAYMENT DETAILS:
Charge Date: {charge_date}
Amount: {amount}
Payment Method: {payment_method}

Need to update your payment method? Please do so before the charge date.

Questions? Contact us:
Phone: (657) 252-2903
Email: puppyday14936@gmail.com

Thank you!

The Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638',
  '[
    {"name": "customer_name", "description": "Customer first name", "required": true, "max_length": 50},
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50},
    {"name": "charge_date", "description": "Date payment will be charged", "required": true, "max_length": 50},
    {"name": "amount", "description": "Payment amount with currency symbol", "required": true, "max_length": 20},
    {"name": "payment_method", "description": "Last 4 digits of card or payment method", "required": true, "max_length": 50}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  html_template = EXCLUDED.html_template,
  text_template = EXCLUDED.text_template,
  subject_template = EXCLUDED.subject_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Payment Success Email Template
-- All variables will be HTML-escaped before replacement
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
  'Payment Success Email',
  'Confirmation email sent after successful payment',
  'payment_success',
  'payment_processed',
  'email',
  'Payment Received - Thank You!',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmed</title>
</head>
<body style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #434E54; background-color: #F8EEE5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(67, 78, 84, 0.1);">
    <!-- Header -->
    <div style="background-color: #16A34A; color: #FFFFFF; padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Payment Received!</h1>
    </div>

    <!-- Body -->
    <div style="padding: 32px 24px;">
      <p style="font-size: 18px; margin: 0 0 24px;">Hi {customer_name},</p>

      <p style="font-size: 16px; margin: 0 0 24px; line-height: 1.8;">
        Thank you! We''ve successfully received your payment for {pet_name}''s grooming service.
      </p>

      <!-- Payment Confirmation Card -->
      <div style="background-color: #D1FAE5; border-left: 4px solid #16A34A; padding: 20px; margin: 24px 0; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #065F46; text-transform: uppercase; letter-spacing: 1px;">Amount Paid</p>
        <p style="margin: 0; font-size: 32px; font-weight: 700; color: #16A34A;">{amount_paid}</p>
      </div>

      <!-- Transaction Details -->
      <div style="margin: 24px 0;">
        <h3 style="font-size: 18px; margin: 0 0 12px; color: #434E54;">Transaction Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6B7280;">Date:</td>
            <td style="padding: 8px 0;">{transaction_date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6B7280;">Payment Method:</td>
            <td style="padding: 8px 0;">{payment_method}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6B7280;">Transaction ID:</td>
            <td style="padding: 8px 0; font-family: monospace; font-size: 12px;">{transaction_id}</td>
          </tr>
        </table>
      </div>

      <!-- Receipt Note -->
      <div style="background-color: #DBEAFE; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #1E40AF;">
          A receipt has been sent to your email for your records.
        </p>
      </div>

      <p style="font-size: 16px; margin: 24px 0 0;">
        Thank you for choosing The Puppy Day!
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #EAE0D5; padding: 24px; text-align: center; color: #6B7280; font-size: 14px;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #434E54;">The Puppy Day</p>
      <p style="margin: 0 0 4px;">14936 Leffingwell Rd, La Mirada, CA 90638</p>
      <p style="margin: 0 0 4px;">(657) 252-2903</p>
      <p style="margin: 0;">
        <a href="mailto:puppyday14936@gmail.com" style="color: #434E54; text-decoration: none;">puppyday14936@gmail.com</a>
      </p>
    </div>
  </div>
</body>
</html>',
  'Hi {customer_name},

Thank you! We''ve successfully received your payment for {pet_name}''s grooming.

AMOUNT PAID: {amount_paid}

TRANSACTION DETAILS:
Date: {transaction_date}
Payment Method: {payment_method}
Transaction ID: {transaction_id}

A receipt has been sent to your email for your records.

Thank you for choosing The Puppy Day!

The Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903
puppyday14936@gmail.com',
  '[
    {"name": "customer_name", "description": "Customer first name", "required": true, "max_length": 50},
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50},
    {"name": "amount_paid", "description": "Amount paid with currency symbol", "required": true, "max_length": 20},
    {"name": "transaction_date", "description": "Date of transaction", "required": true, "max_length": 50},
    {"name": "payment_method", "description": "Payment method used", "required": true, "max_length": 50},
    {"name": "transaction_id", "description": "Transaction ID from payment processor", "required": true, "max_length": 100}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  html_template = EXCLUDED.html_template,
  text_template = EXCLUDED.text_template,
  subject_template = EXCLUDED.subject_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Payment Final Notice Email Template
-- All variables will be HTML-escaped before replacement
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
  'Payment Final Notice Email',
  'Email sent after 3rd payment failure with suspension warning',
  'payment_failed',
  'payment_failure_final',
  'email',
  'URGENT: Final Payment Notice - Account Suspension',
  '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Final Payment Notice</title>
</head>
<body style="font-family: ''Segoe UI'', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #434E54; background-color: #F8EEE5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(67, 78, 84, 0.1);">
    <!-- Header -->
    <div style="background-color: #991B1B; color: #FFFFFF; padding: 32px 24px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 600;">URGENT: Final Notice</h1>
    </div>

    <!-- Body -->
    <div style="padding: 32px 24px;">
      <p style="font-size: 18px; margin: 0 0 24px;">Hi {customer_name},</p>

      <p style="font-size: 16px; margin: 0 0 16px; line-height: 1.8;">
        We have made <strong>multiple attempts</strong> to process your payment for {pet_name}''s grooming services,
        but all attempts have failed.
      </p>

      <p style="font-size: 16px; margin: 0 0 24px; line-height: 1.8; font-weight: 600; color: #DC2626;">
        This is your final notice. Please take immediate action to avoid service suspension.
      </p>

      <!-- Outstanding Balance Card -->
      <div style="background-color: #FEE2E2; border: 2px solid #DC2626; padding: 20px; margin: 24px 0; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #991B1B; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Outstanding Balance</p>
        <p style="margin: 0; font-size: 36px; font-weight: 700; color: #DC2626;">{amount_due}</p>
      </div>

      <!-- Action Required -->
      <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 24px 0; border-radius: 8px;">
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #92400E;">Immediate Action Required</h2>
        <p style="margin: 0 0 12px; color: #92400E;">To avoid account suspension, please:</p>
        <ol style="margin: 0; padding-left: 20px; color: #92400E;">
          <li style="margin-bottom: 8px;">Update your payment method immediately</li>
          <li style="margin-bottom: 8px;">Or call us at (657) 252-2903 to arrange payment</li>
          <li style="margin-bottom: 8px;">Respond within 48 hours to prevent service suspension</li>
        </ol>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="{retry_link}" style="display: inline-block; background-color: #DC2626; color: #FFFFFF; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);">
          Update Payment Method Now
        </a>
      </div>

      <!-- Suspension Warning -->
      <div style="border: 2px solid #DC2626; border-radius: 8px; padding: 20px; margin: 24px 0; background-color: #FFF1F2;">
        <p style="margin: 0 0 8px; font-weight: 700; color: #991B1B; text-transform: uppercase; font-size: 14px;">Account Suspension Warning</p>
        <p style="margin: 0; font-size: 14px; color: #991B1B;">
          If payment is not received within 48 hours, your account will be temporarily suspended,
          and you will not be able to book new appointments until the balance is cleared.
        </p>
      </div>

      <!-- Customer Service -->
      <div style="background-color: #DBEAFE; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 8px; font-weight: 700; color: #1E40AF; font-size: 16px;">Need Help?</p>
        <p style="margin: 0; font-size: 14px; color: #1E40AF;">
          Call us immediately at <strong>(657) 252-2903</strong><br>
          or email <a href="mailto:puppyday14936@gmail.com" style="color: #1E40AF; font-weight: 600;">puppyday14936@gmail.com</a>
        </p>
      </div>

      <p style="font-size: 16px; margin: 24px 0 0;">
        We value your business and want to resolve this matter promptly.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #EAE0D5; padding: 24px; text-align: center; color: #6B7280; font-size: 14px;">
      <p style="margin: 0 0 8px; font-weight: 600; color: #434E54;">The Puppy Day</p>
      <p style="margin: 0 0 4px;">14936 Leffingwell Rd, La Mirada, CA 90638</p>
      <p style="margin: 0 0 4px;">(657) 252-2903</p>
      <p style="margin: 0;">
        <a href="mailto:puppyday14936@gmail.com" style="color: #434E54; text-decoration: none;">puppyday14936@gmail.com</a>
      </p>
    </div>
  </div>
</body>
</html>',
  'Hi {customer_name},

URGENT: FINAL PAYMENT NOTICE

We have made multiple attempts to process your payment for {pet_name}''s grooming services.

OUTSTANDING BALANCE: {amount_due}

IMMEDIATE ACTION REQUIRED:
1. Update your payment method immediately: {retry_link}
2. Or call us at (657) 252-2903 to arrange payment
3. Respond within 48 hours to prevent service suspension

ACCOUNT SUSPENSION WARNING:
If payment is not received within 48 hours, your account will be temporarily suspended, and you will not be able to book new appointments until the balance is cleared.

NEED HELP?
Call us immediately: (657) 252-2903
Email: puppyday14936@gmail.com

We value your business and want to resolve this matter promptly.

The Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638',
  '[
    {"name": "customer_name", "description": "Customer first name", "required": true, "max_length": 50},
    {"name": "pet_name", "description": "Pet name", "required": true, "max_length": 50},
    {"name": "amount_due", "description": "Outstanding amount with currency symbol", "required": true, "max_length": 20},
    {"name": "retry_link", "description": "URL to update payment", "required": true, "max_length": 500}
  ]'::jsonb,
  true
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  html_template = EXCLUDED.html_template,
  text_template = EXCLUDED.text_template,
  subject_template = EXCLUDED.subject_template,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- =============================================
-- UPDATE: Link Templates to Notification Settings
-- =============================================
-- Update notification_settings to reference the newly created/updated templates
UPDATE public.notification_settings ns
SET
  email_template_id = (
    SELECT id FROM public.notification_templates
    WHERE type = ns.notification_type AND channel = 'email' AND is_active = true
    ORDER BY updated_at DESC
    LIMIT 1
  ),
  sms_template_id = (
    SELECT id FROM public.notification_templates
    WHERE type = ns.notification_type AND channel = 'sms' AND is_active = true
    ORDER BY updated_at DESC
    LIMIT 1
  ),
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1 FROM public.notification_templates
  WHERE type = ns.notification_type
);

-- =============================================
-- COMPLETE
-- =============================================
-- Migration completed successfully
-- All notification templates for tasks 0098-0104 have been created
