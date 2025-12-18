# Task 0195: Earning rules API routes

## Description
Create API routes for managing loyalty earning rules.

## Acceptance Criteria
- [ ] Create GET `/api/admin/settings/loyalty/earning-rules` to fetch earning rules
- [ ] Return: qualifying_services array, minimum_spend, first_visit_bonus
- [ ] Create PUT `/api/admin/settings/loyalty/earning-rules` to update rules
- [ ] Accept: qualifying_services (array of service IDs), minimum_spend (number), first_visit_bonus (number)
- [ ] Validate service IDs exist in database
- [ ] Validate minimum_spend >= 0
- [ ] Validate first_visit_bonus >= 0
- [ ] Calculate and return affected_customers count (informational)
- [ ] Store rules in settings table under 'loyalty_earning_rules' key
- [ ] Implement `requireAdmin()` authentication check
- [ ] Create audit log entry for changes

## Implementation Notes
- File: `src/app/api/admin/settings/loyalty/earning-rules/route.ts`
- Use Zod for validation
- Affected customers = customers with upcoming appointments matching new rules

## References
- Req 14.2, Req 14.3, Req 14.7, Req 14.8
- Design: Loyalty Settings API section

## Complexity
Small

## Category
API

## Dependencies
- 0192 (Loyalty settings API)
