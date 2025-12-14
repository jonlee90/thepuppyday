# Authentication System Testing Guide

## Overview
This guide provides step-by-step instructions to test all authentication functionalities in The Puppy Day application.

## Environment Setup

### Mock Mode Testing (Development)
Set in `.env.local`:
```env
NEXT_PUBLIC_USE_MOCKS=true
```

### Real Supabase Testing (Production-Ready)
Set in `.env.local`:
```env
NEXT_PUBLIC_USE_MOCKS=false
NEXT_PUBLIC_SUPABASE_URL=https://jajbtwgbhrkvgxvvruaa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

## Pre-Testing Checklist

### For Real Supabase (Required Before Testing)
1. Run database migrations:
   ```bash
   # Apply user creation trigger
   npx supabase migration up 20241211_create_user_on_signup.sql

   # Apply RLS policies
   npx supabase migration up 20241211_users_rls_policies.sql
   ```

2. Verify migrations in Supabase Dashboard:
   - Check that `handle_new_user()` function exists
   - Verify RLS policies are enabled on `users` table
   - Confirm trigger `on_auth_user_created` exists

## Test Scenarios

### 1. User Registration (`/register`)

#### Test Case 1.1: Successful Registration
**Steps:**
1. Navigate to `/register`
2. Fill in the form:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john.doe@example.com`
   - Phone: `+1 (555) 123-4567` (optional)
   - Password: `Password123`
   - Confirm Password: `Password123`
3. Click "Create Account"

**Expected Result:**
- ✅ User is created in `auth.users` table
- ✅ User record is created in `public.users` table with:
  - Matching ID from auth.users
  - Role set to 'customer'
  - First name, last name, email, phone populated
- ✅ User is automatically logged in
- ✅ Redirect to `/dashboard`
- ✅ Session cookie is set

#### Test Case 1.2: Validation Errors
**Steps:**
1. Navigate to `/register`
2. Try each invalid input:
   - Empty email → Shows "Email is required"
   - Invalid email format → Shows "Please enter a valid email address"
   - Password < 8 chars → Shows "Password must be at least 8 characters"
   - Password without uppercase → Shows password requirements error
   - Password without number → Shows password requirements error
   - Non-matching passwords → Shows "Passwords do not match"

**Expected Result:**
- ✅ Inline validation errors appear below each field
- ✅ Form submission is blocked
- ✅ Error messages are clear and helpful

#### Test Case 1.3: Duplicate Email
**Steps:**
1. Register with `john.doe@example.com`
2. Log out
3. Try to register again with same email

**Expected Result:**
- ✅ Shows error: "User already exists"
- ✅ Form is not submitted
- ✅ User stays on registration page

### 2. User Login (`/login`)

#### Test Case 2.1: Successful Login
**Steps:**
1. Navigate to `/login`
2. Enter credentials:
   - Email: `demo@example.com`
   - Password: `Password123` (any password in mock mode)
3. Click "Sign In"

**Expected Result:**
- ✅ User data is fetched from `public.users`
- ✅ Auth state is updated in Zustand store
- ✅ User is redirected to `/dashboard`
- ✅ Session persists on page refresh

#### Test Case 2.2: Login with Return URL
**Steps:**
1. While logged out, navigate to `/dashboard`
2. Middleware redirects to `/login?returnTo=/dashboard`
3. Log in with valid credentials

**Expected Result:**
- ✅ After login, user is redirected to `/dashboard` (not just `/dashboard`)
- ✅ Return URL is respected

#### Test Case 2.3: Invalid Credentials
**Steps:**
1. Navigate to `/login`
2. Enter:
   - Email: `wrong@example.com`
   - Password: `wrongpassword`
3. Click "Sign In"

**Expected Result:**
- ✅ Error message displayed: "Invalid login credentials"
- ✅ Form is not cleared
- ✅ User stays on login page

#### Test Case 2.4: Validation Errors
**Steps:**
1. Navigate to `/login`
2. Try:
   - Empty email → Shows "Email is required"
   - Invalid email format → Shows "Please enter a valid email address"
   - Empty password → Shows "Password is required"

**Expected Result:**
- ✅ Inline validation errors appear
- ✅ Submit button is disabled until valid

### 3. Password Reset (`/forgot-password`)

#### Test Case 3.1: Request Password Reset
**Steps:**
1. Navigate to `/forgot-password`
2. Enter email: `demo@example.com`
3. Click "Send Reset Link"

**Expected Result (Mock Mode):**
- ✅ Success message: "Check Your Email"
- ✅ Console log shows email would be sent
- ✅ User can navigate back to login

**Expected Result (Real Supabase):**
- ✅ Success message: "Check Your Email"
- ✅ Email is sent to user with reset link
- ✅ Reset link points to `/reset-password` with token

#### Test Case 3.2: Complete Password Reset
**Steps (Real Supabase only):**
1. Request password reset for your email
2. Open email and click reset link
3. Redirected to `/reset-password` with token
4. Enter new password:
   - Password: `NewPassword456`
   - Confirm Password: `NewPassword456`
5. Click "Reset Password"

**Expected Result:**
- ✅ Success message: "Password Reset Successful!"
- ✅ Auto-redirect to `/login` after 2 seconds
- ✅ Can log in with new password
- ✅ Old password no longer works

#### Test Case 3.3: Invalid/Expired Reset Token
**Steps:**
1. Navigate to `/reset-password` directly (without email link)

**Expected Result:**
- ✅ Error message: "Invalid or expired reset link"
- ✅ Button to request new reset link
- ✅ Cannot submit new password

### 4. Session Management

#### Test Case 4.1: Session Persistence
**Steps:**
1. Log in successfully
2. Refresh the page
3. Close browser and reopen
4. Navigate to protected route

**Expected Result:**
- ✅ User remains logged in after refresh
- ✅ User data is loaded from session
- ✅ No redirect to login

#### Test Case 4.2: Logout
**Steps:**
1. While logged in, click logout button (in dashboard)
2. Check auth state

**Expected Result:**
- ✅ User is redirected to `/login`
- ✅ Session is cleared
- ✅ Attempting to access `/dashboard` redirects to login
- ✅ Zustand store is cleared

### 5. Middleware Protection

#### Test Case 5.1: Protected Routes (Unauthenticated)
**Steps:**
1. Log out completely
2. Try to navigate to:
   - `/dashboard`
   - `/appointments`
   - `/pets`
   - `/profile`
   - `/admin`

**Expected Result:**
- ✅ All routes redirect to `/login?returnTo=<route>`
- ✅ User cannot access protected content

#### Test Case 5.2: Protected Routes (Authenticated)
**Steps:**
1. Log in as customer
2. Navigate to customer routes:
   - `/dashboard` ✅
   - `/appointments` ✅
   - `/pets` ✅

**Expected Result:**
- ✅ All customer routes are accessible

#### Test Case 5.3: Admin Route Protection
**Steps:**
1. Log in as customer (role: 'customer')
2. Try to navigate to `/admin`

**Expected Result:**
- ✅ Redirected to `/dashboard`
- ✅ Admin content is not accessible

**Steps (Admin Access):**
1. Log in as admin:
   - Email: `admin@thepuppyday.com`
   - Password: any (in mock mode)
2. Navigate to `/admin`

**Expected Result:**
- ✅ Admin dashboard is accessible
- ✅ Admin can view all users/appointments

#### Test Case 5.4: Auth Page Access (Logged In)
**Steps:**
1. Log in successfully
2. Try to navigate to:
   - `/login`
   - `/register`
   - `/forgot-password`

**Expected Result:**
- ✅ Automatically redirected to `/dashboard`
- ✅ Cannot access auth pages while logged in

### 6. Real Supabase Integration

#### Test Case 6.1: Database Trigger Verification
**Steps:**
1. Set `NEXT_PUBLIC_USE_MOCKS=false`
2. Register a new user via `/register`
3. Check Supabase Dashboard:
   - Navigate to Authentication > Users
   - Navigate to Table Editor > users

**Expected Result:**
- ✅ User appears in `auth.users` table
- ✅ User appears in `public.users` table with matching ID
- ✅ All metadata (first_name, last_name, phone) is populated
- ✅ User role is set to 'customer'

#### Test Case 6.2: RLS Policy Verification
**Steps:**
1. Log in as user A
2. Open browser DevTools > Network
3. Make API call to fetch users:
   ```js
   const { data } = await supabase.from('users').select('*')
   ```

**Expected Result:**
- ✅ User A can only see their own profile
- ✅ Other users' data is not returned
- ✅ RLS policies are enforced

**Steps (Admin):**
1. Log in as admin
2. Make same API call

**Expected Result:**
- ✅ Admin can see all users
- ✅ Full access is granted

## Mock Data Available for Testing

### Pre-seeded Users (Mock Mode)
```
Admin User:
- Email: admin@thepuppyday.com
- Password: <any>
- Role: admin

Demo Customer:
- Email: demo@example.com
- Password: <any>
- Role: customer

Sarah Johnson:
- Email: sarah@example.com
- Password: <any>
- Role: customer
```

## Common Issues & Solutions

### Issue 1: "User already exists" on registration
**Cause:** Email already in use or localStorage has cached data
**Solution:**
- Clear localStorage: `localStorage.clear()`
- Use different email
- Reset mock store in DevTools

### Issue 2: Infinite redirect loop
**Cause:** Middleware and client-side auth state mismatch
**Solution:**
- Clear all cookies
- Clear localStorage
- Restart dev server

### Issue 3: Session not persisting
**Cause:** Zustand persist middleware conflict
**Solution:**
- Check browser console for errors
- Verify `auth-storage` in localStorage
- Ensure cookies are enabled

### Issue 4: RLS policies blocking legitimate access
**Cause:** Policies not properly configured
**Solution:**
- Re-run migration: `20241211_users_rls_policies.sql`
- Check user role in database
- Verify `auth.uid()` matches user ID

## Success Criteria

All authentication functionalities are considered production-ready when:

- ✅ All test cases pass in mock mode
- ✅ All test cases pass with real Supabase
- ✅ Database triggers create user records automatically
- ✅ RLS policies enforce proper access control
- ✅ Middleware protects all routes correctly
- ✅ Session management works across page refreshes
- ✅ Password reset flow works end-to-end
- ✅ Form validations are comprehensive
- ✅ Error handling is user-friendly
- ✅ Loading states are shown appropriately

## Next Steps After Testing

1. **Enable Email Confirmation (Optional)**
   - Configure Supabase email templates
   - Update auth flow to handle email verification

2. **Add OAuth Providers (Optional)**
   - Google Sign-In
   - Apple Sign-In

3. **Implement 2FA (Future Enhancement)**
   - Time-based OTP
   - SMS verification

4. **Monitor & Log Auth Events**
   - Track failed login attempts
   - Log suspicious activity
   - Rate limiting on auth endpoints
