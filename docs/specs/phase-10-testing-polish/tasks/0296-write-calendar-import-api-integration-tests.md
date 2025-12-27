# Task 0296: Write Calendar Import API Integration Tests

## Description
Create integration tests for calendar import API endpoints.

## Checklist
- [ ] Test /api/admin/calendar/import/preview endpoint
- [ ] Test /api/admin/calendar/import/confirm endpoint
- [ ] Test handling of large date ranges

## Acceptance Criteria
Import endpoints return correct preview and confirmation

## References
- Requirement 26.14

## Files to Create/Modify
- `__tests__/api/admin/calendar/import.test.ts`

## Implementation Notes
Mock calendar events for various dates. Test deduplication logic.
