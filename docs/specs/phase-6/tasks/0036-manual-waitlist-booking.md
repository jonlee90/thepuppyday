# Task 0036: Create manual waitlist booking flow

**Group**: Waitlist Slot-Filling Automation (Week 2-3)

## Objective
Allow admins to manually book from waitlist entry

## Files to create/modify
- `src/components/admin/waitlist/BookFromWaitlistModal.tsx`
- `src/app/api/admin/waitlist/[id]/book/route.ts`

## Requirements covered
- REQ-6.7.1

## Acceptance criteria
- "Book Now" button on waitlist entry
- Opens booking flow with pre-filled customer, pet, service
- Date/time picker for available slots
- Optional discount application
- Marks waitlist entry as 'booked' on success
