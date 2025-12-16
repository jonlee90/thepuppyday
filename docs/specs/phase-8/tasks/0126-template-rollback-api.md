# Task 0126: Create template rollback API

## Description
Create API endpoint to rollback templates to previous versions.

## Acceptance Criteria
- [ ] Create POST `/api/admin/notifications/templates/:id/rollback`
- [ ] Accept version number and reason
- [ ] Load historical version from notification_template_history
- [ ] Update current template with historical content
- [ ] Automatically creates new version via trigger
- [ ] Require admin authentication
- [ ] Write unit tests

## References
- Req 11.8

## Complexity
Small

## Category
Admin Template Management APIs
