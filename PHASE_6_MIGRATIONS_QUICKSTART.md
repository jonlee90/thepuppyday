# Phase 6 Migrations - Quick Start Guide

## Overview

This guide will help you quickly apply the Phase 6 database migrations for The Puppy Day application.

## Prerequisites

- Supabase CLI installed (or access to Supabase Dashboard)
- Database access credentials
- Backup of current database (recommended)

## Migration Files

All migration files are located in: `supabase/migrations/`

```
20241213_phase6_reviews_table.sql
20241213_phase6_marketing_campaigns_tables.sql
20241213_phase6_analytics_cache_table.sql
20241213_phase6_waitlist_marketing_tables.sql
20241213_phase6_report_cards_enhancements.sql
20241213_phase6_waitlist_enhancements.sql
20241213_phase6_notifications_log_enhancements.sql
```

## Quick Apply (3 Steps)

### Step 1: Backup Database

```bash
# Using Supabase CLI
supabase db dump -f backup-before-phase6.sql

# OR using pg_dump
pg_dump -h your-host -U your-user your-database > backup-before-phase6.sql
```

### Step 2: Apply Migrations

**Option A: Using Supabase CLI (Recommended)**

```bash
cd "C:\Users\Jon\Documents\claude projects\thepuppyday"

# Push all new migrations to Supabase
supabase db push
```

**Option B: Using Supabase Dashboard**

1. Go to: https://app.supabase.com/project/YOUR-PROJECT/sql
2. For each migration file (in order):
   - Open the file in a text editor
   - Copy the entire contents
   - Paste into SQL Editor
   - Click "Run"
   - Verify "Success" message

**Option C: Using psql**

```bash
cd "C:\Users\Jon\Documents\claude projects\thepuppyday"

# Apply each migration in order
psql -h your-host -U your-user -d your-database -f supabase/migrations/20241213_phase6_reviews_table.sql
psql -h your-host -U your-user -d your-database -f supabase/migrations/20241213_phase6_marketing_campaigns_tables.sql
psql -h your-host -U your-user -d your-database -f supabase/migrations/20241213_phase6_analytics_cache_table.sql
psql -h your-host -U your-user -d your-database -f supabase/migrations/20241213_phase6_waitlist_marketing_tables.sql
psql -h your-host -U your-user -d your-database -f supabase/migrations/20241213_phase6_report_cards_enhancements.sql
psql -h your-host -U your-user -d your-database -f supabase/migrations/20241213_phase6_waitlist_enhancements.sql
psql -h your-host -U your-user -d your-database -f supabase/migrations/20241213_phase6_notifications_log_enhancements.sql
```

### Step 3: Verify

```bash
# Run verification script
psql -h your-host -U your-user -d your-database -f scripts/verify-phase6-migrations.sql

# OR in Supabase Dashboard SQL Editor:
# Copy contents of scripts/verify-phase6-migrations.sql
# Paste and run
```

Expected verification results:
- ✅ 6 new tables created
- ✅ 3 tables modified (report_cards, waitlist, notifications_log)
- ✅ 9 new functions created
- ✅ RLS enabled on all new tables
- ✅ All indexes created
- ✅ All triggers working

## What Gets Created

### New Tables (6)

1. **reviews** - Customer feedback on report cards
2. **marketing_campaigns** - Retention marketing campaigns
3. **campaign_sends** - Individual campaign send tracking
4. **analytics_cache** - Performance cache for dashboard
5. **waitlist_slot_offers** - Waitlist automation offers
6. **marketing_unsubscribes** - Opt-out management

### Modified Tables (3)

1. **report_cards** - Added 8 new columns (groomer_id, view_count, sent_at, etc.)
2. **waitlist** - Added 4 new columns (priority, notes, offer_expires_at, updated_at)
3. **notifications_log** - Added 6 new columns (campaign_id, tracking_id, clicked_at, etc.)

### New Functions (9)

1. `increment_report_card_views(UUID)` - Track report card views
2. `is_report_card_expired(UUID)` - Check expiration
3. `cleanup_expired_analytics_cache()` - Cache cleanup
4. `get_matching_waitlist_entries(UUID, DATE, INT)` - Waitlist matching
5. `expire_old_waitlist_offers()` - Expire old offers
6. `track_notification_click(UUID)` - Click tracking
7. `track_notification_delivery(UUID, TIMESTAMPTZ)` - Delivery tracking
8. `get_notification_metrics(TIMESTAMPTZ, TIMESTAMPTZ)` - Notification metrics
9. `get_campaign_metrics(UUID)` - Campaign performance

## Troubleshooting

### Error: "relation does not exist"

**Problem:** Table referenced in foreign key doesn't exist yet.

**Solution:** Make sure you run migrations in the correct order (listed above).

### Error: "function update_updated_at() does not exist"

**Problem:** The base schema is missing the trigger function.

**Solution:** This function should exist from the initial migration. Check if you need to run:

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Error: "column already exists"

**Problem:** Migration was partially applied before.

**Solution:** Check which columns exist and modify the migration to use `ADD COLUMN IF NOT EXISTS`.

### Error: "permission denied"

**Problem:** Insufficient database privileges.

**Solution:** Make sure you're connected as a superuser or have ALTER TABLE privileges.

## Rollback

If you need to rollback the migrations:

```bash
# Restore from backup
psql -h your-host -U your-user -d your-database -f backup-before-phase6.sql

# OR run rollback script (see PHASE_6_MIGRATIONS_SUMMARY.md)
```

## Next Steps

After successful migration:

1. ✅ Verify all tables and columns exist
2. ✅ Update TypeScript types (Task 1.2)
3. ✅ Update mock seed data (if using NEXT_PUBLIC_USE_MOCKS=true)
4. ✅ Test RLS policies with different user roles
5. ✅ Begin implementing Phase 6 features

## Testing RLS Policies

```sql
-- Test as customer (replace with actual customer ID)
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = 'customer-user-id-here';

-- Try to view reviews (should only see own)
SELECT * FROM reviews;

-- Test as admin
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = 'admin-user-id-here';

-- Try to view all reviews (should see all)
SELECT * FROM reviews;

-- Reset
RESET role;
```

## Mock Service Updates

If using `NEXT_PUBLIC_USE_MOCKS=true`, update these files:

```typescript
// src/mocks/supabase/seed.ts
export const reviews: Review[] = [
  {
    id: '1',
    report_card_id: 'report-1',
    user_id: 'customer-1',
    appointment_id: 'appt-1',
    rating: 5,
    feedback: 'Great service!',
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const marketing_campaigns: MarketingCampaign[] = [
  // Add seed data
];

// ... etc for other tables
```

## Support

For detailed information, see:
- **Full Summary**: `PHASE_6_MIGRATIONS_SUMMARY.md`
- **Phase 6 Design**: `docs/specs/phase-6/design.md`
- **Phase 6 Tasks**: `docs/specs/phase-6/tasks.md`

## Migration Checklist

- [ ] Backup database
- [ ] Apply migration 1: reviews table
- [ ] Apply migration 2: marketing campaigns tables
- [ ] Apply migration 3: analytics cache table
- [ ] Apply migration 4: waitlist & marketing tables
- [ ] Apply migration 5: report_cards enhancements
- [ ] Apply migration 6: waitlist enhancements
- [ ] Apply migration 7: notifications_log enhancements
- [ ] Run verification script
- [ ] Check all tables exist
- [ ] Check all columns added
- [ ] Check all functions created
- [ ] Check RLS enabled
- [ ] Test basic queries
- [ ] Update TypeScript types
- [ ] Update mock seed data (if applicable)
- [ ] Commit migration files to git
- [ ] Mark Task 0001 and 0002 as complete
