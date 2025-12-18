# Task 0216: Unit tests for validation logic

## Description
Write comprehensive unit tests for all validation schemas and functions.

## Acceptance Criteria
- [ ] Test BookingSettings validation schema
  - Valid min_advance_hours range (0-168)
  - Valid max_advance_days range (7-365)
  - Valid cancellation_cutoff_hours range (0-72)
  - Valid buffer_minutes (0-60, divisible by 5)
  - Invalid values are rejected
- [ ] Test HeroContent validation schema
  - Headline max 100 chars
  - Subheadline max 200 chars
  - CTA buttons max 2
  - Valid URL format for CTAs
- [ ] Test SeoSettings validation schema
  - Page title max 60 chars
  - Meta description max 160 chars
  - Valid URL format for OG image
- [ ] Test BusinessInfo validation schema
  - Valid phone format
  - Valid email format
  - Valid zip code format
  - Valid URL format for social links
- [ ] Test commission rate validation
  - Percentage 0-100
  - Flat rate >= 0
- [ ] Test blocked dates validation
  - Valid date format
  - End date >= start date

## Implementation Notes
- File: `__tests__/lib/validation/booking-settings.test.ts`
- File: `__tests__/lib/validation/site-content.test.ts`
- File: `__tests__/lib/validation/business-info.test.ts`
- Use vitest for test framework

## References
- All validation requirements from Req 8, 9, 10, 11, 12
- Design: Input Validation section

## Complexity
Medium

## Category
Testing

## Dependencies
- 0156 (TypeScript types)
- 0165 (Business info validation)
- 0189 (Booking settings validation)
