# Task 0005: Create PhotoUploadSection component with before/after uploads

**Group**: Report Card System - Admin Form (Week 1)

## Objective
Build photo upload components with image compression

## Files to create/modify
- `src/components/admin/report-cards/PhotoUploadSection.tsx`
- `src/components/admin/report-cards/PhotoUpload.tsx`
- `src/lib/utils/image-compression.ts`

## Requirements covered
- REQ-6.1.1
- REQ-6.1.2

## Acceptance criteria
- Drag-drop or click to upload photo
- Before photo optional, after photo required
- Image compression to max 1200px width before upload
- Upload to Supabase Storage `report-card-photos` bucket
- Preview thumbnail shown after upload
- Loading state during upload
- Error handling for failed uploads
