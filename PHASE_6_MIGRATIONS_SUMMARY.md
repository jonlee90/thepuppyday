# Phase 6 Database Migrations Summary

This document summarizes the database migrations created for Phase 6: Admin Panel Advanced Features.

## Migration Files Created

### 1. `20241213_phase6_reviews_table.sql`
**New Table: `reviews`**

Creates the reviews table for customer feedback linked to report cards.

**Columns:**
- `id` (UUID, PK) - Primary key
- `report_card_id` (UUID, FK, UNIQUE) - Links to report_cards table (one review per report card)
- `user_id` (UUID, FK) - Links to users table
- `appointment_id` (UUID, FK) - Links to appointments table
- `rating` (INTEGER, 1-5) - Star rating
- `feedback` (TEXT) - Customer feedback text
- `is_public` (BOOLEAN) - Whether review is displayed publicly
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Indexes:**
- `idx_reviews_user` - User lookup
- `idx_reviews_appointment` - Appointment lookup
- `idx_reviews_rating` - Rating filtering
- `idx_reviews_public` - Public reviews filtering
- `idx_reviews_created` - Sorting by date

**RLS Policies:**
- Customers can view/create their own reviews
- Admins/groomers can view all reviews
- Admins can update reviews (mark as public)
- Public can view public reviews

---

### 2. `20241213_phase6_marketing_campaigns_tables.sql`
**New Tables: `marketing_campaigns`, `campaign_sends`**

Creates tables for retention marketing and automated campaigns.

**marketing_campaigns columns:**
- `id` (UUID, PK)
- `name` (TEXT) - Campaign name
- `type` (TEXT) - 'one_time' or 'recurring'
- `status` (TEXT) - 'draft', 'scheduled', 'sending', 'sent', 'cancelled'
- `segment_criteria` (JSONB) - Customer segmentation filters
- `message` (JSONB) - { sms_body, email_subject, email_body }
- `ab_test_config` (JSONB) - A/B test configuration
- `scheduled_for` (TIMESTAMPTZ) - When to send
- `created_by` (UUID, FK) - Admin who created campaign
- `created_at`, `updated_at`

**campaign_sends columns:**
- `id` (UUID, PK)
- `campaign_id` (UUID, FK) - Links to marketing_campaigns
- `user_id` (UUID, FK) - Recipient
- `notification_log_id` (UUID, FK) - Links to notifications_log
- `variant` (TEXT) - 'A' or 'B' for A/B tests
- `sent_at` (TIMESTAMPTZ) - When sent
- `delivered_at` (TIMESTAMPTZ) - When delivered
- `clicked_at` (TIMESTAMPTZ) - When clicked
- `booking_id` (UUID, FK) - Conversion tracking
- `created_at`

**Indexes:**
- Campaign status, scheduled date, type indexes
- Campaign sends tracking indexes

**RLS Policies:**
- Admin-only access for all operations

---

### 3. `20241213_phase6_analytics_cache_table.sql`
**New Table: `analytics_cache`**

Caches computed analytics metrics for performance (15-minute TTL).

**Columns:**
- `id` (UUID, PK)
- `metric_key` (TEXT) - Metric identifier
- `date_range_start` (DATE)
- `date_range_end` (DATE)
- `cached_value` (JSONB) - Cached data
- `expires_at` (TIMESTAMPTZ) - Cache expiration
- `created_at`

**Unique Constraint:** `(metric_key, date_range_start, date_range_end)`

**Functions:**
- `cleanup_expired_analytics_cache()` - Remove expired cache entries

**RLS Policies:**
- Admin-only access for all operations

---

### 4. `20241213_phase6_waitlist_marketing_tables.sql`
**New Tables: `waitlist_slot_offers`, `marketing_unsubscribes`**

**waitlist_slot_offers columns:**
- `id` (UUID, PK)
- `slot_date` (DATE)
- `slot_time` (TIME)
- `service_id` (UUID, FK)
- `status` (TEXT) - 'pending', 'accepted', 'expired', 'cancelled'
- `discount_percent` (INTEGER, 0-100)
- `response_window_hours` (INTEGER)
- `expires_at` (TIMESTAMPTZ)
- `created_by` (UUID, FK)
- `created_at`, `updated_at`

**marketing_unsubscribes columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK, UNIQUE)
- `email` (TEXT)
- `phone` (TEXT)
- `unsubscribed_from` (TEXT[]) - e.g., ['sms', 'email', 'marketing']
- `reason` (TEXT)
- `created_at`

**RLS Policies:**
- Slot offers: Admin-only
- Unsubscribes: Users can manage their own, admins can view all, anon can create

---

### 5. `20241213_phase6_report_cards_enhancements.sql`
**Modifies Table: `report_cards`**

Adds columns for Phase 6 features.

**New Columns:**
- `groomer_id` (UUID, FK) - Groomer who created report card
- `view_count` (INTEGER) - Public page view counter
- `last_viewed_at` (TIMESTAMPTZ) - Last view timestamp
- `sent_at` (TIMESTAMPTZ) - When notification was sent
- `expires_at` (TIMESTAMPTZ) - Public link expiration (default 90 days)
- `dont_send` (BOOLEAN) - Skip auto-notification
- `is_draft` (BOOLEAN) - Draft status
- `updated_at` (TIMESTAMPTZ)

**New Functions:**
- `increment_report_card_views(UUID)` - Increment view counter
- `is_report_card_expired(UUID)` - Check if expired

**Indexes:**
- groomer_id, is_draft, sent_at, expires_at

---

### 6. `20241213_phase6_waitlist_enhancements.sql`
**Modifies Table: `waitlist`**

Adds columns for waitlist automation.

**New Columns:**
- `priority` (INTEGER) - Priority level (higher = first)
- `notes` (TEXT) - Admin notes
- `offer_expires_at` (TIMESTAMPTZ) - Slot offer expiration
- `updated_at` (TIMESTAMPTZ)

**New Functions:**
- `get_matching_waitlist_entries(service_id, slot_date, max_results)` - Find matching entries
- `expire_old_waitlist_offers()` - Expire old offers

**Indexes:**
- priority, offer_expires_at, composite matching index

---

### 7. `20241213_phase6_notifications_log_enhancements.sql`
**Modifies Table: `notifications_log`**

Adds tracking columns for marketing campaigns.

**New Columns:**
- `campaign_id` (UUID, FK) - Link to campaign
- `campaign_send_id` (UUID, FK) - Link to campaign send
- `tracking_id` (UUID) - Unique tracking ID
- `clicked_at` (TIMESTAMPTZ) - Click tracking
- `delivered_at` (TIMESTAMPTZ) - Delivery tracking
- `cost_cents` (INTEGER) - SMS/email cost

**New Functions:**
- `track_notification_click(tracking_id)` - Track clicks
- `track_notification_delivery(tracking_id, delivered_at)` - Track delivery
- `get_notification_metrics(start_date, end_date)` - Get metrics
- `get_campaign_metrics(campaign_id)` - Get campaign performance

**Indexes:**
- campaign_id, campaign_send_id, tracking_id, clicked_at, delivered_at

---

## Application Order

Run migrations in this order:

1. ✅ `20241213_phase6_reviews_table.sql`
2. ✅ `20241213_phase6_marketing_campaigns_tables.sql` (must run before notifications_log enhancements)
3. ✅ `20241213_phase6_analytics_cache_table.sql`
4. ✅ `20241213_phase6_waitlist_marketing_tables.sql`
5. ✅ `20241213_phase6_report_cards_enhancements.sql`
6. ✅ `20241213_phase6_waitlist_enhancements.sql`
7. ✅ `20241213_phase6_notifications_log_enhancements.sql` (must run after marketing_campaigns)

## How to Apply Migrations

### Option 1: Using Supabase CLI (Production/Development)

```bash
# Make sure you're in the project directory
cd "C:\Users\Jon\Documents\claude projects\thepuppyday"

# Apply all migrations
supabase db reset

# OR apply specific migration
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of each migration file
3. Execute in order listed above
4. Verify success with `\dt` to list tables

### Option 3: Using Mock Database

If using mocks (`NEXT_PUBLIC_USE_MOCKS=true`), update the mock seed data files:
- `src/mocks/supabase/seed.ts` - Add seed data for new tables
- `src/mocks/supabase/client.ts` - Update mock client to handle new tables

## Verification Checklist

After applying migrations, verify:

- [ ] All 6 new tables exist
- [ ] All 3 modified tables have new columns
- [ ] All indexes are created
- [ ] All RLS policies are active
- [ ] All functions are created
- [ ] No foreign key errors
- [ ] Triggers are working (updated_at)

Run verification query:

```sql
-- Check new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'reviews',
    'marketing_campaigns',
    'campaign_sends',
    'analytics_cache',
    'waitlist_slot_offers',
    'marketing_unsubscribes'
  );

-- Check new columns on report_cards
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'report_cards'
  AND column_name IN (
    'groomer_id',
    'view_count',
    'last_viewed_at',
    'sent_at',
    'expires_at',
    'dont_send',
    'is_draft',
    'updated_at'
  );

-- Check new columns on waitlist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'waitlist'
  AND column_name IN ('priority', 'notes', 'offer_expires_at', 'updated_at');

-- Check new columns on notifications_log
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'notifications_log'
  AND column_name IN (
    'campaign_id',
    'campaign_send_id',
    'tracking_id',
    'clicked_at',
    'delivered_at',
    'cost_cents'
  );
```

## Next Steps

After migrations are applied:

1. **Update TypeScript types** (Task 1.2)
   - `src/types/review.ts`
   - `src/types/marketing.ts`
   - `src/types/analytics.ts`
   - `src/types/report-card.ts` (update)
   - `src/types/waitlist.ts` (update)

2. **Update mock seed data** (if using mocks)
   - Add sample data for new tables
   - Update existing mock data with new columns

3. **Test RLS policies**
   - Create test users with different roles
   - Verify access controls work as expected

4. **Begin implementation** of Phase 6 features
   - Start with Group 2: Report Card System

## Rollback

If you need to rollback these migrations:

```sql
-- Drop new tables
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.campaign_sends CASCADE;
DROP TABLE IF EXISTS public.marketing_campaigns CASCADE;
DROP TABLE IF EXISTS public.analytics_cache CASCADE;
DROP TABLE IF EXISTS public.waitlist_slot_offers CASCADE;
DROP TABLE IF EXISTS public.marketing_unsubscribes CASCADE;

-- Remove new columns from existing tables
ALTER TABLE public.report_cards
  DROP COLUMN IF EXISTS groomer_id,
  DROP COLUMN IF EXISTS view_count,
  DROP COLUMN IF EXISTS last_viewed_at,
  DROP COLUMN IF EXISTS sent_at,
  DROP COLUMN IF EXISTS expires_at,
  DROP COLUMN IF EXISTS dont_send,
  DROP COLUMN IF EXISTS is_draft,
  DROP COLUMN IF EXISTS updated_at;

ALTER TABLE public.waitlist
  DROP COLUMN IF EXISTS priority,
  DROP COLUMN IF EXISTS notes,
  DROP COLUMN IF EXISTS offer_expires_at,
  DROP COLUMN IF EXISTS updated_at;

ALTER TABLE public.notifications_log
  DROP COLUMN IF EXISTS campaign_id,
  DROP COLUMN IF EXISTS campaign_send_id,
  DROP COLUMN IF EXISTS tracking_id,
  DROP COLUMN IF EXISTS clicked_at,
  DROP COLUMN IF EXISTS delivered_at,
  DROP COLUMN IF EXISTS cost_cents;
```

## Database Schema Documentation

Updated schema diagram available at: `docs/specs/phase-6/design.md`

## Support

For issues or questions about these migrations, refer to:
- Phase 6 Design Doc: `docs/specs/phase-6/design.md`
- Phase 6 Tasks: `docs/specs/phase-6/tasks.md`
- Supabase Documentation: https://supabase.com/docs
