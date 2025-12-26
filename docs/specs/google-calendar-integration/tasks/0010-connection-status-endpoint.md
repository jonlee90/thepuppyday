# Task 0010: Create connection status endpoint

## Description
API endpoint to return current calendar connection status.

## Files to Create
- `src/app/api/admin/calendar/connection/route.ts`

## Dependencies
- Task 0006 (Connection service)

## Acceptance Criteria
- [ ] GET handler returns connection status
- [ ] Returns isConnected, email, calendar ID, last sync
- [ ] Includes webhook status
- [ ] Handles missing connection gracefully
- [ ] Admin-only access

## Requirements Coverage
- Req 13: Settings UI
- Req 12: Sync status

## Estimated Effort
1 hour
