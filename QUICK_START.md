# Quick Start: Connect Phase 4 to Supabase

This is a streamlined guide to get your Customer Portal connected to Supabase in 5 minutes.

## Prerequisites

- [x] Supabase project created
- [x] `.env.local` configured with Supabase credentials

## Step 1: Apply Database Schema (2 minutes)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `jajbtwgbhrkvgxvvruaa`

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Run Migration**
   - Open: `C:\Users\Jon\Documents\claude projects\thepuppyday\supabase\migrations\20241211000001_initial_schema.sql`
   - Copy entire contents (Ctrl+A, Ctrl+C)
   - Paste into SQL Editor
   - Click "Run" (bottom right)
   - Wait for "Success. No rows returned" message

## Step 2: Verify Schema (1 minute)

Run this in SQL Editor:

```sql
-- Should show 25+ tables
SELECT COUNT(*) as table_count
FROM pg_tables
WHERE schemaname = 'public';

-- Should show services and prices
SELECT s.name, sp.size, sp.price
FROM service_prices sp
JOIN services s ON s.id = sp.service_id
ORDER BY s.name, sp.size;
```

Expected output:
- table_count: 25+
- 8 rows of service prices (2 services × 4 sizes)

## Step 3: Create Test User (1 minute)

1. **Go to Authentication**
   - Click "Authentication" in left sidebar
   - Click "Users" tab
   - Click "Add User" button

2. **Fill Form**
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Uncheck "Auto Confirm Email"
   - Click "Create user"

3. **Verify User Created**
   Run in SQL Editor:
   ```sql
   SELECT id, email, first_name, last_name, role
   FROM public.users
   WHERE email = 'test@example.com';
   ```

   Should show:
   - first_name: "User"
   - last_name: ""
   - role: "customer"

## Step 4: Disable Mocks (30 seconds)

Edit `.env.local`:

```bash
# Change this line:
NEXT_PUBLIC_USE_MOCKS=true

# To this:
NEXT_PUBLIC_USE_MOCKS=false
```

## Step 5: Restart Dev Server (30 seconds)

```bash
# Stop current server (Ctrl+C)
# Start fresh
npm run dev
```

## Step 6: Test Customer Portal (1 minute)

1. **Go to Login**
   - Navigate to http://localhost:3000/login

2. **Sign In**
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Click "Sign In"

3. **Verify Redirect**
   - Should redirect to `/dashboard`
   - Should see: "Welcome back, User!"

4. **Test Each Page**
   - [ ] Dashboard - Shows "No appointments yet"
   - [ ] Appointments (`/appointments`) - Shows empty state
   - [ ] Pets (`/pets`) - Shows empty state
   - [ ] Loyalty (`/loyalty`) - Shows 0/9 punch card
   - [ ] Membership (`/membership`) - Shows 3 membership plans
   - [ ] Profile (`/profile`) - Shows test@example.com
   - [ ] Report Cards (`/report-cards`) - Shows empty state

## Troubleshooting

### "relation 'public.users' does not exist"
- Migration didn't run. Go back to Step 1.

### "Invalid login credentials"
- User not created. Go back to Step 3.
- Or check password is correct.

### Empty dashboard but no errors
- Check browser console (F12)
- Verify user is authenticated: Check for Supabase auth cookie
- Run this in SQL Editor:
  ```sql
  SELECT * FROM public.users WHERE email = 'test@example.com';
  ```

### Data not showing
- RLS policies blocking. Verify policies created:
  ```sql
  SELECT tablename, policyname
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename;
  ```

## Create Test Data (Optional)

To test with sample data, run this in SQL Editor:

```sql
-- Get your user ID first
SELECT id FROM public.users WHERE email = 'test@example.com';
-- Copy the UUID

-- Create a test pet (replace USER_ID)
INSERT INTO public.pets (owner_id, name, breed_custom, size, weight_lbs, gender)
VALUES (
  'YOUR_USER_ID_HERE',
  'Buddy',
  'Golden Retriever',
  'large',
  65.5,
  'male'
);

-- Create a test appointment (replace USER_ID)
INSERT INTO public.appointments (
  customer_id,
  pet_id,
  service_id,
  scheduled_at,
  duration_minutes,
  status,
  total_price
)
SELECT
  'YOUR_USER_ID_HERE',
  p.id,
  s.id,
  NOW() + INTERVAL '3 days',
  90,
  'confirmed',
  70.00
FROM public.pets p
CROSS JOIN public.services s
WHERE p.owner_id = 'YOUR_USER_ID_HERE'
  AND s.name = 'Basic Grooming'
LIMIT 1;

-- Create loyalty record
INSERT INTO public.customer_loyalty (customer_id, current_punches, total_visits)
VALUES ('YOUR_USER_ID_HERE', 3, 3);
```

Now refresh dashboard to see:
- 1 upcoming appointment
- 1 pet in "Your Pets"
- 3/9 punches on loyalty card

## Success Criteria

You're done when:
- [x] All 25+ tables created in Supabase
- [x] Test user can sign in
- [x] Dashboard loads without errors
- [x] All customer pages accessible
- [x] No console errors in browser
- [x] RLS policies working (user only sees their data)

## Next Steps

See `PHASE_4_SUPABASE_INTEGRATION.md` for:
- Complete RLS policy documentation
- Advanced testing procedures
- Performance optimization tips
- Phase 5 (Admin Panel) preparation

## Files Reference

- **Migration SQL**: `supabase/migrations/20241211000001_initial_schema.sql`
- **Test Queries**: `supabase/test-queries.sql`
- **Full Guide**: `MIGRATION_GUIDE.md`
- **Integration Summary**: `PHASE_4_SUPABASE_INTEGRATION.md`

## Support

If stuck:
1. Check browser console (F12)
2. Check Supabase logs: Dashboard → Logs → API
3. Run test queries: `supabase/test-queries.sql`
4. Verify environment variables: `.env.local`

---

**Total Time: ~5 minutes**

Enjoy your fully connected Customer Portal! 🎉
