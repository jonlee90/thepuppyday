# Task 0162: SEO settings editor component

## Description
Build the SEO settings editor component for managing page title, meta description, and Open Graph data.

## Acceptance Criteria
- [ ] Create `SeoSettings` component with form fields
- [ ] Implement page title input with 60 character limit and counter
- [ ] Implement meta description input with 160 character limit and counter
- [ ] Implement Open Graph title input
- [ ] Implement Open Graph description input
- [ ] Implement Open Graph image URL input
- [ ] Show validation warnings for empty required fields (but allow saving with defaults)
- [ ] Display last modification timestamp
- [ ] Implement unsaved changes indicator
- [ ] Save button calls site content API with section='seo'
- [ ] Display success toast on save
- [ ] Show error message on save failure

## Implementation Notes
- File: `src/components/admin/settings/site-content/SeoSettings.tsx`
- Use react-hook-form for form management
- Character counters should change color when limit approached
- Validation warnings should be yellow, not blocking

## References
- Req 2.1, Req 2.2, Req 2.3, Req 2.4, Req 2.7, Req 2.8
- Design: SEO Settings Component section

## Complexity
Small

## Category
UI

## Dependencies
- 0159 (Site content API)
