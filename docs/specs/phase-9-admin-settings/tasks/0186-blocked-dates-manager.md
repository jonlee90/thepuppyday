# Task 0186: Blocked dates manager component

## Description
Create the blocked dates manager component for adding, viewing, and removing blocked dates.

## Acceptance Criteria
- [ ] Create `BlockedDatesManager` component
- [ ] Display list of currently blocked dates with reasons
- [ ] Show blocked date ranges as expandable groups
- [ ] Add single date button with date picker
- [ ] Add date range button with start/end date pickers
- [ ] Optional reason input for each blocked date
- [ ] Remove button for each blocked date with confirmation
- [ ] Warning dialog when blocking date with existing appointments
- [ ] Display appointment count for dates being blocked
- [ ] "Force block" option to proceed despite appointments
- [ ] Success toast on add/remove operations
- [ ] Sort blocked dates chronologically

## Implementation Notes
- File: `src/components/admin/settings/booking/BlockedDatesManager.tsx`
- Use DaisyUI list component
- Date picker should support selecting past dates (for records)

## References
- Req 12.1, Req 12.2, Req 12.3, Req 12.5, Req 12.6
- Design: Blocked Dates Manager section

## Complexity
Medium

## Category
UI

## Dependencies
- 0185 (Blocked dates API)
