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
- [ ] Displays full image with edit form
- [ ] Fields: Pet Name, Breed (dropdown from breeds table), Caption, Tags (comma-separated), Published Status
- [ ] Caption limited to 200 characters with counter
- [ ] Tags parsed from comma-separated values, trimmed
- [ ] Published toggle updates is_published
- [ ] Save updates gallery_images row
- [ ] Inline error messages for validation
- [ ] Delete shows confirmation dialog with warning
- [ ] Delete soft-deletes (sets deleted_at) and removes from Supabase Storage
- [ ] "Unpublished" badge on thumbnail for unpublished images
- [ ] Success toast on save
