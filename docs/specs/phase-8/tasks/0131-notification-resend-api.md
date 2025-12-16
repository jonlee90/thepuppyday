# Task 0131: Create notification resend API

## Description
Create API endpoint to manually resend failed notifications.

## Acceptance Criteria
- [ ] Create POST `/api/admin/notifications/log/:id/resend`
- [ ] Load failed notification from log
- [ ] Create new notification with same parameters
- [ ] Send via notification service
- [ ] Return success/failure and new_log_id
- [ ] Require admin authentication
- [ ] Write integration test

## References
- Req 14.8

## Complexity
Small

## Category
Admin Notification Log APIs
