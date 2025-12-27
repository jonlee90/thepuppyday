# Task 0286: Write OAuth Token Refresh Unit Tests

## Description
Create unit tests for OAuth token refresh functionality to ensure tokens are refreshed correctly before expiration.

## Checklist
- [ ] Test token refresh logic when access token expired
- [ ] Test handling of refresh token failure
- [ ] Test token storage and retrieval

## Acceptance Criteria
Token refresh scenarios covered including failure cases

## References
- Requirement 26.1

## Files to Create/Modify
- `__tests__/lib/calendar/oauth.test.ts`

## Implementation Notes
Mock Google OAuth endpoints. Test both successful refresh and failure scenarios.
