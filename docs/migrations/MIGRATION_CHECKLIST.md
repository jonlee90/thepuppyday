# Supabase Migration Checklist

Use this checklist to track your migration progress. Check off items as you complete them.

## Pre-Migration Preparation

- [ ] Supabase project created and accessible
- [ ] Environment variables configured in `.env.local`
- [ ] Service role key stored securely (server-side only)
- [ ] Backup of current mock data (if any)
- [ ] Read `QUICK_START.md` to understand the process

## Step 1: Database Setup

### Apply Schema
- [ ] Opened Supabase SQL Editor
- [ ] Copied contents of `supabase/migrations/20241211000001_initial_schema.sql`
- [ ] Pasted into SQL Editor
- [ ] Clicked "Run"
- [ ] Received "Success. No rows returned" message

### Verify Tables Created
- [ ] Ran verification query: `SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'`
- [ ] Table count is 25+
- [ ] Checked Table Editor shows all tables

### Verify Seed Data
- [ ] Ran: `SELECT * FROM services ORDER BY display_order`
- [ ] See 2 services (Basic Grooming, Premium Grooming)
- [ ] Ran: `SELECT * FROM service_prices`
- [ ] See 8 prices (2 services × 4 sizes)
- [ ] Ran: `SELECT * FROM addons ORDER BY display_order`
- [ ] See 4 add-ons (Teeth Brushing, Pawdicure, etc.)
- [ ] Ran: `SELECT * FROM breeds ORDER BY name`
- [ ] See 7 breeds
- [ ] Ran: `SELECT * FROM loyalty_settings`
- [ ] See default_threshold = 9, is_enabled = true

### Verify RLS Policies
- [ ] Ran: `SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'`
- [ ] RLS policies exist (20+ policies)
- [ ] Checked specific policies:
  - [ ] `users`: "Users can view own profile"
  - [ ] `pets`: "Customers can view own pets"
  - [ ] `appointments`: "Customers can view own appointments"
  - [ ] `services`: "Public can read services"

### Verify Triggers
- [ ] Ran: `SELECT trigger_name FROM information_schema.triggers WHERE trigger_schema = 'public'`
- [ ] See `handle_new_user` trigger on auth.users
- [ ] See `updated_at` triggers on users, pets, appointments

## Step 2: Authentication Setup

### Create Test User
- [ ] Opened Authentication → Users in Supabase dashboard
- [ ] Clicked "Add User"
- [ ] Entered email: `test@example.com`
- [ ] Entered password: `TestPassword123!`
- [ ] Unchecked "Auto Confirm Email"
- [ ] Clicked "Create user"
- [ ] User appears in users list

### Verify User Record
- [ ] Ran: `SELECT * FROM public.users WHERE email = 'test@example.com'`
- [ ] See user record with:
  - [ ] `first_name`: "User"
  - [ ] `last_name`: ""
  - [ ] `role`: "customer"
  - [ ] `created_at`: timestamp

## Step 3: Application Configuration

### Update Environment
- [ ] Opened `.env.local`
- [ ] Changed `NEXT_PUBLIC_USE_MOCKS=true` to `NEXT_PUBLIC_USE_MOCKS=false`
- [ ] Verified all Supabase environment variables are present:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Saved file

### Restart Development Server
- [ ] Stopped current dev server (Ctrl+C)
- [ ] Ran `npm run dev`
- [ ] Server started without errors
- [ ] Saw "[Supabase] Using mock client" **NOT** in logs (should see real client)

## Step 4: Test Authentication

### Sign In Flow
- [ ] Navigated to http://localhost:3000/login
- [ ] Login page loads without errors
- [ ] Entered `test@example.com` / `TestPassword123!`
- [ ] Clicked "Sign In"
- [ ] Redirected to `/dashboard`
- [ ] No console errors in browser

### Dashboard Display
- [ ] Dashboard shows "Welcome back, User!"
- [ ] See empty states or "No appointments yet"
- [ ] Loyalty widget shows 0/9 punches
- [ ] No loading skeleton stuck
- [ ] No console errors

### Sign Out Flow
- [ ] Clicked user menu / sign out button
- [ ] Redirected to `/login`
- [ ] Attempting to access `/dashboard` redirects to `/login`

## Step 5: Test Customer Portal Pages

### Appointments Page
- [ ] Navigated to `/appointments`
- [ ] Page loads without errors
- [ ] Shows "No Appointments Yet" empty state
- [ ] "Book New" button visible
- [ ] No console errors

### Pets Page
- [ ] Navigated to `/pets`
- [ ] Page loads without errors
- [ ] Shows "No Pets Yet" empty state
- [ ] "Add Pet" button visible
- [ ] No console errors

### Loyalty Page
- [ ] Navigated to `/loyalty`
- [ ] Page loads without errors
- [ ] Shows 0/9 punch card
- [ ] "How It Works" section visible
- [ ] Stats show 0 for all values
- [ ] No console errors

### Membership Page
- [ ] Navigated to `/membership`
- [ ] Page loads without errors
- [ ] Shows 3 membership plans (Basic, Premium, Ultimate)
- [ ] Pricing displayed correctly
- [ ] Features listed for each plan
- [ ] No console errors

### Profile Page
- [ ] Navigated to `/profile`
- [ ] Page loads without errors
- [ ] Shows user email `test@example.com`
- [ ] Shows first name "User"
- [ ] Shows member since date
- [ ] Notification preferences visible
- [ ] No console errors

### Report Cards Page
- [ ] Navigated to `/report-cards`
- [ ] Page loads without errors
- [ ] Shows "No Report Cards Yet" empty state
- [ ] "Book Appointment" button visible
- [ ] No console errors

## Step 6: Test Data Creation (Optional)

### Create Test Pet
- [ ] Opened Supabase SQL Editor
- [ ] Got user ID: `SELECT id FROM public.users WHERE email = 'test@example.com'`
- [ ] Copied UUID
- [ ] Inserted test pet (see `supabase/test-queries.sql`)
- [ ] Ran insert query successfully
- [ ] Verified in Table Editor: `pets` table shows new pet

### Verify Pet Shows in Portal
- [ ] Refreshed `/pets` page
- [ ] See test pet "Buddy"
- [ ] Pet card shows breed, size, weight
- [ ] Can click on pet card

### Create Test Appointment
- [ ] Inserted test appointment using SQL (see `supabase/test-queries.sql`)
- [ ] Appointment created successfully
- [ ] Verified in Table Editor: `appointments` table shows new appointment

### Verify Appointment Shows in Portal
- [ ] Refreshed `/appointments` page
- [ ] See test appointment
- [ ] Shows service name, pet name, date/time
- [ ] Status badge visible
- [ ] No longer shows empty state

### Create Test Loyalty Punch
- [ ] Inserted loyalty record using SQL
- [ ] Created with 3 punches
- [ ] Verified in Table Editor

### Verify Loyalty Shows in Portal
- [ ] Refreshed `/loyalty` page
- [ ] Punch card shows 3/9 punches
- [ ] 3 paw stamps visible
- [ ] Progress bar at ~33%

## Step 7: Test Row Level Security

### Create Second Test User
- [ ] Created second user in Supabase Auth dashboard
- [ ] Email: `test2@example.com`
- [ ] Password: `TestPassword123!`
- [ ] User created successfully

### Verify Data Isolation
- [ ] Signed out from first account
- [ ] Signed in as `test2@example.com`
- [ ] Navigated to `/pets`
- [ ] See **empty state** (not first user's pets)
- [ ] Navigated to `/appointments`
- [ ] See **empty state** (not first user's appointments)
- [ ] RLS is working correctly!

### Verify Public Data Access
- [ ] Navigated to `/membership` (as any user or logged out)
- [ ] Can see membership plans (public data)
- [ ] This confirms public read policies work

## Step 8: Browser Console Check

### No Errors
- [ ] Opened browser DevTools (F12)
- [ ] Checked Console tab
- [ ] No red errors
- [ ] No RLS policy violation errors
- [ ] No "relation does not exist" errors

### Network Tab
- [ ] Checked Network tab
- [ ] See Supabase API calls to `https://jajbtwgbhrkvgxvvruaa.supabase.co`
- [ ] See successful responses (200 status)
- [ ] Auth calls returning session data

### Application Tab
- [ ] Checked Application → Cookies
- [ ] See Supabase auth cookies:
  - [ ] `sb-jajbtwgbhrkvgxvvruaa-auth-token`
  - [ ] Cookies have correct domain and expiry

## Step 9: Performance Check

### Page Load Times
- [ ] Dashboard loads in < 2 seconds
- [ ] Appointments page loads in < 1 second
- [ ] Pets page loads in < 1 second
- [ ] No excessive loading states

### Database Query Efficiency
- [ ] Opened Supabase Dashboard → Logs → API
- [ ] Checked recent queries
- [ ] Queries using indexes (fast execution)
- [ ] No N+1 query issues

## Step 10: Final Verification

### All Pages Accessible
- [ ] `/dashboard` ✓
- [ ] `/appointments` ✓
- [ ] `/pets` ✓
- [ ] `/loyalty` ✓
- [ ] `/membership` ✓
- [ ] `/profile` ✓
- [ ] `/report-cards` ✓

### All Features Working
- [ ] Sign in ✓
- [ ] Sign out ✓
- [ ] View user profile ✓
- [ ] View empty states ✓
- [ ] View test data (if created) ✓
- [ ] Navigation between pages ✓

### Security
- [ ] RLS enforced (customers see only own data) ✓
- [ ] Auth required for customer pages ✓
- [ ] Service role key not exposed client-side ✓
- [ ] Public data accessible ✓

### Documentation
- [ ] Read `README_SUPABASE_MIGRATION.md` ✓
- [ ] Reviewed `ARCHITECTURE_DIAGRAMS.md` ✓
- [ ] Familiar with `MIGRATION_GUIDE.md` ✓

## Troubleshooting Completed

If you encountered issues, check which you resolved:

- [ ] Fixed: "relation 'public.users' does not exist"
  - **Solution**: Re-ran migration SQL
- [ ] Fixed: "new row violates row-level security policy"
  - **Solution**: Verified RLS policies exist
- [ ] Fixed: Data not showing in portal
  - **Solution**: Checked browser console, verified queries
- [ ] Fixed: "Cannot read property 'id' of null"
  - **Solution**: Ensured user signed in, auth loaded
- [ ] Fixed: Infinite loading state
  - **Solution**: Checked auth initialization in layout

## Post-Migration Tasks

### Immediate
- [ ] Commit migration files to git
- [ ] Document any custom changes made
- [ ] Share migration success with team

### Short Term (Phase 4 Completion)
- [ ] Add pet edit functionality
- [ ] Add profile edit functionality
- [ ] Implement form validation (Zod)
- [ ] Add appointment cancellation
- [ ] Add error boundaries

### Medium Term (Phase 5)
- [ ] Build admin panel
- [ ] Add appointment management
- [ ] Add customer management
- [ ] Add report card creation

### Long Term
- [ ] Integrate booking system (Phase 3)
- [ ] Add Stripe payments (Phase 6)
- [ ] Implement notifications (Phase 7)
- [ ] Production deployment

## Success Criteria

All of the following must be true:

- ✅ Database schema applied successfully
- ✅ All 25+ tables created
- ✅ RLS policies enabled and working
- ✅ Seed data inserted (services, breeds, add-ons)
- ✅ Test user can sign in
- ✅ All customer portal pages accessible
- ✅ No console errors
- ✅ RLS preventing unauthorized data access
- ✅ Performance is acceptable
- ✅ Documentation reviewed

## Migration Complete! 🎉

Date completed: _______________

Notes:
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________

Next steps:
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________

## Additional Resources

- **Quick Start**: `QUICK_START.md`
- **Full Guide**: `MIGRATION_GUIDE.md`
- **Technical Docs**: `PHASE_4_SUPABASE_INTEGRATION.md`
- **Test Queries**: `supabase/test-queries.sql`
- **Diagrams**: `ARCHITECTURE_DIAGRAMS.md`

---

**Version**: 1.0
**Last Updated**: December 11, 2024
**Project**: The Puppy Day - Phase 4 Customer Portal
