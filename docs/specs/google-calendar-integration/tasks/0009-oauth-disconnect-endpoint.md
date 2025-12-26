# Task 0009: Create OAuth disconnect endpoint

## Description
Create endpoint to disconnect Google Calendar and clean up data.

## Files to Create
- `src/app/api/admin/calendar/auth/disconnect/route.ts`

## Dependencies
- Task 0004 (OAuth client)
- Task 0006 (Connection service)

## Acceptance Criteria
- [ ] POST handler disconnects Google Calendar
- [ ] Revokes tokens with Google API
- [ ] Deletes all event mappings
- [ ] Deletes connection entry
- [ ] Stops active webhooks
- [ ] Logs disconnection event

## Requirements Coverage
- Req 1.4: Token revocation
- Req 16: Data cleanup

## Estimated Effort
2 hours
