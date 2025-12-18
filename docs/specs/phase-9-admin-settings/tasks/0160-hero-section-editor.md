# Task 0160: Hero section editor component

## Description
Build the hero section editor component for managing homepage hero content including headline, subheadline, and CTA buttons.

## Acceptance Criteria
- [ ] Create `HeroEditor` component with form fields
- [ ] Implement headline text input with 100 character limit and counter
- [ ] Implement subheadline text input with 200 character limit and counter
- [ ] Create CTA button editor allowing up to 2 buttons
- [ ] Each CTA button has: text input, URL input, style selector (primary/secondary)
- [ ] Add/remove CTA button functionality
- [ ] Display live preview panel showing how hero will appear
- [ ] Validate URL format for CTA button links
- [ ] Show validation errors inline next to affected fields
- [ ] Implement unsaved changes indicator
- [ ] Save button calls site content API
- [ ] Display success toast on save
- [ ] Preserve data on save failure with error message

## Implementation Notes
- File: `src/components/admin/settings/site-content/HeroEditor.tsx`
- Use react-hook-form for form management
- Character counter should show "X/100" format
- Preview should update in real-time as user types

## References
- Req 1.1, Req 1.2, Req 1.3, Req 1.4, Req 1.7, Req 1.8, Req 1.9
- Design: Hero Editor Component section

## Complexity
Medium

## Category
UI

## Dependencies
- 0159 (Site content API)
