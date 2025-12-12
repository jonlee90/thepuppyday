# Task 0035: Accessibility audit and improvements

**Group**: Polish & Testing (Week 7)

## Objective
Ensure WCAG 2.1 AA compliance

## Files to create/modify
- All admin components - Add accessibility attributes

## Requirements covered
- REQ-32.1, REQ-32.2, REQ-32.3, REQ-32.4, REQ-32.5, REQ-32.6, REQ-32.7, REQ-32.8, REQ-32.9, REQ-32.10, REQ-32.11, REQ-32.12

## Acceptance criteria
- [ ] Full keyboard navigation (Tab, Shift+Tab, Enter, Space, Arrow keys)
- [ ] Clear focus indicators with 3:1 minimum contrast
- [x] Modal focus trap with return to trigger on close (ConfirmationModal has this)
- [ ] Skip links to main content, navigation, search
- [ ] Descriptive alt text for all images
- [ ] Status conveyed by color + icons/text
- [ ] Form errors associated with inputs via aria-describedby
- [x] Loading states announced via aria-live (ErrorState has this)
- [ ] Semantic table markup with proper headers
- [ ] aria-label for icon-only buttons
- [ ] Text contrast: 4.5:1 normal, 3:1 large
- [ ] 200% text zoom remains functional

## Implementation Notes
- Partial completion: Some components have accessibility features
- ConfirmationModal: Has focus trap, escape handling, ARIA attributes
- ErrorState: Has aria-live="assertive" for screen readers
- Still needed: Comprehensive audit across all admin components
- Status: 🔄 Partially Complete (needs full audit and implementation)
