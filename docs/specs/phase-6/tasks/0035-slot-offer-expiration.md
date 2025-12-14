# Task 0035: Implement slot offer expiration handling

**Group**: Waitlist Slot-Filling Automation (Week 2-3)

## Objective
Handle expired slot offers

## Files to create/modify
- `src/lib/admin/waitlist-expiration.ts`
- `src/app/api/cron/waitlist-expiration/route.ts`

## Requirements covered
- REQ-6.6.4

## Acceptance criteria
- Cron job checks for expired offers
- Expired offers marked status='expired'
- Waitlist entries updated to status='expired_offer'
- Slot returned to available inventory
- Cleanup runs every 15 minutes
