# Task 0008: Create OAuth callback endpoint

## Description
Handle OAuth callback from Google and store tokens.

## Files to Create
- `src/app/api/admin/calendar/auth/callback/route.ts`

## Dependencies
- Task 0005 (Token manager)
- Task 0006 (Connection service)

## Acceptance Criteria
- [ ] GET handler processes OAuth callback
- [ ] Validates state parameter matches admin user
- [ ] Exchanges code for tokens
- [ ] Encrypts and stores tokens
- [ ] Fetches calendar metadata
- [ ] Redirects to settings page with status
- [ ] Error handling for failures

## Requirements Coverage
- Req 1.1-1.5: OAuth flow
- Req 15: Secure storage

## Estimated Effort
3 hours
