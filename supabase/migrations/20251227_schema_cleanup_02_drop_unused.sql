-- Migration: Drop Unused Structures
-- Created: 2025-12-27
-- Description: Removes unused views and columns to clean up schema

-- Drop unused views
DROP VIEW IF EXISTS groomer_commission_earnings;
DROP VIEW IF EXISTS inactive_customer_profiles;
DROP VIEW IF EXISTS notification_template_stats;

-- Drop unused columns from customer_memberships
ALTER TABLE customer_memberships DROP COLUMN IF EXISTS grooms_remaining;
ALTER TABLE customer_memberships DROP COLUMN IF EXISTS grooms_used;
