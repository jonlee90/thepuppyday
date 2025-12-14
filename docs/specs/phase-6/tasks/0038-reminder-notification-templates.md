# Task 0038: Create reminder notification templates

**Group**: Retention Marketing - Breed Reminders (Week 3)

## Objective
Build SMS and email templates for breed reminders

## Files to create/modify
- `src/lib/twilio/breed-reminder-sms.ts`
- `src/lib/resend/breed-reminder-email.tsx`
- `src/mocks/twilio/breed-reminder-sms.ts`
- `src/mocks/resend/breed-reminder-email.ts`

## Requirements covered
- REQ-6.8.2

## Acceptance criteria
- SMS: "Hi [name], [pet_name] is due for a groom [breed_message]! Book now: [link]"
- Email with pet photo, breed-specific message, CTA
- Customizable per breed (e.g., Poodle matting warning)
- Booking link with tracking_id
