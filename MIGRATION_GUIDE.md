# Database Migration Guide - Phase 4 Customer Portal

This guide will help you migrate from mock services to the real Supabase database for Phase 4 (Customer Portal).

## Prerequisites

- Supabase project created
- Environment variables configured in `.env.local`
- Service role key available (for admin operations)

## Step 1: Apply Database Schema

### Option A: Using Supabase Dashboard (Recommended)

1. **Open Supabase SQL Editor**
   - Navigate to https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]
   - Click on "SQL Editor" in the left sidebar

2. **Run the Migration**
   - Copy the entire contents of `supabase/migrations/20241211000001_initial_schema.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute

3. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see all tables listed (users, pets, appointments, etc.)

### Option B: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Initialize Supabase (if not already done)
npx supabase init

# Link to your remote project
npx supabase link --project-ref [YOUR_PROJECT_REF]

# Apply migration
npx supabase db push
```

## Step 2: Verify Database Schema

After applying the migration, verify these key tables exist:

### Core Tables
- ✅ `users` - User accounts
- ✅ `pets` - Customer pets
- ✅ `breeds` - Dog breeds
- ✅ `services` - Grooming services
- ✅ `service_prices` - Size-based pricing
- ✅ `addons` - Add-on services
- ✅ `appointments` - Booking records
- ✅ `appointment_addons` - Junction table
- ✅ `waitlist` - Waitlist entries
- ✅ `report_cards` - Grooming reports

### Membership & Loyalty Tables
- ✅ `memberships` - Membership plans
- ✅ `customer_memberships` - Active subscriptions
- ✅ `loyalty_settings` - Punch card config
- ✅ `customer_loyalty` - Customer punch card records
- ✅ `loyalty_punches` - Individual punches
- ✅ `loyalty_redemptions` - Free wash tracking

### Administrative Tables
- ✅ `customer_flags` - Customer warnings
- ✅ `payments` - Payment records
- ✅ `notifications_log` - Notification history

### CMS Tables
- ✅ `site_content` - CMS content
- ✅ `gallery_images` - Photo gallery
- ✅ `before_after_pairs` - Before/after photos
- ✅ `promo_banners` - Promotional banners
- ✅ `settings` - App settings

## Step 3: Verify RLS Policies

Check that Row Level Security policies are active:

```sql
-- Run this in SQL Editor to verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should have `rowsecurity = true`.

## Step 4: Verify Seed Data

The migration includes default data. Verify it was inserted:

```sql
-- Check services
SELECT name, description FROM public.services ORDER BY display_order;

-- Check service prices
SELECT s.name, sp.size, sp.price
FROM public.service_prices sp
JOIN public.services s ON s.id = sp.service_id
ORDER BY s.name, sp.size;

-- Check addons
SELECT name, price FROM public.addons ORDER BY display_order;

-- Check breeds
SELECT name, grooming_frequency_weeks FROM public.breeds ORDER BY name;

-- Check loyalty settings
SELECT default_threshold, is_enabled FROM public.loyalty_settings;
```

Expected results:
- **Services**: Basic Grooming, Premium Grooming
- **Prices**: 4 sizes per service (small, medium, large, xlarge)
- **Addons**: Teeth Brushing, Pawdicure, Flea & Tick Treatment, Long Hair/Sporting
- **Breeds**: 7 common breeds
- **Loyalty Settings**: threshold = 9, enabled = true

## Step 5: Create Test User

Create a test customer account to verify authentication:

### Using Supabase Dashboard

1. Go to "Authentication" → "Users"
2. Click "Add User"
3. Fill in:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Confirm via email: **Disabled** (for testing)

The `handle_new_user()` trigger will automatically create a record in `public.users`.

### Using SQL

```sql
-- This will trigger the handle_new_user() function
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('TestPassword123!', gen_salt('bf')),
  NOW(),
  '{"first_name": "Test", "last_name": "Customer", "role": "customer"}'::jsonb,
  NOW(),
  NOW()
);
```

## Step 6: Disable Mock Services

Update your `.env.local` file:

```bash
# Change from true to false
NEXT_PUBLIC_USE_MOCKS=false
```

## Step 7: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## Step 8: Test Customer Portal

### Test Authentication

1. Navigate to http://localhost:3000/login
2. Sign in with your test account
3. Verify redirect to `/dashboard`

### Test Customer Portal Pages

Visit each page and verify data loads correctly:

- ✅ `/dashboard` - Shows welcome message, no appointments yet
- ✅ `/appointments` - Shows "No Appointments Yet" empty state
- ✅ `/pets` - Shows "No Pets Yet" empty state
- ✅ `/loyalty` - Shows punch card (0/9 punches)
- ✅ `/membership` - Shows membership options
- ✅ `/profile` - Shows user profile data
- ✅ `/report-cards` - Shows empty state

### Create Test Data

Create a test pet:

1. Go to `/pets`
2. Click "Add Pet"
3. Fill in pet details
4. Submit form
5. Verify pet appears in list

Create a test appointment:

1. Go to `/book` (if booking widget is implemented)
2. Select your pet
3. Choose service and date/time
4. Complete booking
5. Verify appointment appears in `/appointments`

## Step 9: Verify RLS Policies Work

Test that customers can only see their own data:

1. Create a second test user
2. Sign in as the second user
3. Verify you cannot see the first user's pets or appointments
4. Create some data for the second user
5. Sign in as the first user again
6. Verify you cannot see the second user's data

## Troubleshooting

### Error: "relation 'public.users' does not exist"

The migration didn't run successfully. Re-run the SQL in the SQL Editor.

### Error: "null value in column 'first_name' violates not-null constraint"

The auth trigger isn't working. Check that metadata is being passed during signup:

```javascript
// In your signup form
const { data, error } = await supabase.auth.signUp({
  email: data.email,
  password: data.password,
  options: {
    data: {
      first_name: data.firstName,
      last_name: data.lastName,
      role: 'customer'
    }
  }
});
```

### Error: "new row violates row-level security policy"

RLS policies are blocking the operation. Check:

1. User is authenticated: `await supabase.auth.getUser()`
2. User has correct role in `public.users`
3. RLS policy exists for the operation

### Data Not Showing in Customer Portal

Check the browser console for errors. Common issues:

1. **Auth not initialized**: Wait for `useAuth` hook to finish loading
2. **RLS policy blocking**: User doesn't have permission
3. **Query error**: Check column names match database schema

### "Cannot read property 'id' of null"

The user object is null. Ensure:

1. User is signed in
2. `public.users` record exists (check with `SELECT * FROM public.users WHERE id = '[USER_ID]'`)
3. Auth state is loaded before rendering protected pages

## Verification Checklist

Before considering migration complete:

- [ ] All tables created in Supabase
- [ ] RLS enabled on all tables
- [ ] Seed data inserted (services, breeds, addons)
- [ ] Test user can sign in
- [ ] Test user can sign out
- [ ] Dashboard loads without errors
- [ ] Pets page shows empty state or user's pets
- [ ] Appointments page shows empty state or user's appointments
- [ ] Loyalty page shows punch card
- [ ] Profile page shows user data
- [ ] Customer can only see their own data (RLS working)
- [ ] No console errors in browser
- [ ] No 500 errors from API routes

## Next Steps

After successful migration:

1. **Phase 3**: Wire up booking system to create real appointments
2. **Phase 4**: Complete customer portal with edit/delete functionality
3. **Phase 5**: Build admin panel
4. **Phase 6**: Add payment processing with Stripe
5. **Phase 7**: Implement email/SMS notifications

## Support

If you encounter issues:

1. Check Supabase logs: Dashboard → Logs → API
2. Check browser console for client-side errors
3. Verify environment variables are correct
4. Test Supabase connection with a simple query:
   ```javascript
   const { data, error } = await supabase.from('services').select('*');
   console.log('Services:', data, error);
   ```

## Database Schema Diagram

```
users (auth) ──┐
               ├──> pets ──┐
               │           ├──> appointments ──┐
               │           │                   ├──> report_cards
               │           │                   ├──> appointment_addons
               │           │                   └──> payments
               │           └──> waitlist
               │
               ├──> customer_loyalty ──┐
               │                       ├──> loyalty_punches
               │                       └──> loyalty_redemptions
               │
               └──> customer_memberships
```

## Important Notes

- **Backup**: Always backup your Supabase project before running migrations
- **Testing**: Test thoroughly in development before deploying to production
- **RLS**: Never disable RLS in production - it's your security layer
- **Service Role Key**: Keep SUPABASE_SERVICE_ROLE_KEY secret - it bypasses RLS
- **Migrations**: Keep migration files in version control for reproducibility
