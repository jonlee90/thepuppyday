# Quick Start: Fix Storage RLS Policy Error

## The Problem

Getting this error when uploading service images:
```
Error: new row violates row-level security policy
```

## The Solution (2 Minutes)

### Step 1: Open Supabase SQL Editor

Click this link: [Supabase SQL Editor](https://supabase.com/dashboard/project/jajbtwgbhrkvgxvvruaa/sql/new)

### Step 2: Copy & Paste SQL

Copy the entire SQL from: **`C:\Users\Jon\Documents\claude projects\thepuppyday\scripts\fix-storage-rls.sql`**

Or copy from below:

```sql
-- Fix Storage RLS Policies for service-images bucket

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Public can view service images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update service images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete service images" ON storage.objects;

-- Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- 1. Public read access
CREATE POLICY "Public can view service images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-images');

-- 2. Admin upload access
CREATE POLICY "Admins can upload service images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 3. Admin update access
CREATE POLICY "Admins can update service images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'service-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 4. Admin delete access
CREATE POLICY "Admins can delete service images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Verify (should show 4 policies)
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%service images%'
ORDER BY policyname;
```

### Step 3: Click "Run"

The SQL will execute and create 4 RLS policies.

### Step 4: Verify

You should see output showing 4 policies:
1. Admins can delete service images (DELETE)
2. Admins can update service images (UPDATE)
3. Admins can upload service images (INSERT)
4. Public can view service images (SELECT)

### Step 5: Test Upload

1. Go to admin panel: `http://localhost:3000/admin/login`
2. Navigate to Services
3. Try uploading a service image
4. Should work without RLS errors!

## Alternative: Test with Script

```bash
# Test admin upload capability (requires admin credentials)
node scripts/test-admin-upload.js admin@example.com password123
```

## Troubleshooting

### Issue: User is not admin

Check user role:
```sql
SELECT id, email, role FROM users WHERE email = 'your-email@example.com';
```

Update role to admin:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Issue: Bucket doesn't exist

Create the bucket:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
```

## Done!

Admin users with `role = 'admin'` can now upload service images without RLS errors.

---

**For detailed information, see:** `scripts/README_STORAGE_RLS_FIX.md`
