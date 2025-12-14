# Quick Guide: Apply Phase 6 Critical Fixes

## 🚨 IMPORTANT: Apply Before Production Deployment

This migration fixes **CRITICAL security vulnerabilities** identified in code review.

## Prerequisites

- [ ] Development/staging environment for testing
- [ ] Database backup (recommended)
- [ ] Supabase CLI installed OR Dashboard access

## Step 1: Review the Fixes

Read the detailed summary:
```
PHASE_6_CRITICAL_FIXES_SUMMARY.md
```

**Key fixes**:
1. Removed unsafe anonymous unsubscribe policy
2. Added missing Review table columns
3. Fixed Marketing Campaign table schema
4. Added permission checks to SECURITY DEFINER functions
5. Made tracking_id UNIQUE

## Step 2: Test in Development First

### Option A: Using Supabase CLI

```bash
# Make sure you're connected to your DEV project
supabase link --project-ref YOUR_DEV_PROJECT_REF

# Apply the migration
supabase db push

# Verify success
supabase db diff
```

### Option B: Using Supabase Dashboard

1. Go to **SQL Editor** in Supabase Dashboard
2. Open file: `supabase/migrations/20241213_phase6_critical_fixes.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **Run**
6. Check for success message

### Option C: Using MCP Supabase (if available)

```
/mcp supabase migrations apply 20241213_phase6_critical_fixes
```

## Step 3: Verify the Migration

Run these queries in SQL Editor to confirm:

```sql
-- 1. Check reviews table has new columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'reviews'
  AND column_name IN ('destination', 'google_review_url', 'responded_at', 'response_text');
-- Should return 4 rows

-- 2. Check marketing_campaigns renamed columns
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'marketing_campaigns'
  AND column_name IN ('message_content', 'scheduled_at');
-- Should return 2 rows

-- 3. Check campaign_sends renamed customer_id
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'campaign_sends'
  AND column_name = 'customer_id';
-- Should return 1 row

-- 4. Verify unsafe policy removed
SELECT COUNT(*)
FROM pg_policies
WHERE tablename = 'marketing_unsubscribes'
  AND policyname = 'anon_create_unsubscribe';
-- Should return 0

-- 5. Verify tracking_id is unique
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'notifications_log'
  AND constraint_name = 'notifications_log_tracking_id_key';
-- Should return 1 row
```

## Step 4: Update Application Code

After migration succeeds, update code to use renamed columns:

### TypeScript/Frontend Updates

**marketing_campaigns** queries:
```typescript
// BEFORE
const { message, scheduled_for } = campaign;

// AFTER
const { message_content, scheduled_at } = campaign;
```

**campaign_sends** queries:
```typescript
// BEFORE
const { user_id } = campaignSend;

// AFTER
const { customer_id } = campaignSend;
```

**marketing_unsubscribes** queries:
```typescript
// BEFORE
const { user_id } = unsubscribe;

// AFTER
const { customer_id } = unsubscribe;
```

### Check Mock Data

If using mocks, update seed data in:
```
src/mocks/supabase/seed.ts
```

Match the new column names and add new fields with default values.

## Step 5: Test Critical Functions

Test the security fixes on SECURITY DEFINER functions:

```sql
-- Should work (as admin)
SELECT * FROM get_notification_metrics(NOW() - INTERVAL '7 days', NOW());

-- Should fail with "Admin access required" (as customer)
-- (Test by logging in as a customer and trying the same query)
```

## Step 6: Apply to Production

Once verified in dev/staging:

1. **Create production backup**
   ```bash
   # Backup command (adjust for your setup)
   supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Apply migration to production**
   ```bash
   supabase link --project-ref YOUR_PROD_PROJECT_REF
   supabase db push
   ```

3. **Monitor for errors**
   - Check Supabase logs
   - Monitor application error tracking
   - Test critical flows (reviews, campaigns, waitlist)

## Rollback Plan

If issues occur, rollback steps:

1. **Restore database from backup**
   ```bash
   psql -h YOUR_DB_HOST -U postgres -d postgres < backup_TIMESTAMP.sql
   ```

2. **Alternative: Selective rollback**

   Create and run a rollback migration that:
   - Adds back the `anon_create_unsubscribe` policy (if needed)
   - Renames columns back to original names
   - Removes permission checks from functions

   **Note**: This is NOT recommended as it reintroduces security vulnerabilities.

## Breaking Changes Checklist

Update these parts of your codebase:

- [ ] **Review submission flow**: Uses new `destination` field
- [ ] **Campaign creation**: Uses `message_content` instead of `message`
- [ ] **Campaign scheduling**: Uses `scheduled_at` instead of `scheduled_for`
- [ ] **Campaign sends**: References `customer_id` instead of `user_id`
- [ ] **Unsubscribe management**: References `customer_id` instead of `user_id`
- [ ] **Mock data**: Updated to match new schema
- [ ] **TypeScript types**: Already match (no changes needed)

## Common Issues

### Issue: "column does not exist: message"
**Solution**: Update query to use `message_content`

### Issue: "column does not exist: user_id" in campaign_sends
**Solution**: Update query to use `customer_id`

### Issue: Anonymous unsubscribe not working
**Solution**: This is expected. Implement token-based unsubscribe in app layer:
1. Add `unsubscribe_token` column (future migration)
2. Generate unique token when sending marketing emails
3. Create public API endpoint that validates token
4. Allow unauthenticated unsubscribe with valid token

### Issue: "Admin access required" for customers
**Solution**: Verify you're using correct role check in RLS policies. Functions now enforce admin-only access where appropriate.

## Security Verification

After migration, verify security posture:

```sql
-- 1. Confirm no anonymous unsubscribe policy
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'marketing_unsubscribes'
  AND policyname LIKE '%anon%';
-- Should be 0

-- 2. Confirm tracking_id uniqueness
SELECT COUNT(*) FROM (
  SELECT tracking_id, COUNT(*)
  FROM notifications_log
  GROUP BY tracking_id
  HAVING COUNT(*) > 1
) duplicates;
-- Should be 0

-- 3. Test permission enforcement (as customer)
-- This should fail:
SELECT get_notification_metrics(NOW() - INTERVAL '7 days', NOW());
-- Expected: "Admin access required"
```

## Need Help?

- Review: `PHASE_6_CRITICAL_FIXES_SUMMARY.md`
- Check: Original migration file for SQL details
- Test: Always test in development first
- Backup: Always backup production before applying

---

**Status**: Ready to apply
**Severity**: CRITICAL
**Safe to run multiple times**: Yes (idempotent)
