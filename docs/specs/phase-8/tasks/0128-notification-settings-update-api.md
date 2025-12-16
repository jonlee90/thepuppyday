# Task 0128: Create notification settings update API

## Description
Create API endpoint to update notification type settings.

## Acceptance Criteria
- [ ] Create PUT `/api/admin/notifications/settings/:notification_type`
- [ ] Accept email_enabled, sms_enabled, schedule_enabled, max_retries, retry_delays_seconds
- [ ] Save changes immediately to database
- [ ] Require admin authentication
- [ ] Write unit tests

## References
- Req 13.2, Req 13.3, Req 13.4, Req 13.5, Req 13.8

## Complexity
Small

## Category
Admin Notification Settings APIs
