# Task 0172: Banner image upload

## Description
Implement banner image upload functionality using Supabase Storage with validation.

## Acceptance Criteria
- [ ] Create POST `/api/admin/settings/banners/upload` API route
- [ ] Accept FormData with 'file' field
- [ ] Validate file type: image/jpeg, image/png, image/webp, image/gif
- [ ] Validate file size: max 2MB
- [ ] Recommend dimensions 1200x300 pixels (warn if different)
- [ ] Upload to Supabase Storage `banner-images` bucket
- [ ] Generate unique filename using UUID
- [ ] Return public URL on success
- [ ] Create `BannerImageUpload` component with drag-drop support
- [ ] Show upload progress indicator
- [ ] Display preview after upload with recommended dimensions overlay
- [ ] Show dimension warning if image size differs from recommended

## Implementation Notes
- API File: `src/app/api/admin/settings/banners/upload/route.ts`
- Component File: `src/components/admin/settings/banners/BannerImageUpload.tsx`
- Create `banner-images` storage bucket if not exists
- Support animated GIFs for banner-images bucket

## References
- Req 4.2, Req 4.3, Req 4.7
- Design: File Upload Security section

## Complexity
Medium

## Category
API, UI

## Dependencies
- 0169 (Banner list API)
