# Test Login Flow - Step by Step Guide

## Prerequisites

1. **Dev server is running** on http://localhost:3000 or http://localhost:3001
2. **Test users have been seeded** (run `node scripts/seed-test-users.js` if not done)
3. **Environment** uses `NEXT_PUBLIC_USE_MOCKS=false` (real Supabase)

## Test 1: Check Auth Debug Endpoint

Open in browser or use curl:
```
http://localhost:3001/api/auth/debug
```

**Expected Response (when logged out):**
```json
{
  "timestamp": "2024-...",
  "auth": {
    "hasSession": false,
    "hasUser": false,
    "userId": null,
    "userEmail": null
  },
  "database": {
    "userFound": false,
    "role": null,
    "firstName": null,
    "lastName": null
  },
  "errors": {
    "session": null,
    "user": null
  }
}
```

## Test 2: Login Flow - Customer Account

### Step 1: Navigate to Login Page
```
http://localhost:3001/login
```

**Expected:**
- Clean login form with email and password fields
- "Welcome Back" heading
- "Sign in to manage your appointments" subtitle
- No error messages

### Step 2: Enter Customer Credentials
```
Email: demo@example.com
Password: password123
```

### Step 3: Click "Sign In" Button

**Expected:**
- Button shows loading spinner
- No JavaScript errors in console
- Console logs should show:
  ```
  [Auth] Attempting sign in for: demo@example.com
  [Auth] signInWithPassword called, waiting for response...
  [Auth] signInWithPassword resolved
  [Auth] Sign in successful, user: 3c5a8190-6687-49cf-af41-1b0be4bb0058
  [Login] Sign in successful, redirecting to: /dashboard
  ```

### Step 4: Verify Redirect to Dashboard

**Expected:**
- URL changes to `http://localhost:3001/dashboard`
- Page loads successfully (no infinite loading)
- Shows "Welcome back, Demo!" heading
- Shows customer navigation sidebar
- May show empty states for appointments/pets (if no data seeded)

### Step 5: Check Auth Debug Endpoint (Logged In)
```
http://localhost:3001/api/auth/debug
```

**Expected Response:**
```json
{
  "auth": {
    "hasSession": true,
    "hasUser": true,
    "userId": "3c5a8190-6687-49cf-af41-1b0be4bb0058",
    "userEmail": "demo@example.com"
  },
  "database": {
    "userFound": true,
    "role": "customer",
    "firstName": "Demo",
    "lastName": "Customer"
  }
}
```

### Step 6: Test Session Persistence

**Action:** Refresh the page (F5)

**Expected:**
- Still logged in
- Dashboard loads immediately
- No redirect to login

### Step 7: Test Protected Routes

**Action:** Navigate to `/appointments`

**Expected:**
- Page loads successfully
- Still shows customer navigation
- No redirect to login

### Step 8: Test Sign Out

**Action:** Click "Sign Out" in navigation

**Expected:**
- Redirected to `/login`
- Auth debug endpoint shows logged out state
- Cannot access `/dashboard` without redirecting back to login

## Test 3: Login Flow - Admin Account

### Step 1: Sign Out (if needed)

### Step 2: Login with Admin Credentials
```
Email: admin@thepuppyday.com
Password: admin123
```

### Step 3: Verify Admin Redirect

**Expected:**
- Redirects to `/admin/dashboard` (not `/dashboard`)
- Shows admin interface
- Role is "admin"

### Step 4: Try Accessing Customer Routes

**Action:** Navigate to `http://localhost:3001/dashboard`

**Expected:**
- Middleware redirects back to `/admin/dashboard`
- Cannot access customer-only routes

## Test 4: Middleware Protection

### Test 4a: Unauthenticated Access

**Setup:** Sign out completely

**Test Cases:**

1. Try accessing `/dashboard`
   - **Expected:** Redirect to `/login?returnTo=/dashboard`

2. Try accessing `/appointments`
   - **Expected:** Redirect to `/login?returnTo=/appointments`

3. Try accessing `/admin/dashboard`
   - **Expected:** Redirect to `/login`

### Test 4b: Role-Based Access

**Setup:** Login as customer

**Test Cases:**

1. Try accessing `/admin/dashboard`
   - **Expected:** Redirect to `/login` (unauthorized)

2. Try accessing `/dashboard`
   - **Expected:** Access granted, page loads

**Setup:** Login as admin

**Test Cases:**

1. Try accessing `/dashboard`
   - **Expected:** Redirect to `/admin/dashboard`

2. Try accessing `/admin/dashboard`
   - **Expected:** Access granted, page loads

### Test 4c: Return To Parameter

**Test:**
1. Sign out
2. Navigate to `http://localhost:3001/appointments`
3. Should redirect to `/login?returnTo=/appointments`
4. Login with customer credentials
5. Should redirect back to `/appointments`

## Test 5: Error Handling

### Test 5a: Invalid Credentials

**Test:**
```
Email: wrong@example.com
Password: wrongpassword
```

**Expected:**
- Error message displays: "Invalid email or password"
- No redirect
- User stays on login page
- Can try again

### Test 5b: Network Error

**Test:**
1. Disconnect internet (or set invalid Supabase URL)
2. Try to login

**Expected:**
- Error message displays
- No crash
- Helpful error message

## Troubleshooting

### Issue: Login button does nothing

**Check:**
1. Browser console for JavaScript errors
2. Network tab for failed API calls
3. Supabase credentials in `.env.local`

### Issue: Redirect loop

**Check:**
1. Middleware is enabled (`src/middleware.ts` exists)
2. Customer layout is simplified (not doing its own redirects)
3. Clear browser cookies and localStorage

### Issue: Dashboard shows "Loading..." forever

**Check:**
1. User exists in `public.users` table (not just auth.users)
2. Run: `node test-login-flow.js` to verify
3. Check auth debug endpoint
4. Look for errors in server console

### Issue: 401 Unauthorized on dashboard data

**Check:**
1. RLS policies on Supabase tables
2. User role is correctly set in `public.users`
3. Anon key has proper permissions

## Success Criteria

All of the following should work:

- ✅ Customer can login with `demo@example.com` / `password123`
- ✅ Customer is redirected to `/dashboard` after login
- ✅ Dashboard loads without errors
- ✅ Session persists across page refreshes
- ✅ Unauthenticated users are redirected to `/login`
- ✅ Admin users are redirected to `/admin/dashboard`
- ✅ Customers cannot access admin routes
- ✅ Invalid credentials show error message
- ✅ Sign out works and redirects to login
- ✅ Return to parameter works correctly

## Additional Notes

- **First time?** Run `node scripts/seed-test-users.js` to create test accounts
- **Debugging?** Use `http://localhost:3001/api/auth/debug` to check auth state
- **Database issues?** Verify Supabase connection with `node test-login-flow.js`
- **Mock mode?** Set `NEXT_PUBLIC_USE_MOCKS=true` to use mock data (no Supabase needed)
