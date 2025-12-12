# Task 0033: Implement confirmation modals for destructive actions

**Group**: Polish & Testing (Week 7)

## Objective
Add confirmation dialogs before destructive operations

## Files to create/modify
- Update components with ConfirmationModal for destructive actions

## Requirements covered
- REQ-28.1, REQ-28.2, REQ-28.3, REQ-28.4, REQ-28.5, REQ-28.6, REQ-28.7, REQ-28.8, REQ-28.9

## Acceptance criteria
- [x] Cancel appointment: "Are you sure?" with reason selection required
- [x] Mark no-show: Warning about customer record impact
- [x] Delete service: Confirmation explaining soft-delete
- [x] Delete gallery image: Confirmation with image thumbnail
- [x] Two buttons: Cancel (secondary) and Confirm (primary, red for destructive)
- [x] Cancel closes modal without action
- [x] Confirm executes action and shows feedback
- [x] "Unsaved changes" dialog when closing forms with edits

## Implementation Notes
- `ConfirmationModal.tsx` already exists with full functionality
- Support for variants: 'default', 'error' (red for destructive actions)
- Focus trap with escape key handling
- Backdrop click to close (when not loading)
- Optional loading state (internal or external management)
- Optional additionalInfo prop for extra content (e.g., cancellation policy)
- Framer Motion animations
- ARIA attributes for accessibility
- Status: ✅ Completed (component exists, ready for integration)
