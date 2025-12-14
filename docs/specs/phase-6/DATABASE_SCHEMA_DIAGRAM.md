# Phase 6 Database Schema Diagram

## New Tables and Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PHASE 6 SCHEMA OVERVIEW                         │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   appointments       │
│──────────────────────│
│ id (PK)              │◄────┐
│ customer_id (FK)     │     │
│ pet_id (FK)          │     │
│ service_id (FK)      │     │
│ groomer_id (FK)      │     │
│ status               │     │
│ ...                  │     │
└──────────────────────┘     │
         ▲                   │
         │                   │
         │                   │
┌────────┴─────────┐         │
│  report_cards    │         │
│──────────────────│         │
│ id (PK)          │         │
│ appointment_id◄──┘         │
│ groomer_id (FK)  │◄────────┼────────┐
│ view_count       │ NEW     │        │
│ sent_at          │ NEW     │        │
│ expires_at       │ NEW     │        │
│ is_draft         │ NEW     │        │
│ dont_send        │ NEW     │        │
│ ...              │         │        │
└──────────────────┘         │        │
         ▲                   │        │
         │                   │        │
         │                   │        │
┌────────┴─────────┐         │        │
│     reviews      │ NEW     │        │
│──────────────────│         │        │
│ id (PK)          │         │        │
│ report_card_id ◄─┘         │        │
│ user_id (FK)     │◄────────┼────────┤
│ appointment_id ◄─┼─────────┘        │
│ rating (1-5)     │                  │
│ feedback         │                  │
│ is_public        │                  │
└──────────────────┘                  │
                                      │
┌──────────────────────────────────────┴──────┐
│              users                          │
│─────────────────────────────────────────────│
│ id (PK)                                     │
│ role (customer, admin, groomer)             │
│ ...                                         │
└─────────────────────────────────────────────┘
         ▲                    ▲
         │                    │
         │                    │
┌────────┴──────────┐  ┌──────┴───────────────┐
│ waitlist          │  │ marketing_unsubscribes│ NEW
│───────────────────│  │──────────────────────│
│ id (PK)           │  │ id (PK)              │
│ customer_id (FK)  │  │ user_id (FK) UNIQUE  │
│ priority          │  │ unsubscribed_from[]  │
│ notes             │  │ reason               │
│ offer_expires_at  │  └──────────────────────┘
│ updated_at        │
└───────────────────┘
         ▲
         │
         │
┌────────┴──────────────┐
│ waitlist_slot_offers  │ NEW
│───────────────────────│
│ id (PK)               │
│ slot_date             │
│ slot_time             │
│ service_id (FK)       │
│ status                │
│ discount_percent      │
│ expires_at            │
└───────────────────────┘


┌───────────────────────────────────────────────────────────────┐
│                  MARKETING CAMPAIGNS                          │
└───────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│ marketing_campaigns      │ NEW
│──────────────────────────│
│ id (PK)                  │
│ name                     │
│ type (one_time/recurring)│
│ status                   │
│ segment_criteria (JSONB) │
│ message (JSONB)          │
│ ab_test_config (JSONB)   │
│ scheduled_for            │
│ created_by (FK)          │
└──────────────────────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────────────┐
│  campaign_sends          │ NEW
│──────────────────────────│
│ id (PK)                  │
│ campaign_id (FK)         │◄─────┐
│ user_id (FK)             │      │
│ notification_log_id (FK) │──┐   │
│ variant (A/B)            │  │   │
│ sent_at                  │  │   │
│ delivered_at             │  │   │
│ clicked_at               │  │   │
│ booking_id (FK)          │  │   │
└──────────────────────────┘  │   │
                              │   │
                              ▼   │
┌──────────────────────────────────┐
│  notifications_log               │
│──────────────────────────────────│
│ id (PK)                          │
│ customer_id (FK)                 │
│ type                             │
│ channel (email/sms)              │
│ campaign_id (FK)         NEW     │◄────┘
│ campaign_send_id (FK)    NEW     │
│ tracking_id              NEW     │
│ clicked_at               NEW     │
│ delivered_at             NEW     │
│ cost_cents               NEW     │
│ ...                              │
└──────────────────────────────────┘


┌───────────────────────────────────────────────────────────────┐
│                     ANALYTICS CACHE                           │
└───────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│  analytics_cache         │ NEW
│──────────────────────────│
│ id (PK)                  │
│ metric_key               │
│ date_range_start         │
│ date_range_end           │
│ cached_value (JSONB)     │
│ expires_at               │
│ UNIQUE(metric_key,       │
│        date_range_start, │
│        date_range_end)   │
└──────────────────────────┘
```

## Table Relationships Summary

### New Tables

1. **reviews** (1:1 with report_cards)
   - `report_card_id` → `report_cards.id` (UNIQUE)
   - `user_id` → `users.id`
   - `appointment_id` → `appointments.id`

2. **marketing_campaigns** (1:N with campaign_sends)
   - `created_by` → `users.id`

3. **campaign_sends** (N:1 with campaigns, N:1 with notifications)
   - `campaign_id` → `marketing_campaigns.id`
   - `user_id` → `users.id`
   - `notification_log_id` → `notifications_log.id`
   - `booking_id` → `appointments.id`

4. **analytics_cache** (standalone)
   - No foreign keys
   - Unique constraint on (metric_key, date_range_start, date_range_end)

5. **waitlist_slot_offers** (N:1 with services)
   - `service_id` → `services.id`
   - `created_by` → `users.id`

6. **marketing_unsubscribes** (1:1 with users)
   - `user_id` → `users.id` (UNIQUE)

### Modified Tables

1. **report_cards**
   - NEW: `groomer_id` → `users.id`
   - NEW: `view_count`, `sent_at`, `expires_at`, `is_draft`, `dont_send`, `last_viewed_at`, `updated_at`

2. **waitlist**
   - NEW: `priority`, `notes`, `offer_expires_at`, `updated_at`

3. **notifications_log**
   - NEW: `campaign_id` → `marketing_campaigns.id`
   - NEW: `campaign_send_id` → `campaign_sends.id`
   - NEW: `tracking_id`, `clicked_at`, `delivered_at`, `cost_cents`

## Foreign Key Cascade Behavior

| Table | Column | References | ON DELETE |
|-------|--------|------------|-----------|
| reviews | report_card_id | report_cards.id | CASCADE |
| reviews | user_id | users.id | CASCADE |
| reviews | appointment_id | appointments.id | CASCADE |
| marketing_campaigns | created_by | users.id | SET NULL |
| campaign_sends | campaign_id | marketing_campaigns.id | CASCADE |
| campaign_sends | user_id | users.id | CASCADE |
| campaign_sends | notification_log_id | notifications_log.id | SET NULL |
| campaign_sends | booking_id | appointments.id | SET NULL |
| waitlist_slot_offers | service_id | services.id | CASCADE |
| waitlist_slot_offers | created_by | users.id | SET NULL |
| marketing_unsubscribes | user_id | users.id | CASCADE |
| report_cards | groomer_id | users.id | SET NULL |
| notifications_log | campaign_id | marketing_campaigns.id | SET NULL |
| notifications_log | campaign_send_id | campaign_sends.id | SET NULL |

## Key Indexes

### High-Priority Performance Indexes

```sql
-- Reviews
idx_reviews_user (user_id)
idx_reviews_rating (rating)
idx_reviews_public (is_public) WHERE is_public = true

-- Marketing Campaigns
idx_marketing_campaigns_status (status)
idx_marketing_campaigns_scheduled (scheduled_for) WHERE status = 'scheduled'

-- Campaign Sends
idx_campaign_sends_campaign (campaign_id)
idx_campaign_sends_user (user_id)
idx_campaign_sends_booking (booking_id) WHERE booking_id IS NOT NULL

-- Analytics Cache
idx_analytics_cache_metric (metric_key)
idx_analytics_cache_expires (expires_at)

-- Waitlist
idx_waitlist_priority (priority DESC)
idx_waitlist_matching (service_id, requested_date, status) WHERE status = 'active'

-- Notifications Log
idx_notifications_log_tracking (tracking_id)
idx_notifications_log_campaign (campaign_id) WHERE campaign_id IS NOT NULL
```

## Data Flow Examples

### Report Card → Review Flow

```
1. Admin creates report_card (is_draft = true)
2. Admin completes report_card (is_draft = false)
3. System sends notification (report_cards.sent_at = NOW())
4. Customer views public page (view_count++, last_viewed_at = NOW())
5. Customer submits review → creates reviews record
6. If rating 4-5 → redirect to Google
7. If rating 1-3 → private feedback saved
```

### Marketing Campaign Flow

```
1. Admin creates marketing_campaign (status = 'draft')
2. Admin sets segment_criteria, message, schedule
3. Admin activates (status = 'scheduled')
4. Cron job finds scheduled campaigns
5. For each customer in segment:
   - Create campaign_sends record
   - Create notifications_log record
   - Send via Twilio/Resend
6. Track delivery via webhooks (delivered_at)
7. Track clicks via tracking_id redirect (clicked_at)
8. Track conversions (booking_id)
```

### Waitlist Slot Filling Flow

```
1. Admin sees open slot on calendar
2. Admin clicks "Fill from Waitlist"
3. System calls get_matching_waitlist_entries(service_id, date)
4. Admin selects waitlist entries
5. System creates waitlist_slot_offers record
6. System sends SMS with tracking
7. Customer replies "YES"
8. System creates appointment
9. System marks waitlist_slot_offers as 'accepted'
10. System marks waitlist as 'booked'
```

## RLS Policy Summary

| Table | Customer | Admin | Groomer | Anon |
|-------|----------|-------|---------|------|
| reviews | Own only | All | All | Public only |
| marketing_campaigns | - | All | - | - |
| campaign_sends | - | All | - | - |
| analytics_cache | - | All | - | - |
| waitlist_slot_offers | - | All | - | - |
| marketing_unsubscribes | Own only | All | - | Create only |
| report_cards (enhanced) | (existing) | (existing) | (existing) | (existing) |

## JSONB Schema Examples

### marketing_campaigns.segment_criteria

```json
{
  "last_visit_days_ago": { "min": 60, "max": 365 },
  "service_types": ["basic-grooming", "premium-grooming"],
  "breeds": ["poodle", "golden-retriever"],
  "membership_status": ["active", "paused"]
}
```

### marketing_campaigns.message

```json
{
  "sms_body": "Hi {customer_name}! We miss {pet_name}. Book now: {booking_link}",
  "email_subject": "We miss {pet_name}!",
  "email_body": "<html>...</html>"
}
```

### marketing_campaigns.ab_test_config

```json
{
  "enabled": true,
  "variant_a": {
    "sms_body": "Version A message"
  },
  "variant_b": {
    "sms_body": "Version B message"
  },
  "split_percent": 50
}
```

### analytics_cache.cached_value

```json
{
  "total_revenue": 15420.50,
  "total_appointments": 87,
  "avg_booking_value": 177.25,
  "change_percent": 12.5
}
```
