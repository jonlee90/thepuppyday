# Task 0266: Implement Dropdown Keyboard Navigation

## Description
Add keyboard navigation support to all dropdown components for full keyboard accessibility.

## Checklist
- [ ] Add arrow key navigation to dropdown components
- [ ] Implement Enter key to select options
- [ ] Support Home/End keys for first/last item
- [ ] Add proper ARIA roles (listbox, option)

## Acceptance Criteria
All dropdowns navigable with keyboard, proper ARIA attributes

## References
- Requirement 19.4

## Files to Create/Modify
- `src/components/ui/Dropdown.tsx`
- `src/components/ui/Select.tsx`

## Implementation Notes
Follow WAI-ARIA listbox pattern for accessible dropdown navigation.
