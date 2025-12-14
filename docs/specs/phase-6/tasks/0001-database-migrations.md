# Task 0001: Create database migrations for Phase 6 tables

**Group**: Database Schema & Foundation (Week 1)

## Objective
Add new tables required for Phase 6 features

## Files to create/modify
- `supabase/migrations/[timestamp]_phase6_reviews_table.sql`
- `supabase/migrations/[timestamp]_phase6_marketing_campaigns_table.sql`
- `supabase/migrations/[timestamp]_phase6_campaign_sends_table.sql`
- `supabase/migrations/[timestamp]_phase6_analytics_cache_table.sql`
- `supabase/migrations/[timestamp]_phase6_waitlist_slot_offers_table.sql`
- `supabase/migrations/[timestamp]_phase6_marketing_unsubscribes_table.sql`

## Requirements covered
- REQ-6.3.3
- REQ-6.9.1
- REQ-6.13.1
- REQ-6.14.1

## Acceptance criteria
- `reviews` table created with foreign keys to report_cards, users, appointments
- `marketing_campaigns` table created with JSONB fields for segment_criteria, message, ab_test_config
- `campaign_sends` table created for tracking individual notification sends
- `analytics_cache` table created with unique constraint on metric_key + date range
- `waitlist_slot_offers` table created for tracking waitlist slot notifications
- `marketing_unsubscribes` table created for opt-out tracking
- All tables have appropriate indexes
- RLS policies applied for each table
