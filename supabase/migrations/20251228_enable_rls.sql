-- ==============================================================================
-- Migration: Enable Row Level Security (RLS)
-- Task: 0231 - Enable RLS on all tables and create helper functions
-- Description: Enable RLS on all database tables and create security helper functions
-- ==============================================================================

-- ==============================================================================
-- HELPER FUNCTIONS
-- ==============================================================================

-- Function: auth.user_id()
-- Returns the current authenticated user's ID
-- Note: Check if exists first to avoid conflicts with existing function
DO $$
BEGIN
  -- Check if function exists in auth schema
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'auth' AND p.proname = 'user_id'
  ) THEN
    -- Create function in auth schema (following Supabase convention)
    CREATE FUNCTION auth.user_id()
    RETURNS UUID
    LANGUAGE sql
    STABLE
    AS $$
      SELECT COALESCE(
        current_setting('request.jwt.claim.sub', true),
        (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
      )::uuid;
    $$;

    RAISE NOTICE 'Created auth.user_id() function';
  ELSE
    RAISE NOTICE 'auth.user_id() function already exists, skipping creation';
  END IF;
END $$;

COMMENT ON FUNCTION auth.user_id() IS
  'Returns the current authenticated user ID from JWT claims. Safe for RLS policies.';

-- Function: auth.is_admin_or_staff()
-- Returns true if current user is admin or groomer
-- Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion
DO $$
BEGIN
  -- Drop existing function if it exists (to recreate with latest definition)
  DROP FUNCTION IF EXISTS auth.is_admin_or_staff();

  -- Create function
  CREATE FUNCTION auth.is_admin_or_staff()
  RETURNS BOOLEAN
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $func$
  BEGIN
    RETURN EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'groomer')
    );
  END;
  $func$;

  RAISE NOTICE 'Created auth.is_admin_or_staff() function';
END $$;

COMMENT ON FUNCTION auth.is_admin_or_staff() IS
  'Check if current user is admin or groomer. Uses SECURITY DEFINER to bypass RLS and prevent infinite recursion.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION auth.user_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.is_admin_or_staff() TO authenticated;

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ==============================================================================

-- Core User Tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

-- Service & Product Tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breeds ENABLE ROW LEVEL SECURITY;

-- Appointment Tables
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_addons ENABLE ROW LEVEL SECURITY;

-- Waitlist Tables
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Report Cards
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;

-- Customer Management Tables
ALTER TABLE public.customer_flags ENABLE ROW LEVEL SECURITY;

-- Notifications
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- Membership & Loyalty Tables
ALTER TABLE public.customer_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Payment Tables (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on payments table';
  END IF;
END $$;

-- Content & Marketing Tables
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.before_after_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Staff Commission Tables (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'staff_commissions') THEN
    ALTER TABLE public.staff_commissions ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on staff_commissions table';
  END IF;
END $$;

-- Loyalty System Tables (new punch card system)
DO $$
BEGIN
  -- Customer Loyalty table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_loyalty') THEN
    ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on customer_loyalty table';
  END IF;

  -- Loyalty Punches table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'loyalty_punches') THEN
    ALTER TABLE public.loyalty_punches ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on loyalty_punches table';
  END IF;

  -- Loyalty Redemptions table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'loyalty_redemptions') THEN
    ALTER TABLE public.loyalty_redemptions ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on loyalty_redemptions table';
  END IF;

  -- Loyalty Settings table
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'loyalty_settings') THEN
    ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on loyalty_settings table';
  END IF;
END $$;

-- Membership Tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'memberships') THEN
    ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on memberships table';
  END IF;
END $$;

-- Waitlist Slot Offers (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'waitlist_slot_offers') THEN
    ALTER TABLE public.waitlist_slot_offers ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on waitlist_slot_offers table';
  END IF;
END $$;

-- Marketing Tables (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'marketing_campaigns') THEN
    ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on marketing_campaigns table';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'campaign_sends') THEN
    ALTER TABLE public.campaign_sends ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on campaign_sends table';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'marketing_unsubscribes') THEN
    ALTER TABLE public.marketing_unsubscribes ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on marketing_unsubscribes table';
  END IF;
END $$;

-- Settings Audit Log (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'settings_audit_log') THEN
    ALTER TABLE public.settings_audit_log ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on settings_audit_log table';
  END IF;
END $$;

-- Reviews Table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
    ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Enabled RLS on reviews table';
  END IF;
END $$;

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

DO $$
DECLARE
  table_record RECORD;
  rls_enabled_count INTEGER := 0;
  rls_disabled_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Status Verification:';
  RAISE NOTICE '========================================';

  FOR table_record IN
    SELECT
      schemaname,
      tablename,
      rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    IF table_record.rowsecurity THEN
      rls_enabled_count := rls_enabled_count + 1;
      RAISE NOTICE 'RLS ENABLED: %.%', table_record.schemaname, table_record.tablename;
    ELSE
      rls_disabled_count := rls_disabled_count + 1;
      RAISE NOTICE 'RLS DISABLED: %.%', table_record.schemaname, table_record.tablename;
    END IF;
  END LOOP;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total tables with RLS enabled: %', rls_enabled_count;
  RAISE NOTICE 'Total tables with RLS disabled: %', rls_disabled_count;
  RAISE NOTICE '========================================';
END $$;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
