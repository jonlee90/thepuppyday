# Task 0180: Booking settings API routes

## Description
Create API routes for managing booking configuration including advance booking window, cancellation policy, and buffer time.

## Acceptance Criteria
- [ ] Create GET `/api/admin/settings/booking` to fetch all booking settings
- [ ] Return: min_advance_hours, max_advance_days, cancellation_cutoff_hours, buffer_minutes, business_hours, blocked_dates, recurring_blocked_days
- [ ] Create PUT `/api/admin/settings/booking` to update booking settings
- [ ] Accept partial updates for any booking setting field
- [ ] Validate min_advance_hours: 0-168 (1 week max)
- [ ] Validate max_advance_days: 7-365
- [ ] Validate cancellation_cutoff_hours: 0-72
- [ ] Validate buffer_minutes: 0-60, must be in 5-minute increments
- [ ] Store settings in `settings` table with key 'booking_settings'
- [ ] Implement `requireAdmin()` authentication check
- [ ] Create audit log entries for changes
- [ ] Return success response with updated settings

## Implementation Notes
- File: `src/app/api/admin/settings/booking/route.ts`
- Use Zod for validation
- Settings stored as JSONB in settings table

## References
- Req 8.1, Req 8.2, Req 8.3, Req 8.4, Req 8.7
- Req 9.1, Req 9.2, Req 9.5
- Req 10.1, Req 10.2, Req 10.8
- Design: Booking Settings API section

## Complexity
Medium

## Category
API

## Dependencies
- 0155 (Database migrations)
- 0156 (TypeScript types)
