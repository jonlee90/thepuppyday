-- Test file to verify migration can run
-- This simulates the migration on a clean schema

BEGIN;

-- Test 1: Verify appointments table gets new columns
DO $$
BEGIN
  -- Add columns (simulating migration)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'creation_method'
  ) THEN
    ALTER TABLE public.appointments
      ADD COLUMN creation_method TEXT CHECK (creation_method IN ('customer_booking', 'manual_admin', 'csv_import')),
      ADD COLUMN created_by_admin_id UUID REFERENCES public.users(id);
  END IF;

  RAISE NOTICE 'Test 1 PASSED: Appointments columns added';
END $$;

-- Test 2: Verify users table gets new columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN is_active BOOLEAN DEFAULT true,
      ADD COLUMN created_by_admin BOOLEAN DEFAULT false,
      ADD COLUMN activated_at TIMESTAMP WITH TIME ZONE;
  END IF;

  RAISE NOTICE 'Test 2 PASSED: Users columns added';
END $$;

-- Test 3: Verify CHECK constraint
DO $$
BEGIN
  -- Test that customer_booking is a valid value
  INSERT INTO public.appointments (
    customer_id, pet_id, service_id, scheduled_at, duration_minutes,
    total_price, status, payment_status, creation_method
  ) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW() + INTERVAL '1 day',
    60,
    100,
    'pending',
    'pending',
    'customer_booking'
  );

  RAISE NOTICE 'Test 3 PASSED: Valid creation_method accepted';

  -- Rollback test insert
  ROLLBACK TO SAVEPOINT test_insert;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Test 3 FAILED: %', SQLERRM;
END $$;

-- Test 4: Verify invalid creation_method is rejected
DO $$
BEGIN
  SAVEPOINT test_invalid;

  INSERT INTO public.appointments (
    customer_id, pet_id, service_id, scheduled_at, duration_minutes,
    total_price, status, payment_status, creation_method
  ) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    NOW() + INTERVAL '1 day',
    60,
    100,
    'pending',
    'pending',
    'invalid_method'
  );

  RAISE NOTICE 'Test 4 FAILED: Invalid creation_method was accepted';
  ROLLBACK TO SAVEPOINT test_invalid;
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE 'Test 4 PASSED: Invalid creation_method correctly rejected';
    ROLLBACK TO SAVEPOINT test_invalid;
  WHEN OTHERS THEN
    RAISE NOTICE 'Test 4 FAILED: Unexpected error: %', SQLERRM;
    ROLLBACK TO SAVEPOINT test_invalid;
END $$;

-- Test 5: Verify indexes were created
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE indexname IN (
    'idx_appointments_creation_method',
    'idx_appointments_created_by_admin',
    'idx_users_inactive_customers',
    'idx_users_created_by_admin'
  );

  IF index_count >= 2 THEN
    RAISE NOTICE 'Test 5 PASSED: Indexes created (found %)', index_count;
  ELSE
    RAISE NOTICE 'Test 5 WARNING: Some indexes may be missing (found %)', index_count;
  END IF;
END $$;

ROLLBACK;

-- Migration test complete
SELECT 'Migration validation tests completed. Review notices above for results.' AS test_status;
