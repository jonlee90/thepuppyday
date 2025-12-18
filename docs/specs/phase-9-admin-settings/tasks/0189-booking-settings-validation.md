# Task 0189: Booking settings validation

## Description
Implement comprehensive validation for all booking settings with clear error messages.

## Acceptance Criteria
- [ ] Create Zod schema for BookingSettings validation
- [ ] Validate min_advance_hours: integer, 0-168
- [ ] Validate max_advance_days: integer, 7-365
- [ ] Validate max_advance_days >= min_advance_hours (in days)
- [ ] Validate cancellation_cutoff_hours: integer, 0-72
- [ ] Validate buffer_minutes: integer, 0-60, divisible by 5
- [ ] Validate business_hours: each day has valid time ranges
- [ ] Validate blocked_dates: valid date format, end_date >= date
- [ ] Validate recurring_blocked_days: array of integers 0-6
- [ ] Display inline validation errors in UI
- [ ] Prevent save when validation fails
- [ ] Show cross-field validation warnings (e.g., all days blocked)

## Implementation Notes
- File: `src/lib/validation/booking-settings.ts`
- Integrate with react-hook-form for real-time validation
- Use Zod refinements for cross-field validation

## References
- Req 8.4, Req 9.2, Req 10.2, Req 11.4
- NFR-3.3
- Design: Input Validation section

## Complexity
Small

## Category
Validation

## Dependencies
- 0180 (Booking settings API)
- 0181-0188 (All booking settings components)
