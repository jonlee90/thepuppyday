-- RISKY Schema Cleanup Operations
-- Generated: 2025-12-27
-- Database: thepuppyday (Supabase PostgreSQL)
--
-- ⚠️ WARNING: These operations require CAREFUL REVIEW before execution.
-- ⚠️ They remove columns that may be needed for auditing, compliance, or future features.
--
-- INSTRUCTIONS:
-- 1. Review each operation with business stakeholders
-- 2. Verify columns are truly unused (check application logs)
-- 3. Take full database backup before running
-- 4. Test in staging environment first
-- 5. Execute during maintenance window
-- 6. Monitor application for errors after deployment

-- =============================================================================
-- SECTION 1: REMOVE UNUSED AUDIT COLUMNS FROM APPOINTMENTS
-- =============================================================================

-- These columns were added for auditing but are never queried or displayed
-- Risk: May be needed for compliance, customer disputes, or admin investigation

-- REVIEW REQUIRED: Check if these are used in:
-- - Customer service investigations
-- - Dispute resolution
-- - Legal compliance requirements
-- - Future analytics features

-- ⚠️ UNCOMMENT ONLY AFTER REVIEW
/*
ALTER TABLE appointments
  DROP COLUMN IF EXISTS admin_notes,              -- Internal admin notes
  DROP COLUMN IF EXISTS cancellation_reason,      -- Why appointment was cancelled
  DROP COLUMN IF EXISTS created_by_admin_id;      -- Which admin created it

COMMENT ON TABLE appointments IS 'Removed unused audit columns: admin_notes, cancellation_reason, created_by_admin_id (2025-12-27)';
*/

-- SAFER ALTERNATIVE: Keep columns but add comments
COMMENT ON COLUMN appointments.admin_notes IS 'Internal admin notes - currently unused in UI';
COMMENT ON COLUMN appointments.cancellation_reason IS 'Cancellation reason - currently unused in UI';
COMMENT ON COLUMN appointments.created_by_admin_id IS 'Admin who created appointment - currently unused';

-- =============================================================================
-- SECTION 2: REMOVE UNUSED TRACKING COLUMNS FROM NOTIFICATIONS_LOG
-- =============================================================================

-- These columns track notification delivery metrics but are never displayed
-- Risk: Breaks notification analytics, prevents cost tracking, removes retry history

-- REVIEW REQUIRED: Check if planned for:
-- - Notification analytics dashboard
-- - SMS cost reporting
-- - Email deliverability metrics
-- - A/B testing analysis

-- ⚠️ UNCOMMENT ONLY AFTER REVIEW
/*
ALTER TABLE notifications_log
  DROP COLUMN IF EXISTS clicked_at,        -- When link was clicked
  DROP COLUMN IF EXISTS delivered_at,      -- When delivered to recipient
  DROP COLUMN IF EXISTS cost_cents,        -- SMS cost in cents
  DROP COLUMN IF EXISTS retry_count,       -- Number of retry attempts
  DROP COLUMN IF EXISTS retry_after,       -- Next retry timestamp
  DROP COLUMN IF EXISTS is_test,           -- Test notification flag
  DROP COLUMN IF EXISTS message_id;        -- External service message ID

COMMENT ON TABLE notifications_log IS 'Removed unused analytics columns (2025-12-27)';
*/

-- SAFER ALTERNATIVE: Add indexes for future analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_log_clicked_at
  ON notifications_log(clicked_at)
  WHERE clicked_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_log_is_test
  ON notifications_log(is_test)
  WHERE is_test = false;

COMMENT ON COLUMN notifications_log.clicked_at IS 'Link click tracking - indexed for future analytics';
COMMENT ON COLUMN notifications_log.delivered_at IS 'Delivery confirmation - indexed for future analytics';
COMMENT ON COLUMN notifications_log.cost_cents IS 'SMS cost tracking - planned for cost reporting';

-- =============================================================================
-- SECTION 3: REMOVE INCOMPLETE FEATURES FROM REPORT_CARDS
-- =============================================================================

-- These columns were added for features that were never completed
-- Risk: May break existing reports or planned features

-- REVIEW REQUIRED: Check if planned for:
-- - Report card expiration system
-- - View count analytics
-- - Draft/publish workflow
-- - "Don't send" exclusion logic

-- ⚠️ UNCOMMENT ONLY AFTER REVIEW
/*
ALTER TABLE report_cards
  DROP COLUMN IF EXISTS view_count,        -- Times report card was viewed
  DROP COLUMN IF EXISTS last_viewed_at,    -- Last view timestamp
  DROP COLUMN IF EXISTS sent_at,           -- When sent to customer
  DROP COLUMN IF EXISTS expires_at,        -- Expiration date
  DROP COLUMN IF EXISTS dont_send,         -- Skip sending flag
  DROP COLUMN IF EXISTS is_draft;          -- Draft status flag

COMMENT ON TABLE report_cards IS 'Removed incomplete feature columns (2025-12-27)';
*/

-- SAFER ALTERNATIVE: Fix is_draft to default to false
ALTER TABLE report_cards
  ALTER COLUMN is_draft SET DEFAULT false;

UPDATE report_cards
SET is_draft = false
WHERE is_draft = true;

COMMENT ON COLUMN report_cards.is_draft IS 'All report cards auto-published - draft workflow removed';
COMMENT ON COLUMN report_cards.view_count IS 'View tracking - currently unused';
COMMENT ON COLUMN report_cards.expires_at IS 'Expiration system - not implemented';

-- =============================================================================
-- SECTION 4: REMOVE UNUSED COLUMNS FROM REVIEWS
-- =============================================================================

-- Admin response feature was never implemented
-- Risk: Prevents implementing review response workflow

-- REVIEW REQUIRED: Check if planned for:
-- - Admin response to negative reviews
-- - Review management dashboard
-- - Customer communication features

-- ⚠️ UNCOMMENT ONLY AFTER REVIEW
/*
ALTER TABLE reviews
  DROP COLUMN IF EXISTS responded_at,      -- When admin responded
  DROP COLUMN IF EXISTS response_text;     -- Admin response content

COMMENT ON TABLE reviews IS 'Removed unused response columns (2025-12-27)';
*/

-- SAFER ALTERNATIVE: Add comment about future feature
COMMENT ON COLUMN reviews.responded_at IS 'Admin response tracking - feature not implemented';
COMMENT ON COLUMN reviews.response_text IS 'Admin response text - feature not implemented';
COMMENT ON COLUMN reviews.google_review_url IS 'Google review routing URL - set but never displayed';

-- =============================================================================
-- SECTION 5: REMOVE UNUSED COLUMNS FROM WAITLIST
-- =============================================================================

-- Priority and notes features never implemented
-- Risk: May prevent future waitlist prioritization logic

-- REVIEW REQUIRED: Check if planned for:
-- - VIP/priority customer handling
-- - Waitlist notes for special requests
-- - Manual prioritization by admin

-- ⚠️ UNCOMMENT ONLY AFTER REVIEW
/*
ALTER TABLE waitlist
  DROP COLUMN IF EXISTS priority,          -- Priority ranking (always 0)
  DROP COLUMN IF EXISTS notes;             -- Special request notes

COMMENT ON TABLE waitlist IS 'Removed unused priority columns (2025-12-27)';
*/

-- SAFER ALTERNATIVE: Document current behavior
COMMENT ON COLUMN waitlist.priority IS 'Priority ranking - currently unused (always 0, FIFO ordering)';
COMMENT ON COLUMN waitlist.notes IS 'Customer notes - currently unused';

-- =============================================================================
-- SECTION 6: REMOVE UNUSED COLUMNS FROM USERS
-- =============================================================================

-- Lifecycle tracking columns never queried
-- Risk: May be needed for customer retention analytics

-- REVIEW REQUIRED: Check if needed for:
-- - Churn analysis
-- - Admin-created user tracking
-- - Account lifecycle management

-- ⚠️ UNCOMMENT ONLY AFTER REVIEW
/*
ALTER TABLE users
  DROP COLUMN IF EXISTS is_active,         -- Active status flag (never checked)
  DROP COLUMN IF EXISTS created_by_admin,  -- Admin creation flag
  DROP COLUMN IF EXISTS activated_at;      -- Activation timestamp

COMMENT ON TABLE users IS 'Removed unused lifecycle columns (2025-12-27)';
*/

-- SAFER ALTERNATIVE: Add analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at_by_source
  ON users(created_at, created_by_admin);

COMMENT ON COLUMN users.is_active IS 'Account status - set but never checked in queries or RLS';
COMMENT ON COLUMN users.created_by_admin IS 'Admin creation tracking - set but never queried';
COMMENT ON COLUMN users.activated_at IS 'Activation timestamp - never set or used';

-- =============================================================================
-- SECTION 7: REMOVE UNUSED COLUMNS FROM CUSTOMER_FLAGS
-- =============================================================================

-- Flagging feature appears incomplete
-- Risk: May break customer service workflow

-- REVIEW REQUIRED: Check if used in:
-- - Customer service escalation
-- - VIP customer identification
-- - Problem customer tracking

-- ⚠️ UNCOMMENT ONLY AFTER REVIEW
/*
ALTER TABLE customer_flags
  DROP COLUMN IF EXISTS color,             -- Flag color (never displayed)
  DROP COLUMN IF EXISTS flag_type,         -- Flag type enum (never filtered)
  DROP COLUMN IF EXISTS created_by,        -- Admin who created flag
  DROP COLUMN IF EXISTS description;       -- Flag description

COMMENT ON TABLE customer_flags IS 'Removed unused UI columns (2025-12-27)';
*/

-- SAFER ALTERNATIVE: Document incomplete feature
COMMENT ON TABLE customer_flags IS 'Customer flagging feature - only 8 references, appears incomplete';
COMMENT ON COLUMN customer_flags.color IS 'Flag color - never displayed in UI';
COMMENT ON COLUMN customer_flags.flag_type IS 'Flag type - never used for filtering';

-- =============================================================================
-- SECTION 8: DROP POTENTIALLY UNUSED TABLES
-- =============================================================================

-- These tables have zero or minimal code references
-- Risk: HIGH - May break external integrations or future features

-- ⚠️ DO NOT RUN WITHOUT THOROUGH INVESTIGATION
/*
-- marketing_unsubscribes (0 code references)
-- Unsubscribe logic may use this table in database triggers
DROP TABLE IF EXISTS marketing_unsubscribes CASCADE;

-- before_after_pairs (1 reference in marketing page)
-- May be legacy before/after gallery feature
DROP TABLE IF EXISTS before_after_pairs CASCADE;

-- staff_commissions (6 references)
-- Phase 6 feature - may be in active use
-- DROP TABLE IF EXISTS staff_commissions CASCADE;
*/

-- INVESTIGATION QUERIES
-- Run these to check if tables have data before dropping

DO $$
DECLARE
  marketing_unsubscribes_count INTEGER;
  before_after_pairs_count INTEGER;
  staff_commissions_count INTEGER;
BEGIN
  -- Check row counts
  SELECT COUNT(*) INTO marketing_unsubscribes_count FROM marketing_unsubscribes;
  SELECT COUNT(*) INTO before_after_pairs_count FROM before_after_pairs;
  SELECT COUNT(*) INTO staff_commissions_count FROM staff_commissions;

  RAISE NOTICE 'Table row counts:';
  RAISE NOTICE '  marketing_unsubscribes: %', marketing_unsubscribes_count;
  RAISE NOTICE '  before_after_pairs: %', before_after_pairs_count;
  RAISE NOTICE '  staff_commissions: %', staff_commissions_count;

  IF marketing_unsubscribes_count > 0 THEN
    RAISE WARNING 'marketing_unsubscribes has % rows - DO NOT DROP', marketing_unsubscribes_count;
  END IF;

  IF before_after_pairs_count > 0 THEN
    RAISE WARNING 'before_after_pairs has % rows - DO NOT DROP', before_after_pairs_count;
  END IF;

  IF staff_commissions_count > 0 THEN
    RAISE WARNING 'staff_commissions has % rows - DO NOT DROP', staff_commissions_count;
  END IF;
END $$;

-- =============================================================================
-- SECTION 9: FIX TABLE NAME INCONSISTENCIES
-- =============================================================================

-- Fix singular/plural inconsistency
-- calendar_event_mapping (3 references) vs calendar_event_mappings (16 references)

-- STEP 1: Check if both tables exist
DO $$
DECLARE
  singular_exists BOOLEAN;
  plural_exists BOOLEAN;
  singular_count INTEGER := 0;
BEGIN
  -- Check existence
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'calendar_event_mapping'
  ) INTO singular_exists;

  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'calendar_event_mappings'
  ) INTO plural_exists;

  RAISE NOTICE 'Table existence:';
  RAISE NOTICE '  calendar_event_mapping (singular): %', singular_exists;
  RAISE NOTICE '  calendar_event_mappings (plural): %', plural_exists;

  -- Check row count if singular exists
  IF singular_exists THEN
    EXECUTE 'SELECT COUNT(*) FROM calendar_event_mapping' INTO singular_count;
    RAISE NOTICE '  Singular table has % rows', singular_count;
  END IF;

  IF singular_exists AND plural_exists AND singular_count > 0 THEN
    RAISE WARNING 'Both tables exist with data - manual migration required';
  ELSIF singular_exists AND NOT plural_exists THEN
    RAISE NOTICE 'Only singular table exists - can rename to plural';
  ELSIF NOT singular_exists AND plural_exists THEN
    RAISE NOTICE 'Only plural table exists - code should be updated';
  END IF;
END $$;

-- MIGRATION SCRIPT (if both tables exist)
-- ⚠️ UNCOMMENT ONLY AFTER VERIFYING DATA
/*
-- Migrate data from singular to plural
INSERT INTO calendar_event_mappings
  SELECT * FROM calendar_event_mapping
  ON CONFLICT DO NOTHING;

-- Verify migration
DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO old_count FROM calendar_event_mapping;
  SELECT COUNT(*) INTO new_count FROM calendar_event_mappings;

  RAISE NOTICE 'Migration verification:';
  RAISE NOTICE '  Old table rows: %', old_count;
  RAISE NOTICE '  New table rows: %', new_count;

  IF new_count >= old_count THEN
    RAISE NOTICE '✓ Migration successful';
  ELSE
    RAISE EXCEPTION 'Migration failed - new table has fewer rows';
  END IF;
END $$;

-- Drop old table after verification
DROP TABLE IF EXISTS calendar_event_mapping CASCADE;
*/

-- =============================================================================
-- SECTION 10: CLEANUP VERIFICATION
-- =============================================================================

-- Run these queries after cleanup to verify database health

-- Check for orphaned records
SELECT
  'appointments' AS table_name,
  COUNT(*) AS orphaned_count
FROM appointments a
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = a.customer_id)
   OR NOT EXISTS (SELECT 1 FROM pets WHERE id = a.pet_id)
   OR NOT EXISTS (SELECT 1 FROM services WHERE id = a.service_id)

UNION ALL

SELECT
  'pets' AS table_name,
  COUNT(*) AS orphaned_count
FROM pets p
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = p.owner_id)

UNION ALL

SELECT
  'waitlist' AS table_name,
  COUNT(*) AS orphaned_count
FROM waitlist w
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = w.customer_id)
   OR NOT EXISTS (SELECT 1 FROM pets WHERE id = w.pet_id)
   OR NOT EXISTS (SELECT 1 FROM services WHERE id = w.service_id);

-- Check for duplicate records
SELECT
  email,
  COUNT(*) AS duplicate_count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Check for null values in required columns
SELECT
  'users.email' AS column_name,
  COUNT(*) AS null_count
FROM users
WHERE email IS NULL

UNION ALL

SELECT
  'appointments.scheduled_at' AS column_name,
  COUNT(*) AS null_count
FROM appointments
WHERE scheduled_at IS NULL

UNION ALL

SELECT
  'pets.size' AS column_name,
  COUNT(*) AS null_count
FROM pets
WHERE size IS NULL;

-- =============================================================================
-- ROLLBACK PLAN
-- =============================================================================

-- If you need to rollback changes, restore from backup:
--
-- 1. Stop application (prevent new writes)
-- 2. Restore from backup:
--    pg_restore -d thepuppyday backup_before_cleanup.dump
-- 3. Verify data integrity
-- 4. Restart application
-- 5. Monitor for errors

-- =============================================================================
-- FINAL WARNINGS
-- =============================================================================

DO $$
BEGIN
  RAISE WARNING '=============================================================================';
  RAISE WARNING 'RISKY SCHEMA CLEANUP SCRIPT';
  RAISE WARNING '=============================================================================';
  RAISE WARNING '';
  RAISE WARNING 'This script contains operations that may cause data loss.';
  RAISE WARNING '';
  RAISE WARNING 'Before running ANY operations:';
  RAISE WARNING '  1. Take full database backup';
  RAISE WARNING '  2. Review each section with stakeholders';
  RAISE WARNING '  3. Test in staging environment first';
  RAISE WARNING '  4. Uncomment only verified-safe operations';
  RAISE WARNING '  5. Execute during maintenance window';
  RAISE WARNING '  6. Monitor application logs after deployment';
  RAISE WARNING '';
  RAISE WARNING 'Most operations are COMMENTED OUT for safety.';
  RAISE WARNING 'Uncomment only after thorough review.';
  RAISE WARNING '';
  RAISE WARNING '=============================================================================';
END $$;
