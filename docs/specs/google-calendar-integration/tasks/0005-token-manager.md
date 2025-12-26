# Task 0005: Create token manager with auto-refresh

## Description
Implement token manager that automatically refreshes expired OAuth tokens.

## Files to Create
- `src/lib/calendar/token-manager.ts`
- `src/lib/calendar/__tests__/token-manager.test.ts`

## Dependencies
- Task 0003 (Encryption utilities)
- Task 0004 (OAuth client)

## Acceptance Criteria
- [ ] `getValidAccessToken()` checks expiry and refreshes if needed
- [ ] `refreshAccessToken()` uses refresh token
- [ ] `storeTokens()` encrypts and persists tokens
- [ ] Token refresh error handling with automatic disconnection
- [ ] Unit tests for refresh logic
- [ ] All tests pass

## Requirements Coverage
- Req 1.3: Token refresh mechanism
- Req 15: Token encryption

## Estimated Effort
2 hours
