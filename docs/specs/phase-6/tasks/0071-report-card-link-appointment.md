# Task 0071: Add report card link to appointment detail modal

**Group**: Integration & Polish (Week 4)
**Status**: ✅ Completed

## Objective
Integrate report card into appointment workflow

## Files to create/modify
- `src/components/admin/appointments/AppointmentDetailModal.tsx`

## Requirements covered
- REQ-6.1.3

## Acceptance criteria
- ✅ "Create Report Card" button on completed appointments
- ✅ "View Report Card" button if report card exists
- ✅ Report card status indicator (draft/sent/viewed)

## Implementation Notes
- Added Report Card section to completed appointments
- Fetches report card data on modal open
- Shows status badge (Draft/Sent) and viewed timestamp
- Added "Edit Report Card" and "View Public Link" buttons
- Created "Create Report Card" button for appointments without cards
