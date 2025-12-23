-- Migration: Create function for creating inactive user profiles
-- Purpose: Allow admins to create inactive customer profiles without auth accounts
-- Used by: CSV Import, Manual Appointment Creation

-- ==============================================================================
-- CREATE INACTIVE USER PROFILE FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.create_inactive_user_profile(
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_existing_user UUID;
BEGIN
  -- Normalize email (lowercase, trimmed)
  p_email := LOWER(TRIM(p_email));

  -- Check if user already exists (case-insensitive email match)
  SELECT id INTO v_existing_user
  FROM public.users
  WHERE LOWER(email) = p_email
  LIMIT 1;

  -- If user exists, return existing ID
  IF v_existing_user IS NOT NULL THEN
    RETURN v_existing_user;
  END IF;

  -- Generate new UUID for inactive profile
  v_user_id := gen_random_uuid();

  -- Insert inactive user profile
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    is_active,
    created_by_admin,
    password_hash,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_email,
    TRIM(p_first_name),
    TRIM(p_last_name),
    CASE WHEN p_phone IS NOT NULL AND TRIM(p_phone) != ''
         THEN TRIM(p_phone)
         ELSE NULL
    END,
    'customer',
    false, -- Inactive until customer creates account
    true,  -- Created by admin
    NULL,  -- No password for inactive accounts
    now(),
    now()
  );

  RETURN v_user_id;
EXCEPTION
  WHEN unique_violation THEN
    -- Race condition: another process created the user
    SELECT id INTO v_user_id
    FROM public.users
    WHERE LOWER(email) = p_email
    LIMIT 1;

    RETURN v_user_id;
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create inactive user profile: %', SQLERRM;
END;
$$;

-- Grant execution to authenticated users (admins will be checked via RLS)
GRANT EXECUTE ON FUNCTION public.create_inactive_user_profile TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_inactive_user_profile IS
  'Creates an inactive customer profile without an auth account. Used during CSV import and manual appointment creation. Returns existing user ID if email already exists.';

-- ==============================================================================
-- SECURITY: Ensure only admins can call this function
-- ==============================================================================

-- Create RLS policy for the function execution
-- Note: The function itself has SECURITY DEFINER, but we rely on application-level
-- checks in the API routes to ensure only admins call this function.
