# Task 0295: Write Calendar Webhook API Integration Tests

## Description
Create integration tests for calendar webhook endpoint.

## Checklist
- [ ] Test /api/admin/calendar/webhook with valid Google notifications
- [ ] Test webhook signature validation
- [ ] Test webhook processing of event updates

## Acceptance Criteria
Webhook endpoint processes notifications correctly

## References
- Requirement 26.13

## Files to Create/Modify
- `__tests__/api/admin/calendar/webhook.test.ts`

## Implementation Notes
Create test webhook payloads matching Google Calendar notification format.
