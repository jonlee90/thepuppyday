# Task 0034: Create Twilio incoming SMS webhook handler

**Group**: Waitlist Slot-Filling Automation (Week 2-3)

## Objective
Handle "YES" replies for waitlist slot offers

## Files to create/modify
- `src/app/api/webhooks/twilio/incoming/route.ts`
- `src/lib/admin/waitlist-response-handler.ts`

## Requirements covered
- REQ-6.6.3

## Acceptance criteria
- Webhook validates Twilio signature
- Finds active slot offer for phone number
- "YES" reply triggers auto-booking
- First responder wins (race condition handled)
- Confirmation SMS sent to winner
- "Slot filled" SMS sent to others
