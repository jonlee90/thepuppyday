# Task 0265: Implement Modal Keyboard Support

## Description
Add comprehensive keyboard support to Modal component for better accessibility.

## Checklist
- [ ] Add keyboard focus trap to Modal component
- [ ] Implement Escape key to close modal
- [ ] Store and restore previous focus on modal close
- [ ] Prevent body scroll when modal is open

## Acceptance Criteria
Focus trapped in modal, Escape closes modal, focus returns to trigger element

## References
- Requirement 19.2, 19.3
- Design 10.4.3

## Files to Create/Modify
- `src/components/ui/Modal.tsx`

## Implementation Notes
Use createFocusTrap utility from src/lib/accessibility/focus.ts.
