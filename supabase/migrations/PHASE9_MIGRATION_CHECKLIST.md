# Phase 9 Migration Execution Checklist

## Pre-Migration Checklist

### 1. Environment Verification
- [ ] Confirmed Supabase project URL: `https://jajbtwgbhrkvgxvvruaa.supabase.co`
- [ ] Project ref: `jajbtwgbhrkvgxvvruaa`
- [ ] Environment variables verified in `.env.local`
- [ ] Service role key available and valid
- [ ] Database connection working

### 2. Backup
- [ ] Database backup created (via Supabase Dashboard)
  - Go to: Database > Backups > Create Backup
  - Label: "Pre-Phase-9-Migration-YYYYMMDD"
- [ ] Migration files backed up locally
- [ ] `.env.local` backed up

### 3. Review
- [ ] Read migration file: `20241217_phase9_admin_settings_schema.sql`
- [ ] Read quick reference: `PHASE9_QUICK_REFERENCE.md`
- [ ] Read schema diagram: `PHASE9_SCHEMA_DIAGRAM.md`
- [ ] Understand rollback procedure
- [ ] Review RLS policies

### 4. Dependencies Check
- [ ] `users` table exists (required)
- [ ] `update_updated_at()` function exists (required)
- [ ] `settings` table exists (required)
- [ ] `site_content` table exists (required)
- [ ] `promo_banners` table exists (required)

**Verify with:**
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'settings', 'site_content', 'promo_banners');

SELECT proname FROM pg_proc
WHERE proname = 'update_updated_at';
```

## Migration Execution

### Method 1: Supabase Dashboard (Recommended)

#### Step 1: Access SQL Editor
1. [ ] Go to https://supabase.com/dashboard/project/jajbtwgbhrkvgxvvruaa
2. [ ] Navigate to: SQL Editor
3. [ ] Create new query

#### Step 2: Load Migration
1. [ ] Open `supabase/migrations/20241217_phase9_admin_settings_schema.sql`
2. [ ] Copy entire file contents
3. [ ] Paste into SQL Editor

#### Step 3: Review Before Execute
1. [ ] Check SQL syntax highlighting (no red errors)
2. [ ] Verify no existing tables will be dropped
3. [ ] Confirm `IF NOT EXISTS` clauses present
4. [ ] Verify `ON CONFLICT DO NOTHING` on inserts

#### Step 4: Execute Migration
1. [ ] Click "Run" button
2. [ ] Wait for completion (should be < 5 seconds)
3. [ ] Check for success message
4. [ ] Review any warnings or notices

#### Step 5: Verify Execution
1. [ ] Check "Results" panel for confirmation
2. [ ] Look for "Migration completed successfully" message
3. [ ] No error messages displayed

### Method 2: Supabase CLI (Alternative)

```bash
# Ensure Supabase CLI is installed
supabase --version

# Link to remote project (if not already linked)
supabase link --project-ref jajbtwgbhrkvgxvvruaa

# Apply migrations
supabase db push

# Check migration status
supabase migration list
```

- [ ] CLI installed and working
- [ ] Project linked successfully
- [ ] Migration pushed without errors
- [ ] Migration appears in list

### Method 3: Direct psql (Advanced)

```bash
# Get connection string from Supabase Dashboard:
# Settings > Database > Connection String (Direct connection)

psql "postgresql://postgres.[PASSWORD]@db.jajbtwgbhrkvgxvvruaa.supabase.co:5432/postgres" \
  -f supabase/migrations/20241217_phase9_admin_settings_schema.sql
```

- [ ] Connection string obtained
- [ ] psql installed
- [ ] Connection successful
- [ ] Migration executed
- [ ] No errors reported

## Post-Migration Validation

### 1. Table Verification

#### Check tables exist:
```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'staff_commissions',
  'referral_codes',
  'referrals',
  'settings_audit_log'
)
ORDER BY tablename;
```

**Expected Result:** 4 rows returned

- [ ] `referral_codes` exists
- [ ] `referrals` exists
- [ ] `settings_audit_log` exists
- [ ] `staff_commissions` exists

#### Check promo_banners column:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'promo_banners'
AND column_name = 'impression_count';
```

**Expected Result:** 1 row with `bigint` type

- [ ] `impression_count` column exists on `promo_banners`

### 2. Index Verification

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'staff_commissions',
  'referral_codes',
  'referrals',
  'settings_audit_log'
)
ORDER BY tablename, indexname;
```

**Expected Result:** 13+ indexes

- [ ] At least 1 index on `staff_commissions`
- [ ] At least 3 indexes on `referral_codes`
- [ ] At least 5 indexes on `referrals`
- [ ] At least 4 indexes on `settings_audit_log`

### 3. RLS Verification

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'staff_commissions',
  'referral_codes',
  'referrals',
  'settings_audit_log'
)
ORDER BY tablename;
```

**Expected Result:** All 4 tables with `rowsecurity = true`

- [ ] RLS enabled on `staff_commissions`
- [ ] RLS enabled on `referral_codes`
- [ ] RLS enabled on `referrals`
- [ ] RLS enabled on `settings_audit_log`

### 4. Policy Verification

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'staff_commissions',
  'referral_codes',
  'referrals',
  'settings_audit_log'
)
GROUP BY tablename
ORDER BY tablename;
```

**Expected Result:**
- `referral_codes`: 3 policies
- `referrals`: 3 policies
- `settings_audit_log`: 1 policy
- `staff_commissions`: 2 policies

- [ ] At least 2 policies on `staff_commissions`
- [ ] At least 3 policies on `referral_codes`
- [ ] At least 3 policies on `referrals`
- [ ] At least 1 policy on `settings_audit_log`

### 5. Trigger Verification

```sql
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname = 'trigger_staff_commissions_updated_at';
```

**Expected Result:** 1 row

- [ ] Trigger `trigger_staff_commissions_updated_at` exists

### 6. View Verification

```sql
SELECT viewname FROM pg_views
WHERE schemaname = 'public'
AND viewname = 'staff_commission_earnings';
```

**Expected Result:** 1 row

- [ ] View `staff_commission_earnings` exists

### 7. Default Data Verification

#### Check settings:
```sql
SELECT key FROM settings
WHERE key IN (
  'booking_settings',
  'loyalty_earning_rules',
  'loyalty_redemption_rules',
  'referral_program'
)
ORDER BY key;
```

**Expected Result:** 4 rows

- [ ] `booking_settings` exists
- [ ] `loyalty_earning_rules` exists
- [ ] `loyalty_redemption_rules` exists
- [ ] `referral_program` exists

#### Check site content:
```sql
SELECT key FROM site_content
WHERE key IN ('hero', 'seo', 'business_info')
ORDER BY key;
```

**Expected Result:** 3 rows

- [ ] `business_info` exists
- [ ] `hero` exists
- [ ] `seo` exists

### 8. Constraint Verification

```sql
-- staff_commissions constraints
SELECT conname FROM pg_constraint
WHERE conrelid = 'public.staff_commissions'::regclass
ORDER BY conname;

-- referral_codes constraints
SELECT conname FROM pg_constraint
WHERE conrelid = 'public.referral_codes'::regclass
ORDER BY conname;

-- referrals constraints
SELECT conname FROM pg_constraint
WHERE conrelid = 'public.referrals'::regclass
ORDER BY conname;
```

- [ ] `staff_commissions` has rate_type check
- [ ] `staff_commissions` has rate check
- [ ] `staff_commissions` has groomer_id unique
- [ ] `referral_codes` has code unique
- [ ] `referral_codes` has uses_count check
- [ ] `referrals` has status check
- [ ] `referrals` has referee_id unique
- [ ] `referrals` has referrer_not_referee check

### 9. Run Automated Validation Tests

```sql
-- Copy and paste contents of PHASE9_VALIDATION_TESTS.sql
-- into SQL Editor and run
```

- [ ] All tests return 'PASS' status
- [ ] No 'FAIL' results
- [ ] Summary shows correct counts

### 10. Functional Testing

#### Test 1: View default settings
```sql
SELECT * FROM settings
WHERE key = 'booking_settings';
```

- [ ] Returns booking settings with min_advance_hours: 2

#### Test 2: View default site content
```sql
SELECT * FROM site_content
WHERE key = 'hero';
```

- [ ] Returns hero section with "Professional Dog Grooming" headline

#### Test 3: View commission earnings (empty)
```sql
SELECT * FROM staff_commission_earnings;
```

- [ ] Returns empty result set (no error)

#### Test 4: Check RLS as anonymous
```sql
-- In a new query with anonymous context:
SELECT * FROM staff_commissions;
```

- [ ] Returns 0 rows (access denied by RLS)

## Post-Migration Actions

### 1. Monitor Performance
- [ ] Check query performance in Supabase Dashboard
- [ ] Review slow query log
- [ ] Verify indexes are being used

### 2. Update Application Code
- [ ] Review Phase 9 tasks that depend on these tables
- [ ] Update TypeScript types if needed
- [ ] Update API endpoints
- [ ] Update admin UI components

### 3. Documentation
- [ ] Mark Task 0155 as completed
- [ ] Update project README if needed
- [ ] Share migration results with team

### 4. Testing
- [ ] Unit tests for new tables
- [ ] Integration tests for RLS policies
- [ ] E2E tests for admin features

## Rollback Procedure (If Needed)

### Only if critical issues occur:

1. [ ] Create incident log
2. [ ] Document the issue
3. [ ] Run rollback SQL:

```sql
-- Execute rollback (see PHASE9_SCHEMA_DIAGRAM.md for full script)
DROP VIEW IF EXISTS public.staff_commission_earnings;
DROP TABLE IF EXISTS public.settings_audit_log CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.referral_codes CASCADE;
DROP TABLE IF EXISTS public.staff_commissions CASCADE;
ALTER TABLE public.promo_banners DROP COLUMN IF EXISTS impression_count;
DELETE FROM public.settings WHERE key IN (
  'booking_settings', 'loyalty_earning_rules',
  'loyalty_redemption_rules', 'referral_program'
);
DELETE FROM public.site_content WHERE key IN ('hero', 'seo', 'business_info');
```

4. [ ] Verify rollback completed
5. [ ] Restore from backup if needed
6. [ ] Analyze root cause
7. [ ] Fix migration file
8. [ ] Re-test before re-applying

## Success Criteria

All items must be checked before migration is considered complete:

### Critical (Must Pass)
- [ ] All 4 new tables created
- [ ] All indexes created
- [ ] All RLS policies active
- [ ] All constraints enforced
- [ ] No migration errors
- [ ] Default data inserted
- [ ] Application still functional

### Important (Should Pass)
- [ ] All validation tests pass
- [ ] Trigger functioning correctly
- [ ] View query works
- [ ] RLS policies tested
- [ ] Performance acceptable

### Nice to Have
- [ ] Documentation updated
- [ ] Team notified
- [ ] Next tasks planned

## Notes & Observations

**Migration Start Time:** ________________

**Migration End Time:** ________________

**Duration:** ________________

**Issues Encountered:**
- _____________________________________________________________
- _____________________________________________________________
- _____________________________________________________________

**Resolution:**
- _____________________________________________________________
- _____________________________________________________________
- _____________________________________________________________

**Verified By:** ________________

**Date:** ________________

## Contact

**Questions or Issues?**
- Review: `PHASE9_QUICK_REFERENCE.md`
- Check: `PHASE9_SCHEMA_DIAGRAM.md`
- See: `task-0155-implementation-summary.md`

**Migration Files:**
- Main migration: `20241217_phase9_admin_settings_schema.sql`
- Validation: `PHASE9_VALIDATION_TESTS.sql`
- This checklist: `PHASE9_MIGRATION_CHECKLIST.md`
