-- Migration: Add Enum Constraints
-- Created: 2025-12-27
-- Description: Adds CHECK constraints to enforce valid enum values

-- Appointments status constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS chk_appointments_status;
ALTER TABLE appointments ADD CONSTRAINT chk_appointments_status
  CHECK (status IN ('pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'));

-- Appointments payment_status constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS chk_appointments_payment_status;
ALTER TABLE appointments ADD CONSTRAINT chk_appointments_payment_status
  CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed'));

-- Users role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE users ADD CONSTRAINT chk_users_role
  CHECK (role IN ('customer', 'admin', 'groomer'));

-- Waitlist status constraint
ALTER TABLE waitlist DROP CONSTRAINT IF EXISTS chk_waitlist_status;
ALTER TABLE waitlist ADD CONSTRAINT chk_waitlist_status
  CHECK (status IN ('active', 'notified', 'booked', 'expired', 'cancelled'));

-- Notifications_log status constraint
ALTER TABLE notifications_log DROP CONSTRAINT IF EXISTS chk_notifications_log_status;
ALTER TABLE notifications_log ADD CONSTRAINT chk_notifications_log_status
  CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced'));

-- Reviews destination constraint
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS chk_reviews_destination;
ALTER TABLE reviews ADD CONSTRAINT chk_reviews_destination
  CHECK (destination IN ('google', 'yelp', 'facebook', 'internal'));

-- Pets size constraint
ALTER TABLE pets DROP CONSTRAINT IF EXISTS chk_pets_size;
ALTER TABLE pets ADD CONSTRAINT chk_pets_size
  CHECK (size IN ('small', 'medium', 'large', 'xlarge'));

-- Calendar_sync_log status constraint
ALTER TABLE calendar_sync_log DROP CONSTRAINT IF EXISTS chk_calendar_sync_log_status;
ALTER TABLE calendar_sync_log ADD CONSTRAINT chk_calendar_sync_log_status
  CHECK (status IN ('success', 'failed', 'skipped'));
