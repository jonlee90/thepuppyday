# Service Image Upload Fix

## Problem
Service images were not being saved when uploaded in `/admin/services`. The `ServiceForm` component had a mock `uploadImage()` function that only generated fake paths like `/uploads/service-123456.jpg` instead of actually uploading to Supabase Storage.

## Solution Implemented

### 1. Created Supabase Storage Bucket
- **Bucket Name**: `service-images`
- **Public Access**: Yes (for displaying images)
- **File Size Limit**: 10MB
- **Allowed Types**: JPEG, PNG, WebP
- **Location**: Created via Supabase JavaScript API

### 2. Created Upload API Route
**File**: `src/app/api/admin/services/upload-image/route.ts`

This endpoint:
- Accepts multipart form data with a single image file
- Validates file type and size using `validateImageFile()`
- Uploads to Supabase Storage bucket `service-images/services/`
- Returns the public URL of the uploaded image
- Requires admin authentication via `requireAdmin()`

### 3. Updated ServiceForm Component
**File**: `src/components/admin/services/ServiceForm.tsx`

Changed the `uploadImage()` function (lines 118-143) to:
- Create a FormData object with the selected file
- POST to `/api/admin/services/upload-image`
- Handle upload errors properly
- Return the public URL from Supabase Storage

### 4. Created Storage Migration
**File**: `supabase/migrations/20241212_service_images_storage_bucket.sql`

Defines RLS policies for the storage bucket:
- **Public read**: Anyone can view service images
- **Admin upload**: Only admins can upload images
- **Admin update**: Only admins can update images
- **Admin delete**: Only admins can delete images

## How It Works

### Flow Diagram
```
User selects image in ServiceForm
           ↓
File is validated (type, size)
           ↓
Preview is shown using FileReader
           ↓
User clicks "Save"
           ↓
ServiceForm.uploadImage() is called
           ↓
File is uploaded to /api/admin/services/upload-image
           ↓
API validates admin auth
           ↓
API uploads to Supabase Storage (service-images bucket)
           ↓
API returns public URL
           ↓
ServiceForm includes URL in service data
           ↓
Service is created/updated via /api/admin/services
```

## Files Changed

### New Files
1. `src/app/api/admin/services/upload-image/route.ts` - Upload API endpoint
2. `supabase/migrations/20241212_service_images_storage_bucket.sql` - Storage bucket migration
3. `scripts/setup-service-images-storage.js` - Setup helper script

### Modified Files
1. `src/components/admin/services/ServiceForm.tsx` - Updated `uploadImage()` function (lines 118-143)

## Testing Instructions

### Prerequisites
1. Ensure the storage bucket exists (already created)
2. Be logged in as an admin user
3. Development server is running (`npm run dev`)

### Test Steps

1. **Navigate to Services Admin**
   - Go to `http://localhost:3000/admin/services`

2. **Create New Service with Image**
   - Click "Add Service" button
   - Fill in required fields:
     - Name: "Test Service"
     - Duration: 60 minutes
     - Prices for all sizes (e.g., $40, $55, $70, $85)
   - Click "Upload Image" button
   - Select a JPEG, PNG, or WebP image (max 10MB)
   - Verify preview appears
   - Click "Create Service"
   - Wait for success (page should reload)
   - Verify image appears in services list

3. **Edit Existing Service Image**
   - Click Edit icon on any service
   - Click "Change Image" button
   - Select a different image
   - Click "Update Service"
   - Verify new image is saved and displayed

4. **Test Error Handling**
   - Try uploading a non-image file (should show error)
   - Try uploading a file > 10MB (should show error)
   - Try uploading without admin auth (should fail)

### Expected Results

✅ Image uploads successfully
✅ Public URL is returned (format: `https://jajbtwgbhrkvgxvvruaa.supabase.co/storage/v1/object/public/service-images/services/[uuid].[ext]`)
✅ Image is saved in services table
✅ Image displays in services list
✅ Image displays on public booking widget
✅ Images are stored in Supabase Storage bucket `service-images`

### Verify in Supabase Dashboard

1. Go to Supabase Dashboard > Storage
2. Click on `service-images` bucket
3. Navigate to `services/` folder
4. Verify uploaded images are present
5. Click image to view public URL

## Storage Bucket Structure

```
service-images/
  └── services/
      ├── [uuid-1].jpg
      ├── [uuid-2].png
      ├── [uuid-3].webp
      └── ...
```

## Security Features

1. **File Validation**
   - Type checking (JPEG, PNG, WebP only)
   - Size limit (10MB max)
   - Prevents malicious file uploads

2. **Authentication**
   - Admin-only upload access
   - RLS policies enforce permissions
   - Public read for displaying images

3. **URL Sanitization**
   - Image URLs validated to prevent XSS
   - Accepts Supabase public URLs and relative paths
   - Blocks javascript: and data: URIs

4. **Unique File Names**
   - UUIDs prevent collisions
   - Original extensions preserved
   - Path structure organized

## Error Handling

The implementation handles:
- Invalid file types
- File size limits
- Network failures
- Storage quota issues
- Unauthorized access
- Missing files

All errors are displayed to the user with clear messages.

## Performance Considerations

- Images are uploaded before service creation/update
- Upload progress could be added (future enhancement)
- Preview uses FileReader (client-side, instant)
- Public URLs are cached by CDN

## Future Enhancements

1. **Image Optimization**
   - Auto-resize on upload
   - WebP conversion
   - Thumbnail generation

2. **UI Improvements**
   - Upload progress bar
   - Drag-and-drop support
   - Image cropping tool

3. **Management Features**
   - Bulk upload
   - Image library/picker
   - Cleanup of unused images

## Troubleshooting

### Issue: Upload fails with "Failed to get public URL"
**Solution**: Check that the bucket is public and RLS policies allow public read access.

### Issue: "Admins can upload service images" policy error
**Solution**: Ensure user has `role = 'admin'` in the users table.

### Issue: Images don't display after upload
**Solution**:
- Verify the bucket is public
- Check browser console for CORS errors
- Confirm the image URL is correctly saved in the database

### Issue: "Bucket not found" error
**Solution**: Run the bucket creation command:
```bash
node scripts/setup-service-images-storage.js
```

## Migration Status

- ✅ Storage bucket created: `service-images`
- ✅ Upload API endpoint implemented
- ✅ ServiceForm updated to use upload endpoint
- ✅ File validation in place
- ✅ RLS policies configured
- ⚠️ RLS policies may need manual verification in Supabase dashboard

## Related Files

- Gallery upload (similar pattern): `src/app/api/admin/gallery/upload/route.ts`
- Validation utilities: `src/lib/utils/validation.ts`
- Auth utilities: `src/lib/admin/auth.ts`

## Notes

- The storage bucket was created using the Supabase JavaScript API because the CLI migration had connection issues
- The RLS policies in the migration file should be applied manually via Supabase Dashboard > SQL Editor if not automatically applied
- This implementation follows the same pattern as the gallery upload feature, which is already working
