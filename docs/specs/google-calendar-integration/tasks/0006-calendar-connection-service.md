# Task 0006: Create calendar connection service

## Description
Create service layer for managing calendar connections in database.

## Files to Create
- `src/lib/calendar/connection.ts`
- `src/lib/calendar/__tests__/connection.test.ts`

## Dependencies
- Task 0002 (Database migration)
- Task 0005 (Token manager)

## Acceptance Criteria
- [ ] `getActiveConnection()` fetches admin's calendar connection
- [ ] `createConnection()` stores new OAuth connection
- [ ] `deleteConnection()` revokes and cleans up
- [ ] `updateConnectionMetadata()` for calendar selection changes
- [ ] Unit tests with mocked Supabase
- [ ] All tests pass

## Requirements Coverage
- Req 1: OAuth
- Req 9: Calendar Selection

## Estimated Effort
2 hours
