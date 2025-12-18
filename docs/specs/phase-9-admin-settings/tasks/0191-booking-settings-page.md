# Task 0191: Booking settings page assembly

## Description
Create the main booking settings page that combines all booking configuration components.

## Acceptance Criteria
- [ ] Create page at `src/app/(admin)/settings/booking/page.tsx`
- [ ] Create `BookingSettingsClient` client component
- [ ] Include breadcrumb navigation back to settings dashboard
- [ ] Organize components in logical sections with headers:
  - Booking Window (advance booking settings)
  - Cancellation Policy
  - Appointment Buffer
  - Business Hours
  - Blocked Dates (manager + calendar + recurring)
- [ ] Implement tabbed or accordion layout for sections
- [ ] Load all settings on page load
- [ ] Handle loading state with skeleton
- [ ] Handle error state with retry
- [ ] Add "Save All" button for batch updates
- [ ] Individual section saves should also work
- [ ] Success toast after saves

## Implementation Notes
- File: `src/app/(admin)/settings/booking/page.tsx`
- File: `src/components/admin/settings/booking/BookingSettingsClient.tsx`
- Consider using DaisyUI collapse/accordion for sections
- Server component fetches initial data

## References
- Req 8.1, Req 9.1, Req 10.1, Req 11.1, Req 12.1
- Design: Component Hierarchy - Booking section

## Complexity
Medium

## Category
UI

## Dependencies
- 0180-0189 (All booking settings tasks)
