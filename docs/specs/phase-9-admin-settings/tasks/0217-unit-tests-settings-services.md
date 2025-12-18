# Task 0217: Unit tests for settings services

## Description
Write unit tests for settings utility functions and services.

## Acceptance Criteria
- [ ] Test getSiteContent utility
  - Returns content for valid keys
  - Returns default for missing content
  - Handles database errors gracefully
- [ ] Test getBookingSettings utility
  - Returns settings with defaults for missing values
  - Merges saved settings with defaults
- [ ] Test isDateBlocked utility
  - Returns true for blocked dates
  - Returns true for recurring blocked days
  - Returns false for open dates
  - Handles date ranges correctly
- [ ] Test isWithinBookingWindow utility
  - Returns true for dates within window
  - Returns false for dates too soon
  - Returns false for dates too far out
- [ ] Test commission calculation
  - Calculates percentage correctly
  - Calculates flat rate correctly
  - Applies service overrides
  - Includes/excludes add-ons based on setting
- [ ] Test audit logging function
  - Creates log entry with correct fields
  - Handles JSONB serialization

## Implementation Notes
- File: `__tests__/lib/admin/site-content.test.ts`
- File: `__tests__/lib/admin/booking-settings.test.ts`
- File: `__tests__/lib/admin/commission.test.ts`
- Mock Supabase client for database calls

## References
- Design: All utility function sections

## Complexity
Medium

## Category
Testing

## Dependencies
- 0159 (Site content API)
- 0180 (Booking settings API)
- 0207 (Commission settings API)
