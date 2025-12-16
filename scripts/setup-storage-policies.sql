-- Storage Policies for The Puppy Day Application
-- Run this SQL in your Supabase SQL Editor to set up storage access policies

-- =============================================
-- Gallery Images Bucket Policies
-- =============================================

-- Allow authenticated admin/groomer users to upload gallery images
CREATE POLICY "Admin can upload gallery images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gallery-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'groomer')
  )
);

-- Allow authenticated admin/groomer users to update gallery images
CREATE POLICY "Admin can update gallery images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gallery-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'groomer')
  )
);

-- Allow authenticated admin/groomer users to delete gallery images
CREATE POLICY "Admin can delete gallery images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gallery-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'groomer')
  )
);

-- Allow public read access to gallery images
CREATE POLICY "Public can view gallery images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gallery-images');

-- =============================================
-- Report Card Photos Bucket Policies
-- =============================================

-- Allow authenticated admin/groomer users to upload report card photos
CREATE POLICY "Admin can upload report card photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'report-card-photos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'groomer')
  )
);

-- Allow authenticated admin/groomer users to update report card photos
CREATE POLICY "Admin can update report card photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'report-card-photos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'groomer')
  )
);

-- Allow authenticated admin/groomer users to delete report card photos
CREATE POLICY "Admin can delete report card photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'report-card-photos' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'groomer')
  )
);

-- Allow customers to view their own report card photos
-- Allow public read access (report cards will control visibility at app level)
CREATE POLICY "Public can view report card photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'report-card-photos');

-- =============================================
-- Service Images Bucket Policies
-- =============================================

-- Allow authenticated admin users to upload service images
CREATE POLICY "Admin can upload service images"
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

-- Allow authenticated admin users to update service images
CREATE POLICY "Admin can update service images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Allow authenticated admin users to delete service images
CREATE POLICY "Admin can delete service images"
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

-- Allow public read access to service images
CREATE POLICY "Public can view service images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-images');
