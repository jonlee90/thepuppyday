# Task 0219: E2E tests for critical settings flows

## Description
Write end-to-end tests for the most critical admin settings workflows using Playwright.

## Acceptance Criteria
- [ ] Test site content management flow
  - Navigate to site content settings
  - Update hero headline and subheadline
  - Save and verify success toast
  - Navigate to public homepage
  - Verify updated content appears
- [ ] Test banner management flow
  - Navigate to banner settings
  - Create new banner with image upload
  - Set scheduling dates
  - Activate banner
  - Verify banner appears on public site
  - Track click and verify count updates
- [ ] Test booking settings flow
  - Update advance booking window
  - Add blocked date
  - Navigate to booking widget
  - Verify blocked date is unavailable
  - Verify booking window is enforced
- [ ] Test loyalty settings flow
  - Toggle program on/off
  - Update punch threshold
  - Update earning rules
  - Verify changes are saved
- [ ] Test staff management flow
  - View staff directory
  - Add new staff member
  - Update commission settings
  - View earnings report
- [ ] All tests run in authenticated admin context
- [ ] Tests clean up created data after completion

## Implementation Notes
- File: `e2e/admin/settings/site-content.spec.ts`
- File: `e2e/admin/settings/banners.spec.ts`
- File: `e2e/admin/settings/booking.spec.ts`
- File: `e2e/admin/settings/loyalty.spec.ts`
- File: `e2e/admin/settings/staff.spec.ts`
- Use Playwright test fixtures for admin login

## References
- Design: Testing Strategy section
- All UI component requirements

## Complexity
Large

## Category
Testing

## Dependencies
- All UI tasks completed
- 0214 (Booking flow integration)
- 0215 (Marketing site integration)
