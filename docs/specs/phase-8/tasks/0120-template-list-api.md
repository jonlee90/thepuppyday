# Task 0120: Create template list API

## Description
Create API endpoint to list all notification templates with filtering.

## Acceptance Criteria
- [x] Create GET `/api/admin/notifications/templates`
- [x] Support query params: type, trigger_event, active_only
- [x] Return template list with id, name, description, type, trigger_event, channel, is_active, version, variables, timestamps
- [x] Require admin authentication
- [x] Write unit tests

## Status
✅ **COMPLETED** - 2025-01-15

## Implementation
- File: `src/app/api/admin/notifications/templates/route.ts`
- Tests: `__tests__/api/admin/notifications/templates/list.test.ts`
- All acceptance criteria met

## References
- Req 11.1

## Complexity
Small

## Category
Admin Template Management APIs
