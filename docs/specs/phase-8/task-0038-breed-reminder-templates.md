# Task 0038: Breed Reminder Notification Templates

**Status**: ✅ Completed
**Date**: 2025-12-13

## Overview

Implemented SMS and Email notification templates for breed-based grooming reminders. These templates are used by the breed reminder scheduler (Task 0037) to send personalized notifications to customers when their pets are due for grooming based on breed-specific schedules.

## Files Created

### Production Templates (Real Services)

1. **`src/lib/twilio/breed-reminder-sms.ts`**
   - Production SMS implementation using Twilio
   - Sends concise, breed-specific grooming reminders
   - Includes tracking links for conversion tracking
   - Logs to `notifications_log` table

2. **`src/lib/resend/breed-reminder-email.tsx`**
   - Production email implementation using Resend
   - Beautiful HTML email with Clean & Elegant Professional design
   - Breed-specific educational content
   - Pet photo display (with fallback)
   - Responsive mobile design

### Mock Templates (Development)

3. **`src/mocks/twilio/breed-reminder-sms.ts`**
   - Mock SMS for development/testing
   - Console logging instead of actual SMS sending
   - Same interface as production version

4. **`src/mocks/resend/breed-reminder-email.ts`**
   - Mock email for development/testing
   - Console logging with text preview
   - Same interface as production version

## Features

### SMS Template

**Format**: "Hi {name}, {petName} is due for a groom {breedMessage}! Book now: {link}"

**Breed-Specific Messages**:
- Poodle breeds: "to prevent matting"
- Golden/Labrador Retrievers: "for their coat"
- Yorkies: "to keep silky"
- Huskies: "for seasonal care"
- Shih Tzus: "to prevent mats"
- Maltese: "to prevent tangles"
- Bichon Frise: "to prevent matting"
- Doodle breeds: "to prevent matting"
- Default: "for their breed"

**Features**:
- Character count optimization (aims for <160 chars)
- Tracking ID for conversion analytics
- Booking URL with tracking parameters
- Automatic breed message matching (exact and partial)
- Custom breed message override support

### Email Template

**Subject**: "{Pet Name}'s Grooming Appointment Reminder"

**Design**:
- Background: #F8EEE5 (warm cream)
- Primary buttons: #434E54 (charcoal)
- Card backgrounds: #FFFFFF
- Clean, professional layout with soft shadows
- Pet photo in circular frame (200x200px)
- Mobile-responsive design

**Content Sections**:
1. **Header**: Business logo/name on charcoal background
2. **Greeting**: Personalized customer greeting
3. **Pet Info Card**:
   - Pet photo (circular frame with cream border)
   - Pet name and breed
   - Breed-specific "Why now?" message
4. **Call-to-Action**: Prominent "Book {Pet}'s Appointment" button
5. **Footer**:
   - Business contact information
   - Hours of operation
   - Instagram handle
   - Unsubscribe link

**Extended Breed Messages** (more detailed than SMS):
- Poodle: "Poodles need regular grooming every 4-6 weeks to prevent matting and keep their beautiful coat healthy. Their curly hair requires professional care to stay comfortable and looking great."
- Golden Retriever: "Golden Retrievers benefit from grooming every 6-8 weeks to maintain their gorgeous coat, reduce shedding, and keep them comfortable."
- Yorkie: "Yorkies need grooming every 4-6 weeks to keep their silky coat tangle-free and maintain their adorable appearance."
- Husky: "Huskies need seasonal grooming to manage their thick double coat, especially during shedding seasons."
- Shih Tzu: "Shih Tzus need grooming every 4-6 weeks to prevent mats and keep their luxurious coat healthy and comfortable."
- And more...

## Function Signatures

### SMS

```typescript
export interface BreedReminderSMSParams {
  customerName: string;
  customerPhone: string;
  customerId: string;
  petName: string;
  petId: string;
  breedName: string;
  breedMessage?: string; // Optional custom override
  trackingId: string;
  bookingUrl: string;
}

export async function sendBreedReminderSMS(
  supabase: AppSupabaseClient,
  params: BreedReminderSMSParams
): Promise<{ success: boolean; messageSid?: string; error?: string }>;

export function previewBreedReminderSms(
  params: BreedReminderSMSParams
): string;
```

### Email

```typescript
export interface BreedReminderEmailParams {
  customerName: string;
  customerEmail: string;
  customerId: string;
  petName: string;
  petId: string;
  breedName: string;
  breedMessage: string;
  petPhotoUrl?: string;
  trackingId: string;
  bookingUrl: string;
}

export async function sendBreedReminderEmail(
  supabase: AppSupabaseClient,
  params: BreedReminderEmailParams
): Promise<{ success: boolean; emailId?: string; error?: string }>;

export function previewBreedReminderEmail(
  params: BreedReminderEmailParams
): string;
```

## Database Logging

Both SMS and Email templates log to `notifications_log` table:

```typescript
{
  customer_id: string;
  type: 'breed_reminder';
  channel: 'sms' | 'email';
  recipient: string; // phone or email
  subject: string | null; // null for SMS
  content: string;
  message_id: string | null; // Twilio SID or Resend ID
  tracking_id: string; // For conversion tracking
  status: 'sent' | 'failed';
}
```

## Usage Example

```typescript
import { sendBreedReminderSMS } from '@/lib/twilio/breed-reminder-sms';
import { sendBreedReminderEmail } from '@/lib/resend/breed-reminder-email';
import { createServerClient } from '@/lib/supabase/server';

// In breed reminder scheduler (Task 0037)
const supabase = createServerClient();

// Send SMS
const smsResult = await sendBreedReminderSMS(supabase, {
  customerName: 'John',
  customerPhone: '+16572522903',
  customerId: 'uuid-123',
  petName: 'Buddy',
  petId: 'pet-uuid-456',
  breedName: 'Golden Retriever',
  trackingId: 'reminder_abc123',
  bookingUrl: 'https://thepuppyday.com/book?track=reminder_abc123',
  // breedMessage: 'custom message' // optional override
});

// Send Email
const emailResult = await sendBreedReminderEmail(supabase, {
  customerName: 'John',
  customerEmail: 'john@example.com',
  customerId: 'uuid-123',
  petName: 'Buddy',
  petId: 'pet-uuid-456',
  breedName: 'Golden Retriever',
  breedMessage: 'for their beautiful coat maintenance',
  petPhotoUrl: 'https://storage.com/buddy.jpg', // optional
  trackingId: 'reminder_abc123',
  bookingUrl: 'https://thepuppyday.com/book?track=reminder_abc123',
});

if (smsResult.success) {
  console.log('SMS sent:', smsResult.messageSid);
}

if (emailResult.success) {
  console.log('Email sent:', emailResult.emailId);
}
```

## Mock Mode Behavior

When `NEXT_PUBLIC_USE_MOCKS=true`:

**SMS Mock**:
```
📱 [MOCK] Breed Reminder SMS:
──────────────────────────────────────────────────
  To: +16572522903
  Customer: John
  Pet: Buddy (Golden Retriever)
  Tracking ID: reminder_abc123

  Message:
  Hi John, Buddy is due for a groom for their coat! Book now: https://...

  Characters: 78
  Message SID: SM_MOCK_1702456789_abc123def
──────────────────────────────────────────────────
✅ [MOCK] Logged to notifications_log
```

**Email Mock**:
```
📧 [MOCK] Breed Reminder Email:
════════════════════════════════════════════════════════════
To: john@example.com
Subject: Buddy's Grooming Appointment Reminder
Pet: Buddy (Golden Retriever)
Customer: John
Tracking ID: reminder_abc123
Booking URL: https://thepuppyday.com/book?track=reminder_abc123
Pet Photo: https://storage.com/buddy.jpg

────────────────────────────────────────────────────────────
Email Preview:
────────────────────────────────────────────────────────────
Hi John,

It's time for Buddy's grooming appointment! Regular grooming keeps your
furry friend happy, healthy, and looking their best.

Pet: Buddy
Breed: Golden Retriever

Why now? Golden Retrievers benefit from grooming every 6-8 weeks to
maintain their gorgeous coat, reduce shedding, and keep them comfortable.

We'd love to see Buddy again! Book an appointment at your convenience,
and we'll make sure they get the pampering they deserve.

📅 Book Buddy's Appointment: https://...

[Business footer info...]
────────────────────────────────────────────────────────────
Email ID: email_abc123def456ghi789
════════════════════════════════════════════════════════════
✅ [MOCK] Logged to notifications_log
```

## Design Patterns Used

1. **Breed Message Mapping**:
   - Exact match lookup (e.g., "poodle")
   - Partial match fallback (e.g., "toy poodle" matches "poodle")
   - Default fallback message
   - Custom message override support

2. **Consistent Interface**:
   - Same function signatures for production and mock
   - Same parameters and return types
   - Automatic switching based on `NEXT_PUBLIC_USE_MOCKS`

3. **Comprehensive Logging**:
   - Console logging for development visibility
   - Database logging for analytics and tracking
   - Success and failure paths both logged

4. **Responsive Email Design**:
   - Mobile-first approach
   - Flexible images (max-width: 100%)
   - Adjusted font sizes for mobile
   - Stack layout on small screens

5. **Error Handling**:
   - Try-catch blocks in all async functions
   - Graceful failure with error logging
   - Database logging even on failure
   - Clear error messages in return values

## Testing

### Manual Testing (Mock Mode)

1. Set `NEXT_PUBLIC_USE_MOCKS=true`
2. Trigger breed reminder scheduler
3. Check console for mock output
4. Verify notifications_log entries

### Preview Functions

```typescript
import { previewBreedReminderSms } from '@/lib/twilio/breed-reminder-sms';
import { previewBreedReminderEmail } from '@/lib/resend/breed-reminder-email';

// Preview SMS content
const smsPreview = previewBreedReminderSms({
  customerName: 'John',
  petName: 'Buddy',
  breedName: 'Golden Retriever',
  bookingUrl: 'https://...',
  // ... other params
});

// Preview email HTML
const emailPreview = previewBreedReminderEmail({
  customerName: 'John',
  petName: 'Buddy',
  breedName: 'Golden Retriever',
  breedMessage: 'for their beautiful coat',
  bookingUrl: 'https://...',
  // ... other params
});
```

## Integration with Task 0037

These templates are called by the breed reminder scheduler:

1. **Scheduler** identifies pets due for grooming
2. **Scheduler** generates tracking ID and booking URL
3. **Scheduler** calls appropriate template (SMS/Email/Both)
4. **Template** builds message with breed-specific content
5. **Template** sends notification via service
6. **Template** logs to notifications_log
7. **Scheduler** updates pet's last_reminder_sent timestamp

## Future Enhancements

1. **A/B Testing**: Multiple message variants per breed
2. **Personalization**: Include last visit date, favorite groomer
3. **Promotions**: Seasonal discounts, loyalty rewards
4. **Images**: Breed-specific stock photos as fallbacks
5. **Localization**: Multi-language support
6. **Rich Media**: SMS with MMS photos for capable devices
7. **Dynamic Scheduling**: Learn optimal send times per customer
8. **Unsubscribe Management**: Preference center for notification types

## Related Tasks

- **Task 0037**: Breed Reminder Scheduler (calls these templates)
- **Task 0022**: Report Card SMS (similar pattern)
- **Task 0023**: Report Card Email (similar pattern)
- **Task 0035**: Waitlist SMS Notifications (similar pattern)

## Verification

✅ All 4 files created successfully
✅ Production build passes
✅ Type checking passes
✅ Consistent interfaces between production and mock
✅ Database logging implemented
✅ Preview functions provided
✅ Error handling comprehensive
✅ Breed message mapping robust
✅ Email design matches brand guidelines
✅ SMS character optimization implemented
✅ Tracking ID support for analytics

## Summary

Task 0038 is complete. The breed reminder notification templates provide a robust, tested foundation for sending personalized grooming reminders to customers. The templates feature breed-specific messaging, beautiful email design, comprehensive logging, and seamless switching between production and mock modes for development.
