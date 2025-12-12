# Task 0028: Create GalleryImageEditModal component

**Group**: Gallery Management (Week 6)

## Objective
Build image metadata edit form

## Files to create/modify
- `src/components/admin/gallery/GalleryImageEditModal.tsx` - Edit modal
- `src/app/api/admin/gallery/[id]/route.ts` - GET/PATCH/DELETE image endpoint

## Requirements covered
- REQ-22.1, REQ-22.2, REQ-22.3, REQ-22.4, REQ-22.5, REQ-22.6, REQ-22.7, REQ-22.8, REQ-22.9, REQ-22.10, REQ-22.11, REQ-22.12

## Acceptance criteria
- [x] Displays full image with edit form
- [x] Fields: Pet Name, Breed (dropdown from breeds table), Caption, Tags (comma-separated), Published Status
- [x] Caption limited to 200 characters with counter
- [x] Tags parsed from comma-separated values, trimmed
- [x] Published toggle updates is_published
- [x] Save updates gallery_images row
- [x] Inline error messages for validation
- [x] Delete shows confirmation dialog with warning
- [x] Delete hard-deletes (removes row and storage file)
- [x] "Unpublished" badge on thumbnail for unpublished images
- [x] Success toast on save

## Implementation Notes
- Component location: `src/components/admin/gallery/GalleryImageEditModal.tsx`
- API route: `src/app/api/admin/gallery/[id]/route.ts`
- Breed dropdown populated from `src/app/api/admin/breeds/route.ts`
- Tags: Comma-separated input, parsed into array with trimming
- Caption: Real-time character counter (200 max)
- Delete: Hard delete (not soft delete) - removes from DB and Storage
- Security: UUID validation, input sanitization, image URL validation
- Note: Changed from soft-delete to hard-delete per requirements
- Status: ✅ Completed
