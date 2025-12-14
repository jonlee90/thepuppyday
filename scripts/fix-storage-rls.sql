-- Fix Storage RLS Policies for service-images bucket
-- Execute this in Supabase Dashboard > SQL Editor
-- URL: https://supabase.com/dashboard/project/jajbtwgbhrkvgxvvruaa/sql/new

-- ============================================
-- STEP 1: Drop existing policies (if any)
-- ============================================

DROP POLICY IF EXISTS "Public can view service images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload service images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update service images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete service images" ON storage.objects;

-- ============================================
-- STEP 2: Ensure RLS is enabled
-- ============================================

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create RLS policies
-- ============================================

-- Allow public read access to service images (bucket is public)
CREATE POLICY "Public can view service images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-images');

-- Allow authenticated admins to upload service images
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

-- Allow authenticated admins to update service images
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

-- Allow authenticated admins to delete service images
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

-- ============================================
-- STEP 4: Verify policies
-- ============================================

-- List all policies on storage.objects for service-images bucket
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE '%service images%' OR
    policyname LIKE '%service-images%'
  )
ORDER BY policyname;

-- ============================================
-- Expected Output:
-- ============================================
-- You should see 4 policies:
-- 1. "Admins can delete service images" - DELETE - authenticated
-- 2. "Admins can update service images" - UPDATE - authenticated
-- 3. "Admins can upload service images" - INSERT - authenticated
-- 4. "Public can view service images" - SELECT - public
-- ============================================
