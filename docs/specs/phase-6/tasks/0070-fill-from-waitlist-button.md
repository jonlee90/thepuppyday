# Task 0070: Add "Fill from Waitlist" button to appointment calendar

**Group**: Integration & Polish (Week 4)
**Status**: ✅ Completed

## Objective
Integrate waitlist fill functionality into calendar

## Files to create/modify
- `src/components/admin/appointments/AppointmentCalendar.tsx`

## Requirements covered
- REQ-6.6.1

## Acceptance criteria
- ✅ Click empty time slot shows "Fill from Waitlist" button
- ✅ Button opens FillSlotModal
- ✅ Badge shows matching waitlist count

## Implementation Notes
- Added date/time selection to FullCalendar component
- Created modal that appears when clicking empty slots
- Implemented waitlist count fetching for selected time slots
- Added badge showing matching waitlist count
- Integrated with existing FillSlotModal component
