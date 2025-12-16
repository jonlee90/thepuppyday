# Task 0119: Integrate preference checks into notification service

## Description
Update the notification service to respect customer preferences when sending notifications.

## Acceptance Criteria
- [ ] Update NotificationService.send() to check user preferences
- [ ] Allow transactional notifications regardless of preferences (confirmations, status updates)
- [ ] Block marketing notifications if opted out (retention reminders)
- [ ] Log skipped notifications with reason "customer preference"
- [ ] Write unit tests for preference filtering

## References
- Req 19.2, Req 19.3, Req 19.7, Req 19.8

## Complexity
Small

## Category
Customer Notification Preferences
