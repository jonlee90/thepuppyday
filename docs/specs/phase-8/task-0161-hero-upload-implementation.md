# Task 0161: Hero Image Upload API Implementation

**Status**: Completed
**Date**: 2025-12-17
**Implemented By**: Claude Code

## Overview

Implemented the hero image upload API endpoint for Task 0161, allowing admins to upload hero images with strict validation for file type, size, and dimensions.

## Implementation Details

### API Endpoint

**File**: `src/app/api/admin/settings/site-content/upload/route.ts`

**Route**: `POST /api/admin/settings/site-content/upload`

**Authentication**: Requires admin authentication via `requireAdmin()`

### Validation Requirements

1. **File Type**: Only accepts `image/jpeg`, `image/png`, `image/webp`
2. **File Size**: Maximum 5MB
3. **Dimensions**: Minimum 1920x800 pixels (validated using Sharp)

### Storage Configuration

- **Bucket Name**: `hero-images`
- **Bucket Type**: Public (auto-created if doesn't exist)
- **File Naming**: UUID-based (`crypto.randomUUID()` + original extension)
- **Access**: Public URLs returned for immediate use

### Key Features

#### 1. Automatic Bucket Creation

```typescript
async function ensureBucketExists(supabase: any): Promise<{ success: boolean; error?: string }>
```

- Checks if `hero-images` bucket exists
- Creates bucket with public access if missing
- Configures bucket with file size limit and allowed MIME types

#### 2. Image Validation

```typescript
async function validateHeroImage(file: File): Promise<{ valid: boolean; error?: string; width?: number; height?: number }>
```

- Validates file type against allowed list
- Checks file size (max 5MB)
- Uses Sharp to read image metadata and validate dimensions
- Returns detailed error messages for each validation failure

#### 3. Response Format

**Success (200)**:
```json
{
  "url": "https://...supabase.co/storage/v1/object/public/hero-images/uuid.jpg",
  "width": 1920,
  "height": 1080
}
```

**Error (400/500)**:
```json
{
  "error": "Detailed error message"
}
```

### Error Messages

Specific, user-friendly error messages:

- `"No file provided"` - No file in FormData
- `"File must be JPEG, PNG, or WebP"` - Invalid file type
- `"File size must be under 5MB (current: X.XXmb)"` - File too large
- `"Image must be at least 1920x800 pixels (actual: WxH)"` - Dimensions too small
- `"Failed to read image metadata. Please ensure the file is a valid image."` - Corrupt/invalid image
- `"Storage quota exceeded"` - Storage upload error
- `"Unauthorized: Admin or staff access required"` - Authentication failure

## Testing

**Test File**: `__tests__/api/admin/settings/site-content/upload.test.ts`

### Test Coverage (8 tests, 100% passing)

1. **Success Case**: Upload valid hero image (1920x1080 JPEG)
2. **Missing File**: Reject request with no file
3. **Invalid Type**: Reject PDF file
4. **File Too Large**: Reject 6MB file
5. **Dimensions Too Small**: Reject 800x600 image
6. **Bucket Creation**: Auto-create bucket if missing
7. **Storage Errors**: Handle upload failures gracefully
8. **Authentication**: Require admin access

### Test Results

```
✓ All 8 tests passing
✓ Duration: 170ms
✓ Coverage: All validation paths tested
```

## Dependencies

- **Sharp**: Image processing and metadata extraction (already installed via Next.js)
- **Supabase Storage**: File storage and public URL generation
- **Service Role Client**: Used for storage operations (bypasses RLS)

## Security Considerations

1. **Authentication**: Admin-only access via `requireAdmin()`
2. **File Type Validation**: Strict MIME type checking
3. **File Size Limit**: 5MB maximum to prevent abuse
4. **Dimension Validation**: Ensures images meet minimum quality standards
5. **Service Role Usage**: Storage operations use service role to bypass RLS (appropriate for admin uploads)
6. **UUID Filenames**: Prevents path traversal and filename conflicts

## Usage Example

```typescript
// Frontend upload handler
async function uploadHeroImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/admin/settings/site-content/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const { error } = await response.json();
    throw new Error(error);
  }

  const { url, width, height } = await response.json();
  console.log(`Uploaded: ${url} (${width}x${height})`);
  return url;
}
```

## Future Enhancements

Potential improvements for future iterations:

1. **Image Optimization**: Auto-compress/resize images before storage
2. **Multiple Sizes**: Generate responsive image variants (mobile, tablet, desktop)
3. **WebP Conversion**: Auto-convert to WebP for better compression
4. **Delete Old Images**: Clean up replaced hero images to save storage
5. **CDN Integration**: Serve images via CDN for better performance
6. **Image Cropping**: Allow admins to crop/adjust images before upload

## Files Created

1. `src/app/api/admin/settings/site-content/upload/route.ts` - API endpoint
2. `__tests__/api/admin/settings/site-content/upload.test.ts` - Test suite

## Files Modified

None (new feature)

## Notes

- The endpoint uses Sharp (via Next.js dependency) for image metadata reading
- Storage bucket is auto-created on first upload if missing
- All validation happens before storage upload to prevent unnecessary storage usage
- Public URLs are immediately usable after upload
- Error messages are designed to be user-friendly for admin UI display

## Related Tasks

- Task 0160: Hero Settings Management API (PATCH endpoint)
- Task 0162: Hero Settings UI Component (Frontend integration)
