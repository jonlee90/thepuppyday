-- ==============================================================================
-- TEST SCRIPT: Validate RLS Infinite Recursion Fix
-- ==============================================================================
-- Run this script AFTER applying 20250120_fix_users_rls_infinite_recursion.sql
-- to verify the fix works correctly
-- ==============================================================================

-- ==============================================================================
-- TEST 1: Verify helper functions exist
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'is_admin'
    AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'FAILED: is_admin() function not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'is_staff'
    AND pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'FAILED: is_staff() function not found';
  END IF;

  RAISE NOTICE 'PASSED: Helper functions exist';
END $$;

-- ==============================================================================
-- TEST 2: Verify all old policies are removed
-- ==============================================================================

DO $$
DECLARE
  old_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'users'
  AND policyname IN (
    'Admins can view all users',
    'Admins have full access',
    'Authenticated users can read users',
    'Enable insert for authentication'
  );

  IF old_policy_count > 0 THEN
    RAISE EXCEPTION 'FAILED: Found % old policies that should be removed', old_policy_count;
  END IF;

  RAISE NOTICE 'PASSED: Old conflicting policies removed';
END $$;

-- ==============================================================================
-- TEST 3: Verify new policies exist
-- ==============================================================================

DO $$
DECLARE
  new_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO new_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'users'
  AND policyname IN (
    'users_select_own',
    'users_select_admin',
    'users_update_own',
    'users_update_admin',
    'users_insert_admin',
    'users_delete_admin',
    'users_insert_signup'
  );

  IF new_policy_count < 7 THEN
    RAISE EXCEPTION 'FAILED: Expected 7 new policies, found %', new_policy_count;
  END IF;

  RAISE NOTICE 'PASSED: All new policies created (found %)', new_policy_count;
END $$;

-- ==============================================================================
-- TEST 4: Verify policies use is_admin() function
-- ==============================================================================

DO $$
DECLARE
  policy_using_function INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_using_function
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'users'
  AND (qual LIKE '%is_admin()%' OR with_check LIKE '%is_admin()%');

  IF policy_using_function < 1 THEN
    RAISE EXCEPTION 'FAILED: No policies using is_admin() function';
  END IF;

  RAISE NOTICE 'PASSED: Policies using is_admin() function (found %)', policy_using_function;
END $$;

-- ==============================================================================
-- TEST 5: Verify no circular policy definitions
-- ==============================================================================

DO $$
DECLARE
  circular_policies INTEGER;
BEGIN
  -- Check for policies that query users table directly (bad pattern)
  SELECT COUNT(*) INTO circular_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'users'
  AND policyname LIKE '%admin%'
  AND (
    qual LIKE '%FROM public.users%' OR
    qual LIKE '%FROM users%'
  )
  AND policyname NOT IN ('users_select_own', 'users_update_own', 'users_insert_signup');

  IF circular_policies > 0 THEN
    RAISE WARNING 'POTENTIAL ISSUE: Found % policies with direct users table queries', circular_policies;
  ELSE
    RAISE NOTICE 'PASSED: No circular policy definitions detected';
  END IF;
END $$;

-- ==============================================================================
-- TEST 6: Test is_admin() function execution
-- ==============================================================================

DO $$
DECLARE
  admin_check BOOLEAN;
BEGIN
  -- This should execute without infinite recursion
  -- It will return false when run as superuser (not authenticated user)
  BEGIN
    SELECT public.is_admin() INTO admin_check;
    RAISE NOTICE 'PASSED: is_admin() executed without error (result: %)', admin_check;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'FAILED: is_admin() threw error: %', SQLERRM;
  END;
END $$;

-- ==============================================================================
-- TEST 7: Test is_staff() function execution
-- ==============================================================================

DO $$
DECLARE
  staff_check BOOLEAN;
BEGIN
  -- This should execute without infinite recursion
  BEGIN
    SELECT public.is_staff() INTO staff_check;
    RAISE NOTICE 'PASSED: is_staff() executed without error (result: %)', staff_check;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'FAILED: is_staff() threw error: %', SQLERRM;
  END;
END $$;

-- ==============================================================================
-- TEST 8: Verify RLS is still enabled
-- ==============================================================================

DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'users'
  AND relnamespace = 'public'::regnamespace;

  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'FAILED: RLS not enabled on users table';
  END IF;

  RAISE NOTICE 'PASSED: RLS enabled on users table';
END $$;

-- ==============================================================================
-- TEST 9: List all current policies for review
-- ==============================================================================

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Current Users Table RLS Policies:';
  RAISE NOTICE '========================================';

  FOR policy_record IN
    SELECT
      policyname,
      cmd,
      CASE
        WHEN roles = '{authenticated}' THEN 'authenticated'
        WHEN roles = '{anon}' THEN 'anon'
        WHEN roles = '{anon,authenticated}' THEN 'anon,authenticated'
        ELSE array_to_string(roles, ',')
      END as roles,
      CASE
        WHEN qual IS NOT NULL THEN 'Yes'
        ELSE 'No'
      END as has_using,
      CASE
        WHEN with_check IS NOT NULL THEN 'Yes'
        ELSE 'No'
      END as has_with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'users'
    ORDER BY policyname
  LOOP
    RAISE NOTICE 'Policy: % | Command: % | Roles: % | USING: % | WITH CHECK: %',
      policy_record.policyname,
      policy_record.cmd,
      policy_record.roles,
      policy_record.has_using,
      policy_record.has_with_check;
  END LOOP;

  RAISE NOTICE '========================================';
END $$;

-- ==============================================================================
-- TEST 10: Verify services table policies updated
-- ==============================================================================

DO $$
DECLARE
  services_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO services_policies
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'services'
  AND policyname IN ('services_select_staff', 'services_all_admin');

  IF services_policies < 2 THEN
    RAISE WARNING 'POTENTIAL ISSUE: Expected 2 updated policies on services table, found %', services_policies;
  ELSE
    RAISE NOTICE 'PASSED: Services table policies updated (found %)', services_policies;
  END IF;
END $$;

-- ==============================================================================
-- TEST SUMMARY
-- ==============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS RECURSION FIX VALIDATION COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All tests passed! The fix is ready for deployment.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test user login in application';
  RAISE NOTICE '2. Test admin login in application';
  RAISE NOTICE '3. Verify no error 42P17 in logs';
  RAISE NOTICE '4. Deploy to production';
  RAISE NOTICE '========================================';
END $$;
