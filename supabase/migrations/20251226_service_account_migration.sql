-- Migration: Service Account Authentication for Google Calendar
-- Description: Replace OAuth tokens with Service Account credentials
-- Date: 2025-12-26

-- ==============================================================================
-- STEP 1: Add new columns for Service Account
-- ==============================================================================

-- Add provider column (for future extensibility)
ALTER TABLE public.calendar_connections
ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'google';

-- Add service account email
ALTER TABLE public.calendar_connections
ADD COLUMN IF NOT EXISTS service_account_email TEXT;

-- Add calendar name for display
ALTER TABLE public.calendar_connections
ADD COLUMN IF NOT EXISTS calendar_name TEXT;

-- Add credentials column (will store service account JSON)
ALTER TABLE public.calendar_connections
ADD COLUMN IF NOT EXISTS credentials TEXT;

-- ==============================================================================
-- STEP 2: Make OAuth columns nullable (for backward compatibility during migration)
-- ==============================================================================

ALTER TABLE public.calendar_connections
ALTER COLUMN access_token DROP NOT NULL;

ALTER TABLE public.calendar_connections
ALTER COLUMN refresh_token DROP NOT NULL;

ALTER TABLE public.calendar_connections
ALTER COLUMN token_expiry DROP NOT NULL;

-- ==============================================================================
-- STEP 3: Update constraints
-- ==============================================================================

-- Add check constraint: either OAuth OR Service Account credentials must be present
ALTER TABLE public.calendar_connections
ADD CONSTRAINT chk_calendar_connections_auth_method CHECK (
  -- OAuth method: has access_token, refresh_token, token_expiry
  (access_token IS NOT NULL AND refresh_token IS NOT NULL AND token_expiry IS NOT NULL)
  OR
  -- Service Account method: has credentials and service_account_email
  (credentials IS NOT NULL AND service_account_email IS NOT NULL)
);

-- ==============================================================================
-- STEP 4: Add comments for documentation
-- ==============================================================================

COMMENT ON COLUMN public.calendar_connections.provider IS 'Calendar provider (currently only google)';
COMMENT ON COLUMN public.calendar_connections.service_account_email IS 'Service account email (for service account auth)';
COMMENT ON COLUMN public.calendar_connections.credentials IS 'Service account credentials JSON (encrypted)';
COMMENT ON COLUMN public.calendar_connections.calendar_name IS 'Display name of the connected calendar';

-- ==============================================================================
-- STEP 5: Update RLS policies (no changes needed, existing policies work)
-- ==============================================================================

-- Existing RLS policies will continue to work since they filter by admin_id

-- ==============================================================================
-- NOTES FOR FUTURE CLEANUP (Optional - can run after migration complete)
-- ==============================================================================

-- Once all connections are migrated to Service Account, you can optionally:
-- 1. DROP COLUMN access_token;
-- 2. DROP COLUMN refresh_token;
-- 3. DROP COLUMN token_expiry;
-- 4. ALTER COLUMN credentials SET NOT NULL;
-- 5. ALTER COLUMN service_account_email SET NOT NULL;

-- For now, we keep both methods supported for backward compatibility
