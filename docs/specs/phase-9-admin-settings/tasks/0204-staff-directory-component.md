# Task 0204: Staff directory component

## Description
Create the staff directory component that displays all staff members with their details and quick stats.

## Acceptance Criteria
- [ ] Create `StaffDirectory` component
- [ ] Support grid and list view toggle
- [ ] Display staff card with: name, email, phone, role badge, status badge
- [ ] Show quick stats per groomer: appointment count, avg rating
- [ ] Status indicators: Active (green), Inactive (gray)
- [ ] Role badges: Admin (purple), Groomer (blue)
- [ ] Search/filter by name, email
- [ ] Filter by role dropdown
- [ ] Filter by status toggle
- [ ] Edit button navigates to staff detail/edit
- [ ] Empty state message for single-groomer mode explaining multi-groomer features
- [ ] Loading skeleton while data fetches

## Implementation Notes
- File: `src/components/admin/settings/staff/StaffDirectory.tsx`
- Use DaisyUI card for grid view, table for list view
- Consider virtualization for large staff lists

## References
- Req 17.1, Req 17.4, Req 17.6, Req 17.7
- Design: Staff Directory section

## Complexity
Medium

## Category
UI

## Dependencies
- 0203 (Staff management API)
