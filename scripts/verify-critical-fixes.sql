-- Verification Script for Phase 6 Critical Fixes
-- Run this after applying 20241213_phase6_critical_fixes.sql
-- All queries should return expected results

-- ============================================================================
-- 1. Verify Reviews Table Enhancements
-- ============================================================================

-- Should return 4 rows (destination, google_review_url, responded_at, response_text)
SELECT
  'reviews_new_columns' AS check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'reviews'
  AND column_name IN ('destination', 'google_review_url', 'responded_at', 'response_text')
ORDER BY column_name;

-- Should return 2 rows (indexes)
SELECT
  'reviews_new_indexes' AS check_name,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'reviews'
  AND indexname IN ('idx_reviews_destination', 'idx_reviews_unresponded');

-- ============================================================================
-- 2. Verify Marketing Campaigns Table Fixes
-- ============================================================================

-- Should return 5 rows (message_content, scheduled_at, description, channel, sent_at)
SELECT
  'marketing_campaigns_columns' AS check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'marketing_campaigns'
  AND column_name IN ('message_content', 'scheduled_at', 'description', 'channel', 'sent_at')
ORDER BY column_name;

-- Should return 0 rows (old columns should be renamed)
SELECT
  'marketing_campaigns_old_columns_removed' AS check_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'marketing_campaigns'
  AND column_name IN ('message', 'scheduled_for');

-- Should return 1 row (new index)
SELECT
  'marketing_campaigns_new_indexes' AS check_name,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'marketing_campaigns'
  AND indexname = 'idx_marketing_campaigns_channel';

-- ============================================================================
-- 3. Verify Campaign Sends Table Restructure
-- ============================================================================

-- Should return 6 rows (customer_id, channel, recipient, status, opened_at, error_message)
SELECT
  'campaign_sends_columns' AS check_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'campaign_sends'
  AND column_name IN ('customer_id', 'channel', 'recipient', 'status', 'opened_at', 'error_message')
ORDER BY column_name;

-- Should return 0 rows (user_id should be renamed to customer_id)
SELECT
  'campaign_sends_old_user_id_removed' AS check_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'campaign_sends'
  AND column_name = 'user_id';

-- Should return 2 rows (new indexes)
SELECT
  'campaign_sends_new_indexes' AS check_name,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'campaign_sends'
  AND indexname IN ('idx_campaign_sends_customer', 'idx_campaign_sends_campaign_status', 'idx_campaign_sends_status');

-- ============================================================================
-- 4. Verify Waitlist Slot Offers Restructure
-- ============================================================================

-- Should return 6 rows (new columns)
SELECT
  'waitlist_slot_offers_new_columns' AS check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'waitlist_slot_offers'
  AND column_name IN (
    'waitlist_entry_id',
    'offered_slot_start',
    'offered_slot_end',
    'accepted_at',
    'cancelled_at',
    'cancellation_reason'
  )
ORDER BY column_name;

-- Should return 2 rows (new indexes)
SELECT
  'waitlist_slot_offers_new_indexes' AS check_name,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'waitlist_slot_offers'
  AND indexname IN ('idx_waitlist_slot_offers_waitlist_entry', 'idx_waitlist_slot_offers_offered_slot_start');

-- ============================================================================
-- 5. Verify Marketing Unsubscribes Consistency Fix
-- ============================================================================

-- Should return 1 row (customer_id)
SELECT
  'marketing_unsubscribes_customer_id' AS check_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'marketing_unsubscribes'
  AND column_name = 'customer_id';

-- Should return 0 rows (user_id should be renamed)
SELECT
  'marketing_unsubscribes_old_user_id_removed' AS check_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'marketing_unsubscribes'
  AND column_name = 'user_id';

-- ============================================================================
-- 6. Verify Unsafe Anonymous Unsubscribe Policy Removed
-- ============================================================================

-- Should return 0 rows (policy should be deleted)
SELECT
  'unsafe_anon_policy_removed' AS check_name,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'marketing_unsubscribes'
  AND policyname = 'anon_create_unsubscribe';

-- Count remaining policies on marketing_unsubscribes
SELECT
  'marketing_unsubscribes_policy_count' AS check_name,
  COUNT(*) AS policy_count,
  array_agg(policyname) AS policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'marketing_unsubscribes';

-- ============================================================================
-- 7. Verify Tracking ID Unique Constraint
-- ============================================================================

-- Should return 1 row (unique constraint)
SELECT
  'tracking_id_unique_constraint' AS check_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'notifications_log'
  AND constraint_name = 'notifications_log_tracking_id_key';

-- Verify no duplicate tracking_ids exist
SELECT
  'no_duplicate_tracking_ids' AS check_name,
  COUNT(*) AS duplicate_count
FROM (
  SELECT tracking_id
  FROM public.notifications_log
  GROUP BY tracking_id
  HAVING COUNT(*) > 1
) duplicates;
-- Should return 0

-- ============================================================================
-- 8. Verify SECURITY DEFINER Functions Updated
-- ============================================================================

-- Check that functions exist and are SECURITY DEFINER
SELECT
  'security_definer_functions' AS check_name,
  proname AS function_name,
  prosecdef AS is_security_definer,
  pg_get_functiondef(oid) LIKE '%RAISE EXCEPTION%' AS has_permission_check
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'increment_report_card_views',
    'get_matching_waitlist_entries',
    'expire_old_waitlist_offers',
    'track_notification_click',
    'track_notification_delivery',
    'get_notification_metrics',
    'get_campaign_metrics'
  )
ORDER BY proname;

-- ============================================================================
-- 9. Verify Data Migrations
-- ============================================================================

-- Check existing reviews have destination set
SELECT
  'reviews_destination_populated' AS check_name,
  COUNT(*) AS total_reviews,
  COUNT(destination) AS reviews_with_destination,
  COUNT(*) FILTER (WHERE destination = 'google') AS google_reviews,
  COUNT(*) FILTER (WHERE destination = 'private') AS private_reviews
FROM public.reviews;

-- Check existing campaigns have channel set
SELECT
  'campaigns_channel_populated' AS check_name,
  COUNT(*) AS total_campaigns,
  COUNT(channel) AS campaigns_with_channel,
  COUNT(*) FILTER (WHERE channel = 'email') AS email_campaigns,
  COUNT(*) FILTER (WHERE channel = 'sms') AS sms_campaigns,
  COUNT(*) FILTER (WHERE channel = 'both') AS both_campaigns
FROM public.marketing_campaigns;

-- ============================================================================
-- 10. Summary Report
-- ============================================================================

SELECT
  '========================================' AS separator,
  'VERIFICATION COMPLETE' AS status,
  NOW() AS verified_at;

-- Expected Results Summary:
-- ✅ reviews: 4 new columns, 2 new indexes
-- ✅ marketing_campaigns: 5 columns (renamed + added), 1 new index
-- ✅ campaign_sends: 6 new columns, 3 new indexes
-- ✅ waitlist_slot_offers: 6 new columns, 2 new indexes
-- ✅ marketing_unsubscribes: customer_id (renamed from user_id)
-- ✅ anon_create_unsubscribe policy: REMOVED
-- ✅ tracking_id: UNIQUE constraint added
-- ✅ SECURITY DEFINER functions: 7 functions with permission checks
-- ✅ Data migrations: Reviews have destination, campaigns have channel
