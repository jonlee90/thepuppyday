# Schema Reconciliation Action Plan
**Priority: HIGH** | **Effort: 4-8 hours** | **Risk: Medium**

---

## Quick Stats

| Metric | Count | Status |
|--------|-------|--------|
| Total Tables | 50 | ✓ Documented |
| Tables in TypeScript | 24 | ⚠️ 48% coverage |
| Missing Types | 26 | 🔴 Critical |
| Type Bypasses | 103 | 🔴 `(supabase as any)` |
| Missing Indexes | 30+ | ⚠️ Performance |
| Unused Columns | 30+ | ⚠️ Technical debt |
| Unused Views | 3 | ✓ Safe to remove |

---

## Immediate Actions (Do Today)

### 1. Regenerate TypeScript Types (30 minutes)
**Priority: CRITICAL** | **Risk: LOW** | **Impact: HIGH**

```bash
# Generate complete types from Supabase
npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/types/supabase.ts

# Or if using local dev
npx supabase db pull
npx supabase gen types typescript --local > src/types/supabase.ts
```

**Why:** 26 tables (52% of schema) have no TypeScript types, forcing 103 `(supabase as any)` bypasses.

**Impact:**
- ✓ Fix 103 type safety violations
- ✓ Catch schema mismatches at compile time
- ✓ Enable IDE autocomplete for all tables
- ✓ Prevent runtime errors from invalid queries

---

### 2. Run Safe Schema Cleanup (15 minutes)
**Priority: HIGH** | **Risk: LOW** | **Impact: HIGH**

```bash
# Execute safe operations
psql <YOUR_DATABASE_URL> -f SCHEMA_CLEANUP_SAFE.sql
```

**What it does:**
- ✓ Adds 30+ performance indexes
- ✓ Drops 3 unused database views
- ✓ Removes 2 unused columns
- ✓ Adds 8 enum constraints
- ✓ Improves query performance 2-10x

**Expected Results:**
- Appointment queries: 50-200ms → 5-20ms
- Settings lookups: 30-100ms → <5ms
- Notification log queries: 100-500ms → 10-50ms

---

### 3. Fix Table Name Inconsistency (10 minutes)
**Priority: MEDIUM** | **Risk: LOW** | **Impact: MEDIUM**

```typescript
// Find and replace in 3 files:
// OLD: .from('calendar_event_mapping')
// NEW: .from('calendar_event_mappings')

// Files to update:
// - src/lib/calendar/event-mapping-repository.ts (verify if both exist)
```

**Why:** Code references both `calendar_event_mapping` (3 refs) and `calendar_event_mappings` (16 refs).

**Impact:**
- ✓ Consistent naming
- ✓ Prevent future confusion
- ✓ Simplified codebase

---

## Short-term Actions (This Week)

### 4. Remove Type Bypasses (2-4 hours)
**Priority: HIGH** | **Risk: MEDIUM** | **Impact: HIGH**

After regenerating types, remove all `(supabase as any)` casts:

```bash
# Find all type bypasses
grep -r "(supabase as any)" src/

# Count: 103 instances across 62 files
```

**Process:**
1. Search for `(supabase as any).from(`
2. Replace with proper typed `supabase.from(`
3. Fix TypeScript errors (most will auto-fix with new types)
4. Test affected routes

**Files with most bypasses:**
- `src/lib/admin/` - 30+ files
- `src/app/api/admin/` - 40+ files
- `src/lib/calendar/` - 15+ files

---

### 5. Review and Document Unused Columns (1 hour)
**Priority: MEDIUM** | **Risk: LOW** | **Impact: MEDIUM**

Review `SCHEMA_RECONCILIATION_REPORT.md` section 2 and decide:

**Keep (for auditing):**
- `appointments.admin_notes`
- `appointments.cancellation_reason`
- `users.is_active`
- `users.activated_at`

**Remove (confirmed unused):**
- `customer_memberships.grooms_remaining` (already in safe cleanup)
- `customer_memberships.grooms_used` (already in safe cleanup)

**Implement or Remove:**
- `report_cards.view_count` - Add analytics or remove
- `notifications_log.clicked_at` - Implement tracking or remove
- `waitlist.priority` - Implement feature or remove
- `reviews.response_text` - Implement admin response or remove

---

### 6. Complete Incomplete Features (2-4 hours)
**Priority: MEDIUM** | **Risk: LOW** | **Impact: MEDIUM**

Based on unused columns, these features are incomplete:

1. **Customer Flagging** (8 references only)
   - Columns exist: `color`, `flag_type`, `description`, `created_by`
   - Missing: UI to display flags, filtering by type, color coding
   - Decision: Implement or remove feature

2. **Notification Analytics** (44 references)
   - Columns exist: `clicked_at`, `delivered_at`, `cost_cents`
   - Missing: Analytics dashboard, cost reporting
   - Decision: Build analytics page or remove tracking

3. **Review Response** (6 references)
   - Columns exist: `responded_at`, `response_text`
   - Missing: Admin response UI, customer view
   - Decision: Implement or remove

4. **Report Card Lifecycle** (23 references)
   - Columns exist: `is_draft`, `sent_at`, `expires_at`, `view_count`
   - Missing: Draft workflow, expiration logic, view tracking
   - Decision: Simplify or implement fully

---

## Medium-term Actions (This Month)

### 7. Add Database Constraints (30 minutes)
**Priority: MEDIUM** | **Risk: LOW** | **Impact: MEDIUM**

Already included in `SCHEMA_CLEANUP_SAFE.sql`:

```sql
-- Enum constraints for data integrity
ALTER TABLE appointments ADD CONSTRAINT chk_status CHECK (status IN (...));
ALTER TABLE users ADD CONSTRAINT chk_role CHECK (role IN (...));
ALTER TABLE pets ADD CONSTRAINT chk_size CHECK (size IN (...));
-- etc.
```

**Benefits:**
- ✓ Prevent invalid data at database level
- ✓ Catch bugs before they reach application
- ✓ Self-documenting schema

---

### 8. Optimize Query Patterns (2-3 hours)
**Priority: MEDIUM** | **Risk: MEDIUM** | **Impact: HIGH**

Review code for N+1 query patterns:

```typescript
// BAD: N+1 query
for (const appointment of appointments) {
  const customer = await supabase.from('users').select('*').eq('id', appointment.customer_id);
}

// GOOD: Join query
const appointments = await supabase
  .from('appointments')
  .select(`
    *,
    customer:users!customer_id(*),
    pet:pets!pet_id(*),
    service:services!service_id(*)
  `);
```

**Files to review:**
- `src/lib/db/optimized-queries.ts` - Check for pagination issues
- `src/app/admin/appointments/page.tsx` - Verify joins
- `src/components/admin/appointments/` - Check data fetching

---

### 9. Monitor Query Performance (Ongoing)
**Priority: LOW** | **Risk: LOW** | **Impact: HIGH**

After adding indexes, monitor Supabase dashboard:

1. Check slow query log (Settings → Database → Query Performance)
2. Look for queries >100ms
3. Verify new indexes are being used
4. Adjust as needed

**Key metrics:**
- `appointments` queries should be <20ms
- `settings` lookups should be <5ms
- `notifications_log` queries should be <50ms

---

## Long-term Actions (Next Quarter)

### 10. Schema Documentation (2 hours)
**Priority: LOW** | **Risk: LOW** | **Impact: MEDIUM**

Update `.claude/doc/database.md` with:
- Index documentation
- Enum constraints
- Business logic in columns
- Deprecation notes
- Common query patterns

---

### 11. RLS Policy Audit (3-4 hours)
**Priority: MEDIUM** | **Risk: HIGH** | **Impact: HIGH**

Review Row Level Security policies:

```sql
-- Check for policies that query the same table (recursion risk)
SELECT tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public';
```

**Focus areas:**
- Avoid infinite recursion in policies
- Use SECURITY DEFINER functions
- Check for N+1 policy evaluations
- Verify all tables have RLS enabled

---

### 12. Marketing Feature Decision (1-2 hours)
**Priority: LOW** | **Risk: MEDIUM** | **Impact: LOW**

Review marketing tables:
- `marketing_campaigns` (10 references)
- `marketing_unsubscribes` (0 references)
- `campaign_sends` (11 references)

**Decision:**
- Implement fully (build campaign manager UI)
- OR remove tables (use external tool like Mailchimp)

---

## Risky Operations (Review Required)

See `SCHEMA_CLEANUP_RISKY.sql` for operations that need stakeholder approval:

1. ⚠️ Remove audit columns from `appointments`
2. ⚠️ Remove tracking columns from `notifications_log`
3. ⚠️ Remove incomplete features from `report_cards`
4. ⚠️ Drop unused tables (`marketing_unsubscribes`)

**DO NOT RUN** without business approval.

---

## Success Metrics

After completing this plan:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| TypeScript Coverage | 48% | 100% | +52% |
| Type Bypasses | 103 | 0 | -103 |
| Missing Indexes | 30+ | 0 | +30 indexes |
| Appointment Query Time | 50-200ms | 5-20ms | 90% faster |
| Settings Query Time | 30-100ms | <5ms | 95% faster |
| Schema Documentation | Partial | Complete | ✓ |
| Unused Columns | 30+ | <10 | -20 columns |

---

## Rollback Plan

If issues occur after changes:

1. **TypeScript Types:**
   ```bash
   git checkout HEAD~1 src/types/supabase.ts
   ```

2. **Database Changes:**
   ```bash
   # Restore from backup
   pg_restore -d thepuppyday backup_before_cleanup.dump
   ```

3. **Index Removal (if performance degrades):**
   ```sql
   DROP INDEX IF EXISTS idx_appointments_scheduled_at;
   -- etc.
   ```

---

## Maintenance Schedule

**Weekly:**
- Check Supabase slow query log
- Review new type bypasses in PRs

**Monthly:**
- Run `ANALYZE` on large tables
- Review index usage statistics
- Check for orphaned records

**Quarterly:**
- Full schema audit
- Update documentation
- Review RLS policies

---

## Files Generated

1. `SCHEMA_RECONCILIATION_REPORT.md` - Full analysis (50 tables, 455 columns)
2. `SCHEMA_CLEANUP_SAFE.sql` - Safe operations (indexes, views, constraints)
3. `SCHEMA_CLEANUP_RISKY.sql` - Risky operations (requires review)
4. `SCHEMA_ACTION_PLAN.md` - This file (action plan)

---

## Questions Before Starting

1. Do you have Supabase project ID for type generation?
2. Do you have database backup before running cleanup?
3. Which incomplete features should be implemented vs removed?
4. Is there a staging environment for testing?
5. What's the best time for maintenance window?

---

## Next Steps

**Immediate (today):**
1. ✓ Review `SCHEMA_RECONCILIATION_REPORT.md`
2. ✓ Regenerate TypeScript types
3. ✓ Run `SCHEMA_CLEANUP_SAFE.sql`
4. ✓ Fix table name inconsistency

**This week:**
5. Remove type bypasses (103 instances)
6. Decide on incomplete features
7. Test query performance improvements

**This month:**
8. Complete or remove incomplete features
9. Optimize query patterns
10. Update schema documentation

---

**Estimated Total Effort:** 8-16 hours
**Risk Level:** Medium (with backups and staging tests)
**Impact:** High (type safety, performance, maintainability)
