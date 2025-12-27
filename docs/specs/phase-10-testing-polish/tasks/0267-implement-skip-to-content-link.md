# Task 0267: Implement Skip to Content Link

## Description
Add skip navigation link for keyboard users to bypass repetitive navigation elements.

## Checklist
- [ ] Add skip link to main layout (hidden until focused)
- [ ] Create #main-content target in page layouts
- [ ] Style skip link to be visible on focus
- [ ] Test with keyboard navigation

## Acceptance Criteria
Skip link appears on Tab, navigates to main content area

## References
- Requirement 19.8

## Files to Create/Modify
- `src/app/layout.tsx`
- `src/app/(customer)/layout.tsx`
- `src/app/(admin)/layout.tsx`

## Implementation Notes
Use setupSkipToContent() from src/lib/accessibility/focus.ts.
