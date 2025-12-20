-- Migration: Admin Appointment Management Schema Modifications
-- Phase: Admin Panel Advanced (Phase 6)
-- Tasks: 0001-database-schema-modifications
-- Description: Add appointment creation tracking and customer account activation flow

-- ==============================================================================
-- APPOINTMENTS TABLE: Creation Tracking
-- ==============================================================================

-- Add creation tracking columns
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS creation_method TEXT CHECK (creation_method IN ('customer_booking', 'manual_admin', 'csv_import')),
  ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES public.users(id);

-- Default existing appointments to customer_booking
UPDATE public.appointments
SET creation_method = 'customer_booking'
WHERE creation_method IS NULL;

-- Make creation_method NOT NULL after setting defaults
ALTER TABLE public.appointments
  ALTER COLUMN creation_method SET DEFAULT 'customer_booking',
  ALTER COLUMN creation_method SET NOT NULL;

-- Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_appointments_creation_method
  ON public.appointments(creation_method);

CREATE INDEX IF NOT EXISTS idx_appointments_created_by_admin
  ON public.appointments(created_by_admin_id)
  WHERE created_by_admin_id IS NOT NULL;

-- ==============================================================================
-- USERS TABLE: Account Activation Flow
-- ==============================================================================

-- Add account activation columns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;

-- Update existing users to active status
UPDATE public.users
SET
  is_active = true,
  created_by_admin = false,
  activated_at = created_at
WHERE is_active IS NULL;

-- Make is_active and created_by_admin NOT NULL after setting defaults
ALTER TABLE public.users
  ALTER COLUMN is_active SET NOT NULL,
  ALTER COLUMN created_by_admin SET NOT NULL;

-- Create partial index for finding inactive customer profiles
-- This index helps efficiently find customers who need to activate their accounts
CREATE INDEX IF NOT EXISTS idx_users_inactive_customers
  ON public.users(email, role)
  WHERE is_active = false AND role = 'customer';

-- Create index for admin-created users
CREATE INDEX IF NOT EXISTS idx_users_created_by_admin
  ON public.users(created_by_admin)
  WHERE created_by_admin = true;

-- ==============================================================================
-- CONSTRAINTS
-- ==============================================================================

-- Constraint: Active accounts must have password_hash
-- Note: This allows inactive (not-yet-activated) accounts to exist without passwords
-- When admin creates a customer profile, it starts inactive without a password
-- Customer activates account by setting password through email link
ALTER TABLE public.users
  ADD CONSTRAINT chk_active_has_password
  CHECK (is_active = false OR password_hash IS NOT NULL);

-- ==============================================================================
-- RLS POLICIES UPDATES
-- ==============================================================================

-- Drop existing policies if they exist (to recreate with new columns)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Recreate RLS policies with consideration for inactive accounts
-- Users can view their own profile (active or inactive)
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users AS u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Users can update their own profile (including activation)
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can manage all users (insert, update, delete)
CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users AS u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users AS u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users AS u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ==============================================================================
-- HELPFUL VIEWS (Optional)
-- ==============================================================================

-- View for inactive customer profiles awaiting activation
CREATE OR REPLACE VIEW public.inactive_customer_profiles AS
SELECT
  id,
  email,
  first_name,
  last_name,
  phone,
  created_at,
  created_by_admin
FROM public.users
WHERE
  role = 'customer'
  AND is_active = false
  AND created_by_admin = true
ORDER BY created_at DESC;

-- Grant access to admins
GRANT SELECT ON public.inactive_customer_profiles TO authenticated;

-- RLS policy for the view
CREATE POLICY "Admins can view inactive profiles" ON public.inactive_customer_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users AS u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- ==============================================================================
-- COMMENTS
-- ==============================================================================

COMMENT ON COLUMN public.appointments.creation_method IS 'How the appointment was created: customer_booking (online), manual_admin (admin panel), csv_import (bulk import)';
COMMENT ON COLUMN public.appointments.created_by_admin_id IS 'Admin user ID if appointment was created manually or via CSV import';
COMMENT ON COLUMN public.users.is_active IS 'Whether user account is activated. Inactive accounts cannot login until activated.';
COMMENT ON COLUMN public.users.created_by_admin IS 'Whether this user profile was created by an admin (vs self-signup)';
COMMENT ON COLUMN public.users.activated_at IS 'Timestamp when user account was activated (password set)';

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
