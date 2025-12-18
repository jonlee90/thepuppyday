# Task 0183: Buffer time settings component

## Description
Create the buffer time configuration component for setting time between appointments.

## Acceptance Criteria
- [ ] Create `BufferTimeSettings` component
- [ ] Display current buffer time in minutes (default: 15)
- [ ] Implement selector for buffer time (0-60 minutes)
- [ ] Only allow 5-minute increments (0, 5, 10, 15, 20, etc.)
- [ ] Common presets as quick-select buttons: 0, 15, 30, 45, 60 min
- [ ] Show explanation that buffer time is for cleanup/prep
- [ ] Note that setting 0 allows back-to-back appointments
- [ ] Display visual timeline showing buffer between appointments
- [ ] Note that existing appointments are not affected
- [ ] Implement unsaved changes indicator
- [ ] Save button calls booking settings API

## Implementation Notes
- File: `src/components/admin/settings/booking/BufferTimeSettings.tsx`
- Use DaisyUI button group or custom selector
- Visual timeline should show example appointments with buffer

## References
- Req 10.1, Req 10.2, Req 10.3, Req 10.4, Req 10.5, Req 10.7, Req 10.8
- Design: Buffer Time Settings section

## Complexity
Small

## Category
UI

## Dependencies
- 0180 (Booking settings API)
