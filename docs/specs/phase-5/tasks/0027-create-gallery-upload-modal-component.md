# Task 0027: Create GalleryUploadModal component

**Group**: Gallery Management (Week 6)

## Objective
Build multi-file drag-drop upload modal

## Files to create/modify
- `src/components/admin/gallery/GalleryUploadModal.tsx` - Upload modal
- `src/app/api/admin/gallery/upload/route.ts` - POST upload endpoint

## Requirements covered
- REQ-21.3, REQ-21.4, REQ-21.5, REQ-21.6, REQ-21.7, REQ-21.8

## Acceptance criteria
- [ ] Drag-drop zone accepting multiple files
- [ ] File type validation: JPEG, PNG, WebP
- [ ] File size validation: max 10MB each
- [ ] Visual border highlight on drag over
- [ ] Upload to Supabase Storage `gallery-images` with UUID filenames
- [ ] Insert rows to gallery_images table on completion
- [ ] Success message on upload complete
- [ ] Per-file error display for failed uploads, continue with successful
