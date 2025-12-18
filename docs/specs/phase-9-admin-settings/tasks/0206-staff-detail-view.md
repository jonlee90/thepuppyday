# Task 0206: Staff detail view component

## Description
Create the staff detail view component that displays comprehensive information about a staff member.

## Acceptance Criteria
- [ ] Create GET `/api/admin/settings/staff/[id]` API route
- [ ] Return staff details with: profile info, upcoming appointments, completed count, avg rating, commission settings
- [ ] Create `StaffDetail` component
- [ ] Display profile section with name, email, phone, role, status
- [ ] Display statistics section:
  - Total appointments completed
  - Upcoming appointments (next 7 days)
  - Average rating (if reviews available)
- [ ] Display recent appointments list (last 10)
- [ ] Link to full appointment history
- [ ] Edit button opens StaffForm in edit mode
- [ ] Deactivate button with confirmation
- [ ] Link to commission settings

## Implementation Notes
- API File: `src/app/api/admin/settings/staff/[id]/route.ts`
- Component File: `src/components/admin/settings/staff/StaffDetail.tsx`
- Consider creating a staff detail page or modal

## References
- Req 17.4, Req 17.5, Req 17.6
- Design: Staff Directory section

## Complexity
Medium

## Category
API, UI

## Dependencies
- 0203 (Staff management API)
- 0204 (Staff directory)
