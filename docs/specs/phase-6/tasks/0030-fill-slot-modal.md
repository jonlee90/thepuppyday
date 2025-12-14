# Task 0030: Create FillSlotModal component

**Group**: Waitlist Slot-Filling Automation (Week 2-3)

## Objective
Build modal for filling open calendar slots from waitlist

## Files to create/modify
- `src/components/admin/waitlist/FillSlotModal.tsx`
- `src/components/admin/waitlist/SlotSummary.tsx`
- `src/components/admin/waitlist/MatchingWaitlistList.tsx`

## Requirements covered
- REQ-6.6.1

## Acceptance criteria
- Modal triggered from appointment calendar empty slot click
- Shows slot date/time and service
- Queries matching waitlist entries (same service, date ±3 days)
- Sorted by priority, then created date
- Empty state if no matches
