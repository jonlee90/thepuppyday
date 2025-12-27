# Task 0258: Enhance Button with Loading State

## Description
Add loading state functionality to Button component for better user feedback during async operations.

## Checklist
- [ ] Add isLoading and loadingText props to Button component
- [ ] Implement spinner animation inside button
- [ ] Auto-disable button when loading
- [ ] Maintain button dimensions during loading state

## Acceptance Criteria
Buttons show loading spinner, remain same size, disabled during loading

## References
- Requirement 16.2, 16.6
- Design 10.4.1

## Files to Create/Modify
- `src/components/ui/button.tsx`

## Implementation Notes
Use existing spinner component or create simple inline SVG spinner.
