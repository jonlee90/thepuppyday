# Task 0029: Create ReportCardAddToGallery button

**Group**: Gallery Management (Week 6)

## Objective
Enable adding report card photos to gallery

## Files to create/modify
- `src/components/admin/gallery/ReportCardAddToGallery.tsx` - Add to gallery button

## Requirements covered
- REQ-23.1, REQ-23.2, REQ-23.3, REQ-23.4, REQ-23.5, REQ-23.6, REQ-23.7

## Acceptance criteria
- [x] "Add to Gallery" button on report card photos
- [x] Copies image reference to gallery_images table
- [x] Pre-fills pet name and breed from appointment data
- [x] Auto-adds "before-after" tag for before/after photos
- [x] "Report Card" badge on gallery thumbnails sourced from report cards
- [x] Deleting gallery image does NOT delete original report card image
- [x] Link back to original appointment from report card-sourced images

## Implementation Notes
- Component location: `src/components/admin/gallery/ReportCardAddToGallery.tsx`
- API endpoint: `POST /api/admin/gallery` (same as upload but for references)
- Reusable button component with success feedback
- Pre-fills metadata from appointment.pet and appointment.pet.breed
- Auto-tags: "report-card" and "before-after" (for before/after photos)
- References existing image URL (no file upload needed)
- Delete protection: Gallery deletion doesn't affect report card image
- Future enhancement: Add source_type/source_id fields for better tracking
- Status: ✅ Completed
