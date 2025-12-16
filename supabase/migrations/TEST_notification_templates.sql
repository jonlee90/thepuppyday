-- =============================================
-- Phase 8: Notification Templates Test Suite
-- =============================================
-- Description: Test all notification templates with sample data
-- Run this after 20241215_phase8_notification_default_templates.sql

-- =============================================
-- TEST SETUP
-- =============================================
DO $$
DECLARE
  v_test_count INTEGER := 0;
  v_pass_count INTEGER := 0;
  v_fail_count INTEGER := 0;
  v_template_id UUID;
  v_rendered RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NOTIFICATION TEMPLATES TEST SUITE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- =============================================
  -- TEST 1: Booking Confirmation Email
  -- =============================================
  RAISE NOTICE 'TEST 1: Booking Confirmation Email';
  v_test_count := v_test_count + 1;

  BEGIN
    SELECT id INTO v_template_id
    FROM notification_templates
    WHERE name = 'Booking Confirmation Email - Enhanced';

    IF v_template_id IS NULL THEN
      RAISE EXCEPTION 'Template not found';
    END IF;

    SELECT * INTO v_rendered
    FROM render_template(
      v_template_id,
      '{
        "customer_name": "Sarah",
        "pet_name": "Buddy",
        "appointment_date": "Monday, January 15, 2025",
        "appointment_time": "10:00 AM",
        "service_name": "Premium Grooming",
        "total_price": "$95.00"
      }'::jsonb
    );

    IF v_rendered.subject IS NOT NULL AND
       v_rendered.html_content IS NOT NULL AND
       v_rendered.text_content IS NOT NULL THEN
      RAISE NOTICE '  ✓ PASS: Template renders successfully';
      RAISE NOTICE '  Subject: %', v_rendered.subject;
      v_pass_count := v_pass_count + 1;
    ELSE
      RAISE EXCEPTION 'Template rendering returned NULL';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '  ✗ FAIL: %', SQLERRM;
      v_fail_count := v_fail_count + 1;
  END;

  -- =============================================
  -- TEST 2: Booking Confirmation SMS
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 2: Booking Confirmation SMS';
  v_test_count := v_test_count + 1;

  BEGIN
    SELECT id INTO v_template_id
    FROM notification_templates
    WHERE name = 'Booking Confirmation SMS';

    IF v_template_id IS NULL THEN
      RAISE EXCEPTION 'Template not found';
    END IF;

    SELECT * INTO v_rendered
    FROM render_template(
      v_template_id,
      '{
        "pet_name": "Buddy",
        "appointment_date": "Jan 15",
        "appointment_time": "10:00 AM",
        "total_price": "$95"
      }'::jsonb
    );

    IF v_rendered.text_content IS NOT NULL THEN
      RAISE NOTICE '  ✓ PASS: Template renders successfully';
      RAISE NOTICE '  Text: %', v_rendered.text_content;
      RAISE NOTICE '  Length: % characters', LENGTH(v_rendered.text_content);
      IF LENGTH(v_rendered.text_content) > 160 THEN
        RAISE NOTICE '  ⚠ WARNING: SMS exceeds 160 characters';
      END IF;
      v_pass_count := v_pass_count + 1;
    ELSE
      RAISE EXCEPTION 'Template rendering returned NULL';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '  ✗ FAIL: %', SQLERRM;
      v_fail_count := v_fail_count + 1;
  END;

  -- =============================================
  -- TEST 3: Appointment Reminder SMS
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 3: Appointment Reminder SMS - 24h';
  v_test_count := v_test_count + 1;

  BEGIN
    SELECT id INTO v_template_id
    FROM notification_templates
    WHERE name = 'Appointment Reminder SMS - 24h';

    SELECT * INTO v_rendered
    FROM render_template(
      v_template_id,
      '{
        "pet_name": "Max",
        "appointment_time": "2:00 PM"
      }'::jsonb
    );

    IF v_rendered.text_content IS NOT NULL THEN
      RAISE NOTICE '  ✓ PASS: Template renders successfully';
      RAISE NOTICE '  Text: %', v_rendered.text_content;
      RAISE NOTICE '  Length: % characters', LENGTH(v_rendered.text_content);
      v_pass_count := v_pass_count + 1;
    ELSE
      RAISE EXCEPTION 'Template rendering returned NULL';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '  ✗ FAIL: %', SQLERRM;
      v_fail_count := v_fail_count + 1;
  END;

  -- =============================================
  -- TEST 4: Status Checked In SMS
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 4: Status Checked In SMS';
  v_test_count := v_test_count + 1;

  BEGIN
    SELECT id INTO v_template_id
    FROM notification_templates
    WHERE name = 'Status: Checked In SMS';

    SELECT * INTO v_rendered
    FROM render_template(
      v_template_id,
      '{
        "pet_name": "Luna"
      }'::jsonb
    );

    IF v_rendered.text_content IS NOT NULL THEN
      RAISE NOTICE '  ✓ PASS: Template renders successfully';
      RAISE NOTICE '  Text: %', v_rendered.text_content;
      RAISE NOTICE '  Length: % characters', LENGTH(v_rendered.text_content);
      v_pass_count := v_pass_count + 1;
    ELSE
      RAISE EXCEPTION 'Template rendering returned NULL';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '  ✗ FAIL: %', SQLERRM;
      v_fail_count := v_fail_count + 1;
  END;

  -- =============================================
  -- TEST 5: Status Ready for Pickup SMS
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 5: Status Ready for Pickup SMS';
  v_test_count := v_test_count + 1;

  BEGIN
    SELECT id INTO v_template_id
    FROM notification_templates
    WHERE name = 'Status: Ready for Pickup SMS';

    SELECT * INTO v_rendered
    FROM render_template(
      v_template_id,
      '{
        "pet_name": "Charlie"
      }'::jsonb
    );

    IF v_rendered.text_content IS NOT NULL THEN
      RAISE NOTICE '  ✓ PASS: Template renders successfully';
      RAISE NOTICE '  Text: %', v_rendered.text_content;
      RAISE NOTICE '  Length: % characters', LENGTH(v_rendered.text_content);
      v_pass_count := v_pass_count + 1;
    ELSE
      RAISE EXCEPTION 'Template rendering returned NULL';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '  ✗ FAIL: %', SQLERRM;
      v_fail_count := v_fail_count + 1;
  END;

  -- =============================================
  -- TEST 6: Report Card Ready Email
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 6: Report Card Ready Email';
  v_test_count := v_test_count + 1;

  BEGIN
    SELECT id INTO v_template_id
    FROM notification_templates
    WHERE name = 'Report Card Ready Email - Enhanced';

    SELECT * INTO v_rendered
    FROM render_template(
      v_template_id,
      '{
        "customer_name": "John",
        "pet_name": "Bella",
        "report_card_url": "https://puppyday.com/report/abc123",
        "groomer_notes": "Bella was a perfect angel today!",
        "next_grooming_date": "February 15, 2025",
        "review_url": "https://g.page/puppyday/review"
      }'::jsonb
    );

    IF v_rendered.subject IS NOT NULL AND v_rendered.html_content IS NOT NULL THEN
      RAISE NOTICE '  ✓ PASS: Template renders successfully';
      RAISE NOTICE '  Subject: %', v_rendered.subject;
      v_pass_count := v_pass_count + 1;
    ELSE
      RAISE EXCEPTION 'Template rendering returned NULL';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '  ✗ FAIL: %', SQLERRM;
      v_fail_count := v_fail_count + 1;
  END;

  -- =============================================
  -- TEST 7: Report Card Ready SMS
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 7: Report Card Ready SMS';
  v_test_count := v_test_count + 1;

  BEGIN
    SELECT id INTO v_template_id
    FROM notification_templates
    WHERE name = 'Report Card Ready SMS';

    SELECT * INTO v_rendered
    FROM render_template(
      v_template_id,
      '{
        "pet_name": "Bella",
        "report_card_url": "https://pday.co/r/abc123"
      }'::jsonb
    );

    IF v_rendered.text_content IS NOT NULL THEN
      RAISE NOTICE '  ✓ PASS: Template renders successfully';
      RAISE NOTICE '  Text: %', v_rendered.text_content;
      RAISE NOTICE '  Length: % characters', LENGTH(v_rendered.text_content);
      v_pass_count := v_pass_count + 1;
    ELSE
      RAISE EXCEPTION 'Template rendering returned NULL';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '  ✗ FAIL: %', SQLERRM;
      v_fail_count := v_fail_count + 1;
  END;

  -- =============================================
  -- TEST 8: Waitlist Spot Available SMS
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 8: Waitlist Spot Available SMS';
  v_test_count := v_test_count + 1;

  BEGIN
    SELECT id INTO v_template_id
    FROM notification_templates
    WHERE name = 'Waitlist Spot Available SMS';

    SELECT * INTO v_rendered
    FROM render_template(
      v_template_id,
      '{
        "customer_name": "Mike",
        "available_date": "Jan 20",
        "available_time": "3:00 PM",
        "booking_url": "https://pday.co/b/xyz789"
      }'::jsonb
    );

    IF v_rendered.text_content IS NOT NULL THEN
      RAISE NOTICE '  ✓ PASS: Template renders successfully';
      RAISE NOTICE '  Text: %', v_rendered.text_content;
      RAISE NOTICE '  Length: % characters', LENGTH(v_rendered.text_content);
      v_pass_count := v_pass_count + 1;
    ELSE
      RAISE EXCEPTION 'Template rendering returned NULL';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '  ✗ FAIL: %', SQLERRM;
      v_fail_count := v_fail_count + 1;
  END;

  -- =============================================
  -- TEST 9: Retention Reminder Email
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 9: Retention Reminder Email';
  v_test_count := v_test_count + 1;

  BEGIN
    SELECT id INTO v_template_id
    FROM notification_templates
    WHERE name = 'Retention Reminder Email - Enhanced';

    SELECT * INTO v_rendered
    FROM render_template(
      v_template_id,
      '{
        "customer_name": "Emily",
        "pet_name": "Cooper",
        "weeks_since_last": "8",
        "breed_name": "Golden Retriever",
        "recommended_weeks": "6",
        "booking_url": "https://puppyday.com/book"
      }'::jsonb
    );

    IF v_rendered.subject IS NOT NULL AND v_rendered.html_content IS NOT NULL THEN
      RAISE NOTICE '  ✓ PASS: Template renders successfully';
      RAISE NOTICE '  Subject: %', v_rendered.subject;
      v_pass_count := v_pass_count + 1;
    ELSE
      RAISE EXCEPTION 'Template rendering returned NULL';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '  ✗ FAIL: %', SQLERRM;
      v_fail_count := v_fail_count + 1;
  END;

  -- =============================================
  -- TEST 10: Retention Reminder SMS
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 10: Retention Reminder SMS';
  v_test_count := v_test_count + 1;

  BEGIN
    SELECT id INTO v_template_id
    FROM notification_templates
    WHERE name = 'Retention Reminder SMS';

    SELECT * INTO v_rendered
    FROM render_template(
      v_template_id,
      '{
        "customer_name": "Emily",
        "pet_name": "Cooper",
        "weeks_since_last": "8",
        "booking_url": "https://pday.co/b/ret123"
      }'::jsonb
    );

    IF v_rendered.text_content IS NOT NULL THEN
      RAISE NOTICE '  ✓ PASS: Template renders successfully';
      RAISE NOTICE '  Text: %', v_rendered.text_content;
      RAISE NOTICE '  Length: % characters', LENGTH(v_rendered.text_content);
      v_pass_count := v_pass_count + 1;
    ELSE
      RAISE EXCEPTION 'Template rendering returned NULL';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '  ✗ FAIL: %', SQLERRM;
      v_fail_count := v_fail_count + 1;
  END;

  -- =============================================
  -- TEST 11: Payment Failed Email
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 11: Payment Failed Email';
  v_test_count := v_test_count + 1;

  BEGIN
    SELECT id INTO v_template_id
    FROM notification_templates
    WHERE name = 'Payment Failed Email';

    SELECT * INTO v_rendered
    FROM render_template(
      v_template_id,
      '{
        "customer_name": "David",
        "pet_name": "Rocky",
        "amount_due": "$95.00",
        "failure_reason": "Insufficient funds",
        "retry_link": "https://puppyday.com/payment/retry/abc"
      }'::jsonb
    );

    IF v_rendered.subject IS NOT NULL AND v_rendered.html_content IS NOT NULL THEN
      RAISE NOTICE '  ✓ PASS: Template renders successfully';
      RAISE NOTICE '  Subject: %', v_rendered.subject;
      v_pass_count := v_pass_count + 1;
    ELSE
      RAISE EXCEPTION 'Template rendering returned NULL';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '  ✗ FAIL: %', SQLERRM;
      v_fail_count := v_fail_count + 1;
  END;

  -- =============================================
  -- TEST 12: Payment Reminder Email
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 12: Payment Reminder Email';
  v_test_count := v_test_count + 1;

  BEGIN
    SELECT id INTO v_template_id
    FROM notification_templates
    WHERE name = 'Payment Reminder Email';

    SELECT * INTO v_rendered
    FROM render_template(
      v_template_id,
      '{
        "customer_name": "Lisa",
        "pet_name": "Daisy",
        "charge_date": "January 20, 2025",
        "amount": "$55.00",
        "payment_method": "Visa ending in 1234"
      }'::jsonb
    );

    IF v_rendered.subject IS NOT NULL AND v_rendered.html_content IS NOT NULL THEN
      RAISE NOTICE '  ✓ PASS: Template renders successfully';
      RAISE NOTICE '  Subject: %', v_rendered.subject;
      v_pass_count := v_pass_count + 1;
    ELSE
      RAISE EXCEPTION 'Template rendering returned NULL';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '  ✗ FAIL: %', SQLERRM;
      v_fail_count := v_fail_count + 1;
  END;

  -- =============================================
  -- TEST 13: Payment Success Email
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 13: Payment Success Email';
  v_test_count := v_test_count + 1;

  BEGIN
    SELECT id INTO v_template_id
    FROM notification_templates
    WHERE name = 'Payment Success Email';

    SELECT * INTO v_rendered
    FROM render_template(
      v_template_id,
      '{
        "customer_name": "Robert",
        "pet_name": "Milo",
        "amount_paid": "$70.00",
        "transaction_date": "January 15, 2025 at 10:30 AM",
        "payment_method": "Visa ending in 5678",
        "transaction_id": "ch_1234567890abcdef"
      }'::jsonb
    );

    IF v_rendered.subject IS NOT NULL AND v_rendered.html_content IS NOT NULL THEN
      RAISE NOTICE '  ✓ PASS: Template renders successfully';
      RAISE NOTICE '  Subject: %', v_rendered.subject;
      v_pass_count := v_pass_count + 1;
    ELSE
      RAISE EXCEPTION 'Template rendering returned NULL';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '  ✗ FAIL: %', SQLERRM;
      v_fail_count := v_fail_count + 1;
  END;

  -- =============================================
  -- TEST 14: Payment Final Notice Email
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE 'TEST 14: Payment Final Notice Email';
  v_test_count := v_test_count + 1;

  BEGIN
    SELECT id INTO v_template_id
    FROM notification_templates
    WHERE name = 'Payment Final Notice Email';

    SELECT * INTO v_rendered
    FROM render_template(
      v_template_id,
      '{
        "customer_name": "Jennifer",
        "pet_name": "Oscar",
        "amount_due": "$95.00",
        "retry_link": "https://puppyday.com/payment/urgent/xyz"
      }'::jsonb
    );

    IF v_rendered.subject IS NOT NULL AND v_rendered.html_content IS NOT NULL THEN
      RAISE NOTICE '  ✓ PASS: Template renders successfully';
      RAISE NOTICE '  Subject: %', v_rendered.subject;
      v_pass_count := v_pass_count + 1;
    ELSE
      RAISE EXCEPTION 'Template rendering returned NULL';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '  ✗ FAIL: %', SQLERRM;
      v_fail_count := v_fail_count + 1;
  END;

  -- =============================================
  -- TEST SUMMARY
  -- =============================================
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Tests: %', v_test_count;
  RAISE NOTICE 'Passed: %', v_pass_count;
  RAISE NOTICE 'Failed: %', v_fail_count;
  RAISE NOTICE '';

  IF v_fail_count = 0 THEN
    RAISE NOTICE '✓ ALL TESTS PASSED!';
  ELSE
    RAISE NOTICE '✗ SOME TESTS FAILED';
  END IF;
  RAISE NOTICE '========================================';

END $$;

-- =============================================
-- VERIFY TEMPLATE COUNTS
-- =============================================
DO $$
DECLARE
  v_total_templates INTEGER;
  v_email_templates INTEGER;
  v_sms_templates INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEMPLATE STATISTICS';
  RAISE NOTICE '========================================';

  SELECT COUNT(*) INTO v_total_templates FROM notification_templates;
  SELECT COUNT(*) INTO v_email_templates FROM notification_templates WHERE channel = 'email';
  SELECT COUNT(*) INTO v_sms_templates FROM notification_templates WHERE channel = 'sms';

  RAISE NOTICE 'Total Templates: %', v_total_templates;
  RAISE NOTICE 'Email Templates: %', v_email_templates;
  RAISE NOTICE 'SMS Templates: %', v_sms_templates;
  RAISE NOTICE '';

  -- List all templates
  RAISE NOTICE 'Template List:';
  FOR r IN
    SELECT name, type, channel, is_active
    FROM notification_templates
    ORDER BY type, channel
  LOOP
    RAISE NOTICE '  - % (% - %) %', r.name, r.type, r.channel,
      CASE WHEN r.is_active THEN '✓' ELSE '✗' END;
  END LOOP;

  RAISE NOTICE '========================================';
END $$;

-- =============================================
-- VERIFY NOTIFICATION SETTINGS LINKS
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NOTIFICATION SETTINGS TEMPLATE LINKS';
  RAISE NOTICE '========================================';

  FOR r IN
    SELECT
      ns.notification_type,
      et.name as email_template_name,
      st.name as sms_template_name
    FROM notification_settings ns
    LEFT JOIN notification_templates et ON ns.email_template_id = et.id
    LEFT JOIN notification_templates st ON ns.sms_template_id = st.id
    ORDER BY ns.notification_type
  LOOP
    RAISE NOTICE 'Type: %', r.notification_type;
    RAISE NOTICE '  Email: %', COALESCE(r.email_template_name, 'NOT LINKED');
    RAISE NOTICE '  SMS: %', COALESCE(r.sms_template_name, 'NOT LINKED');
    RAISE NOTICE '';
  END LOOP;

  RAISE NOTICE '========================================';
END $$;
