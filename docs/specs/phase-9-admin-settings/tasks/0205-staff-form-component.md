# Task 0205: Staff form component (create/edit)

## Description
Create the staff form component for adding new staff members and editing existing ones.

## Acceptance Criteria
- [ ] Create `StaffForm` component (modal or page)
- [ ] Support create mode (no staff prop) and edit mode (staff prop provided)
- [ ] Form fields: first_name (required), last_name (required), email (required), phone (optional), role (required)
- [ ] Role selector: groomer or admin
- [ ] For edit mode: active status toggle
- [ ] Email validation and uniqueness check
- [ ] Phone number formatting/validation
- [ ] Confirmation when deactivating staff with upcoming appointments
- [ ] Display upcoming appointments count when deactivating
- [ ] Save creates or updates via staff API
- [ ] Success toast on save
- [ ] Error handling with inline messages

## Implementation Notes
- File: `src/components/admin/settings/staff/StaffForm.tsx`
- Use DaisyUI modal or drawer
- Integrate with react-hook-form

## References
- Req 17.2, Req 17.3, Req 17.4, Req 17.5
- Design: Staff Form section

## Complexity
Medium

## Category
UI

## Dependencies
- 0203 (Staff management API)
