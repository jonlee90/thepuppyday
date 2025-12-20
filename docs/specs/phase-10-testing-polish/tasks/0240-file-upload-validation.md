# Task 0240: Add file upload validation

**Phase**: 10.2 Security
**Prerequisites**: 0237
**Estimated effort**: 2-3 hours

## Objective

Implement comprehensive file upload validation for security and performance.

## Requirements

- Validate file type against allowed types (JPG, PNG, WebP)
- Validate file size limits (max 5MB for most, 2MB for banners)
- Validate content-type header matches actual file type
- Reject malicious files

## Acceptance Criteria

- [ ] Only allowed file types accepted (JPG, PNG, WebP)
- [ ] File size validated before upload
- [ ] Content-type validated against file extension
- [ ] Magic number validation for images
- [ ] Clear error messages for invalid uploads
- [ ] File validation applied to all upload endpoints

## Implementation Details

### Files to Create

- `src/lib/validations/file-upload.ts`

### Files to Modify

- `src/app/api/admin/settings/site-content/upload/route.ts`
- `src/app/api/admin/gallery/route.ts`
- `src/app/api/customer/pets/[id]/photo/route.ts`

### File Validation Function

```typescript
export async function validateImageUpload(
  file: File,
  maxSizeMB: number = 5
): Promise<{ valid: boolean; error?: string }> {
  // Check file size
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `File size must be under ${maxSizeMB}MB` };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, and WebP files allowed' };
  }

  // Validate magic number (first bytes)
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer).slice(0, 4);
  const isValidImage = validateMagicNumber(bytes, file.type);

  if (!isValidImage) {
    return { valid: false, error: 'File type mismatch' };
  }

  return { valid: true };
}
```

## References

- **Requirements**: Req 7.8
- **Design**: Section 10.2.2
