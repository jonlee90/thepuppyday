# Phase 6 Critical Fixes - Deployment Checklist

## Pre-Deployment

- [ ] Read `PHASE_6_CRITICAL_FIXES_SUMMARY.md` for complete details
- [ ] Review `APPLY_CRITICAL_FIXES.md` for step-by-step instructions
- [ ] Backup production database
- [ ] Test in development/staging environment first

## Files Created

- [x] `supabase/migrations/20241213_phase6_critical_fixes.sql` - Main migration (605 lines)
- [x] `scripts/verify-critical-fixes.sql` - Verification queries
- [x] `PHASE_6_CRITICAL_FIXES_SUMMARY.md` - Detailed documentation
- [x] `APPLY_CRITICAL_FIXES.md` - Quick start guide
- [x] `CRITICAL_FIXES_CHECKLIST.md` - This file

## Migration Checklist

### 1. Security Fixes
- [x] Remove `anon_create_unsubscribe` policy
- [x] Add UNIQUE constraint on `notifications_log.tracking_id`
- [x] Add permission checks to `increment_report_card_views()`
- [x] Add permission checks to `get_matching_waitlist_entries()`
- [x] Add permission checks to `expire_old_waitlist_offers()`
- [x] Add permission checks to `track_notification_click()`
- [x] Add permission checks to `get_notification_metrics()`
- [x] Add permission checks to `get_campaign_metrics()`
- [x] Document `track_notification_delivery()` webhook security

### 2. Schema Fixes - Reviews Table
- [x] Add `destination` column
- [x] Add `google_review_url` column
- [x] Add `responded_at` column
- [x] Add `response_text` column
- [x] Create `idx_reviews_destination` index
- [x] Create `idx_reviews_unresponded` index
- [x] Populate `destination` for existing reviews

### 3. Schema Fixes - Marketing Campaigns
- [x] Rename `message` → `message_content`
- [x] Rename `scheduled_for` → `scheduled_at`
- [x] Add `description` column
- [x] Add `channel` column
- [x] Add `sent_at` column
- [x] Create `idx_marketing_campaigns_channel` index
- [x] Update `idx_marketing_campaigns_scheduled_at` index
- [x] Populate `channel` for existing campaigns

### 4. Schema Fixes - Campaign Sends
- [x] Rename `user_id` → `customer_id`
- [x] Add `channel` column
- [x] Add `recipient` column
- [x] Add `status` column
- [x] Add `opened_at` column
- [x] Add `error_message` column
- [x] Create `idx_campaign_sends_customer` index
- [x] Create `idx_campaign_sends_campaign_status` index
- [x] Create `idx_campaign_sends_status` index

### 5. Schema Fixes - Waitlist Slot Offers
- [x] Add `waitlist_entry_id` column
- [x] Add `offered_slot_start` column
- [x] Add `offered_slot_end` column
- [x] Add `accepted_at` column
- [x] Add `cancelled_at` column
- [x] Add `cancellation_reason` column
- [x] Create `idx_waitlist_slot_offers_waitlist_entry` index
- [x] Create `idx_waitlist_slot_offers_offered_slot_start` index

### 6. Consistency Fixes
- [x] Rename `marketing_unsubscribes.user_id` → `customer_id`

## Deployment Steps

### Development/Staging
- [ ] Apply migration to dev/staging
  ```bash
  supabase link --project-ref YOUR_DEV_PROJECT_REF
  supabase db push
  ```
- [ ] Run verification script
  ```bash
  # Copy contents of scripts/verify-critical-fixes.sql
  # Run in Supabase SQL Editor
  ```
- [ ] Test affected features:
  - [ ] Review submission (test routing to Google vs private)
  - [ ] Review admin response (test response_text)
  - [ ] Marketing campaign creation (test new fields)
  - [ ] Campaign sends tracking (test new status fields)
  - [ ] Waitlist slot offers (test new columns)
  - [ ] Permission checks on admin-only functions
- [ ] Update application code for renamed columns
- [ ] Update mock data (if using mocks)
- [ ] Run integration tests
- [ ] Verify no errors in logs

### Production
- [ ] **CREATE BACKUP** of production database
- [ ] Schedule maintenance window (if needed)
- [ ] Apply migration to production
  ```bash
  supabase link --project-ref YOUR_PROD_PROJECT_REF
  supabase db push
  ```
- [ ] Run verification script in production
- [ ] Smoke test critical paths:
  - [ ] Customer can submit review
  - [ ] Admin can view campaigns
  - [ ] Waitlist functionality works
  - [ ] No permission errors for normal operations
- [ ] Monitor error logs for 24 hours
- [ ] Verify security posture (no anonymous unsubscribe abuse)

## Application Code Updates

### TypeScript Types
- [ ] Types already match new schema (no changes needed)
- [ ] Verify imports work correctly

### Database Queries - Find and Replace
- [ ] `marketing_campaigns.message` → `message_content`
- [ ] `marketing_campaigns.scheduled_for` → `scheduled_at`
- [ ] `campaign_sends.user_id` → `customer_id`
- [ ] `marketing_unsubscribes.user_id` → `customer_id`

### Mock Data Updates
- [ ] Update `src/mocks/supabase/seed.ts` if using mocks
- [ ] Add new fields with default values
- [ ] Rename columns in mock data

### API/Service Layer
- [ ] Review submission: Use `destination` field
- [ ] Campaign creation: Use `message_content` and `scheduled_at`
- [ ] Campaign sends: Use `customer_id` and new status fields
- [ ] Unsubscribe: Use `customer_id`

## Verification (Post-Deployment)

Run these queries to verify:

```sql
-- 1. Reviews table
SELECT column_name FROM information_schema.columns
WHERE table_name = 'reviews'
  AND column_name IN ('destination', 'google_review_url', 'responded_at', 'response_text');
-- Expected: 4 rows

-- 2. Marketing campaigns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'marketing_campaigns'
  AND column_name IN ('message_content', 'scheduled_at', 'channel');
-- Expected: 3 rows

-- 3. Campaign sends
SELECT column_name FROM information_schema.columns
WHERE table_name = 'campaign_sends'
  AND column_name = 'customer_id';
-- Expected: 1 row

-- 4. Unsafe policy removed
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'marketing_unsubscribes'
  AND policyname = 'anon_create_unsubscribe';
-- Expected: 0

-- 5. Tracking ID unique
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'notifications_log'
  AND constraint_name = 'notifications_log_tracking_id_key';
-- Expected: 1 row
```

Or run the complete verification script:
- [ ] Run `scripts/verify-critical-fixes.sql` in SQL Editor
- [ ] All checks should pass

## Rollback Plan (If Needed)

**Warning**: Rollback reintroduces security vulnerabilities. Only use if absolutely necessary.

1. [ ] Restore from backup
   ```bash
   psql -h YOUR_DB_HOST -U postgres -d postgres < backup_TIMESTAMP.sql
   ```

2. [ ] Alternative: Manual rollback queries
   - Add back `anon_create_unsubscribe` policy (NOT RECOMMENDED)
   - Rename columns back to original names
   - Remove permission checks from functions

3. [ ] Revert application code changes

## Security Verification

After deployment, verify:

- [ ] Anonymous users **cannot** create marketing_unsubscribes
- [ ] Customers **cannot** call admin-only functions
- [ ] `tracking_id` values are unique (no duplicates)
- [ ] SECURITY DEFINER functions enforce permissions
- [ ] Application logs show no permission errors for valid operations

## Known Breaking Changes

### Features Disabled
- Anonymous unsubscribe (requires token-based system - TODO)

### Functions Now Require Admin
- `get_matching_waitlist_entries()`
- `expire_old_waitlist_offers()`
- `get_notification_metrics()`
- `get_campaign_metrics()`

### Column Renames Required in App Code
- `marketing_campaigns.message` → `message_content`
- `marketing_campaigns.scheduled_for` → `scheduled_at`
- `campaign_sends.user_id` → `customer_id`
- `marketing_unsubscribes.user_id` → `customer_id`

## Future TODOs

- [ ] Implement token-based unsubscribe system
  - Add `unsubscribe_token` column
  - Create secure token validation function
  - Add policy for token-based anonymous unsubscribe
  - Update email templates with token links

- [ ] Migrate waitlist slot offers data
  - Create script to populate `offered_slot_start/end` from `slot_date/time`
  - Verify data integrity
  - Drop deprecated columns: `slot_date`, `slot_time`, `service_id`

- [ ] Webhook delivery tracking
  - Create API endpoint for `track_notification_delivery`
  - Implement webhook signature verification
  - Document webhook setup for Twilio/Resend

## Sign-Off

- [ ] Migration tested in development: __________ (Date)
- [ ] Migration tested in staging: __________ (Date)
- [ ] Code updated for renamed columns: __________ (Date)
- [ ] Production backup created: __________ (Date)
- [ ] Migration applied to production: __________ (Date)
- [ ] Verification completed: __________ (Date)
- [ ] Monitoring confirmed no issues: __________ (Date)

## Resources

- **Detailed Summary**: `PHASE_6_CRITICAL_FIXES_SUMMARY.md`
- **Quick Guide**: `APPLY_CRITICAL_FIXES.md`
- **Migration File**: `supabase/migrations/20241213_phase6_critical_fixes.sql`
- **Verification Script**: `scripts/verify-critical-fixes.sql`

---

**Status**: ✅ Ready for deployment
**Severity**: 🔴 CRITICAL - Apply before production
**Safe to run multiple times**: ✅ Yes (idempotent)
**Estimated duration**: ~2-5 minutes
