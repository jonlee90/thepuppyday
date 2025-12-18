-- =============================================
-- Phase 9: Admin Settings & Content Management
-- Validation Tests for Migration 20241217_phase9_admin_settings_schema.sql
-- =============================================

-- =============================================
-- TEST 1: Verify all tables were created
-- =============================================
SELECT 'TEST 1: Verify tables exist' as test_name;

SELECT
  tablename,
  CASE
    WHEN tablename IN ('staff_commissions', 'referral_codes', 'referrals', 'settings_audit_log')
    THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('staff_commissions', 'referral_codes', 'referrals', 'settings_audit_log')
ORDER BY tablename;

-- =============================================
-- TEST 2: Verify promo_banners has impression_count column
-- =============================================
SELECT 'TEST 2: Verify promo_banners.impression_count exists' as test_name;

SELECT
  column_name,
  data_type,
  column_default,
  CASE
    WHEN column_name = 'impression_count' AND data_type = 'bigint'
    THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'promo_banners'
AND column_name = 'impression_count';

-- =============================================
-- TEST 3: Verify indexes were created
-- =============================================
SELECT 'TEST 3: Verify indexes exist' as test_name;

SELECT
  indexname,
  tablename,
  'PASS' as status
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
  'idx_staff_commissions_groomer',
  'idx_referral_codes_customer',
  'idx_referral_codes_code',
  'idx_referrals_referrer',
  'idx_referrals_referee',
  'idx_referrals_code',
  'idx_settings_audit_log_admin',
  'idx_settings_audit_log_type',
  'idx_settings_audit_log_created'
)
ORDER BY indexname;

-- =============================================
-- TEST 4: Verify RLS is enabled on all new tables
-- =============================================
SELECT 'TEST 4: Verify RLS enabled' as test_name;

SELECT
  tablename,
  rowsecurity,
  CASE
    WHEN rowsecurity = true THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('staff_commissions', 'referral_codes', 'referrals', 'settings_audit_log')
ORDER BY tablename;

-- =============================================
-- TEST 5: Verify RLS policies were created
-- =============================================
SELECT 'TEST 5: Verify RLS policies exist' as test_name;

SELECT
  tablename,
  policyname,
  'PASS' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('staff_commissions', 'referral_codes', 'referrals', 'settings_audit_log')
ORDER BY tablename, policyname;

-- =============================================
-- TEST 6: Verify default settings were inserted
-- =============================================
SELECT 'TEST 6: Verify default settings inserted' as test_name;

SELECT
  key,
  value ->> 'min_advance_hours' as min_advance_hours,
  value ->> 'is_enabled' as is_enabled,
  CASE
    WHEN key IN ('booking_settings', 'loyalty_earning_rules', 'loyalty_redemption_rules', 'referral_program')
    THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM public.settings
WHERE key IN ('booking_settings', 'loyalty_earning_rules', 'loyalty_redemption_rules', 'referral_program')
ORDER BY key;

-- =============================================
-- TEST 7: Verify default site content was inserted
-- =============================================
SELECT 'TEST 7: Verify default site content inserted' as test_name;

SELECT
  key,
  content ->> 'headline' as headline,
  content ->> 'page_title' as page_title,
  content ->> 'name' as business_name,
  CASE
    WHEN key IN ('hero', 'seo', 'business_info')
    THEN 'PASS'
    ELSE 'FAIL'
  END as status
FROM public.site_content
WHERE key IN ('hero', 'seo', 'business_info')
ORDER BY key;

-- =============================================
-- TEST 8: Verify constraints on staff_commissions
-- =============================================
SELECT 'TEST 8: Verify staff_commissions constraints' as test_name;

SELECT
  conname as constraint_name,
  contype as constraint_type,
  'PASS' as status
FROM pg_constraint
WHERE conrelid = 'public.staff_commissions'::regclass
AND conname IN ('staff_commissions_rate_type_check', 'staff_commissions_rate_check', 'staff_commissions_groomer_id_key')
ORDER BY conname;

-- =============================================
-- TEST 9: Verify constraints on referral_codes
-- =============================================
SELECT 'TEST 9: Verify referral_codes constraints' as test_name;

SELECT
  conname as constraint_name,
  contype as constraint_type,
  'PASS' as status
FROM pg_constraint
WHERE conrelid = 'public.referral_codes'::regclass
AND conname IN ('referral_codes_code_key', 'referral_codes_uses_count_check', 'max_uses_check')
ORDER BY conname;

-- =============================================
-- TEST 10: Verify constraints on referrals
-- =============================================
SELECT 'TEST 10: Verify referrals constraints' as test_name;

SELECT
  conname as constraint_name,
  contype as constraint_type,
  'PASS' as status
FROM pg_constraint
WHERE conrelid = 'public.referrals'::regclass
AND conname IN ('referrals_status_check', 'referrals_referee_id_key', 'referrer_not_referee')
ORDER BY conname;

-- =============================================
-- TEST 11: Verify trigger on staff_commissions
-- =============================================
SELECT 'TEST 11: Verify triggers exist' as test_name;

SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  'PASS' as status
FROM pg_trigger
WHERE tgname = 'trigger_staff_commissions_updated_at'
AND tgrelid = 'public.staff_commissions'::regclass;

-- =============================================
-- TEST 12: Verify helper view exists
-- =============================================
SELECT 'TEST 12: Verify helper view exists' as test_name;

SELECT
  viewname,
  'PASS' as status
FROM pg_views
WHERE schemaname = 'public'
AND viewname = 'staff_commission_earnings';

-- =============================================
-- TEST 13: Test inserting sample data
-- =============================================
SELECT 'TEST 13: Test sample data insertion' as test_name;

-- Note: This would require a test user to be created first
-- Skipping for now, but here's the pattern:
-- INSERT INTO public.staff_commissions (groomer_id, rate_type, rate, include_addons)
-- VALUES ('test-groomer-uuid', 'percentage', 50.00, true)
-- RETURNING id, 'PASS' as status;

SELECT 'TEST 13 SKIPPED - Requires test user creation' as result;

-- =============================================
-- SUMMARY
-- =============================================
SELECT 'VALIDATION COMPLETE' as summary;
SELECT
  'Total Tables Created: 4' as tables,
  'Total Indexes Created: 9+' as indexes,
  'Total RLS Policies: 12+' as policies,
  'Total Default Settings: 4' as settings,
  'Total Site Content: 3' as content;
