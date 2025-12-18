# Task 0201: Integration with existing loyalty system

## Description
Integrate loyalty settings with the existing punch card system to apply configured rules.

## Acceptance Criteria
- [ ] Update punch awarding logic to check earning rules
- [ ] Check qualifying_services when awarding punches
- [ ] Check minimum_spend threshold before awarding punch
- [ ] Award first_visit_bonus for new customers' first appointment
- [ ] Update redemption flow to check redemption rules
- [ ] Only allow redemption for eligible_services
- [ ] Check reward expiration based on expiration_days setting
- [ ] Integrate referral tracking into customer registration
- [ ] Generate referral code for new customers when program enabled
- [ ] Award referral bonuses when referred customer completes first appointment
- [ ] Create `getLoyaltySettings` utility for loyalty functions
- [ ] Ensure settings are cached appropriately for performance

## Implementation Notes
- Update: `src/lib/loyalty/` existing loyalty functions
- File: `src/lib/admin/loyalty-settings.ts` for utility functions
- Integration with booking completion flow from Phase 7

## References
- Req 14.5, Req 14.6, Req 15.3, Req 15.5, Req 15.7, Req 16.4
- IR-3.1, IR-3.2, IR-3.3
- Design: Loyalty System Integration section

## Complexity
Large

## Category
Integration

## Dependencies
- 0192-0200 (All loyalty settings tasks)
