# Task 0161: Hero image upload with Supabase Storage

## Description
Implement hero background image upload functionality using Supabase Storage with validation, compression, and preview.

## Acceptance Criteria
- [ ] Create POST `/api/admin/settings/site-content/upload` API route
- [ ] Accept FormData with 'file' field
- [ ] Validate file type: image/jpeg, image/png, image/webp only
- [ ] Validate file size: max 5MB
- [ ] Validate minimum dimensions: 1920x800 pixels
- [ ] Return error with specific message for validation failures
- [ ] Upload to Supabase Storage `hero-images` bucket
- [ ] Generate unique filename using UUID
- [ ] Return public URL, width, height on success
- [ ] Create `HeroImageUpload` component with drag-drop support
- [ ] Show upload progress indicator
- [ ] Display preview thumbnail after upload
- [ ] Show error state for failed uploads with retry option
- [ ] Implement client-side image dimension validation before upload

## Implementation Notes
- API File: `src/app/api/admin/settings/site-content/upload/route.ts`
- Component File: `src/components/admin/settings/site-content/HeroImageUpload.tsx`
- Create `hero-images` storage bucket if not exists
- Use file-type library for server-side validation

## References
- Req 1.5, Req 1.6, Req 1.8
- Design: File Upload Security section

## Complexity
Medium

## Category
API, UI

## Dependencies
- 0159 (Site content API)
- 0160 (Hero section editor)
