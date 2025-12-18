# Task 0203: Staff management API routes

## Description
Create API routes for listing and managing staff members (groomers and admins).

## Acceptance Criteria
- [ ] Create GET `/api/admin/settings/staff` to list all staff
- [ ] Filter by role: groomer, admin, or all
- [ ] Filter by status: active, inactive, or all
- [ ] Return staff with: user info, appointment_count, upcoming_appointments, avg_rating (if available), commission settings
- [ ] Create POST `/api/admin/settings/staff` to add new staff member
- [ ] Accept: email, first_name, last_name, phone (optional), role (groomer/admin)
- [ ] Create user record with specified role
- [ ] Validate email uniqueness
- [ ] Send invitation email to new staff member (optional)
- [ ] Implement `requireAdmin()` authentication check
- [ ] Create audit log entry for staff changes

## Implementation Notes
- File: `src/app/api/admin/settings/staff/route.ts`
- Query users table with role IN ('groomer', 'admin')
- Join with appointments for counts
- Consider pagination for large staff lists

## References
- Req 17.1, Req 17.2, Req 17.3, Req 17.7, Req 17.8
- Design: Staff Management API section

## Complexity
Medium

## Category
API

## Dependencies
- 0155 (Database migrations)
- 0156 (TypeScript types)
