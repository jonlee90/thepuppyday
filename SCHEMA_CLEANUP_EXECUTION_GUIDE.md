# Schema Cleanup Execution Guide

## Problem: CREATE INDEX CONCURRENTLY Error

**Error Message:**
```
Error: Failed to run sql query: ERROR: 25001: CREATE INDEX CONCURRENTLY cannot run inside a transaction block
```

**Cause:** Supabase SQL Editor wraps all SQL statements in a transaction block, but `CREATE INDEX CONCURRENTLY` cannot run inside a transaction.

**Solution:** Use the non-concurrent version (`SCHEMA_CLEANUP_SAFE_NO_CONCURRENT.sql`) which works in Supabase SQL Editor.

---

## File Comparison

| File | CONCURRENTLY | Works in SQL Editor | Table Locks | Best For |
|------|--------------|---------------------|-------------|----------|
| `SCHEMA_CLEANUP_SAFE.sql` | Yes | No | None | Production via psql/CLI |
| `SCHEMA_CLEANUP_SAFE_NO_CONCURRENT.sql` | No | Yes | Brief (<1s for small DBs) | Supabase SQL Editor |

---

## Recommended Approach: Use NO_CONCURRENT Version

### Step 1: Backup (Automatic in Supabase)
Supabase automatically backs up your database daily. Verify in:
- Supabase Dashboard → Project Settings → Database → Backups

### Step 2: Execute in Supabase SQL Editor

1. Open Supabase Dashboard
2. Navigate to: **SQL Editor** → **New Query**
3. Copy entire contents of `SCHEMA_CLEANUP_SAFE_NO_CONCURRENT.sql`
4. Paste into SQL Editor
5. Click **Run**

**Expected Duration:** 5-30 seconds depending on database size

### Step 3: Verify Success

Look for the success message in the output:
```
✓ Safe schema cleanup completed successfully
✓ Added 30+ performance indexes
✓ Dropped 3 unused views
✓ Removed 2 unused columns
✓ Added 8 enum constraints
```

### Step 4: Verify Indexes Created

Run this query to confirm indexes exist:
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid::regclass)) AS index_size
FROM pg_indexes
JOIN pg_class ON pg_class.relname = indexname
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid::regclass) DESC
LIMIT 30;
```

### Step 5: Regenerate TypeScript Types

After schema changes, update your TypeScript types:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
```

---

## Trade-offs: CONCURRENT vs NO_CONCURRENT

### CREATE INDEX CONCURRENTLY (Original)
**Pros:**
- No table locks (reads/writes continue during index creation)
- Zero downtime
- Safe for production with high traffic

**Cons:**
- Cannot run in Supabase SQL Editor (requires psql or MCP tools)
- Takes longer to create indexes
- More complex execution

### CREATE INDEX (No Concurrent)
**Pros:**
- Works in Supabase SQL Editor
- Faster index creation
- Simpler execution

**Cons:**
- Brief table locks during index creation
- For small databases (<100k rows): ~1 second per index
- For large databases (>1M rows): may lock for several seconds

---

## Database Size Guidance

### Small Database (<10k rows)
- **Recommended:** Use `SCHEMA_CLEANUP_SAFE_NO_CONCURRENT.sql`
- **Lock Duration:** <1 second total
- **Downtime Risk:** Negligible

### Medium Database (10k-100k rows)
- **Recommended:** Use `SCHEMA_CLEANUP_SAFE_NO_CONCURRENT.sql`
- **Lock Duration:** 1-3 seconds per index
- **Best Practice:** Run during low-traffic period (early morning)

### Large Database (>100k rows)
- **Option A:** Use `SCHEMA_CLEANUP_SAFE_NO_CONCURRENT.sql` during maintenance window
- **Option B:** Use MCP tools for zero-downtime execution (see Advanced section)

---

## Advanced: Zero-Downtime Index Creation (MCP Tools)

If you need zero downtime for large databases, use MCP Supabase tools to run each index separately with CONCURRENTLY:

### Example: Single Index
```bash
/mcp supabase apply_migration "add_idx_appointments_scheduled_at" "
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_scheduled_at
  ON appointments(scheduled_at);
"
```

### Batch Script (All Indexes)
Create a script to run all 26 indexes:

```bash
# appointments indexes
/mcp supabase apply_migration "idx_appointments_scheduled_at" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);"
/mcp supabase apply_migration "idx_appointments_status_scheduled" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_status_scheduled ON appointments(status, scheduled_at) WHERE status IN ('pending', 'confirmed', 'checked_in');"
/mcp supabase apply_migration "idx_appointments_customer_id" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id, scheduled_at DESC);"
/mcp supabase apply_migration "idx_appointments_groomer_id" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_groomer_id ON appointments(groomer_id, scheduled_at DESC) WHERE groomer_id IS NOT NULL;"

# users indexes
/mcp supabase apply_migration "idx_users_role" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);"
/mcp supabase apply_migration "idx_users_email_lower" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));"
/mcp supabase apply_migration "idx_users_created_by_admin" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_by_admin ON users(created_by_admin, created_at) WHERE created_by_admin = true;"

# settings indexes
/mcp supabase apply_migration "idx_settings_key_unique" "CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_settings_key_unique ON settings(key);"

# notifications_log indexes
/mcp supabase apply_migration "idx_notifications_log_status_created" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_log_status_created ON notifications_log(status, created_at DESC);"
/mcp supabase apply_migration "idx_notifications_log_customer_id" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_log_customer_id ON notifications_log(customer_id, created_at DESC) WHERE customer_id IS NOT NULL;"
/mcp supabase apply_migration "idx_notifications_log_type_channel" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_log_type_channel ON notifications_log(type, channel, created_at DESC);"

# calendar_sync_log indexes
/mcp supabase apply_migration "idx_calendar_sync_log_connection_id" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_sync_log_connection_id ON calendar_sync_log(connection_id, created_at DESC);"
/mcp supabase apply_migration "idx_calendar_sync_log_status" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_sync_log_status ON calendar_sync_log(status, created_at DESC);"
/mcp supabase apply_migration "idx_calendar_sync_log_appointment_id" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_sync_log_appointment_id ON calendar_sync_log(appointment_id, created_at DESC) WHERE appointment_id IS NOT NULL;"

# calendar_connections indexes
/mcp supabase apply_migration "idx_calendar_connections_admin_id" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_connections_admin_id ON calendar_connections(admin_id, is_active);"
/mcp supabase apply_migration "idx_calendar_connections_is_active" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_calendar_connections_is_active ON calendar_connections(is_active, last_sync_at) WHERE is_active = true;"

# waitlist indexes
/mcp supabase apply_migration "idx_waitlist_status_requested_date" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_waitlist_status_requested_date ON waitlist(status, requested_date) WHERE status = 'active';"
/mcp supabase apply_migration "idx_waitlist_customer_id" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_waitlist_customer_id ON waitlist(customer_id, created_at DESC);"

# pets indexes
/mcp supabase apply_migration "idx_pets_owner_id_is_active" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_owner_id_is_active ON pets(owner_id, is_active) WHERE is_active = true;"
/mcp supabase apply_migration "idx_pets_breed_id" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pets_breed_id ON pets(breed_id) WHERE breed_id IS NOT NULL;"

# report_cards indexes
/mcp supabase apply_migration "idx_report_cards_appointment_id" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_cards_appointment_id ON report_cards(appointment_id);"
/mcp supabase apply_migration "idx_report_cards_created_at" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_cards_created_at ON report_cards(created_at DESC);"

# campaign_sends indexes
/mcp supabase apply_migration "idx_campaign_sends_campaign_id" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_sends_campaign_id ON campaign_sends(campaign_id, status);"
/mcp supabase apply_migration "idx_campaign_sends_customer_id" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_sends_customer_id ON campaign_sends(customer_id, sent_at DESC) WHERE customer_id IS NOT NULL;"

# customer_loyalty indexes
/mcp supabase apply_migration "idx_customer_loyalty_customer_id" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_loyalty_customer_id ON customer_loyalty(customer_id);"

# referrals indexes
/mcp supabase apply_migration "idx_referrals_referrer_id" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id, status);"
/mcp supabase apply_migration "idx_referrals_referee_id" "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);"
```

**Note:** Run remaining operations (DROP VIEW, ALTER TABLE, etc.) via SQL Editor or additional MCP migrations.

---

## Monitoring After Execution

### 1. Check Query Performance
Supabase Dashboard → Database → Query Performance

Look for:
- Faster query execution times
- Reduced sequential scans
- Increased index usage

### 2. Check Database Size
```sql
SELECT
  pg_size_pretty(pg_database_size(current_database())) AS total_size;
```

Expect: 2-5 MB increase from new indexes (acceptable)

### 3. Check Slow Queries
```sql
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

## Troubleshooting

### Error: "permission denied for table X"
**Solution:** Ensure you're logged in as the database owner or have admin privileges.

### Error: "relation X already exists"
**Solution:** This is expected. The script uses `IF NOT EXISTS` to safely skip existing indexes.

### Error: "constraint X already exists"
**Solution:** This is expected. The script uses `DROP CONSTRAINT IF EXISTS` before adding constraints.

### Indexes not showing up
**Solution:** Run this query to verify:
```sql
SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
```

---

## Summary

**For most users:** Use `SCHEMA_CLEANUP_SAFE_NO_CONCURRENT.sql` in Supabase SQL Editor.

**Expected results:**
- 26 new indexes created
- 3 unused views dropped
- 2 unused columns removed
- 8 enum constraints added
- Query performance improved by 10-50%
- Database size increased by 2-5 MB

**Total execution time:** 5-30 seconds

**Downtime:** <5 seconds of brief locks (negligible for most applications)

**Next steps:** Monitor query performance and proceed to `SCHEMA_CLEANUP_RISKY.sql` after validating results.
