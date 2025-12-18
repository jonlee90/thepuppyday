# Task 0192: Loyalty settings API routes

## Description
Create API routes for managing loyalty program configuration including punch card settings, program status, and statistics.

## Acceptance Criteria
- [ ] Create GET `/api/admin/settings/loyalty` to fetch all loyalty settings
- [ ] Return: is_enabled, punch_threshold, earning_rules, redemption_rules, referral_program
- [ ] Include stats: active_customers count, total_rewards_redeemed, pending_rewards
- [ ] Create PUT `/api/admin/settings/loyalty` to update base loyalty settings
- [ ] Accept: is_enabled (boolean), punch_threshold (number 5-20)
- [ ] Validate punch_threshold range
- [ ] Handle program enable/disable toggle
- [ ] Note: Disabled program preserves existing punch data
- [ ] Store settings in `loyalty_settings` table or `settings` table
- [ ] Implement `requireAdmin()` authentication check
- [ ] Create audit log entries for changes
- [ ] Return updated settings with stats

## Implementation Notes
- File: `src/app/api/admin/settings/loyalty/route.ts`
- Stats calculated from customer_loyalty and related tables
- Consider caching stats for performance

## References
- Req 13.1, Req 13.2, Req 13.3, Req 13.4, Req 13.5, Req 13.6, Req 13.7, Req 13.8
- Design: Loyalty Settings API section

## Complexity
Medium

## Category
API

## Dependencies
- 0155 (Database migrations)
- 0156 (TypeScript types)
