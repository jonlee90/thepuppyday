# Task 0181: Advance booking window settings component

## Description
Create the advance booking window configuration component for setting minimum and maximum booking lead times.

## Acceptance Criteria
- [ ] Create `AdvanceBookingWindow` component
- [ ] Display current minimum advance booking hours (default: 24)
- [ ] Implement slider + number input for min hours (0-168 range)
- [ ] Display current maximum advance booking days (default: 30)
- [ ] Implement slider + number input for max days (7-365 range)
- [ ] Show warning when min_hours > 24 (disables same-day booking)
- [ ] Display explanation text for each setting
- [ ] Show preview of booking window (e.g., "Customers can book 1 day to 30 days in advance")
- [ ] Implement unsaved changes indicator
- [ ] Save button calls booking settings API
- [ ] Display success toast on save

## Implementation Notes
- File: `src/components/admin/settings/booking/AdvanceBookingWindow.tsx`
- Use DaisyUI range slider component
- Sync slider and input values bidirectionally

## References
- Req 8.1, Req 8.2, Req 8.3, Req 8.4, Req 8.8
- Design: Advance Booking Window section

## Complexity
Small

## Category
UI

## Dependencies
- 0180 (Booking settings API)
