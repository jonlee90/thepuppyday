# Task 0212: Staff management page assembly

## Description
Create the main staff management page that combines staff directory, forms, and earnings reports.

## Acceptance Criteria
- [ ] Create page at `src/app/(admin)/settings/staff/page.tsx`
- [ ] Create `StaffManagementClient` client component
- [ ] Include breadcrumb navigation back to settings dashboard
- [ ] Display staff directory as main view
- [ ] "Add Staff" button opens StaffForm modal
- [ ] Tab or section for Earnings Report
- [ ] Handle single-groomer mode gracefully with explanatory message
- [ ] Loading skeleton while data fetches
- [ ] Error state with retry
- [ ] Success toasts for CRUD operations
- [ ] Integrate staff detail view (modal or nested route)

## Implementation Notes
- File: `src/app/(admin)/settings/staff/page.tsx`
- File: `src/components/admin/settings/staff/StaffManagementClient.tsx`
- Consider nested routes for staff/[id] detail pages
- Server component fetches initial staff list

## References
- Req 17.1, Req 17.7
- Design: Component Hierarchy - Staff section

## Complexity
Medium

## Category
UI

## Dependencies
- 0203-0211 (All staff management tasks)
