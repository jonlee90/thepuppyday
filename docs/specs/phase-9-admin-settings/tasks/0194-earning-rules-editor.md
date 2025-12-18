# Task 0194: Earning rules editor component

## Description
Create the earning rules editor component for configuring how customers earn loyalty punches.

## Acceptance Criteria
- [ ] Create `EarningRulesForm` component
- [ ] Multi-select for qualifying services (empty = all services qualify)
- [ ] Minimum spend threshold input (0 = no minimum)
- [ ] First visit bonus toggle with punch count input
- [ ] Display list of all available services for selection
- [ ] Show "All services" option as quick select
- [ ] Preview of affected customers count when rules change
- [ ] Explanation text for each rule
- [ ] Note that changes apply to future appointments only
- [ ] Implement unsaved changes indicator
- [ ] Save button calls earning rules API
- [ ] Display success toast on save

## Implementation Notes
- File: `src/components/admin/settings/loyalty/EarningRulesForm.tsx`
- Fetch services list for multi-select
- Use DaisyUI checkbox group for service selection

## References
- Req 14.1, Req 14.2, Req 14.3, Req 14.4, Req 14.5, Req 14.6, Req 14.7, Req 14.8
- Design: Earning Rules Form section

## Complexity
Medium

## Category
UI

## Dependencies
- 0192 (Loyalty settings API)
