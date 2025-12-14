# Task 0037: Create breed-based reminder scheduler

**Group**: Retention Marketing - Breed Reminders (Week 3)

## Objective
Build daily job to schedule grooming reminders based on breed frequency

## Files to create/modify
- `src/lib/admin/breed-reminder-scheduler.ts`
- `src/app/api/cron/breed-reminders/route.ts`

## Requirements covered
- REQ-6.8.1
- REQ-6.8.4

## Acceptance criteria
- Cron job runs daily at 9 AM
- Query pets where last_appointment + breed.frequency = today + 7 days
- Skip if upcoming appointment exists
- Skip if appointment within next 14 days
- Create campaign_sends records
- Mark as sent to prevent duplicates
- Stop after 2 attempts if no response
