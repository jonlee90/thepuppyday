# Task 0175: Banner editor modal (create/edit)

## Description
Create the banner editor modal component for creating and editing promotional banners.

## Acceptance Criteria
- [ ] Create `BannerEditor` modal component
- [ ] Support both create mode (no banner prop) and edit mode (banner prop provided)
- [ ] Include image upload area with preview
- [ ] Include alt text input (required for accessibility)
- [ ] Include click URL input with validation (optional, allow internal/external)
- [ ] Include is_active toggle switch
- [ ] Show form validation errors inline
- [ ] Display preview of how banner will appear on public site
- [ ] Save button creates or updates banner via API
- [ ] Close button with unsaved changes confirmation
- [ ] Success toast on save
- [ ] Error handling with retry option

## Implementation Notes
- File: `src/components/admin/settings/banners/BannerEditor.tsx`
- Use DaisyUI modal component
- Integrate with BannerImageUpload component
- Form validation using Zod schema

## References
- Req 4.2, Req 4.4, Req 4.5, Req 4.7
- NFR-5.1
- Design: Banner Editor Modal section

## Complexity
Medium

## Category
UI

## Dependencies
- 0170 (Banner individual API)
- 0172 (Banner image upload)
