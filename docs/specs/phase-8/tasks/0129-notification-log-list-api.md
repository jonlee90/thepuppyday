# Task 0129: Create notification log list API

## Description
Create API endpoint to list and filter notification logs with pagination.

## Acceptance Criteria
- [ ] Create GET `/api/admin/notifications/log`
- [ ] Support pagination (page, limit with default 50)
- [ ] Support filters: type, channel, status, customer_id, start_date, end_date
- [ ] Support search by recipient email/phone
- [ ] Join with users table to include customer_name
- [ ] Return logs in reverse chronological order
- [ ] Return pagination metadata (total, total_pages)
- [ ] Require admin authentication
- [ ] Write unit tests with various filter combinations

## References
- Req 14.1, Req 14.4, Req 14.5, Req 14.6, Req 14.7

## Complexity
Medium

## Category
Admin Notification Log APIs
