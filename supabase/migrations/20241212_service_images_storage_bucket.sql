-- Create storage bucket for service images
-- This migration creates a public storage bucket for service images

-- Create the service-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  true, -- Public access for displaying images
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Storage policies for service-images bucket

-- Allow public read access to service images
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
    SELECT 1 FROM users
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
    SELECT 1 FROM users
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
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Add helpful comment
COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads. service-images bucket stores service photos.';
