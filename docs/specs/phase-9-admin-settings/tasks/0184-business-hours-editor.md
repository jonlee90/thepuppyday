# Task 0184: Business hours editor enhancement

## Description
Enhance the existing business hours editor to support booking-specific hours and multiple time ranges per day.

## Acceptance Criteria
- [ ] Create/enhance `BusinessHoursEditor` component
- [ ] Display operating hours for each day of the week (Mon-Sun)
- [ ] For each day, allow setting: open time, close time, available for booking toggle
- [ ] Validate close time is after open time
- [ ] Allow marking individual days as closed (grey out in booking calendar)
- [ ] Support multiple time ranges per day (for lunch breaks, split shifts)
- [ ] Add/remove time range buttons for each day
- [ ] Show warning if booking hours differ from displayed business hours
- [ ] Store hours in settings table under 'business_hours' key
- [ ] Time pickers in 15-minute increments
- [ ] Display visual weekly schedule preview

## Implementation Notes
- File: `src/components/admin/settings/booking/BusinessHoursEditor.tsx`
- Use time picker component (react-time-picker or custom)
- Consider using existing hours editor if available and extending it

## References
- Req 11.1, Req 11.2, Req 11.3, Req 11.4, Req 11.5, Req 11.6, Req 11.7, Req 11.8
- Design: Business Hours Editor section

## Complexity
Medium

## Category
UI

## Dependencies
- 0180 (Booking settings API)
