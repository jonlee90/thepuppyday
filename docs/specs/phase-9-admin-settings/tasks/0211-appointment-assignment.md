# Task 0211: Appointment assignment enhancement

## Description
Enhance the appointment system to support groomer assignment and customer preferences.

## Acceptance Criteria
- [ ] Add groomer assignment dropdown to appointment detail view
- [ ] Dropdown shows all active groomers
- [ ] Update `groomer_id` field on appointment when assigned
- [ ] Show unassigned appointments in "Unassigned" section/filter
- [ ] Allow customers to select preferred groomer during booking (when multiple active)
- [ ] Pre-select customer's preferred groomer if they have one and groomer is available
- [ ] Log groomer assignment changes
- [ ] Optionally notify customer when groomer assignment changes
- [ ] Create notification toggle for assignment change notifications
- [ ] Update appointment calendar to show groomer color coding

## Implementation Notes
- Update: Appointment detail component
- Update: Booking widget service selection
- Consider customer preference storage in customer record
- Add groomer_id filter to calendar/appointment list

## References
- Req 20.1, Req 20.2, Req 20.3, Req 20.4, Req 20.5, Req 20.6, Req 20.7
- Design: Appointment Assignment section

## Complexity
Medium

## Category
UI, Integration

## Dependencies
- 0203 (Staff management API)
