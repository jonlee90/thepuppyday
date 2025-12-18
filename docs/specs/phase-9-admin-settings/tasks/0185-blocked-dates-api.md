# Task 0185: Blocked dates API routes

## Description
Create API routes for managing blocked dates including single dates, date ranges, and reasons.

## Acceptance Criteria
- [ ] Create GET `/api/admin/settings/booking/blocked-dates` to fetch blocked dates
- [ ] Return array of blocked dates with date, end_date, reason
- [ ] Create POST `/api/admin/settings/booking/blocked-dates` to add blocked date
- [ ] Accept: date (required), end_date (optional for ranges), reason (optional)
- [ ] Validate date format (YYYY-MM-DD)
- [ ] Check for existing appointments on blocked date(s)
- [ ] Return affected_appointments count in response
- [ ] Create DELETE `/api/admin/settings/booking/blocked-dates` to remove blocked date
- [ ] Accept: date or dates array for bulk delete
- [ ] Store blocked dates in settings table under 'booking_settings.blocked_dates' array
- [ ] Return 409 Conflict if blocking date with appointments (require confirmation)
- [ ] Implement `requireAdmin()` authentication check

## Implementation Notes
- File: `src/app/api/admin/settings/booking/blocked-dates/route.ts`
- Use Zod for date validation
- Consider separate confirmation endpoint for blocking dates with appointments

## References
- Req 12.1, Req 12.2, Req 12.3, Req 12.5, Req 12.6, Req 12.7
- Design: Blocked Dates API section

## Complexity
Medium

## Category
API

## Dependencies
- 0180 (Booking settings API)
