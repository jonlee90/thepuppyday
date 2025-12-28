-- Migration: Add Performance Indexes
-- Created: 2025-12-27
-- Description: Creates 26 performance indexes for frequently queried columns

-- Performance indexes for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status_scheduled_at ON appointments(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_scheduled ON appointments(customer_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_groomer_scheduled ON appointments(groomer_id, scheduled_at);

-- Performance indexes for users
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_created_by_admin ON users(created_by_admin);

-- Performance index for settings
CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_key_unique ON settings(key);

-- Performance indexes for notifications_log
CREATE INDEX IF NOT EXISTS idx_notifications_log_customer_created ON notifications_log(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_log_status ON notifications_log(status);
CREATE INDEX IF NOT EXISTS idx_notifications_log_tracking_id ON notifications_log(tracking_id);

-- Performance indexes for calendar_connections
CREATE INDEX IF NOT EXISTS idx_calendar_connections_admin_id ON calendar_connections(admin_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_last_sync ON calendar_connections(last_sync_at);

-- Performance indexes for calendar_sync_log
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_connection_created ON calendar_sync_log(connection_id, created_at);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_status ON calendar_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_appointment_id ON calendar_sync_log(appointment_id);

-- Performance indexes for waitlist
CREATE INDEX IF NOT EXISTS idx_waitlist_customer_created ON waitlist(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_status_requested_date ON waitlist(status, requested_date);

-- Performance indexes for pets
CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_pets_breed_id ON pets(breed_id);

-- Performance indexes for report_cards
CREATE INDEX IF NOT EXISTS idx_report_cards_appointment_id ON report_cards(appointment_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_groomer_id ON report_cards(groomer_id);

-- Performance indexes for campaign_sends
CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign_customer ON campaign_sends(campaign_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_notification_log_id ON campaign_sends(notification_log_id);

-- Performance index for customer_loyalty
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_loyalty_customer_id ON customer_loyalty(customer_id);

-- Performance indexes for referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
