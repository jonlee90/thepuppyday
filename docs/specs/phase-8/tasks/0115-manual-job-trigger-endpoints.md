# Task 0115: Create manual job trigger endpoints (development)

## Description
Create admin endpoints to manually trigger scheduled jobs for testing and development.

## Acceptance Criteria
- [ ] Create POST `/api/admin/notifications/jobs/reminders/trigger`
- [ ] Create POST `/api/admin/notifications/jobs/retention/trigger`
- [ ] Require admin authentication
- [ ] Only enable in development mode
- [ ] Return same response format as cron jobs
- [ ] Write integration tests

## References
- Req 16.8

## Complexity
Small

## Category
Scheduled Jobs (Cron)
