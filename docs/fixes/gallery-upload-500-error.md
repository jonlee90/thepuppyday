# Fix: Gallery Upload 500 Error

## Issue

**Date:** 2025-12-15

**Symptom:** Admin gallery upload endpoint returning 500 Internal Server Error with "All uploads failed" message.

**Error Location:**
- Endpoint: `POST /api/admin/gallery/upload`
- Page: `/admin/gallery`
- User Action: Clicking "Upload 2 Photos" button

## Root Cause

The `gallery-images` Supabase storage bucket did not exist. When the upload API route attempted to upload files to the bucket, Supabase returned an error because the bucket was missing.

**Investigation Steps:**
1. Reviewed the upload API route at `src/app/api/admin/gallery/upload/route.ts`
2. Found the code was attempting to upload to `storage.from('gallery-images')`
3. Created a test script to check existing Supabase storage buckets
4. Discovered only `service-images` bucket existed
5. Confirmed `gallery-images` and `report-card-photos` buckets were missing

## Solution

### 1. Created Missing Storage Buckets

Created a setup script to automatically create all required storage buckets:

**File:** `scripts/setup-storage-buckets.js`

**Required Buckets:**
- `gallery-images` - Public gallery images (10MB limit, JPEG/PNG/WebP)
- `report-card-photos` - Report card photos (10MB limit, JPEG/PNG/WebP)
- `service-images` - Service icons (5MB limit, JPEG/PNG/WebP)

**Usage:**
```bash
node scripts/setup-storage-buckets.js
```

### 2. Created Storage RLS Policies

Created SQL script to set up proper Row Level Security policies for storage access:

**File:** `scripts/setup-storage-policies.sql`

**Policies:**
- Admin/Groomer users can upload, update, delete images
- Public users have read-only access
- Policies check user role from `users` table

**Usage:**
1. Open Supabase SQL Editor
2. Execute the SQL from `scripts/setup-storage-policies.sql`

### 3. Documentation

Created comprehensive documentation:
- `scripts/README.md` - Instructions for running setup scripts
- This fix document

## Verification

After running the setup script:

```
Testing Supabase Storage...

1. Listing all buckets:
   Found 3 existing bucket(s): [ 'service-images', 'gallery-images', 'report-card-photos' ]

2. Checking for gallery-images bucket:
   ✓ gallery-images bucket exists
     - Public: true
     - ID: gallery-images

3. Testing file upload:
   ✓ Upload test successful
```

## Prevention

To prevent this issue in future deployments:

1. **Initial Setup Checklist:**
   - Run `node scripts/setup-storage-buckets.js`
   - Execute `scripts/setup-storage-policies.sql` in Supabase SQL Editor
   - Verify all buckets exist in Supabase Dashboard > Storage

2. **Deployment to New Environment:**
   - Add storage setup to deployment documentation
   - Consider adding health check endpoint that verifies bucket existence
   - Add storage bucket setup to CI/CD pipeline

3. **Development Setup:**
   - Add storage setup to `README.md` onboarding instructions
   - Consider adding automatic bucket creation on first API call (with proper error handling)

## Related Files

### Modified/Created Files:
- `scripts/setup-storage-buckets.js` (new)
- `scripts/setup-storage-policies.sql` (new)
- `scripts/README.md` (new)
- `docs/fixes/gallery-upload-500-error.md` (this file)

### Related Code:
- `src/app/api/admin/gallery/upload/route.ts` - Gallery upload endpoint
- `src/app/api/admin/report-cards/upload/route.ts` - Report card photo upload endpoint
- `src/components/admin/gallery/GalleryUploadModal.tsx` - Upload UI component

## Testing Checklist

After applying the fix, verify:

- [ ] Gallery upload works for single image
- [ ] Gallery upload works for multiple images
- [ ] Uploaded images appear in gallery grid
- [ ] Public URL is generated correctly
- [ ] Images are visible on public gallery page
- [ ] Report card photo upload works
- [ ] Service image upload works (if implemented)
- [ ] Storage policies prevent unauthorized access

## Additional Notes

- All buckets are configured as `public: true` for read access
- File size limits are enforced at bucket level
- MIME type restrictions prevent non-image uploads
- The upload API uses service role for authentication, but RLS policies provide additional security layer
