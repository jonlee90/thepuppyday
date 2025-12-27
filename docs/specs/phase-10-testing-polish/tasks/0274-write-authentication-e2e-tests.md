# Task 0274: Write Authentication E2E Tests

## Description
Create end-to-end tests for authentication flows to ensure login, registration, and password reset work correctly.

## Checklist
- [ ] Test customer registration flow
- [ ] Test customer login flow
- [ ] Test admin login flow
- [ ] Test session expiration and re-authentication
- [ ] Test password reset flow

## Acceptance Criteria
All auth flows tested, proper redirects verified

## References
- Requirement 23.2

## Files to Create/Modify
- `e2e/pages/auth.spec.ts`

## Implementation Notes
Mock email sending for password reset tests. Verify redirects to correct pages after login.
