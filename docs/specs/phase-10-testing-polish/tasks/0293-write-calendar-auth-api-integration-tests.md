# Task 0293: Write Calendar Auth API Integration Tests

## Description
Create integration tests for calendar authentication API endpoints.

## Checklist
- [ ] Test /api/admin/calendar/auth/start endpoint
- [ ] Test /api/admin/calendar/auth/callback endpoint
- [ ] Test /api/admin/calendar/auth/disconnect endpoint

## Acceptance Criteria
All auth endpoints return correct responses

## References
- Requirement 26.11

## Files to Create/Modify
- `__tests__/api/admin/calendar/auth.test.ts`

## Implementation Notes
Mock OAuth token exchange. Verify database stores credentials correctly.
