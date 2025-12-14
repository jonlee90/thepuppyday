# Services CRUD Operations - Fix Guide

## Problem Summary

The `/admin/services` page CRUD operations were failing with 400/404 errors when working with the real Supabase database (`NEXT_PUBLIC_USE_MOCKS=false`).

## Root Causes Identified

### 1. Missing Database Columns
- `services` table was missing `updated_at` column
- `service_prices` table was missing `created_at` and `updated_at` columns
- TypeScript types expected these columns but they didn't exist in the database

### 2. Missing Row Level Security (RLS) Policies
- RLS was not enabled on `services` and `service_prices` tables
- No policies existed to allow admin users to perform CRUD operations
- Public read access was not configured for the booking widget

### 3. Type Mismatches
- `ServicePrice` interface in TypeScript didn't extend `BaseEntity` (missing `id` and `created_at`)
- This caused type errors when querying the database

## Solution Steps

### Step 1: Apply Database Migration

Run the migration to add missing columns and RLS policies:

```bash
# Option 1: Via Supabase CLI (recommended)
supabase db push

# Option 2: Via Supabase Dashboard
# Go to SQL Editor and paste contents of:
# supabase/migrations/20241212_services_rls_and_fixes.sql
```

The migration will:
1. Add `updated_at` to `services` table
2. Add `created_at` and `updated_at` to `service_prices` table
3. Create triggers to auto-update `updated_at` on changes
4. Enable RLS on both tables
5. Create RLS policies:
   - Public read access for active services
   - Staff can view all services (including inactive)
   - Admin full CRUD access
   - Public read access for all service prices
   - Admin full CRUD access to service prices

### Step 2: Verify Database Structure

Run the verification script:

```bash
# In Supabase SQL Editor, run:
scripts/apply-services-migration.sql
```

Expected output should show:
- `services` table has columns: id, name, description, image_url, duration_minutes, is_active, display_order, created_at, updated_at
- `service_prices` table has columns: id, service_id, size, price, created_at, updated_at
- RLS is enabled on both tables
- Multiple RLS policies exist for both tables

### Step 3: Test CRUD Operations

#### Manual Testing via API

1. Start the development server:
```bash
npm run dev
```

2. Log in as an admin user at `http://localhost:3000/login`

3. Navigate to `http://localhost:3000/admin/services`

4. Test each operation:
   - **CREATE**: Click "Add New Service", fill form, submit
   - **READ**: Services should load and display in the table
   - **UPDATE**: Click edit icon, modify fields, save
   - **DELETE**: Click delete (if implemented) or set inactive

#### Automated API Testing

Run the automated test script (requires dev server running):

```bash
node scripts/test-services-api.mjs
```

This will test:
1. GET /api/admin/services (list all)
2. POST /api/admin/services (create)
3. GET /api/admin/services/[id] (get single)
4. PATCH /api/admin/services/[id] (update)
5. DELETE /api/admin/services/[id] (delete)
6. Verify deletion

Expected results: All tests should pass with status 200/201.

### Step 4: Check Authentication

If tests fail with 401/403 errors, verify admin authentication:

1. Check that you're logged in as admin:
```javascript
// In browser console on admin page:
const response = await fetch('/api/admin/services');
const data = await response.json();
console.log('Status:', response.status, 'Data:', data);
```

2. Verify user role in database:
```sql
-- In Supabase SQL Editor:
SELECT id, email, role FROM public.users WHERE email = 'your-admin-email@example.com';
```

Role should be `'admin'`, not `'customer'` or `'groomer'`.

3. Check middleware is working:
```bash
# Check middleware logs in terminal where dev server is running
# Should see: [Admin Auth] Auth user result...
# Should see: [Admin Auth] Admin access granted for: ...
```

## File Changes Made

### 1. Database Migration
- **File**: `supabase/migrations/20241212_services_rls_and_fixes.sql`
- **Changes**: Added columns, triggers, RLS policies

### 2. TypeScript Types
- **File**: `src/types/database.ts`
- **Changes**:
  - Added `updated_at` to `Service` interface
  - Changed `ServicePrice` to extend `BaseEntity`
  - Added `updated_at` to `ServicePrice` interface

### 3. API Routes (No Changes Needed)
- `src/app/api/admin/services/route.ts` - Already correct
- `src/app/api/admin/services/[id]/route.ts` - Already correct

### 4. Components (No Changes Needed)
- `src/components/admin/services/ServiceForm.tsx` - Already correct
- `src/components/admin/services/ServicesList.tsx` - Already correct

## Testing Checklist

- [ ] Migration applied successfully
- [ ] Database structure verified (has all columns)
- [ ] RLS enabled on both tables
- [ ] RLS policies created
- [ ] TypeScript types updated
- [ ] Development server starts without errors
- [ ] Can log in as admin user
- [ ] Services list page loads
- [ ] Can create new service with prices
- [ ] Can view service details
- [ ] Can update service (including image_url)
- [ ] Can update service prices
- [ ] Can toggle service active/inactive
- [ ] Can drag-and-drop reorder services
- [ ] Can delete service (if no appointments)
- [ ] Proper error messages on validation failures

## Common Issues and Solutions

### Issue: "Service not found" (404) on UPDATE

**Cause**: Service doesn't exist or RLS policies blocking access

**Solution**:
1. Verify service ID exists:
```sql
SELECT id, name FROM services WHERE id = 'your-service-id';
```

2. Check if user is admin:
```sql
SELECT role FROM users WHERE id = auth.uid();
```

3. Test with service role key (bypasses RLS):
   - Temporarily use `SUPABASE_SERVICE_ROLE_KEY` in API route
   - If it works, issue is with RLS policies

### Issue: "Invalid image URL" (400)

**Cause**: Validation rejecting valid URLs

**Solution**:
- Check URL format in `src/lib/utils/validation.ts`
- Valid formats:
  - `https://example.com/image.jpg` ✓
  - `http://example.com/image.jpg` ✓
  - `/uploads/image.jpg` ✓
  - `data:image/png;base64,...` ✗ (security)
  - `javascript:alert(1)` ✗ (security)

### Issue: Prices not updating

**Cause**: service_prices rows don't exist or unique constraint violation

**Solution**:
1. Check if prices exist:
```sql
SELECT * FROM service_prices WHERE service_id = 'your-service-id';
```

2. If missing, insert them:
```sql
INSERT INTO service_prices (service_id, size, price)
VALUES
  ('your-service-id', 'small', 40.00),
  ('your-service-id', 'medium', 55.00),
  ('your-service-id', 'large', 70.00),
  ('your-service-id', 'xlarge', 85.00);
```

### Issue: "Unauthorized: Admin or staff access required"

**Cause**: Not logged in or not admin role

**Solution**:
1. Log in at `/login`
2. Verify admin role in database
3. Check middleware logs for authentication details

## Additional Resources

### API Route Validation

All API routes use these validation functions (in `src/lib/utils/validation.ts`):
- `validateServiceName(name)` - Required, max 100 chars, sanitizes HTML
- `validateDescription(desc)` - Optional, max 500 chars, sanitizes HTML
- `validateDuration(minutes)` - Required, 15-480 minutes
- `validatePrice(price)` - Required, >= 0, max 2 decimal places
- `isValidImageUrl(url)` - Optional, allows http/https URLs or /paths
- `isValidUUID(id)` - Required for [id] routes, prevents SQL injection

### Database Constraints

**Services Table**:
- `name` - TEXT NOT NULL
- `duration_minutes` - INTEGER NOT NULL
- `is_active` - BOOLEAN DEFAULT true
- `display_order` - INTEGER DEFAULT 0

**Service Prices Table**:
- `service_id` - UUID NOT NULL (foreign key to services)
- `size` - TEXT NOT NULL (must be: small, medium, large, xlarge)
- `price` - DECIMAL(10,2) NOT NULL
- UNIQUE(service_id, size) - Only one price per size per service

### RLS Policy Details

**services Table Policies**:
1. `Public read access for active services` - Anyone can SELECT where is_active=true
2. `Staff can view all services` - Admin/groomer can SELECT all services
3. `Admin full access to services` - Admin can INSERT, UPDATE, DELETE

**service_prices Table Policies**:
1. `Public read access for service prices` - Anyone can SELECT
2. `Admin full access to service prices` - Admin can INSERT, UPDATE, DELETE

## Next Steps

After fixing CRUD operations:
1. Test with real user accounts (customer, admin, groomer)
2. Verify booking widget can read services and prices
3. Test image upload to Supabase Storage (currently mocked)
4. Implement service deletion confirmation modal
5. Add audit logging for service changes
6. Set up automated tests

## Contact

If issues persist, check:
- Server logs: `npm run dev` terminal output
- Browser console: Network tab and Console tab
- Supabase logs: Supabase Dashboard > Logs
- Database state: Supabase Dashboard > Table Editor
