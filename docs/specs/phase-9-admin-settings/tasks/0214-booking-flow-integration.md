# Task 0214: Integration with booking flow

## Description
Ensure all booking settings are properly integrated with the customer-facing booking flow.

## Acceptance Criteria
- [ ] Booking widget loads booking settings on initialization
- [ ] Calendar respects max_advance_days when showing available dates
- [ ] Calendar greys out blocked dates with tooltip showing reason
- [ ] Calendar greys out recurring blocked days (weekly closures)
- [ ] Time slots respect min_advance_hours for earliest bookable slot
- [ ] Buffer time is applied between appointments in availability check
- [ ] Cancellation policy is displayed on booking confirmation page
- [ ] Cancellation deadline is calculated and shown to customer
- [ ] Business hours are used to generate time slot options
- [ ] Groomer selection is available when multiple groomers active
- [ ] Customer groomer preference is pre-selected if available
- [ ] Write automated test for booking settings integration

## Implementation Notes
- Update: Booking widget components
- Update: Availability calculation functions
- Ensure settings are loaded efficiently (caching)

## References
- IR-2.1, IR-2.2, IR-2.3
- Req 8.5, Req 8.6, Req 9.6, Req 10.3, Req 11.7, Req 12.4, Req 20.5
- Design: Booking System Integration section

## Complexity
Large

## Category
Integration

## Dependencies
- 0190 (Availability integration)
- 0191 (Booking settings page)
