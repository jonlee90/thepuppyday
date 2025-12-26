# Task 0004: Create Google OAuth client factory

## Description
Create factory functions for Google OAuth 2.0 client with proper scope configuration and token exchange.

## Files to Create
- `src/lib/calendar/oauth.ts` - OAuth client factory
- `src/lib/calendar/__tests__/oauth.test.ts` - Unit tests

## Dependencies
- Task 0001 (TypeScript types)
- Task 0003 (Encryption utilities)

## Acceptance Criteria
- [ ] `createOAuth2Client()` factory function implemented
- [ ] Scope constants defined (calendar.events permission)
- [ ] `generateAuthUrl()` implemented with offline access and consent prompt
- [ ] `exchangeCodeForTokens()` implemented for authorization code exchange
- [ ] `revokeTokens()` implemented for disconnection
- [ ] Unit tests with mocked googleapis package
- [ ] All tests pass

## Implementation Notes
- Install googleapis package: `npm install googleapis`
- Use google.auth.OAuth2 from googleapis
- Redirect URI should match callback endpoint
- Request offline access for refresh tokens
- Include force consent prompt for initial authorization

## Requirements Coverage
- Req 1: OAuth Authentication
- Req 6.1: Minimum required scopes

## Estimated Effort
3 hours
