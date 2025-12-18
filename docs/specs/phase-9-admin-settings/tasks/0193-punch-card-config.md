# Task 0193: Punch card configuration component

## Description
Create the punch card configuration component for managing the loyalty program's basic settings.

## Acceptance Criteria
- [ ] Create `PunchCardConfig` component
- [ ] Display enable/disable toggle for loyalty program
- [ ] Confirmation dialog when disabling program
- [ ] Display current punch threshold (default: 9 for "buy 9, get 10th free")
- [ ] Implement threshold selector (range 5-20)
- [ ] Visual punch card preview showing threshold
- [ ] Display stats summary cards:
  - Active customers in program
  - Total rewards redeemed
  - Pending rewards
- [ ] Note that threshold changes apply to new cycles only
- [ ] Warning if reducing threshold below current customer progress
- [ ] Implement unsaved changes indicator
- [ ] Save button calls loyalty settings API

## Implementation Notes
- File: `src/components/admin/settings/loyalty/PunchCardConfig.tsx`
- Visual punch card should show filled and empty punches
- Use DaisyUI stats component for metrics

## References
- Req 13.1, Req 13.2, Req 13.3, Req 13.4, Req 13.5, Req 13.6
- Design: Punch Card Configuration section

## Complexity
Medium

## Category
UI

## Dependencies
- 0192 (Loyalty settings API)
