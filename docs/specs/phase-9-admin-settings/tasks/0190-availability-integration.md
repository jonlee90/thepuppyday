# Task 0190: Integration with availability API

## Description
Integrate booking settings with the existing availability calculation system.

## Acceptance Criteria
- [ ] Update availability calculation to check blocked_dates
- [ ] Update availability calculation to check recurring_blocked_days
- [ ] Apply min_advance_hours when determining earliest bookable slot
- [ ] Apply max_advance_days when determining latest bookable date
- [ ] Apply buffer_minutes between appointments in availability check
- [ ] Update booking calendar to grey out dates beyond max_advance_days
- [ ] Show "Too soon" message for slots within min_advance_hours
- [ ] Show blocked date reason in tooltip on calendar
- [ ] Create `getBookingSettings` utility for availability functions
- [ ] Ensure settings are cached appropriately for performance

## Implementation Notes
- Update: `src/lib/booking/availability.ts` or equivalent
- File: `src/lib/admin/booking-settings.ts` for utility functions
- Use Supabase caching or React Query for settings

## References
- Req 8.5, Req 8.6, Req 10.3, Req 10.6
- IR-2.1, IR-2.2, IR-2.3
- Design: Booking System Integration section

## Complexity
Large

## Category
Integration

## Dependencies
- 0180 (Booking settings API)
- 0185 (Blocked dates API)
