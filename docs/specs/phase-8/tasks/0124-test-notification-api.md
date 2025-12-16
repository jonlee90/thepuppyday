# Task 0124: Create test notification API

## Description
Create API endpoint to send test notifications to verify templates.

## Acceptance Criteria
- [ ] Create POST `/api/admin/notifications/templates/:id/test`
- [ ] Accept recipient_email (for email) or recipient_phone (for SMS) and sample_data
- [ ] Render template with sample data
- [ ] Add "[TEST]" prefix to email subject
- [ ] Send via appropriate provider
- [ ] Mark log entry with is_test=true
- [ ] Return success/failure status, message_id, and log_entry_id
- [ ] Display full error message on failure
- [ ] Require admin authentication
- [ ] Write integration test with mock providers

## References
- Req 12.1, Req 12.2, Req 12.3, Req 12.4, Req 12.5, Req 12.6, Req 12.7, Req 12.8

## Complexity
Medium

## Category
Admin Template Management APIs
