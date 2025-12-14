# Admin Panel Test Credentials

## Quick Reference

### Admin/Owner Access (Full Access)
```
Email: admin@thepuppyday.com
Password: [any password works in mock mode]
Role: admin
```
**Access**: All admin panel features including Configuration section

---

### Staff/Groomer Access (Limited Access)
```
Email: staff@thepuppyday.com
Password: [any password works in mock mode]
Role: groomer
```
**Access**: Dashboard, Appointments, Customers only (no Configuration section)

---

### Customer Access (Should Redirect)
```
Email: demo@example.com
Password: [any password works in mock mode]
Role: customer
```
**Expected**: Redirected to `/dashboard` if accessing `/admin/*`

---

## Testing Checklist

### Admin User (`admin@thepuppyday.com`)
- [ ] Can access `/admin/dashboard`
- [ ] Sees all navigation items:
  - [ ] Dashboard
  - [ ] Appointments
  - [ ] Customers
  - [ ] Services (owner-only)
  - [ ] Add-ons (owner-only)
  - [ ] Gallery (owner-only)
  - [ ] Settings (owner-only)
- [ ] Sidebar collapse/expand works
- [ ] Mobile hamburger menu works
- [ ] Logout redirects to `/login`

### Staff User (`staff@thepuppyday.com`)
- [ ] Can access `/admin/dashboard`
- [ ] Sees limited navigation:
  - [ ] Dashboard
  - [ ] Appointments
  - [ ] Customers
  - [ ] ❌ Services (hidden)
  - [ ] ❌ Add-ons (hidden)
  - [ ] ❌ Gallery (hidden)
  - [ ] ❌ Settings (hidden)
- [ ] Sidebar collapse/expand works
- [ ] Mobile hamburger menu works
- [ ] Logout redirects to `/login`

### Customer User (`demo@example.com`)
- [ ] Cannot access `/admin/dashboard` (redirects to `/dashboard`)
- [ ] Cannot access `/api/admin/*` (403 Forbidden)
- [ ] Can access customer portal at `/dashboard`

### Unauthenticated
- [ ] `/admin/dashboard` redirects to `/login?returnTo=/admin/dashboard`
- [ ] `/api/admin/*` returns 401 Unauthorized
- [ ] After login, redirects to original URL

---

## Quick Start

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to login:**
   ```
   http://localhost:3000/login
   ```

3. **Login with admin credentials:**
   - Email: `admin@thepuppyday.com`
   - Password: `test` (or any password)

4. **Access admin panel:**
   ```
   http://localhost:3000/admin/dashboard
   ```

---

## Additional Test Users (Customer Portal)

```
Email: sarah@example.com
Password: [any]
Role: customer
```

---

## Mock Mode Notes

- ✅ Any password works for existing users
- ✅ User data persists in localStorage
- ✅ Logout clears session
- ✅ Role-based access enforced
- ✅ Middleware protection active
