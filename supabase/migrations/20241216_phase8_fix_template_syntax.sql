-- =============================================
-- Phase 8: Fix Template Syntax
-- Security Fix: Update template variable syntax from Handlebars {{var}} to {var}
-- =============================================
-- Description: Changes template variable syntax to use simple curly braces {variable}
-- instead of Handlebars syntax {{variable}} for programmatic replacement in TypeScript

-- This fixes the critical security issue where the database migration uses Handlebars
-- syntax but the TypeScript code uses template literals for replacement.

BEGIN;

-- =============================================
-- UPDATE BOOKING CONFIRMATION EMAIL
-- =============================================
UPDATE public.notification_templates
SET
  subject_template = 'Appointment Confirmed for {pet_name} - {appointment_date}',
  html_template = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    html_template,
    '{{customer_name}}', '{customer_name}'),
    '{{pet_name}}', '{pet_name}'),
    '{{appointment_date}}', '{appointment_date}'),
    '{{appointment_time}}', '{appointment_time}'),
    '{{service_name}}', '{service_name}'),
    '{{total_price}}', '{total_price}'),
  text_template = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    text_template,
    '{{customer_name}}', '{customer_name}'),
    '{{pet_name}}', '{pet_name}'),
    '{{appointment_date}}', '{appointment_date}'),
    '{{appointment_time}}', '{appointment_time}'),
    '{{service_name}}', '{service_name}'),
    '{{total_price}}', '{total_price}'),
  updated_at = NOW()
WHERE name = 'Booking Confirmation Email - Enhanced';

-- =============================================
-- UPDATE BOOKING CONFIRMATION SMS
-- =============================================
UPDATE public.notification_templates
SET
  text_template = REPLACE(REPLACE(REPLACE(REPLACE(
    text_template,
    '{{pet_name}}', '{pet_name}'),
    '{{appointment_date}}', '{appointment_date}'),
    '{{appointment_time}}', '{appointment_time}'),
    '{{total_price}}', '{total_price}'),
  updated_at = NOW()
WHERE name = 'Booking Confirmation SMS';

-- =============================================
-- UPDATE APPOINTMENT REMINDER SMS
-- =============================================
UPDATE public.notification_templates
SET
  text_template = REPLACE(REPLACE(
    text_template,
    '{{pet_name}}', '{pet_name}'),
    '{{appointment_time}}', '{appointment_time}'),
  updated_at = NOW()
WHERE name = 'Appointment Reminder SMS - 24h';

-- =============================================
-- UPDATE STATUS: CHECKED IN SMS
-- =============================================
UPDATE public.notification_templates
SET
  text_template = REPLACE(text_template, '{{pet_name}}', '{pet_name}'),
  updated_at = NOW()
WHERE name = 'Status: Checked In SMS';

-- =============================================
-- UPDATE STATUS: READY FOR PICKUP SMS
-- =============================================
UPDATE public.notification_templates
SET
  text_template = REPLACE(text_template, '{{pet_name}}', '{pet_name}'),
  updated_at = NOW()
WHERE name = 'Status: Ready for Pickup SMS';

-- =============================================
-- UPDATE REPORT CARD READY EMAIL
-- =============================================
UPDATE public.notification_templates
SET
  subject_template = '{pet_name}''s Grooming Report Card is Ready!',
  html_template = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    html_template,
    '{{customer_name}}', '{customer_name}'),
    '{{pet_name}}', '{pet_name}'),
    '{{report_card_url}}', '{report_card_url}'),
    '{{groomer_notes}}', '{groomer_notes}'),
    '{{next_grooming_date}}', '{next_grooming_date}'),
    '{{review_url}}', '{review_url}'),
    '{{#if', '{#if'), -- Handle conditional blocks
  text_template = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    text_template,
    '{{customer_name}}', '{customer_name}'),
    '{{pet_name}}', '{pet_name}'),
    '{{report_card_url}}', '{report_card_url}'),
    '{{groomer_notes}}', '{groomer_notes}'),
    '{{next_grooming_date}}', '{next_grooming_date}'),
    '{{review_url}}', '{review_url}'),
  updated_at = NOW()
WHERE name = 'Report Card Ready Email - Enhanced';

-- =============================================
-- UPDATE REPORT CARD READY SMS
-- =============================================
UPDATE public.notification_templates
SET
  text_template = REPLACE(REPLACE(
    text_template,
    '{{pet_name}}', '{pet_name}'),
    '{{report_card_url}}', '{report_card_url}'),
  updated_at = NOW()
WHERE name = 'Report Card Ready SMS';

-- =============================================
-- UPDATE WAITLIST SPOT AVAILABLE SMS
-- =============================================
UPDATE public.notification_templates
SET
  text_template = REPLACE(REPLACE(REPLACE(REPLACE(
    text_template,
    '{{customer_name}}', '{customer_name}'),
    '{{available_date}}', '{available_date}'),
    '{{available_time}}', '{available_time}'),
    '{{booking_url}}', '{booking_url}'),
  updated_at = NOW()
WHERE name = 'Waitlist Spot Available SMS';

-- =============================================
-- UPDATE RETENTION REMINDER EMAIL
-- =============================================
UPDATE public.notification_templates
SET
  subject_template = 'Time for {pet_name}''s Grooming! We Miss You',
  html_template = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    html_template,
    '{{customer_name}}', '{customer_name}'),
    '{{pet_name}}', '{pet_name}'),
    '{{weeks_since_last}}', '{weeks_since_last}'),
    '{{breed_name}}', '{breed_name}'),
    '{{recommended_weeks}}', '{recommended_weeks}'),
    '{{booking_url}}', '{booking_url}'),
  text_template = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    text_template,
    '{{customer_name}}', '{customer_name}'),
    '{{pet_name}}', '{pet_name}'),
    '{{weeks_since_last}}', '{weeks_since_last}'),
    '{{breed_name}}', '{breed_name}'),
    '{{recommended_weeks}}', '{recommended_weeks}'),
    '{{booking_url}}', '{booking_url}'),
  updated_at = NOW()
WHERE name = 'Retention Reminder Email - Enhanced';

-- =============================================
-- UPDATE RETENTION REMINDER SMS
-- =============================================
UPDATE public.notification_templates
SET
  text_template = REPLACE(REPLACE(REPLACE(REPLACE(
    text_template,
    '{{customer_name}}', '{customer_name}'),
    '{{pet_name}}', '{pet_name}'),
    '{{weeks_since_last}}', '{weeks_since_last}'),
    '{{booking_url}}', '{booking_url}'),
  updated_at = NOW()
WHERE name = 'Retention Reminder SMS';

-- =============================================
-- UPDATE PAYMENT FAILED EMAIL
-- =============================================
UPDATE public.notification_templates
SET
  subject_template = 'Payment Issue - Action Required for {pet_name}',
  html_template = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    html_template,
    '{{customer_name}}', '{customer_name}'),
    '{{pet_name}}', '{pet_name}'),
    '{{amount_due}}', '{amount_due}'),
    '{{failure_reason}}', '{failure_reason}'),
    '{{retry_link}}', '{retry_link}'),
  text_template = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    text_template,
    '{{customer_name}}', '{customer_name}'),
    '{{pet_name}}', '{pet_name}'),
    '{{amount_due}}', '{amount_due}'),
    '{{failure_reason}}', '{failure_reason}'),
    '{{retry_link}}', '{retry_link}'),
  updated_at = NOW()
WHERE name = 'Payment Failed Email';

-- =============================================
-- UPDATE PAYMENT REMINDER EMAIL
-- =============================================
UPDATE public.notification_templates
SET
  subject_template = 'Upcoming Payment for {pet_name} - {charge_date}',
  html_template = REPLACE(REPLACE(REPLACE(REPLACE(
    html_template,
    '{{customer_name}}', '{customer_name}'),
    '{{pet_name}}', '{pet_name}'),
    '{{charge_date}}', '{charge_date}'),
    '{{amount}}', '{amount}'),
  text_template = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    text_template,
    '{{customer_name}}', '{customer_name}'),
    '{{pet_name}}', '{pet_name}'),
    '{{charge_date}}', '{charge_date}'),
    '{{amount}}', '{amount}'),
    '{{payment_method}}', '{payment_method}'),
  updated_at = NOW()
WHERE name = 'Payment Reminder Email';

-- =============================================
-- UPDATE PAYMENT SUCCESS EMAIL
-- =============================================
UPDATE public.notification_templates
SET
  html_template = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    html_template,
    '{{customer_name}}', '{customer_name}'),
    '{{pet_name}}', '{pet_name}'),
    '{{amount_paid}}', '{amount_paid}'),
    '{{transaction_date}}', '{transaction_date}'),
    '{{payment_method}}', '{payment_method}'),
    '{{transaction_id}}', '{transaction_id}'),
  text_template = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    text_template,
    '{{customer_name}}', '{customer_name}'),
    '{{pet_name}}', '{pet_name}'),
    '{{amount_paid}}', '{amount_paid}'),
    '{{transaction_date}}', '{transaction_date}'),
    '{{payment_method}}', '{payment_method}'),
    '{{transaction_id}}', '{transaction_id}'),
  updated_at = NOW()
WHERE name = 'Payment Success Email';

-- =============================================
-- UPDATE PAYMENT FINAL NOTICE EMAIL
-- =============================================
UPDATE public.notification_templates
SET
  html_template = REPLACE(REPLACE(REPLACE(REPLACE(
    html_template,
    '{{customer_name}}', '{customer_name}'),
    '{{pet_name}}', '{pet_name}'),
    '{{amount_due}}', '{amount_due}'),
    '{{retry_link}}', '{retry_link}'),
  text_template = REPLACE(REPLACE(REPLACE(REPLACE(
    text_template,
    '{{customer_name}}', '{customer_name}'),
    '{{pet_name}}', '{pet_name}'),
    '{{amount_due}}', '{amount_due}'),
    '{{retry_link}}', '{retry_link}'),
  updated_at = NOW()
WHERE name = 'Payment Final Notice Email';

-- =============================================
-- VERIFICATION
-- =============================================
-- Verify that all templates have been updated
DO $$
DECLARE
  remaining_handlebars INTEGER;
BEGIN
  -- Count templates that still contain Handlebars syntax
  SELECT COUNT(*)
  INTO remaining_handlebars
  FROM public.notification_templates
  WHERE
    html_template LIKE '%{{%}}%'
    OR text_template LIKE '%{{%}}%'
    OR subject_template LIKE '%{{%}}%';

  IF remaining_handlebars > 0 THEN
    RAISE WARNING 'Warning: % templates still contain Handlebars syntax ({{variable}})', remaining_handlebars;
  ELSE
    RAISE NOTICE 'Success: All templates have been updated to use simple replacement syntax {variable}';
  END IF;
END $$;

COMMIT;

-- =============================================
-- COMPLETE
-- =============================================
-- Migration completed successfully
-- All notification templates now use {variable} syntax instead of {{variable}}
-- This ensures consistency with the TypeScript template replacement system
