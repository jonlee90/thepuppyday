# Task 0120: Create template list API

## Description
Create API endpoint to list all notification templates with filtering.

## Acceptance Criteria
- [ ] Create GET `/api/admin/notifications/templates`
- [ ] Support query params: type, trigger_event, active_only
- [ ] Return template list with id, name, description, type, trigger_event, channel, is_active, version, variables, timestamps
- [ ] Require admin authentication
- [ ] Write unit tests

## References
- Req 11.1

## Complexity
Small

## Category
Admin Template Management APIs
