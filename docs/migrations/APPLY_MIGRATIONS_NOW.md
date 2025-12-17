# Apply Phase 6 Migrations - Quick Reference Card

## 🚀 Ready to Apply!

All 7 migration files are created and ready. Choose your preferred method below.

---

## Method 1: Supabase CLI (Recommended)

```bash
# 1. Navigate to project directory
cd "C:\Users\Jon\Documents\claude projects\thepuppyday"

# 2. Apply all migrations
supabase db push

# 3. Verify success
psql -f scripts/verify-phase6-migrations.sql
```

**Time**: ~2 minutes

---

## Method 2: Supabase Dashboard (Manual)

1. Go to: https://app.supabase.com/project/YOUR-PROJECT/sql
2. Run these files **in order**:

```
✅ 1. 20241213_phase6_reviews_table.sql
✅ 2. 20241213_phase6_marketing_campaigns_tables.sql
✅ 3. 20241213_phase6_analytics_cache_table.sql
✅ 4. 20241213_phase6_waitlist_marketing_tables.sql
✅ 5. 20241213_phase6_report_cards_enhancements.sql
✅ 6. 20241213_phase6_waitlist_enhancements.sql
✅ 7. 20241213_phase6_notifications_log_enhancements.sql
```

For each file:
- Copy contents from `supabase/migrations/[filename]`
- Paste into SQL Editor
- Click "Run"
- Wait for "Success" confirmation

**Time**: ~10 minutes

---

## Method 3: Using Mock Database Only

If using `NEXT_PUBLIC_USE_MOCKS=true`, skip Supabase and update:

1. `src/mocks/supabase/seed.ts` - Add seed data
2. `src/mocks/supabase/client.ts` - Handle new tables

**Time**: ~30 minutes

---

## ✅ Verification Checklist

After applying migrations:

```sql
-- Run this in Supabase SQL Editor or psql:

-- Check new tables (should return 6 rows)
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'reviews',
  'marketing_campaigns',
  'campaign_sends',
  'analytics_cache',
  'waitlist_slot_offers',
  'marketing_unsubscribes'
);

-- Check new functions (should return 9 rows)
SELECT COUNT(*) FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'increment_report_card_views',
  'is_report_card_expired',
  'cleanup_expired_analytics_cache',
  'get_matching_waitlist_entries',
  'expire_old_waitlist_offers',
  'track_notification_click',
  'track_notification_delivery',
  'get_notification_metrics',
  'get_campaign_metrics'
);
```

**Expected Results:**
- ✅ 6 new tables
- ✅ 9 new functions
- ✅ No errors

---

## 🔧 Quick Test

Test basic operations:

```sql
-- Test reviews table (should work)
SELECT * FROM reviews LIMIT 1;

-- Test marketing_campaigns table (should work)
SELECT * FROM marketing_campaigns LIMIT 1;

-- Test function (should return count)
SELECT get_matching_waitlist_entries(
  'service-uuid-here'::uuid,
  CURRENT_DATE,
  10
);
```

---

## 📊 What Gets Created

| Category | Count | Details |
|----------|-------|---------|
| New Tables | 6 | reviews, marketing_campaigns, campaign_sends, analytics_cache, waitlist_slot_offers, marketing_unsubscribes |
| Modified Tables | 3 | report_cards (+8 cols), waitlist (+4 cols), notifications_log (+6 cols) |
| New Functions | 9 | View tracking, matching, metrics, expiration |
| RLS Policies | 47 | Security for all new tables |
| Indexes | 29 | Performance optimization |

---

## ⚠️ Before You Start

**1. Backup Database**
```bash
supabase db dump -f backup-before-phase6.sql
```

**2. Check Environment**
```bash
# Development
NEXT_PUBLIC_USE_MOCKS=true

# Production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**3. Verify Connection**
```bash
supabase status
```

---

## 🆘 Troubleshooting

### Error: "function update_updated_at() does not exist"

**Fix:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Error: "relation does not exist"

**Fix:** You skipped a migration. Run them in order!

### Error: "column already exists"

**Fix:** Migration was partially applied. Check which columns exist and comment out those lines.

---

## 📚 Documentation

- **Full Guide**: `PHASE_6_MIGRATIONS_SUMMARY.md`
- **Quick Start**: `PHASE_6_MIGRATIONS_QUICKSTART.md`
- **Schema Diagram**: `docs/specs/phase-6/DATABASE_SCHEMA_DIAGRAM.md`
- **Verification Script**: `scripts/verify-phase6-migrations.sql`

---

## ⏱️ Time Estimates

| Method | Time | Difficulty |
|--------|------|------------|
| Supabase CLI | 2 min | Easy |
| Supabase Dashboard | 10 min | Medium |
| Mock Setup | 30 min | Medium |

---

## 🎯 After Migration

1. ✅ Run verification script
2. ✅ Test basic queries
3. ✅ Update TypeScript types (Task 1.2)
4. ✅ Update mock seed data (if applicable)
5. ✅ Begin Phase 6 implementation

---

## 📝 Migration Files Location

```
C:\Users\Jon\Documents\claude projects\thepuppyday\supabase\migrations\

20241213_phase6_reviews_table.sql                     (3.2 KB)
20241213_phase6_marketing_campaigns_tables.sql        (5.8 KB)
20241213_phase6_analytics_cache_table.sql             (2.1 KB)
20241213_phase6_waitlist_marketing_tables.sql         (4.9 KB)
20241213_phase6_report_cards_enhancements.sql         (2.8 KB)
20241213_phase6_waitlist_enhancements.sql             (2.6 KB)
20241213_phase6_notifications_log_enhancements.sql    (4.2 KB)
```

---

## 🚦 Status

- ✅ **Created**: All 7 migration files
- ✅ **Documented**: 4 comprehensive docs
- ✅ **Verified**: Script ready to test
- ⏳ **Applied**: Waiting for you!

---

## 🎬 Ready? Let's Go!

Choose your method above and apply the migrations now.

**Recommended**: Use Supabase CLI for fastest, safest application.

```bash
cd "C:\Users\Jon\Documents\claude projects\thepuppyday"
supabase db push
```

---

**Questions?** Check `PHASE_6_MIGRATIONS_SUMMARY.md` for detailed explanations.
