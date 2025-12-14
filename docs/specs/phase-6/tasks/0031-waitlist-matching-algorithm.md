# Task 0031: Create waitlist matching algorithm

**Group**: Waitlist Slot-Filling Automation (Week 2-3)

## Objective
Build API to find matching waitlist entries for open slot

## Files to create/modify
- `src/app/api/admin/waitlist/match/route.ts`
- `src/lib/admin/waitlist-matcher.ts`

## Requirements covered
- REQ-6.6.1

## Acceptance criteria
- Match by service_id
- Match by requested_date within ±3 days
- Filter status = 'active' only
- Return sorted by priority DESC, created_at ASC
- Limit to top 10 matches
