# Task 0187: Blocked dates calendar visualization

## Description
Create a calendar view for visualizing and managing blocked dates.

## Acceptance Criteria
- [ ] Create `BlockedDatesCalendar` component
- [ ] Display monthly calendar view
- [ ] Highlight blocked dates in red/gray
- [ ] Show reason tooltip on hover over blocked date
- [ ] Click on date to toggle blocked status
- [ ] Click and drag to select date range
- [ ] Show existing appointments as dots on calendar dates
- [ ] Different colors for: open, blocked, has appointments, blocked with appointments
- [ ] Navigation arrows for month switching
- [ ] "Today" button to jump to current month
- [ ] Mini calendar view for quick overview
- [ ] Sync with blocked dates list component

## Implementation Notes
- File: `src/components/admin/settings/booking/BlockedDatesCalendar.tsx`
- Use react-calendar or custom calendar component
- Consider using existing calendar from booking system if available

## References
- Req 12.1, Req 12.4
- Design: Blocked Dates Manager section

## Complexity
Medium

## Category
UI

## Dependencies
- 0186 (Blocked dates manager)
