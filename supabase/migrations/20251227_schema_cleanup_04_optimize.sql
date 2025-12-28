-- Migration: Optimize Tables
-- Created: 2025-12-27
-- Description: Analyzes core tables to update query planner statistics

-- Analyze core tables for query planner optimization
ANALYZE appointments;
ANALYZE users;
ANALYZE pets;
ANALYZE notifications_log;
ANALYZE calendar_sync_log;
ANALYZE waitlist;
ANALYZE report_cards;
