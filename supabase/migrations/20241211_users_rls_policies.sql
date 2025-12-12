-- Migration: Row Level Security policies for users table
-- Ensures users can only read/update their own data, while admins have full access

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins have full access" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authentication" ON public.users;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Admins have full access to all users
CREATE POLICY "Admins have full access"
ON public.users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Allow insert during authentication (handled by trigger)
-- This is needed for the trigger function to work
CREATE POLICY "Enable insert for authentication"
ON public.users
FOR INSERT
WITH CHECK (true);

-- Add helpful comments
COMMENT ON POLICY "Users can view own profile" ON public.users IS
  'Allows authenticated users to view their own profile data';

COMMENT ON POLICY "Users can update own profile" ON public.users IS
  'Allows authenticated users to update their own profile data';

COMMENT ON POLICY "Admins have full access" ON public.users IS
  'Grants full CRUD access to users with admin role';

COMMENT ON POLICY "Enable insert for authentication" ON public.users IS
  'Allows user creation during signup process via trigger';
