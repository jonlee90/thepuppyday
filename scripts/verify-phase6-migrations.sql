-- Phase 6 Migration Verification Script
-- Run this script after applying migrations to verify everything is correct

-- =====================================================
-- 1. CHECK NEW TABLES EXIST
-- =====================================================

SELECT
  'NEW TABLES CHECK' as check_type,
  table_name,
  CASE
    WHEN table_name IN (
      'reviews',
      'marketing_campaigns',
      'campaign_sends',
      'analytics_cache',
      'waitlist_slot_offers',
      'marketing_unsubscribes'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'reviews',
    'marketing_campaigns',
    'campaign_sends',
    'analytics_cache',
    'waitlist_slot_offers',
    'marketing_unsubscribes'
  )
ORDER BY table_name;

-- =====================================================
-- 2. CHECK NEW COLUMNS ON REPORT_CARDS
-- =====================================================

SELECT
  'REPORT_CARDS COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'report_cards'
  AND column_name IN (
    'groomer_id',
    'view_count',
    'last_viewed_at',
    'sent_at',
    'expires_at',
    'dont_send',
    'is_draft',
    'updated_at'
  )
ORDER BY ordinal_position;

-- =====================================================
-- 3. CHECK NEW COLUMNS ON WAITLIST
-- =====================================================

SELECT
  'WAITLIST COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'waitlist'
  AND column_name IN ('priority', 'notes', 'offer_expires_at', 'updated_at')
ORDER BY ordinal_position;

-- =====================================================
-- 4. CHECK NEW COLUMNS ON NOTIFICATIONS_LOG
-- =====================================================

SELECT
  'NOTIFICATIONS_LOG COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notifications_log'
  AND column_name IN (
    'campaign_id',
    'campaign_send_id',
    'tracking_id',
    'clicked_at',
    'delivered_at',
    'cost_cents'
  )
ORDER BY ordinal_position;

-- =====================================================
-- 5. CHECK FOREIGN KEY CONSTRAINTS
-- =====================================================

SELECT
  'FOREIGN KEYS' as check_type,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'reviews',
    'marketing_campaigns',
    'campaign_sends',
    'waitlist_slot_offers',
    'marketing_unsubscribes'
  )
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 6. CHECK INDEXES
-- =====================================================

SELECT
  'INDEXES' as check_type,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE '%reviews%'
    OR indexname LIKE '%marketing_campaigns%'
    OR indexname LIKE '%campaign_sends%'
    OR indexname LIKE '%analytics_cache%'
    OR indexname LIKE '%waitlist_slot_offers%'
    OR indexname LIKE '%marketing_unsubscribes%'
    OR indexname LIKE '%report_cards_groomer%'
    OR indexname LIKE '%report_cards_draft%'
    OR indexname LIKE '%report_cards_sent%'
    OR indexname LIKE '%report_cards_expires%'
    OR indexname LIKE '%waitlist_priority%'
    OR indexname LIKE '%waitlist_offer_expires%'
    OR indexname LIKE '%waitlist_matching%'
    OR indexname LIKE '%notifications_log_campaign%'
    OR indexname LIKE '%notifications_log_tracking%'
  )
ORDER BY tablename, indexname;

-- =====================================================
-- 7. CHECK RLS POLICIES
-- =====================================================

SELECT
  'RLS POLICIES' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual IS NOT NULL as has_using_clause,
  with_check IS NOT NULL as has_with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'reviews',
    'marketing_campaigns',
    'campaign_sends',
    'analytics_cache',
    'waitlist_slot_offers',
    'marketing_unsubscribes'
  )
ORDER BY tablename, policyname;

-- =====================================================
-- 8. CHECK RLS IS ENABLED
-- =====================================================

SELECT
  'RLS ENABLED' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'reviews',
    'marketing_campaigns',
    'campaign_sends',
    'analytics_cache',
    'waitlist_slot_offers',
    'marketing_unsubscribes'
  )
ORDER BY tablename;

-- =====================================================
-- 9. CHECK FUNCTIONS EXIST
-- =====================================================

SELECT
  'FUNCTIONS' as check_type,
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'increment_report_card_views',
    'is_report_card_expired',
    'cleanup_expired_analytics_cache',
    'get_matching_waitlist_entries',
    'expire_old_waitlist_offers',
    'track_notification_click',
    'track_notification_delivery',
    'get_notification_metrics',
    'get_campaign_metrics'
  )
ORDER BY routine_name;

-- =====================================================
-- 10. CHECK TRIGGERS
-- =====================================================

SELECT
  'TRIGGERS' as check_type,
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND (
    trigger_name LIKE '%reviews%'
    OR trigger_name LIKE '%marketing_campaigns%'
    OR trigger_name LIKE '%waitlist_slot_offers%'
    OR (trigger_name LIKE '%report_cards%' AND trigger_name LIKE '%updated_at%')
    OR (trigger_name LIKE '%waitlist%' AND trigger_name LIKE '%updated_at%')
  )
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 11. CHECK UNIQUE CONSTRAINTS
-- =====================================================

SELECT
  'UNIQUE CONSTRAINTS' as check_type,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'reviews',
    'analytics_cache',
    'marketing_unsubscribes'
  )
ORDER BY tc.table_name, kcu.ordinal_position;

-- =====================================================
-- 12. SUMMARY COUNT
-- =====================================================

SELECT
  'SUMMARY' as check_type,
  'New Tables' as category,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'reviews',
    'marketing_campaigns',
    'campaign_sends',
    'analytics_cache',
    'waitlist_slot_offers',
    'marketing_unsubscribes'
  )

UNION ALL

SELECT
  'SUMMARY' as check_type,
  'New Functions' as category,
  COUNT(*) as count
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'increment_report_card_views',
    'is_report_card_expired',
    'cleanup_expired_analytics_cache',
    'get_matching_waitlist_entries',
    'expire_old_waitlist_offers',
    'track_notification_click',
    'track_notification_delivery',
    'get_notification_metrics',
    'get_campaign_metrics'
  )

UNION ALL

SELECT
  'SUMMARY' as check_type,
  'RLS Policies' as category,
  COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'reviews',
    'marketing_campaigns',
    'campaign_sends',
    'analytics_cache',
    'waitlist_slot_offers',
    'marketing_unsubscribes'
  );

-- =====================================================
-- 13. TEST BASIC OPERATIONS (Optional - only if safe)
-- =====================================================

-- Uncomment these to test basic insert/select operations
-- Make sure you have test users and data first!

/*
-- Test reviews table
INSERT INTO public.reviews (
  report_card_id,
  user_id,
  appointment_id,
  rating,
  feedback,
  is_public
) VALUES (
  (SELECT id FROM public.report_cards LIMIT 1),
  (SELECT id FROM public.users WHERE role = 'customer' LIMIT 1),
  (SELECT id FROM public.appointments LIMIT 1),
  5,
  'Test review',
  false
);

SELECT * FROM public.reviews ORDER BY created_at DESC LIMIT 1;

-- Test marketing_campaigns table
INSERT INTO public.marketing_campaigns (
  name,
  type,
  status,
  message
) VALUES (
  'Test Campaign',
  'one_time',
  'draft',
  '{"sms_body": "Test message", "email_subject": "Test", "email_body": "Test body"}'::jsonb
);

SELECT * FROM public.marketing_campaigns ORDER BY created_at DESC LIMIT 1;

-- Cleanup test data
DELETE FROM public.reviews WHERE feedback = 'Test review';
DELETE FROM public.marketing_campaigns WHERE name = 'Test Campaign';
*/
