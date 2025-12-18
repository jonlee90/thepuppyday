# Task 0218: Integration tests for API endpoints

## Description
Write integration tests for all Phase 9 API endpoints.

## Acceptance Criteria
- [ ] Test site content API
  - GET returns all content sections
  - PUT updates specific section
  - Validates input and returns errors
  - Creates audit log entry
- [ ] Test banner API
  - GET returns filtered banners by status
  - POST creates banner with validation
  - PUT updates banner fields
  - DELETE soft-deletes with analytics
  - Reorder updates display_order
- [ ] Test booking settings API
  - GET returns all settings with defaults
  - PUT updates partial settings
  - Blocked dates CRUD operations
- [ ] Test loyalty settings API
  - GET returns settings with stats
  - PUT updates program settings
  - Earning rules update
  - Redemption rules update
  - Referral program update
- [ ] Test staff management API
  - GET returns staff with stats
  - POST creates new staff
  - PUT updates staff
  - Commission settings CRUD
  - Earnings report with filters
- [ ] All endpoints require admin authentication
- [ ] All endpoints return proper error responses

## Implementation Notes
- File: `__tests__/api/admin/settings/site-content.test.ts`
- File: `__tests__/api/admin/settings/banners.test.ts`
- File: `__tests__/api/admin/settings/booking.test.ts`
- File: `__tests__/api/admin/settings/loyalty.test.ts`
- File: `__tests__/api/admin/settings/staff.test.ts`
- Use msw for API mocking or test against mock Supabase

## References
- All API routes from Design document

## Complexity
Large

## Category
Testing

## Dependencies
- All API route tasks (0159, 0169-0171, 0180, 0185, 0192, 0195, 0197, 0199, 0203, 0207, 0209)
