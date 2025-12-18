# Task 0197: Redemption rules API routes

## Description
Create API routes for managing loyalty redemption rules.

## Acceptance Criteria
- [ ] Create GET `/api/admin/settings/loyalty/redemption-rules` to fetch redemption rules
- [ ] Return: eligible_services array, expiration_days, max_value
- [ ] Create PUT `/api/admin/settings/loyalty/redemption-rules` to update rules
- [ ] Accept: eligible_services (array of service IDs), expiration_days (number), max_value (number, optional)
- [ ] Validate at least one service is in eligible_services array
- [ ] Validate expiration_days >= 0
- [ ] Validate max_value >= 0 if provided
- [ ] Store rules in settings table under 'loyalty_redemption_rules' key
- [ ] Implement `requireAdmin()` authentication check
- [ ] Create audit log entry for changes
- [ ] Return updated rules

## Implementation Notes
- File: `src/app/api/admin/settings/loyalty/redemption-rules/route.ts`
- Use Zod for validation
- Consider adding migration logic for existing pending rewards

## References
- Req 15.2, Req 15.6, Req 15.8
- Design: Loyalty Settings API section

## Complexity
Small

## Category
API

## Dependencies
- 0192 (Loyalty settings API)
