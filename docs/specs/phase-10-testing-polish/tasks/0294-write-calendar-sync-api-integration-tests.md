# Task 0294: Write Calendar Sync API Integration Tests

## Description
Create integration tests for calendar sync API endpoints.

## Checklist
- [ ] Test /api/admin/calendar/sync/manual endpoint
- [ ] Test /api/admin/calendar/sync/bulk endpoint
- [ ] Test /api/admin/calendar/sync/resync endpoint
- [ ] Test error responses for non-existent appointments

## Acceptance Criteria
All sync endpoints return correct responses

## References
- Requirement 26.12

## Files to Create/Modify
- `__tests__/api/admin/calendar/sync.test.ts`

## Implementation Notes
Mock Google Calendar API. Verify sync operations update database correctly.
