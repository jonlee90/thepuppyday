# Task 0199: Referral codes table and API

## Description
Create API routes for managing the referral program and referral codes.

## Acceptance Criteria
- [ ] Create GET `/api/admin/settings/loyalty/referral` to fetch referral settings
- [ ] Return: is_enabled, referrer_bonus_punches, referee_bonus_punches
- [ ] Include stats: total_referrals, successful_conversions, bonuses_awarded
- [ ] Create PUT `/api/admin/settings/loyalty/referral` to update referral settings
- [ ] Accept: is_enabled, referrer_bonus_punches, referee_bonus_punches
- [ ] Validate bonus punches >= 0
- [ ] Store settings in settings table under 'referral_program' key
- [ ] Create utility function to generate unique referral codes
- [ ] Referral code format: 6 alphanumeric characters (e.g., "ABC123")
- [ ] Implement `requireAdmin()` authentication check
- [ ] Create audit log entry for changes

## Implementation Notes
- File: `src/app/api/admin/settings/loyalty/referral/route.ts`
- File: `src/lib/loyalty/referral-codes.ts` for code generation utility
- Code generation should check for uniqueness in database

## References
- Req 16.2, Req 16.5, Req 16.6, Req 16.7, Req 16.8
- Design: Referral Codes Table section

## Complexity
Medium

## Category
API

## Dependencies
- 0155 (Database migrations - referral tables)
- 0192 (Loyalty settings API)
