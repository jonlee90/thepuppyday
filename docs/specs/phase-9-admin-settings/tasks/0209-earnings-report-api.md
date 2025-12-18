# Task 0209: Earnings report API

## Description
Create API endpoint for generating groomer earnings reports.

## Acceptance Criteria
- [ ] Create GET `/api/admin/settings/staff/earnings` endpoint
- [ ] Accept query params: groomer_id (optional), start_date, end_date, group_by (day/week/month)
- [ ] Return summary: total_services, total_revenue, total_commission, total_tips
- [ ] Return by_groomer array with per-groomer breakdown
- [ ] Include: services count, revenue, commission, tips, avg_appointment_value
- [ ] Return timeline array for chart visualization
- [ ] Calculate commission based on staff_commissions table settings
- [ ] Default to 0% commission if no settings configured
- [ ] Support comparison to previous period
- [ ] Implement `requireAdmin()` authentication check
- [ ] Query should complete within 3 seconds for 1 year of data

## Implementation Notes
- File: `src/app/api/admin/settings/staff/earnings/route.ts`
- Join appointments, payments, staff_commissions tables
- Consider caching for performance on large date ranges

## References
- Req 19.1, Req 19.2, Req 19.3, Req 19.4, Req 19.5, Req 19.6, Req 19.7
- Design: Staff Management API - Earnings section

## Complexity
Large

## Category
API

## Dependencies
- 0202 (Staff commissions migration)
- 0207 (Commission settings API)
