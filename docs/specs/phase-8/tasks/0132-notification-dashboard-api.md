# Task 0132: Create notification dashboard API

## Description
Create comprehensive analytics API for the notifications dashboard.

## Acceptance Criteria
- [ ] Create GET `/api/admin/notifications/dashboard`
- [ ] Support query params: start_date, end_date, period (7d, 30d, 90d)
- [ ] Calculate summary metrics: total_sent, total_delivered, total_failed, delivery_rate, click_rate
- [ ] Calculate by_channel breakdown for email and SMS
- [ ] Calculate by_type breakdown with success rates
- [ ] Generate timeline data for charts (daily aggregations)
- [ ] Group failure_reasons with counts and percentages
- [ ] Compare to previous period for trend indicators
- [ ] Require admin authentication
- [ ] Write unit tests with sample data

## References
- Req 20.1, Req 20.2, Req 20.3, Req 20.4, Req 20.5, Req 20.6, Req 20.7, Req 20.8

## Complexity
Large

## Category
Admin Dashboard Analytics API
