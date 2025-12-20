-- ==============================================================================
-- CRITICAL FIXES FOR ADMIN APPOINTMENT MANAGEMENT
-- ==============================================================================
-- This migration addresses critical issues identified in code review:
-- - Issue #4: Add email UNIQUE constraint
-- - Issue #3: Remove RLS policy on view (views inherit RLS from underlying tables)
-- - Issue #12: Add proper foreign key constraint for created_by_admin_id
-- - Issue #13: Improve constraint logic for active_has_password
-- ==============================================================================

-- ==============================================================================
-- FIX #4: Add UNIQUE Constraint on Email (Case-Insensitive)
-- ==============================================================================

-- Drop existing constraint if exists
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_active_has_password;

-- Create unique index on email (case-insensitive to prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
  ON public.users(LOWER(email));

COMMENT ON INDEX idx_users_email_unique IS 'Ensures email uniqueness (case-insensitive) to prevent duplicates and support account activation flow';

-- ==============================================================================
-- FIX #13: Improve Constraint Logic for Active Password Requirement
-- ==============================================================================

-- Add improved constraint with more explicit logic
ALTER TABLE public.users
  ADD CONSTRAINT chk_active_requires_password
  CHECK (
    (is_active = false) OR
    (is_active = true AND password_hash IS NOT NULL)
  );

COMMENT ON CONSTRAINT chk_active_requires_password ON public.users IS 'Ensures active accounts must have a password. Inactive accounts (created by admin) can exist without passwords until activation.';

-- ==============================================================================
-- FIX #12: Add Foreign Key Constraint for created_by_admin_id
-- ==============================================================================

-- Add foreign key constraint with ON DELETE SET NULL
-- This ensures data integrity while allowing admin user deletion
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS fk_created_by_admin,
  ADD CONSTRAINT fk_created_by_admin
  FOREIGN KEY (created_by_admin_id)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT fk_created_by_admin ON public.appointments IS 'Foreign key to admin user who created appointment. Set to NULL if admin is deleted.';

-- ==============================================================================
-- FIX #3: Remove RLS Policy on View (Not Supported)
-- ==============================================================================

-- Drop the RLS policy on view (this would fail as views don't support RLS policies)
DROP POLICY IF EXISTS "Admins can view inactive profiles" ON public.inactive_customer_profiles;

-- Instead, recreate the view with SECURITY INVOKER
-- This means the view uses the permissions of the user executing the query
DROP VIEW IF EXISTS public.inactive_customer_profiles;

CREATE OR REPLACE VIEW public.inactive_customer_profiles
WITH (security_invoker = true) AS
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

-- Grant access to authenticated users (RLS on users table will still apply)
GRANT SELECT ON public.inactive_customer_profiles TO authenticated;

COMMENT ON VIEW public.inactive_customer_profiles IS 'Shows inactive customer profiles created by admins awaiting activation. Security is enforced through RLS on users table.';

-- ==============================================================================
-- VERIFICATION QUERIES (Comment out before running)
-- ==============================================================================

-- Verify email uniqueness constraint
-- SELECT COUNT(*), LOWER(email)
-- FROM public.users
-- GROUP BY LOWER(email)
-- HAVING COUNT(*) > 1;

-- Verify foreign key constraint
-- SELECT a.id, a.created_by_admin_id, u.email
-- FROM public.appointments a
-- LEFT JOIN public.users u ON a.created_by_admin_id = u.id
-- WHERE a.created_by_admin_id IS NOT NULL;

-- Verify active users have passwords
-- SELECT id, email, is_active, password_hash IS NULL as missing_password
-- FROM public.users
-- WHERE is_active = true AND password_hash IS NULL;
