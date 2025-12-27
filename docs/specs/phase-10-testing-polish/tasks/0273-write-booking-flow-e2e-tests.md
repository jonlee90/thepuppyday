# Task 0273: Write Booking Flow E2E Tests

## Description
Create comprehensive end-to-end tests for the complete booking flow to ensure critical path works correctly.

## Checklist
- [ ] Test guest complete booking flow (service -> date -> pet -> contact -> confirm)
- [ ] Test registered customer booking with saved pet
- [ ] Test handling of fully-booked slots with waitlist option
- [ ] Test add-on selection and price calculation
- [ ] Test form validation and error messages

## Acceptance Criteria
All booking flow scenarios pass, tests run in under 2 minutes

## References
- Requirement 23.1
- Design 10.5.1

## Files to Create/Modify
- `e2e/pages/booking.spec.ts`

## Implementation Notes
Use test fixtures from e2e/fixtures/auth.ts for authenticated customer tests.
