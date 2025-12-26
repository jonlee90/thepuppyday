# Task 0007: Create OAuth start endpoint

## Description
Create API endpoint to initiate Google OAuth flow.

## Files to Create
- `src/app/api/admin/calendar/auth/start/route.ts`

## Dependencies
- Task 0004 (OAuth client)
- Task 0006 (Connection service)

## Acceptance Criteria
- [ ] POST handler generates OAuth authorization URL
- [ ] Uses `requireAdmin()` middleware
- [ ] Includes admin user ID in state parameter
- [ ] Returns conflict if connection exists
- [ ] Returns redirect URL to Google OAuth
- [ ] Error handling for OAuth failures

## Requirements Coverage
- Req 1.1: OAuth redirect
- Req 2: Admin access control

## Estimated Effort
2 hours
