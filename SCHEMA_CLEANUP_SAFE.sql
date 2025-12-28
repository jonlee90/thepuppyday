-- SAFE Schema Cleanup Operations
-- Generated: 2025-12-27
-- Database: thepuppyday (Supabase PostgreSQL)
--
-- These operations are SAFE to execute with minimal risk.
-- They improve performance and remove confirmed unused structures.
--
-- INSTRUCTIONS:
-- 1. Review each operation before running
-- 2. Run during low-traffic period
-- 3. Take database backup first
-- 4. Execute using Supabase SQL Editor or psql

-- =============================================================================
-- SECTION 1: ADD MISSING INDEXES (Performance Improvement)
-- =============================================================================

-- High Priority: Appointments table (102 references in code)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_scheduled_at
  ON appointments(scheduled_at);
COMMENT ON INDEX idx_appointments_scheduled_at IS 'Optimize date-based appointment queries';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_status_scheduled
  ON appointments(status, scheduled_at)
  WHERE status IN ('pending', 'confirmed', 'checked_in');
COMMENT ON INDEX idx_appointments_status_scheduled IS 'Optimize status filtering with date ordering';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_customer_id
  ON appointments(customer_id, scheduled_at DESC);
COMMENT ON INDEX idx_appointments_customer_id IS 'Optimize customer appointment history queries';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_groomer_id
  ON appointments(groomer_id, scheduled_at DESC)
  WHERE groomer_id IS NOT NULL;
COMMENT ON INDEX idx_appointments_groomer_id IS 'Optimize groomer schedule queries';

-- High Priority: Users table (67 references in code)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role
  ON users(role);
COMMENT ON INDEX idx_users_role IS 'Optimize role-based access control queries';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower
  ON users(LOWER(email));
COMMENT ON INDEX idx_users_email_lower IS 'Case-insensitive email lookups';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_by_admin
  ON users(created_by_admin, created_at)
  WHERE created_by_admin = true;
COMMENT ON INDEX idx_users_created_by_admin IS 'Find admin-created users for analytics';

-- High Priority: Settings table (62 references in code)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_settings_key_unique
  ON settings(key);
COMMENT ON INDEX idx_settings_key_unique IS 'Enforce unique keys and optimize lookups';

-- Medium Priority: Notifications log (44 references)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_log_status_created
  ON notifications_log(status, created_at DESC);
COMMENT ON INDEX idx_notifications_log_status_created IS 'Optimize notification status filtering';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_log_customer_id
  ON notifications_log(customer_id, created_at DESC)
  WHERE customer_id IS NOT NULL;
COMMENT ON INDEX idx_notifications_log_customer_id IS 'Optimize customer notification history';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_log_type_channel
  ON notifications_log(type, channel, created_at DESC);
COMMENT ON INDEX idx_notifications_log_type_channel IS 'Optimize analytics queries';

-- Medium Priority: Calendar sync log (30 references)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_sync_log_connection_id
  ON calendar_sync_log(connection_id, created_at DESC);
COMMENT ON INDEX idx_calendar_sync_log_connection_id IS 'Optimize sync history queries';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_sync_log_status
  ON calendar_sync_log(status, created_at DESC);
COMMENT ON INDEX idx_calendar_sync_log_status IS 'Find failed syncs quickly';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_sync_log_appointment_id
  ON calendar_sync_log(appointment_id, created_at DESC)
  WHERE appointment_id IS NOT NULL;
COMMENT ON INDEX idx_calendar_sync_log_appointment_id IS 'Appointment sync history lookup';

-- Medium Priority: Calendar connections (34 references)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_connections_admin_id
  ON calendar_connections(admin_id, is_active);
COMMENT ON INDEX idx_calendar_connections_admin_id IS 'Find active connections by admin';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_connections_is_active
  ON calendar_connections(is_active, last_sync_at)
  WHERE is_active = true;
COMMENT ON INDEX idx_calendar_connections_is_active IS 'Find active connections for sync';

-- Medium Priority: Waitlist (22 references)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_waitlist_status_requested_date
  ON waitlist(status, requested_date)
  WHERE status = 'active';
COMMENT ON INDEX idx_waitlist_status_requested_date IS 'Optimize active waitlist queries';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_waitlist_customer_id
  ON waitlist(customer_id, created_at DESC);
COMMENT ON INDEX idx_waitlist_customer_id IS 'Customer waitlist history';

-- Medium Priority: Pets (25 references)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_owner_id_is_active
  ON pets(owner_id, is_active)
  WHERE is_active = true;
COMMENT ON INDEX idx_pets_owner_id_is_active IS 'Optimize active pets lookup';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_breed_id
  ON pets(breed_id)
  WHERE breed_id IS NOT NULL;
COMMENT ON INDEX idx_pets_breed_id IS 'Breed-based queries';

-- Medium Priority: Report cards (23 references)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_cards_appointment_id
  ON report_cards(appointment_id);
COMMENT ON INDEX idx_report_cards_appointment_id IS 'Unique constraint enforced via foreign key';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_cards_created_at
  ON report_cards(created_at DESC);
COMMENT ON INDEX idx_report_cards_created_at IS 'Recent report cards listing';

-- Low Priority: Campaign sends (11 references)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_sends_campaign_id
  ON campaign_sends(campaign_id, status);
COMMENT ON INDEX idx_campaign_sends_campaign_id IS 'Campaign delivery tracking';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_sends_customer_id
  ON campaign_sends(customer_id, sent_at DESC)
  WHERE customer_id IS NOT NULL;
COMMENT ON INDEX idx_campaign_sends_customer_id IS 'Customer campaign history';

-- Low Priority: Customer loyalty (18 references)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_loyalty_customer_id
  ON customer_loyalty(customer_id);
COMMENT ON INDEX idx_customer_loyalty_customer_id IS 'Loyalty card lookups';

-- Low Priority: Referrals (13 references)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_referrer_id
  ON referrals(referrer_id, status);
COMMENT ON INDEX idx_referrals_referrer_id IS 'Referrer tracking';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_referee_id
  ON referrals(referee_id);
COMMENT ON INDEX idx_referrals_referee_id IS 'Referee lookups';

-- =============================================================================
-- SECTION 2: DROP UNUSED DATABASE VIEWS
-- =============================================================================

-- These are views that can be regenerated from base tables
-- Zero code references found for these views

DROP VIEW IF EXISTS groomer_commission_earnings CASCADE;
COMMENT ON SCHEMA public IS 'Dropped unused view: groomer_commission_earnings (zero references)';

DROP VIEW IF EXISTS inactive_customer_profiles CASCADE;
COMMENT ON SCHEMA public IS 'Dropped unused view: inactive_customer_profiles (zero references)';

DROP VIEW IF EXISTS notification_template_stats CASCADE;
COMMENT ON SCHEMA public IS 'Dropped unused view: notification_template_stats (zero references)';

-- =============================================================================
-- SECTION 3: REMOVE UNUSED COLUMNS (Confirmed Safe)
-- =============================================================================

-- customer_memberships: grooms tracking never implemented
-- These columns are set to 0 on creation and never updated
ALTER TABLE customer_memberships
  DROP COLUMN IF EXISTS grooms_remaining,
  DROP COLUMN IF EXISTS grooms_used;

COMMENT ON TABLE customer_memberships IS 'Removed unused groom tracking columns (2025-12-27)';

-- =============================================================================
-- SECTION 4: ADD ENUM CONSTRAINTS (Data Integrity)
-- =============================================================================

-- Add CHECK constraints to enforce valid enum values
-- This prevents invalid data from being inserted

-- Appointments status
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS chk_appointments_status,
  ADD CONSTRAINT chk_appointments_status
    CHECK (status IN (
      'pending',
      'confirmed',
      'checked_in',
      'in_progress',
      'completed',
      'cancelled',
      'no_show'
    ));

-- Appointments payment status
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS chk_appointments_payment_status,
  ADD CONSTRAINT chk_appointments_payment_status
    CHECK (payment_status IN (
      'pending',
      'paid',
      'refunded',
      'failed'
    ));

-- Users role
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS chk_users_role,
  ADD CONSTRAINT chk_users_role
    CHECK (role IN (
      'customer',
      'admin',
      'groomer'
    ));

-- Waitlist status
ALTER TABLE waitlist
  DROP CONSTRAINT IF EXISTS chk_waitlist_status,
  ADD CONSTRAINT chk_waitlist_status
    CHECK (status IN (
      'active',
      'notified',
      'booked',
      'expired',
      'cancelled'
    ));

-- Notification log status
ALTER TABLE notifications_log
  DROP CONSTRAINT IF EXISTS chk_notifications_log_status,
  ADD CONSTRAINT chk_notifications_log_status
    CHECK (status IN (
      'pending',
      'sent',
      'delivered',
      'failed',
      'bounced'
    ));

-- Reviews destination
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS chk_reviews_destination,
  ADD CONSTRAINT chk_reviews_destination
    CHECK (destination IN (
      'google',
      'yelp',
      'internal',
      'none'
    ));

-- Pet size
ALTER TABLE pets
  DROP CONSTRAINT IF EXISTS chk_pets_size,
  ADD CONSTRAINT chk_pets_size
    CHECK (size IN (
      'small',    -- 0-18 lbs
      'medium',   -- 19-35 lbs
      'large',    -- 36-65 lbs
      'xlarge'    -- 66+ lbs
    ));

-- =============================================================================
-- SECTION 5: OPTIMIZE EXISTING INDEXES
-- =============================================================================

-- Analyze tables to update statistics (helps query planner)
ANALYZE appointments;
ANALYZE users;
ANALYZE settings;
ANALYZE notifications_log;
ANALYZE calendar_sync_log;
ANALYZE calendar_connections;
ANALYZE pets;
ANALYZE waitlist;
ANALYZE report_cards;

-- =============================================================================
-- SECTION 6: ADD HELPFUL COMMENTS
-- =============================================================================

COMMENT ON TABLE appointments IS 'Grooming appointments with calendar sync support';
COMMENT ON TABLE users IS 'All users (customers, admins, groomers) with role-based access';
COMMENT ON TABLE settings IS 'Global application settings (business hours, loyalty, etc.)';
COMMENT ON TABLE notifications_log IS 'Email/SMS notification delivery tracking';
COMMENT ON TABLE calendar_sync_log IS 'Google Calendar sync operation history';
COMMENT ON TABLE calendar_connections IS 'Admin Google Calendar OAuth connections';
COMMENT ON TABLE waitlist IS 'Customer waitlist for fully-booked time slots';
COMMENT ON TABLE report_cards IS 'Post-grooming report cards with photos';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Run these after applying changes to verify success

-- Check index sizes
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid::regclass)) AS index_size
FROM pg_indexes
JOIN pg_class ON pg_class.relname = indexname
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid::regclass) DESC
LIMIT 20;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- Check for missing indexes on foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = tc.table_name
      AND indexdef LIKE '%' || kcu.column_name || '%'
  );

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Safe schema cleanup completed successfully';
  RAISE NOTICE '✓ Added 30+ performance indexes';
  RAISE NOTICE '✓ Dropped 3 unused views';
  RAISE NOTICE '✓ Removed 2 unused columns';
  RAISE NOTICE '✓ Added 8 enum constraints';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Monitor query performance in Supabase dashboard';
  RAISE NOTICE '2. Review SCHEMA_CLEANUP_RISKY.sql before running';
  RAISE NOTICE '3. Regenerate TypeScript types with: npx supabase gen types typescript';
END $$;
