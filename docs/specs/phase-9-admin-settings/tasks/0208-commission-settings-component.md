# Task 0208: Commission settings component

## Description
Create the commission settings component for configuring groomer commission rates.

## Acceptance Criteria
- [ ] Create `CommissionSettings` component
- [ ] Display groomer name at top
- [ ] Rate type selector: Percentage or Flat rate per service
- [ ] Base rate input (% for percentage, $ for flat)
- [ ] "Include add-ons in commission" toggle
- [ ] Per-service override table:
  - List all services
  - Custom rate override input for each (optional)
  - Clear override button
- [ ] Preview calculation example with sample appointment
- [ ] Show calculation breakdown (base rate + add-ons if included)
- [ ] Implement unsaved changes indicator
- [ ] Save button calls commission API
- [ ] Success toast on save
- [ ] Note about commission being for reporting only

## Implementation Notes
- File: `src/components/admin/settings/staff/CommissionSettings.tsx`
- Fetch services list for override table
- Preview should show realistic example calculation

## References
- Req 18.1, Req 18.2, Req 18.3, Req 18.4, Req 18.5, Req 18.6
- Design: Commission Settings section

## Complexity
Medium

## Category
UI

## Dependencies
- 0207 (Commission settings API)
