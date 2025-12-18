# Task 0198: Referral program settings component

## Description
Create the referral program settings component for configuring referral bonuses.

## Acceptance Criteria
- [ ] Create `ReferralProgramSettings` component
- [ ] Enable/disable toggle for referral program
- [ ] Referrer bonus punches input (default: 1)
- [ ] Referee (new customer) bonus punches input (default: 0)
- [ ] Explanation of when bonuses are awarded (after first completed appointment)
- [ ] Display referral statistics:
  - Total referrals
  - Successful conversions
  - Total bonuses awarded
- [ ] Note that disabling stops new referral codes but honors pending
- [ ] Show sample referral code format
- [ ] Implement unsaved changes indicator
- [ ] Save button calls referral API

## Implementation Notes
- File: `src/components/admin/settings/loyalty/ReferralProgramSettings.tsx`
- Use DaisyUI toggle and number inputs
- Stats from referrals and referral_codes tables

## References
- Req 16.1, Req 16.2, Req 16.3, Req 16.4, Req 16.5, Req 16.6, Req 16.7, Req 16.8
- Design: Referral Program section

## Complexity
Medium

## Category
UI

## Dependencies
- 0192 (Loyalty settings API)
