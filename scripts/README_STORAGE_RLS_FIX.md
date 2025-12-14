# Storage RLS Policy Fix for service-images Bucket

## Problem

Admin users are getting RLS (Row Level Security) policy violations when trying to upload service images:

```
Error: new row violates row-level security policy
```

This occurs at the `/api/admin/services/upload-image` endpoint when attempting to upload images to the `service-images` Supabase Storage bucket.

## Root Cause

The RLS policies on the `storage.objects` table are either:
1. Not applied to the Supabase database yet, OR
2. Incorrectly configured to block admin uploads

## Solution

Apply the correct RLS policies that allow:
- **Admins** (role='admin') to INSERT, UPDATE, DELETE objects
- **Everyone** (public) to SELECT (view) objects

## Fix Steps

### Option 1: Quick Fix (Recommended)

**Execute SQL directly in Supabase Dashboard:**

1. Go to: [Supabase SQL Editor](https://supabase.com/dashboard/project/jajbtwgbhrkvgxvvruaa/sql/new)

2. Copy and paste the contents of **`scripts/fix-storage-rls.sql`**

3. Click **"Run"** to execute

4. Verify output shows 4 policies created:
   - "Admins can delete service images" (DELETE)
   - "Admins can update service images" (UPDATE)
   - "Admins can upload service images" (INSERT)
   - "Public can view service images" (SELECT)

### Option 2: Using Supabase CLI

```bash
# Initialize Supabase project (if not done)
npx supabase init

# Link to remote project
npx supabase link --project-ref jajbtwgbhrkvgxvvruaa

# Apply migration
npx supabase db push
```

### Option 3: Run Helper Script

```bash
# This will display the SQL to execute manually
node scripts/apply-storage-policies.js
```

## Verify the Fix

### Method 1: Test Script

```bash
# Test admin upload capability
node scripts/test-admin-upload.js <admin-email> <admin-password>
```

Example:
```bash
node scripts/test-admin-upload.js admin@example.com admin123
```

Expected output:
```
✅ Signed in successfully
✅ Upload successful!
✅ Test file deleted
✅ Test complete - admin upload works!
```

### Method 2: Check Policies in Dashboard

1. Go to: [Supabase Database Policies](https://supabase.com/dashboard/project/jajbtwgbhrkvgxvvruaa/database/policies)

2. Filter by table: `storage.objects`

3. Verify you see 4 policies related to "service images"

### Method 3: Manual Upload Test

1. Sign in to the admin panel at: `http://localhost:3000/admin/login`

2. Navigate to **Services** section

3. Try uploading a service image

4. Should succeed without RLS errors

## Expected RLS Policies

After applying the fix, these policies should exist on `storage.objects`:

### 1. Public can view service images
- **Operation:** SELECT
- **Role:** public
- **Condition:** `bucket_id = 'service-images'`

### 2. Admins can upload service images
- **Operation:** INSERT
- **Role:** authenticated
- **Condition:**
  ```sql
  bucket_id = 'service-images' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
  ```

### 3. Admins can update service images
- **Operation:** UPDATE
- **Role:** authenticated
- **Condition:** Same as INSERT

### 4. Admins can delete service images
- **Operation:** DELETE
- **Role:** authenticated
- **Condition:** Same as INSERT

## Troubleshooting

### Issue: "bucket_id does not exist"

**Solution:** Create the bucket first:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
```

### Issue: "User role is not 'admin'"

**Verify user role in database:**

```sql
SELECT id, email, role FROM users WHERE email = 'your-admin@email.com';
```

**Update user role if needed:**

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin@email.com';
```

### Issue: Still getting RLS errors after applying policies

**Check if policies are actually applied:**

```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%service images%';
```

**If no results, policies weren't applied. Re-run the SQL from `fix-storage-rls.sql`.**

## Files

- **`scripts/fix-storage-rls.sql`** - SQL to apply RLS policies (EXECUTE THIS)
- **`scripts/test-admin-upload.js`** - Test script to verify admin upload works
- **`scripts/apply-storage-policies.js`** - Helper script to display migration SQL
- **`scripts/check-storage-policies.js`** - Check current bucket and policies status
- **`supabase/migrations/20241212_service_images_storage_bucket.sql`** - Original migration

## Security Notes

- These policies ensure only authenticated users with `role = 'admin'` can upload/modify images
- Public read access is intentional (bucket is public for displaying service images)
- The `auth.uid()` function ensures the authenticated user's ID matches the user in the `users` table
- Queries join with the `users` table to verify the `role` column

## Next Steps After Fix

1. Test upload in admin panel
2. Verify images display correctly on public pages
3. Consider adding image optimization/resizing with Supabase Image Transformation
4. Monitor storage usage and set up alerts for quota limits

## Support

If issues persist after applying the fix:

1. Check Supabase Dashboard > Logs for detailed error messages
2. Verify the `users` table has correct `role` values
3. Ensure the authenticated user's JWT contains the correct `uid`
4. Contact support with error logs from the upload API endpoint
