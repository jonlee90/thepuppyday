# Task 0126: Create template rollback API

## Description
Create API endpoint to rollback templates to previous versions.

## Acceptance Criteria
- [x] Create POST `/api/admin/notifications/templates/:id/rollback`
- [x] Accept version number and reason
- [x] Load historical version from notification_template_history
- [x] Update current template with historical content
- [x] Automatically creates new version via trigger
- [x] Require admin authentication
- [x] Write unit tests

## References
- Req 11.8

## Complexity
Small

## Category
Admin Template Management APIs

## Status
✅ **COMPLETED** - 2025-01-15

