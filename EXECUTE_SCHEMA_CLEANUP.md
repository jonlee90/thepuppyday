# Schema Cleanup Execution Guide

**Generated**: 2025-12-27
**Database**: The Puppy Day (Supabase PostgreSQL)
**Status**: Ready to Execute

---

## Overview

This guide will help you execute the safe database schema cleanup operations identified in the schema reconciliation report.

### What Will Be Done

1. **Add 30+ Performance Indexes** - Non-blocking (`CONCURRENTLY`)
2. **Drop 3 Unused Views** - groomer_commission_earnings, inactive_customer_profiles, notification_template_stats
3. **Remove 2 Unused Columns** - customer_memberships.grooms_remaining, customer_memberships.grooms_used
4. **Add 7 Enum Constraints** - Data validation for status fields
5. **Analyze Tables** - Update query planner statistics
6. **Add Table Comments** - Documentation

---

## Execution Methods

### Method 1: Supabase SQL Editor (RECOMMENDED)

1. Go to your Supabase project: https://supabase.com/dashboard/project/jajbtwgbhrkvgxvvruaa
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query
4. Copy and paste the SQL from each migration file below
5. Execute each section separately

**Execution Order**:
1. `migration_1_indexes.sql` - Performance indexes
2. `migration_2_cleanup.sql` - Drop unused structures
3. `migration_3_constraints.sql` - Add enum constraints
4. `migration_4_optimize.sql` - Analyze and comments

### Method 2: Combined Single Execution

If you prefer to run everything at once, use the file:
- `/Users/jonathanlee/Desktop/thepuppyday/SCHEMA_CLEANUP_SAFE.sql`

---

## Migration Files

### Migration 1: Performance Indexes (30+ indexes)

**File**: `/tmp/migration_1_indexes.sql`

**What it does**:
- Creates indexes on frequently queried columns
- Uses `CONCURRENTLY` to avoid locking tables
- Adds indexes for appointments, users, settings, notifications, calendar sync, waitlist, pets, etc.

**Expected Duration**: 30-60 seconds (depending on data volume)

**Critical Indexes**:
- `idx_appointments_scheduled_at` - Date-based queries
- `idx_appointments_status_scheduled` - Status filtering
- `idx_appointments_customer_id` - Customer history
- `idx_users_role` - Role-based access control
- `idx_users_email_lower` - Case-insensitive email lookups
- `idx_settings_key_unique` - Enforce unique settings keys

---

### Migration 2: Drop Unused Structures

**File**: `/tmp/migration_2_cleanup.sql`

**What it does**:
- Drops 3 unused views (zero code references found)
- Removes 2 unused columns from customer_memberships

**Expected Duration**: < 5 seconds

**Safe**: All operations use `IF EXISTS` - won't fail if already removed

---

### Migration 3: Enum Constraints

**File**: `/tmp/migration_3_constraints.sql`

**What it does**:
- Adds CHECK constraints to enforce valid enum values
- Prevents invalid data from being inserted

**Tables affected**:
- appointments.status
- appointments.payment_status
- users.role
- waitlist.status
- notifications_log.status
- reviews.destination
- pets.size

**Expected Duration**: < 10 seconds

**Safe**: Uses `DROP CONSTRAINT IF EXISTS` before adding new constraints

---

### Migration 4: Optimize & Comments

**File**: `/tmp/migration_4_optimize.sql`

**What it does**:
- Runs ANALYZE on 9 core tables to update query planner statistics
- Adds helpful comments to tables for documentation

**Expected Duration**: < 10 seconds

**Safe**: ANALYZE is always safe to run

---

## Pre-Execution Checklist

- [ ] Database backup taken (Supabase auto-backups should be enabled)
- [ ] Executing during low-traffic period (optional, but recommended)
- [ ] Reviewed migration files for correctness
- [ ] Supabase SQL Editor is open and ready

---

## Expected Results

After successful execution, you should see:

### Indexes Created
```sql
-- Verify indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

Expected: 30+ new indexes with names starting with `idx_`

### Views Dropped
```sql
-- Verify views dropped
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'groomer_commission_earnings',
    'inactive_customer_profiles',
    'notification_template_stats'
  );
```

Expected: 0 rows (views should be gone)

### Columns Removed
```sql
-- Verify columns dropped
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'customer_memberships'
  AND column_name IN ('grooms_remaining', 'grooms_used');
```

Expected: 0 rows (columns should be gone)

### Constraints Added
```sql
-- Verify constraints
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname LIKE 'chk_%'
  AND conrelid::regclass::text IN (
    'appointments', 'users', 'waitlist',
    'notifications_log', 'reviews', 'pets'
  )
ORDER BY table_name, constraint_name;
```

Expected: 7 check constraints for enum validation

---

## Troubleshooting

### Issue: "Index already exists"
**Solution**: This is safe to ignore. The `IF NOT EXISTS` clause prevents errors.

### Issue: "Relation does not exist"
**Solution**: This is safe to ignore for DROP operations. The `IF EXISTS` clause prevents errors.

### Issue: "Constraint already exists"
**Solution**: The migration uses `DROP CONSTRAINT IF EXISTS` before adding. Re-run the specific constraint section.

### Issue: "Permission denied"
**Solution**: Ensure you're logged in as the database owner or have sufficient privileges in Supabase.

### Issue: "Concurrent index creation failed"
**Solution**:
1. Check for active long-running queries
2. Retry the specific index creation
3. If persistent, remove `CONCURRENTLY` keyword (requires brief table lock)

---

## Post-Execution Verification

Run these queries in Supabase SQL Editor to verify success:

### 1. Count New Indexes
```sql
SELECT
  COUNT(*) as index_count,
  SUM(pg_relation_size(indexrelid)) / 1024 / 1024 as total_size_mb
FROM pg_indexes
JOIN pg_class ON pg_class.relname = indexname
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';
```

### 2. Check Table Statistics
```sql
SELECT
  schemaname,
  tablename,
  last_analyze,
  last_autoanalyze,
  n_live_tup as live_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC
LIMIT 10;
```

### 3. Verify Enum Constraints
```sql
SELECT
  table_name,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
  AND constraint_type = 'CHECK'
  AND constraint_name LIKE 'chk_%'
ORDER BY table_name;
```

---

## Performance Monitoring

After cleanup, monitor these metrics in Supabase Dashboard:

1. **Query Performance** (Database → Query Performance)
   - Average query duration should decrease
   - Slow queries should use new indexes

2. **Database Health** (Database → Health)
   - Index usage statistics
   - Table sizes and growth

3. **Logs** (Database → Logs)
   - Check for any errors or warnings
   - Monitor sequential scans vs index scans

---

## Rollback Plan

If you need to rollback (unlikely for safe operations):

### Rollback Indexes
```sql
-- Drop indexes by pattern
DO $$
DECLARE
  idx_name text;
BEGIN
  FOR idx_name IN
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      AND indexname NOT IN (
        -- Keep existing indexes if any
        SELECT indexname FROM pg_indexes WHERE indexname < 'idx_'
      )
  LOOP
    EXECUTE 'DROP INDEX CONCURRENTLY IF EXISTS ' || idx_name;
  END LOOP;
END $$;
```

### Re-add Removed Columns
```sql
-- Only if you need the old columns back
ALTER TABLE customer_memberships
  ADD COLUMN IF NOT EXISTS grooms_remaining INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grooms_used INTEGER DEFAULT 0;
```

### Remove Constraints
```sql
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS chk_appointments_status;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS chk_appointments_payment_status;
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE waitlist DROP CONSTRAINT IF EXISTS chk_waitlist_status;
ALTER TABLE notifications_log DROP CONSTRAINT IF EXISTS chk_notifications_log_status;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS chk_reviews_destination;
ALTER TABLE pets DROP CONSTRAINT IF EXISTS chk_pets_size;
```

---

## Next Steps After Cleanup

1. **Monitor Performance**
   - Watch query execution plans in Supabase
   - Check if slow queries are now using indexes

2. **Update TypeScript Types**
   ```bash
   # If you have Supabase CLI installed
   npx supabase gen types typescript --project-id jajbtwgbhrkvgxvvruaa > src/types/supabase-generated.ts
   ```

3. **Review Risky Operations**
   - See `SCHEMA_CLEANUP_RISKY.sql` for operations that need manual review
   - These require business logic validation before execution

4. **Document Changes**
   - Update `docs/architecture/ARCHITECTURE.md` with schema changes
   - Note any performance improvements observed

---

## Support

If you encounter issues:

1. Check Supabase Dashboard → Logs for detailed error messages
2. Review the specific SQL statement that failed
3. Consult Supabase documentation: https://supabase.com/docs/guides/database
4. Reach out to Supabase support if needed

---

**Status**: ✅ Ready to Execute
**Risk Level**: LOW (all operations are safe and reversible)
**Estimated Total Time**: 1-2 minutes
**Recommended Execution Time**: Any time (operations are non-blocking)
