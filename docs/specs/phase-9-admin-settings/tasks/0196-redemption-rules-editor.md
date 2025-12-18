# Task 0196: Redemption rules editor component

## Description
Create the redemption rules editor component for configuring how customers can redeem loyalty rewards.

## Acceptance Criteria
- [ ] Create `RedemptionRulesForm` component
- [ ] Multi-select for eligible services (which services can be redeemed for free)
- [ ] At least one service must be selected for redemption
- [ ] Expiration days input (0 = rewards never expire)
- [ ] Optional maximum value cap for free service
- [ ] Display how reward appears during booking checkout
- [ ] Preview of pending rewards that would be affected by changes
- [ ] Warning if reducing eligible services affects pending rewards
- [ ] Note about notifying customers when rewards expire
- [ ] Implement unsaved changes indicator
- [ ] Save button calls redemption rules API

## Implementation Notes
- File: `src/components/admin/settings/loyalty/RedemptionRulesForm.tsx`
- Fetch services list for multi-select
- Use DaisyUI checkbox group for service selection

## References
- Req 15.1, Req 15.2, Req 15.3, Req 15.4, Req 15.5, Req 15.6, Req 15.7, Req 15.8
- Design: Redemption Rules section

## Complexity
Medium

## Category
UI

## Dependencies
- 0192 (Loyalty settings API)
