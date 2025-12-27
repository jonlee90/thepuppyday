# Task 0284: Write Calendar Mapping Unit Tests

## Description
Create unit tests for calendar event mapping functions to ensure correct data transformation between appointments and Google Calendar events.

## Checklist
- [ ] Test mapAppointmentToGoogleEvent() for correct field mapping
- [ ] Test mapGoogleEventToAppointment() for reverse mapping
- [ ] Test handling of optional fields and edge cases
- [ ] Test timezone handling in date conversions

## Acceptance Criteria
All mapping functions tested with various appointment types

## References
- Requirement 26.2
- Design 10.5.4

## Files to Create/Modify
- `__tests__/lib/calendar/mapping.test.ts`

## Implementation Notes
Test with appointments that have different configurations (with/without addons, different services, etc.).
