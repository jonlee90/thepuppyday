# Quick Start: Apply RLS Infinite Recursion Fix

## Problem
Login fails with error: `infinite recursion detected in policy for relation 'users'`

## Solution
Apply the migration that fixes RLS policies using SECURITY DEFINER functions.

---

## Step 1: Apply the Fix Migration

```bash
# Navigate to project directory
cd "C:\Users\Jon\Documents\claude projects\thepuppyday"

# Apply the migration
supabase migration up
```

Or manually run the migration file:
```bash
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20250120_fix_users_rls_infinite_recursion.sql
```

---

## Step 2: Verify the Fix

Run the test script:
```bash
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/TEST_20250120_rls_recursion_fix.sql
```

Look for:
- ✅ `PASSED: Helper functions exist`
- ✅ `PASSED: Old conflicting policies removed`
- ✅ `PASSED: All new policies created`
- ✅ `PASSED: RLS enabled on users table`

---

## Step 3: Test Authentication

### Test Regular User Login
```typescript
// In your app or Supabase Studio
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'jonlee213@gmail.com',
  password: 'your-password'
})

// Should succeed without error 42P17
```

### Test User Profile Query
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', user.id)
  .single()

// Should return user profile
```

### Test Admin Query (if admin)
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')

// Admins should see all users
// Regular users should only see themselves
```

---

## What Changed

### Before (BROKEN)
```sql
-- This caused infinite recursion
CREATE POLICY "Admins can view all users"
USING (
  EXISTS (
    SELECT 1 FROM users u  -- ⚠️ Queries users table
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);
```

### After (FIXED)
```sql
-- Helper function (runs with SECURITY DEFINER)
CREATE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ SECURITY DEFINER;

-- Policy uses function (no recursion)
CREATE POLICY "users_select_admin"
USING (public.is_admin());  -- ✅ No recursion!
```

---

## Troubleshooting

### Migration Fails
```bash
# Check for syntax errors
psql -h your-db-host -U postgres -d postgres -c "\i supabase/migrations/20250120_fix_users_rls_infinite_recursion.sql"

# Check existing policies
psql -h your-db-host -U postgres -d postgres -c "SELECT * FROM pg_policies WHERE tablename = 'users';"
```

### Still Getting Error 42P17
1. Verify migration applied successfully
2. Check that `is_admin()` function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'is_admin';
   ```
3. Verify old policies are removed:
   ```sql
   SELECT policyname FROM pg_policies
   WHERE tablename = 'users'
   AND policyname LIKE '%Admins%';
   ```

### Login Still Fails
1. Check Supabase logs for errors
2. Verify RLS is enabled:
   ```sql
   SELECT relname, relrowsecurity
   FROM pg_class
   WHERE relname = 'users';
   ```
3. Test function directly:
   ```sql
   SELECT public.is_admin();
   ```

---

## Files Created

1. **Migration**: `supabase/migrations/20250120_fix_users_rls_infinite_recursion.sql`
2. **Test Script**: `supabase/migrations/TEST_20250120_rls_recursion_fix.sql`
3. **Review Doc**: `docs/reviews/users-rls-infinite-recursion-fix.md`

---

## Need More Info?

See the full review document: `docs/reviews/users-rls-infinite-recursion-fix.md`
