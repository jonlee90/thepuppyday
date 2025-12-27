-- ==============================================================================
-- Migration: Performance Indexes
-- Task: 0228 - Add indexes for query performance optimization
-- Description: Create indexes on frequently queried columns to improve performance
-- ==============================================================================

-- ==============================================================================
-- APPOINTMENTS TABLE INDEXES
-- ==============================================================================

-- Index for availability queries (checking available time slots)
-- Used by booking system to find open slots and admin calendar view
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at_status
  ON public.appointments(scheduled_at, status)
  WHERE status IN ('pending', 'confirmed', 'checked_in', 'in_progress');

COMMENT ON INDEX idx_appointments_scheduled_at_status IS
  'Optimizes availability queries and calendar views. Partial index only includes active appointments.';

-- Index for customer appointment history queries
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id_scheduled_at
  ON public.appointments(customer_id, scheduled_at DESC);

COMMENT ON INDEX idx_appointments_customer_id_scheduled_at IS
  'Optimizes customer appointment history queries with DESC order for recent appointments first.';

-- Index for groomer schedule queries
CREATE INDEX IF NOT EXISTS idx_appointments_groomer_id_scheduled_at
  ON public.appointments(groomer_id, scheduled_at)
  WHERE groomer_id IS NOT NULL;

COMMENT ON INDEX idx_appointments_groomer_id_scheduled_at IS
  'Optimizes groomer schedule queries. Partial index only includes assigned appointments.';

-- Index for status-based filtering (admin views)
CREATE INDEX IF NOT EXISTS idx_appointments_status_scheduled_at
  ON public.appointments(status, scheduled_at DESC)
  WHERE status != 'completed' AND status != 'cancelled' AND status != 'no_show';

COMMENT ON INDEX idx_appointments_status_scheduled_at IS
  'Optimizes admin views filtering by status. Partial index excludes completed/cancelled appointments.';

-- ==============================================================================
-- NOTIFICATIONS_LOG TABLE INDEXES
-- ==============================================================================

-- Index for notification processing and monitoring
CREATE INDEX IF NOT EXISTS idx_notifications_log_type_status_created
  ON public.notifications_log(type, status, created_at DESC);

COMMENT ON INDEX idx_notifications_log_type_status_created IS
  'Optimizes notification monitoring, filtering, and retry logic.';

-- Index for finding pending notifications to send
CREATE INDEX IF NOT EXISTS idx_notifications_log_pending
  ON public.notifications_log(status, created_at)
  WHERE status = 'pending';

COMMENT ON INDEX idx_notifications_log_pending IS
  'Optimizes queries for pending notifications needing to be sent.';

-- Index for customer notification history
CREATE INDEX IF NOT EXISTS idx_notifications_log_customer_created
  ON public.notifications_log(customer_id, created_at DESC)
  WHERE customer_id IS NOT NULL;

COMMENT ON INDEX idx_notifications_log_customer_created IS
  'Optimizes customer notification history queries.';

-- Index for report card notification tracking
CREATE INDEX IF NOT EXISTS idx_notifications_log_report_card
  ON public.notifications_log(report_card_id, status)
  WHERE report_card_id IS NOT NULL;

COMMENT ON INDEX idx_notifications_log_report_card IS
  'Optimizes tracking of report card notifications.';

-- ==============================================================================
-- USERS TABLE INDEXES
-- ==============================================================================

-- Index for email lookups during authentication
CREATE INDEX IF NOT EXISTS idx_users_email
  ON public.users(LOWER(email));

COMMENT ON INDEX idx_users_email IS
  'Optimizes email lookups during authentication. Uses LOWER() for case-insensitive searches.';

-- Index for active customer queries
CREATE INDEX IF NOT EXISTS idx_users_role_active
  ON public.users(role, is_active)
  WHERE role = 'customer';

COMMENT ON INDEX idx_users_role_active IS
  'Optimizes customer list queries filtering by active status.';

-- ==============================================================================
-- CALENDAR EVENT MAPPING INDEXES (if columns exist)
-- ==============================================================================

-- Note: These indexes are already created in 20251226_calendar_integration.sql
-- Listed here for reference and documentation completeness

-- Index for Google Calendar sync status queries
-- CREATE INDEX IF NOT EXISTS idx_calendar_event_mapping_google_event_sync
--   ON public.calendar_event_mapping(google_event_id, last_synced_at);

-- ==============================================================================
-- PETS TABLE INDEXES
-- ==============================================================================

-- Index for finding active pets by owner
CREATE INDEX IF NOT EXISTS idx_pets_owner_active
  ON public.pets(owner_id, is_active)
  WHERE is_active = true;

COMMENT ON INDEX idx_pets_owner_active IS
  'Optimizes queries for customer active pets. Partial index only includes active pets.';

-- ==============================================================================
-- WAITLIST TABLE INDEXES
-- ==============================================================================

-- Index for finding waitlist entries by requested date and status
CREATE INDEX IF NOT EXISTS idx_waitlist_requested_date_status
  ON public.waitlist(requested_date, status)
  WHERE status = 'active';

COMMENT ON INDEX idx_waitlist_requested_date_status IS
  'Optimizes waitlist matching when slots become available. Partial index only includes active entries.';

-- Index for customer waitlist entries
CREATE INDEX IF NOT EXISTS idx_waitlist_customer_status
  ON public.waitlist(customer_id, status, created_at DESC);

COMMENT ON INDEX idx_waitlist_customer_status IS
  'Optimizes customer waitlist history queries.';

-- ==============================================================================
-- REPORT_CARDS TABLE INDEXES
-- ==============================================================================

-- Index for finding unsent report cards
CREATE INDEX IF NOT EXISTS idx_report_cards_sent_draft
  ON public.report_cards(sent_at, is_draft, dont_send)
  WHERE sent_at IS NULL AND is_draft = false AND dont_send = false;

COMMENT ON INDEX idx_report_cards_sent_draft IS
  'Optimizes queries for report cards ready to send. Partial index for unsent, non-draft cards.';

-- Index for appointment report card lookups
CREATE INDEX IF NOT EXISTS idx_report_cards_appointment
  ON public.report_cards(appointment_id);

COMMENT ON INDEX idx_report_cards_appointment IS
  'Optimizes lookups of report cards by appointment.';

-- ==============================================================================
-- CUSTOMER_MEMBERSHIPS TABLE INDEXES
-- ==============================================================================

-- Index for active membership queries
CREATE INDEX IF NOT EXISTS idx_customer_memberships_customer_status
  ON public.customer_memberships(customer_id, status)
  WHERE status = 'active';

COMMENT ON INDEX idx_customer_memberships_customer_status IS
  'Optimizes active membership lookups. Partial index only includes active memberships.';

-- ==============================================================================
-- LOYALTY TABLES INDEXES
-- ==============================================================================

-- Index for customer loyalty balance lookups
CREATE INDEX IF NOT EXISTS idx_loyalty_points_customer
  ON public.loyalty_points(customer_id);

COMMENT ON INDEX idx_loyalty_points_customer IS
  'Optimizes customer loyalty balance queries.';

-- Index for loyalty transaction history
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer_created
  ON public.loyalty_transactions(customer_id, created_at DESC);

COMMENT ON INDEX idx_loyalty_transactions_customer_created IS
  'Optimizes customer loyalty transaction history queries.';

-- ==============================================================================
-- CUSTOMER_FLAGS TABLE INDEXES
-- ==============================================================================

-- Index for active customer flags
CREATE INDEX IF NOT EXISTS idx_customer_flags_customer_active
  ON public.customer_flags(customer_id, is_active)
  WHERE is_active = true;

COMMENT ON INDEX idx_customer_flags_customer_active IS
  'Optimizes queries for active customer flags. Partial index only includes active flags.';

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';

  RAISE NOTICE 'Total custom indexes created: %', index_count;
END $$;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
