# Task 0282: Write Auth and Customer API Integration Tests

## Description
Create integration tests for authentication and customer management API endpoints.

## Checklist
- [ ] Test /api/auth/* endpoints (login, register, logout, refresh)
- [ ] Test /api/customer/profile endpoint
- [ ] Test /api/customer/pets endpoint
- [ ] Test /api/customer/appointments endpoint

## Acceptance Criteria
All auth and customer API routes tested

## References
- Requirement 25.2, 25.3

## Files to Create/Modify
- `__tests__/api/auth/login.test.ts`
- `__tests__/api/auth/register.test.ts`
- `__tests__/api/customer/profile.test.ts`
- `__tests__/api/customer/pets.test.ts`
- `__tests__/api/customer/appointments.test.ts`

## Implementation Notes
Test both authenticated and unauthenticated requests. Verify proper 401 responses.
