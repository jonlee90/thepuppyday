# Task 0213: Groomer filtering in calendar

## Description
Add groomer filtering functionality to the appointment calendar for viewing individual groomer schedules.

## Acceptance Criteria
- [ ] Add groomer filter dropdown to appointment calendar header
- [ ] Options: "All Groomers", individual groomer names
- [ ] Filter calendar to show only selected groomer's appointments
- [ ] Show appointments in groomer's color when filtering by individual
- [ ] Update availability calculation to consider groomer schedules if configured
- [ ] Each groomer can have their own schedule (future enhancement placeholder)
- [ ] Display groomer name badge on each appointment card
- [ ] Quick toggle buttons for each groomer (if few groomers)
- [ ] Remember last selected filter in localStorage
- [ ] Update day/week/month views with filter

## Implementation Notes
- Update: Appointment calendar component
- Add groomer color assignment utility
- Consider groomer-specific business hours in future

## References
- Req 20.4, Req 20.6, Req 20.8
- Design: Groomer Calendar section

## Complexity
Medium

## Category
UI, Integration

## Dependencies
- 0203 (Staff management API)
- 0211 (Appointment assignment)
