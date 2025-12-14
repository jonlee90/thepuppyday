# Task 0002: Modify existing tables for Phase 6 enhancements

**Group**: Database Schema & Foundation (Week 1)

## Objective
Add new columns to existing report_cards, waitlist, and notifications_log tables

## Files to create/modify
- `supabase/migrations/[timestamp]_phase6_report_cards_enhancements.sql`
- `supabase/migrations/[timestamp]_phase6_waitlist_enhancements.sql`
- `supabase/migrations/[timestamp]_phase6_notifications_log_enhancements.sql`

## Requirements covered
- REQ-6.1.3
- REQ-6.4.2
- REQ-6.5.2
- REQ-6.17.2

## Acceptance criteria
- `report_cards` table has new columns: groomer_id, view_count, last_viewed_at, sent_at, expires_at, dont_send, is_draft, updated_at
- `waitlist` table has new columns: priority, notes, offer_expires_at, updated_at
- `notifications_log` table has new columns: campaign_id, campaign_send_id, tracking_id, clicked_at, delivered_at, cost_cents
- Triggers created for updated_at timestamps
