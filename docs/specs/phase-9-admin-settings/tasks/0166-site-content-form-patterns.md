# Task 0166: Site content form patterns (unsaved changes, validation)

## Description
Implement shared form patterns for all settings forms including unsaved changes detection, leave page confirmation, and consistent validation feedback.

## Acceptance Criteria
- [ ] Create `useSettingsForm` custom hook for form state management
- [ ] Track dirty state (unsaved changes) across form fields
- [ ] Display "Unsaved changes" indicator when form is dirty
- [ ] Implement leave page confirmation dialog when navigating away with unsaved changes
- [ ] Create consistent inline error message component
- [ ] Create consistent success toast pattern
- [ ] Implement optimistic UI updates with rollback on failure
- [ ] Create loading state indicator for save operations
- [ ] Implement retry logic for failed saves
- [ ] Track retry count for error recovery

## Implementation Notes
- File: `src/hooks/admin/use-settings-form.ts`
- File: `src/components/admin/settings/UnsavedChangesIndicator.tsx`
- File: `src/components/admin/settings/LeaveConfirmDialog.tsx`
- Use next/navigation's useBeforeUnload or similar pattern
- Follow existing patterns from booking forms

## References
- NFR-3.1, NFR-3.2, NFR-3.3, NFR-3.4
- NFR-4.1
- Design: Form Patterns section

## Complexity
Medium

## Category
Foundation

## Dependencies
- 0160 (Hero section editor)
- 0162 (SEO settings editor)
- 0164 (Business info editor)
