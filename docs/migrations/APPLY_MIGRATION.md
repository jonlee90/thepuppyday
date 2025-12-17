# Quick Migration Guide - Services Table Fix

## Option 1: Supabase CLI (Recommended)

```bash
# Make sure you're in the project directory
cd "C:\Users\Jon\Documents\claude projects\thepuppyday"

# Link to your Supabase project (if not already linked)
npx supabase link --project-ref jajbtwgbhrkvgxvvruaa

# Apply all pending migrations
npx supabase db push

# Or apply specific migration
npx supabase db push --include 20241212_services_rls_and_fixes
```

## Option 2: Supabase Dashboard (Web UI)

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/jajbtwgbhrkvgxvvruaa

2. Navigate to: **SQL Editor**

3. Click: **New Query**

4. Copy and paste the entire contents of:
   `supabase/migrations/20241212_services_rls_and_fixes.sql`

5. Click: **Run** (or press Ctrl+Enter)

6. Verify output shows success messages

## Option 3: Direct SQL Connection

```bash
# Get connection string from Supabase Dashboard > Settings > Database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.jajbtwgbhrkvgxvvruaa.supabase.co:5432/postgres" -f supabase/migrations/20241212_services_rls_and_fixes.sql
```

## Verify Migration Success

After applying, run this query in SQL Editor:

```sql
-- Check services table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'services'
ORDER BY ordinal_position;

-- Should show: id, name, description, image_url, duration_minutes, is_active, display_order, created_at, updated_at

-- Check service_prices table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'service_prices'
ORDER BY ordinal_position;

-- Should show: id, service_id, size, price, created_at, updated_at

-- Check RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('services', 'service_prices');

-- Should show multiple policies for each table
```

## Expected Results

✅ `services.updated_at` column exists
✅ `service_prices.created_at` column exists
✅ `service_prices.updated_at` column exists
✅ RLS enabled on both tables
✅ At least 3 policies on services table
✅ At least 2 policies on service_prices table

## Test CRUD Operations

After migration, test the admin panel:

```bash
# Start dev server
npm run dev

# Open browser
http://localhost:3000/admin/services

# Try creating, editing, and deleting services
```

## Rollback (If Needed)

If something goes wrong, you can rollback by dropping the columns:

```sql
-- WARNING: This will remove the columns and their data!
ALTER TABLE public.services DROP COLUMN IF EXISTS updated_at;
ALTER TABLE public.service_prices DROP COLUMN IF EXISTS created_at;
ALTER TABLE public.service_prices DROP COLUMN IF EXISTS updated_at;

-- Disable RLS
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_prices DISABLE ROW LEVEL SECURITY;

-- Drop policies
DROP POLICY IF EXISTS "Public read access for active services" ON public.services;
DROP POLICY IF EXISTS "Staff can view all services" ON public.services;
DROP POLICY IF EXISTS "Admin full access to services" ON public.services;
DROP POLICY IF EXISTS "Public read access for service prices" ON public.service_prices;
DROP POLICY IF EXISTS "Admin full access to service prices" ON public.service_prices;
```

## Troubleshooting

### Error: "relation does not exist"
- Run the initial schema migration first: `20241211000001_initial_schema.sql`

### Error: "permission denied"
- Make sure you're using an admin account or service role key

### Error: "column already exists"
- Migration is idempotent and safe to re-run
- The DO blocks check for existence before adding columns

## Next Steps

After successful migration:
1. Verify TypeScript types match (already updated in `src/types/database.ts`)
2. Test all CRUD operations in admin panel
3. Run automated API tests: `node scripts/test-services-api.mjs`
4. Check that booking widget can still read services
