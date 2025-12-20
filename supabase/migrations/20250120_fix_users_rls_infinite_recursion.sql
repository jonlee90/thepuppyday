-- ==============================================================================
-- FIX: Infinite Recursion in Users Table RLS Policies
-- ==============================================================================
-- Problem: RLS policies checking users.role = 'admin' cause infinite recursion
-- because querying users table triggers RLS evaluation which queries users table
--
-- Solution: Use SECURITY DEFINER function to check admin role without RLS
-- ==============================================================================

-- ==============================================================================
-- STEP 1: Create SECURITY DEFINER function for admin check
-- ==============================================================================

-- This function bypasses RLS when checking if current user is admin
-- It runs with the permissions of the function owner (superuser privileges)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Check if current user is admin. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ==============================================================================
-- STEP 2: Drop ALL existing users table RLS policies
-- ==============================================================================

-- Drop all conflicting policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can read users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Admins have full access" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authentication" ON public.users;

-- ==============================================================================
-- STEP 3: Create NEW RLS policies using SECURITY DEFINER function
-- ==============================================================================

-- Policy 1: Users can view their own profile
-- Simple, no recursion - checked FIRST for performance
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Admins can view all users
-- Uses is_admin() function to avoid recursion
CREATE POLICY "users_select_admin"
ON public.users
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Policy 3: Users can update their own profile
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Admins can update any user
CREATE POLICY "users_update_admin"
ON public.users
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy 5: Admins can insert users
CREATE POLICY "users_insert_admin"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Policy 6: Admins can delete users
CREATE POLICY "users_delete_admin"
ON public.users
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Policy 7: Allow insert during signup (for trigger function)
-- This allows the create_user_on_signup trigger to work
CREATE POLICY "users_insert_signup"
ON public.users
FOR INSERT
TO anon, authenticated
WITH CHECK (auth.uid() = id);

-- ==============================================================================
-- STEP 4: Add helpful comments
-- ==============================================================================

COMMENT ON POLICY "users_select_own" ON public.users IS
  'Allows authenticated users to view their own profile. Checked first for performance.';

COMMENT ON POLICY "users_select_admin" ON public.users IS
  'Allows admins to view all users. Uses is_admin() function to prevent infinite recursion.';

COMMENT ON POLICY "users_update_own" ON public.users IS
  'Allows authenticated users to update their own profile (including account activation).';

COMMENT ON POLICY "users_update_admin" ON public.users IS
  'Allows admins to update any user profile.';

COMMENT ON POLICY "users_insert_admin" ON public.users IS
  'Allows admins to create new user accounts manually.';

COMMENT ON POLICY "users_delete_admin" ON public.users IS
  'Allows admins to delete user accounts.';

COMMENT ON POLICY "users_insert_signup" ON public.users IS
  'Allows user creation during signup process via trigger or direct insert.';

-- ==============================================================================
-- STEP 5: Update other tables using similar admin check pattern
-- ==============================================================================

-- Create SECURITY DEFINER function for staff check (admin OR groomer)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'groomer')
  );
END;
$$;

COMMENT ON FUNCTION public.is_staff() IS
  'Check if current user is staff (admin or groomer). Uses SECURITY DEFINER to bypass RLS.';

GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

-- Update services table policies to use new function
DROP POLICY IF EXISTS "Staff can view all services" ON public.services;
DROP POLICY IF EXISTS "Admin full access to services" ON public.services;

CREATE POLICY "services_select_staff"
ON public.services
FOR SELECT
TO authenticated
USING (public.is_staff());

CREATE POLICY "services_all_admin"
ON public.services
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Update service_prices table policies to use new function
DROP POLICY IF EXISTS "Admin full access to service prices" ON public.service_prices;

CREATE POLICY "service_prices_all_admin"
ON public.service_prices
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

-- Verify policies are correctly set
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'users';

  RAISE NOTICE 'Total policies on users table: %', policy_count;

  IF policy_count < 5 THEN
    RAISE WARNING 'Expected at least 5 policies on users table, found %', policy_count;
  END IF;
END $$;

-- List all policies for verification
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Users Table RLS Policies:';
  RAISE NOTICE '========================================';

  FOR policy_record IN
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'users'
    ORDER BY policyname
  LOOP
    RAISE NOTICE 'Policy: % (Command: %)', policy_record.policyname, policy_record.cmd;
  END LOOP;

  RAISE NOTICE '========================================';
END $$;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
