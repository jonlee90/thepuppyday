# Task 0021: Create report card notification scheduler

**Group**: Report Card Automation (Week 2)

## Objective
Schedule auto-send of report cards after appointment completion

## Files to create/modify
- `src/lib/admin/report-card-scheduler.ts`
- `src/app/api/webhooks/appointment-completed/route.ts`

## Requirements covered
- REQ-6.4.1

## Acceptance criteria
- Trigger when appointment status changes to "completed"
- Configurable delay (default 15 minutes)
- Send SMS + Email with report card link
- Skip if dont_send is true
- Skip if report card is still draft
