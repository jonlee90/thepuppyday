# Task 0297: Write Calendar Sync Integration Tests

## Description
Create comprehensive integration tests for two-way calendar synchronization.

## Checklist
- [ ] Test appointment creation triggers calendar event creation
- [ ] Test appointment update triggers calendar event update
- [ ] Test appointment cancellation triggers calendar event deletion
- [ ] Test incoming webhook updates local appointments

## Acceptance Criteria
Two-way sync verified through integration tests

## References
- Requirement 26.15, 26.16, 26.17, 26.18

## Files to Create/Modify
- `__tests__/integration/calendar-sync.test.ts`

## Implementation Notes
Test full sync cycle: local change -> Google Calendar -> webhook -> local update.
