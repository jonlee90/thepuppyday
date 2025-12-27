# Task 0289: Write Calendar OAuth E2E Tests

## Description
Create end-to-end tests for Google Calendar OAuth connection flow.

## Checklist
- [ ] Test OAuth connection flow (start -> redirect -> callback)
- [ ] Test OAuth disconnection flow
- [ ] Test service account connection flow
- [ ] Test error handling during OAuth process

## Acceptance Criteria
OAuth flows complete successfully in E2E tests

## References
- Requirement 26.6, 26.7

## Files to Create/Modify
- `e2e/admin/calendar-oauth.spec.ts`

## Implementation Notes
Mock Google OAuth endpoints or use test Google account. Handle redirects properly in tests.
