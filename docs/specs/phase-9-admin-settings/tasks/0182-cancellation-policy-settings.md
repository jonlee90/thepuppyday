# Task 0182: Cancellation policy settings component

## Description
Create the cancellation policy configuration component for setting the cancellation cutoff period.

## Acceptance Criteria
- [ ] Create `CancellationPolicy` component
- [ ] Display current cancellation cutoff hours (default: 24)
- [ ] Implement dropdown or slider for cutoff hours (0-72 range)
- [ ] Common presets: 0 (anytime), 12, 24, 48, 72 hours
- [ ] Show warning text when customer cancels within cutoff window
- [ ] Display policy preview (e.g., "Cancellations must be made at least 24 hours before appointment")
- [ ] Note that setting 0 allows cancellations at any time
- [ ] Show info about how policy appears in confirmations and emails
- [ ] Note that changes apply to new bookings only, not existing
- [ ] Implement unsaved changes indicator
- [ ] Save button calls booking settings API

## Implementation Notes
- File: `src/components/admin/settings/booking/CancellationPolicy.tsx`
- Use DaisyUI select or custom preset buttons
- Include visual representation of the policy

## References
- Req 9.1, Req 9.2, Req 9.3, Req 9.4, Req 9.5, Req 9.6, Req 9.7, Req 9.8
- Design: Cancellation Policy section

## Complexity
Small

## Category
UI

## Dependencies
- 0180 (Booking settings API)
