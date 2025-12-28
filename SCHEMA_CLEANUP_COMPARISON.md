# Schema Cleanup Files Comparison

## Quick Reference

| Aspect | SCHEMA_CLEANUP_SAFE.sql | SCHEMA_CLEANUP_SAFE_NO_CONCURRENT.sql |
|--------|------------------------|--------------------------------------|
| **Works in Supabase SQL Editor** | ❌ No | ✅ Yes |
| **CREATE INDEX Method** | `CREATE INDEX CONCURRENTLY` | `CREATE INDEX` |
| **Table Locks** | ✅ None (zero downtime) | ⚠️ Brief locks (<1s per index) |
| **Execution Method** | psql, MCP tools, or direct DB connection | Supabase SQL Editor |
| **Best For** | Production with high traffic | Development, small-medium databases |
| **Total Indexes Created** | 26 | 26 |
| **Other Operations** | DROP VIEW, ALTER TABLE, constraints | Same |

---

## Key Differences

### 1. Index Creation Syntax

**SCHEMA_CLEANUP_SAFE.sql (Original):**
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_scheduled_at
  ON appointments(scheduled_at);
```

**SCHEMA_CLEANUP_SAFE_NO_CONCURRENT.sql (SQL Editor Compatible):**
```sql
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at
  ON appointments(scheduled_at);
```

### 2. Transaction Block Compatibility

**SCHEMA_CLEANUP_SAFE.sql:**
- ❌ Cannot run in transaction block (Supabase SQL Editor wraps all SQL in transactions)
- Error: `ERROR: 25001: CREATE INDEX CONCURRENTLY cannot run inside a transaction block`

**SCHEMA_CLEANUP_SAFE_NO_CONCURRENT.sql:**
- ✅ Compatible with transaction blocks
- Works perfectly in Supabase SQL Editor

### 3. Table Locking Behavior

**SCHEMA_CLEANUP_SAFE.sql (CONCURRENTLY):**
- Allows concurrent reads and writes during index creation
- No table locks
- Takes longer to create indexes
- Zero downtime

**SCHEMA_CLEANUP_SAFE_NO_CONCURRENT.sql:**
- Acquires `SHARE` lock on table during index creation
- Blocks writes but allows reads
- Faster index creation
- Brief downtime (typically <1 second per index for small-medium databases)

---

## Lock Duration Estimates

Based on database size (appointments table as reference):

| Rows | Estimated Lock Duration per Index | Total Lock Time (26 indexes) | Recommended Approach |
|------|-----------------------------------|------------------------------|----------------------|
| <1,000 | <100ms | <3 seconds | NO_CONCURRENT (SQL Editor) |
| 1,000-10,000 | 100-500ms | 3-15 seconds | NO_CONCURRENT (SQL Editor) |
| 10,000-100,000 | 500ms-2s | 15-60 seconds | NO_CONCURRENT (off-peak hours) |
| 100,000-1M | 2-10s | 1-5 minutes | CONCURRENT (MCP tools) |
| >1M | 10-60s | 5-30 minutes | CONCURRENT (MCP tools) |

**Note:** Lock duration depends on:
- Database size
- Server resources (CPU, RAM, disk I/O)
- Existing table load
- Complexity of index (partial indexes are faster)

---

## When to Use Each Version

### Use SCHEMA_CLEANUP_SAFE_NO_CONCURRENT.sql When:
✅ Running in Supabase SQL Editor
✅ Database has <100k rows
✅ Can run during low-traffic period (e.g., 2-6 AM)
✅ Need simple, one-click execution
✅ Development or staging environment
✅ Brief downtime is acceptable

### Use SCHEMA_CLEANUP_SAFE.sql When:
✅ Production database with high traffic
✅ Database has >100k rows
✅ Zero downtime is required
✅ Have access to psql or MCP tools
✅ Can run long-running operations (indexes may take minutes to build)

---

## Migration Path

If you've already tried `SCHEMA_CLEANUP_SAFE.sql` and got the error:

1. ✅ **Use NO_CONCURRENT version immediately**
   - Copy `SCHEMA_CLEANUP_SAFE_NO_CONCURRENT.sql` into Supabase SQL Editor
   - Run during low-traffic period
   - Expect 5-30 seconds execution time

2. ⏸️ **OR** Use MCP tools for zero downtime (advanced)
   - Run each CREATE INDEX CONCURRENTLY separately via MCP
   - See `SCHEMA_CLEANUP_EXECUTION_GUIDE.md` for batch script
   - Expect 5-60 minutes execution time depending on database size

---

## What's Identical Between Files

Both files perform these operations identically:

1. **DROP VIEW operations** (3 views):
   - `groomer_commission_earnings`
   - `inactive_customer_profiles`
   - `notification_template_stats`

2. **ALTER TABLE operations** (2 columns dropped):
   - `customer_memberships.grooms_remaining`
   - `customer_memberships.grooms_used`

3. **CHECK constraints** (8 constraints added):
   - `appointments.status`
   - `appointments.payment_status`
   - `users.role`
   - `waitlist.status`
   - `notifications_log.status`
   - `reviews.destination`
   - `pets.size`

4. **ANALYZE operations** (9 tables):
   - Updates table statistics for query planner

5. **COMMENT operations**:
   - Adds helpful documentation to tables and indexes

---

## Verification After Execution

Run this query to confirm indexes were created:

```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
  AND indexdef LIKE '%CREATE%INDEX%'
ORDER BY tablename, indexname;
```

Expected result: 26 indexes (if starting from scratch)

---

## Performance Impact

### Index Storage Overhead
- Estimated additional storage: 2-5 MB (depends on table sizes)
- Acceptable for 99% of applications

### Query Performance Improvement
Expected improvements on common queries:

| Query Type | Before | After | Improvement |
|------------|--------|-------|-------------|
| Appointment by date | Sequential scan (slow) | Index scan (fast) | 10-100x faster |
| User role filtering | Sequential scan | Index scan | 5-50x faster |
| Customer appointment history | Sequential scan | Index scan | 10-100x faster |
| Notification log filtering | Sequential scan | Index scan | 5-50x faster |

### Write Performance Impact
- Minimal (indexes are updated automatically)
- Typical overhead: 5-10% slower writes
- Acceptable trade-off for 10-100x faster reads

---

## Recommended Workflow

### For Development/Staging:
1. ✅ Use `SCHEMA_CLEANUP_SAFE_NO_CONCURRENT.sql`
2. ✅ Run directly in Supabase SQL Editor
3. ✅ Monitor query performance for 24 hours
4. ✅ Proceed to `SCHEMA_CLEANUP_RISKY.sql` if needed

### For Production:
1. ✅ **Option A:** Use `SCHEMA_CLEANUP_SAFE_NO_CONCURRENT.sql` during maintenance window (2-6 AM)
2. ✅ **Option B:** Use MCP tools with `SCHEMA_CLEANUP_SAFE.sql` for zero downtime
3. ✅ Monitor query performance for 1 week
4. ⏸️ Hold off on `SCHEMA_CLEANUP_RISKY.sql` until thoroughly validated

---

## Summary

**Bottom Line:** For most users running in Supabase SQL Editor, use `SCHEMA_CLEANUP_SAFE_NO_CONCURRENT.sql`.

**Trade-off:** Brief table locks (<1s per index) vs. zero downtime (CONCURRENTLY)

**Recommendation:**
- Small-medium databases (<100k rows): NO_CONCURRENT version is perfectly safe
- Large databases (>100k rows): Consider MCP tools for CONCURRENT execution

**Expected Outcome:**
- 26 new indexes
- 10-100x faster query performance
- 2-5 MB additional storage
- 5-30 seconds execution time (NO_CONCURRENT)
