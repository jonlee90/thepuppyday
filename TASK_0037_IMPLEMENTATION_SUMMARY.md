# Task 0037: Breed-based Reminder Scheduler - Implementation Summary

**Status**: ✅ COMPLETED

**Date**: 2024-12-13

## Overview

Implemented automated daily cron job to send grooming reminders based on pet breed grooming frequency. This retention marketing feature helps ensure customers book their next grooming appointment at the appropriate time for their pet's breed.

## Files Created

### 1. `src/lib/admin/breed-reminder-scheduler.ts`

**Purpose**: Core scheduling logic for breed-based grooming reminders

**Key Functions**:

- `processBreedReminders(supabase)`: Main orchestrator function
  - Finds eligible pets
  - Checks for exclusions (upcoming appointments, recent sends)
  - Sends notifications via email/SMS
  - Creates tracking records
  - Returns statistics

- `findEligiblePets(supabase)`: Eligibility detection
  - Queries pets with breeds and grooming frequency
  - Calculates next due date: `last_appointment_date + breed.grooming_frequency_weeks * 7`
  - Matches pets due in exactly 7 days
  - Returns list with customer and breed details

- `hasUpcomingAppointment(supabase, petId, customerId)`: Skip logic
  - Checks if pet has confirmed/pending appointments in the future
  - Prevents duplicate reminders

- `hasAppointmentWithinDays(supabase, petId, days)`: Skip logic
  - Checks if pet has appointment within next N days (default: 14)
  - Avoids sending reminders too close to existing bookings

- `getRecentAttemptCount(supabase, customerId, petId)`: Attempt tracking
  - Queries `campaign_sends` for recent sends (last 30 days)
  - Returns count to enforce max 2 attempts

- `sendBreedReminder(...)`: Notification sender
  - Builds custom message using breed's `reminder_message` or default
  - Generates unique `tracking_id` for conversion tracking
  - Logs to `notifications_log` table
  - Creates `campaign_sends` record with attempt count
  - Supports both email and SMS channels

**Business Logic**:
- ✅ Send reminders 7 days before grooming is due
- ✅ Skip if pet has upcoming appointment scheduled
- ✅ Skip if pet has appointment within 14 days
- ✅ Respect customer notification preferences (`email_promotional`, `sms_promotional`)
- ✅ Max 2 reminder attempts per pet (30-day window)
- ✅ Generate tracking IDs for conversion attribution
- ✅ Log all notifications for analytics

### 2. `src/app/api/cron/breed-reminders/route.ts`

**Purpose**: API endpoint for scheduled cron job execution

**Endpoints**:
- `GET /api/cron/breed-reminders`
- `POST /api/cron/breed-reminders`

**Security**:
- Validates `CRON_SECRET` from environment variable
- Supports `Authorization: Bearer <token>` header
- Skips validation in development (`NEXT_PUBLIC_USE_MOCKS=true`)

**Response Format**:
```json
{
  "success": true,
  "timestamp": "2024-12-13T09:00:00.000Z",
  "stats": {
    "eligible_count": 15,
    "sent_count": 12,
    "skipped_count": 3,
    "error_count": 0
  },
  "errors": []
}
```

**Error Handling**:
- Returns 401 if unauthorized
- Returns 500 on fatal errors
- Logs all errors for debugging
- Returns detailed error messages in response

### 3. `supabase/migrations/20241213_phase6_campaign_sends_enhancements.sql`

**Purpose**: Database schema enhancements for breed reminders

**Changes**:
- `campaign_id` made nullable (for non-campaign sends)
- Added `pet_id UUID` - references which pet reminder was for
- Added `tracking_id UUID` - unique ID for click/conversion tracking
- Added `attempt_count INTEGER` - tracks send attempts (max 2)

**Indexes**:
- `idx_campaign_sends_pet` - pet_id lookups
- `idx_campaign_sends_tracking` - tracking_id lookups
- `idx_campaign_sends_user_pet` - composite index for attempt counting

### 4. `src/types/marketing.ts` (Updated)

**Changes to `CampaignSend` interface**:
- `campaign_id`: Made nullable for breed reminders
- `user_id`: Renamed from `customer_id` to match database
- `notification_log_id`: Added for linking to notifications_log
- `pet_id`: Added for pet-specific tracking
- `tracking_id`: Added for click/conversion tracking
- `attempt_count`: Added for retry limit enforcement

## Database Integration

### Tables Used

**`pets`**:
- Source of pets needing reminders
- Filters: `is_active = true`, `breed_id IS NOT NULL`

**`breeds`**:
- `grooming_frequency_weeks` - determines reminder timing
- `reminder_message` - custom message per breed (optional)

**`appointments`**:
- `status = 'completed'` - finds last grooming date
- `status IN ('pending', 'confirmed', 'checked_in')` - checks for upcoming appointments

**`users`**:
- Customer contact information (email, phone)
- Notification preferences (`preferences.email_promotional`, `preferences.sms_promotional`)

**`notifications_log`**:
- Records all email/SMS sends
- Tracks delivery status
- Links to `tracking_id` for attribution

**`campaign_sends`**:
- Tracks each reminder send
- Enforces attempt limits (max 2)
- Links to `booking_id` for conversion tracking

## Timing Logic

### Eligibility Calculation

```
next_due_date = last_appointment_date + (breed.grooming_frequency_weeks * 7 days)
eligible = (next_due_date == today + 7 days)
```

**Example**:
- Last appointment: December 1, 2024
- Breed frequency: 6 weeks (42 days)
- Next due date: January 12, 2025
- Reminder date: January 5, 2025 (7 days before)

### Skip Conditions

1. **No completed appointments**: Pet never groomed before
2. **Has upcoming appointment**: Already booked
3. **Appointment within 14 days**: Too close to existing booking
4. **Max attempts reached**: Already sent 2 reminders in last 30 days
5. **Opted out**: Customer disabled promotional notifications

## Cron Configuration

### Recommended Setup (Vercel)

**vercel.json**:
```json
{
  "crons": [
    {
      "path": "/api/cron/breed-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Schedule**: Daily at 9:00 AM (server timezone)

**Environment Variables**:
```bash
CRON_SECRET=<random_secure_string>
```

### Alternative: External Cron Service

Use services like:
- Cron-job.org
- EasyCron
- AWS EventBridge

**HTTP Request**:
```bash
curl -X POST https://thepuppyday.com/api/cron/breed-reminders \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

## Testing

### Manual Testing

```bash
# Development environment (no auth required)
curl http://localhost:3000/api/cron/breed-reminders
```

### Production Testing

```bash
# With authentication
curl https://thepuppyday.com/api/cron/breed-reminders \
  -H "Authorization: Bearer <CRON_SECRET>"
```

### Expected Output

```json
{
  "success": true,
  "timestamp": "2024-12-13T09:00:00.000Z",
  "stats": {
    "eligible_count": 5,
    "sent_count": 4,
    "skipped_count": 1,
    "error_count": 0
  }
}
```

## Notification Content

### Email Template

**Subject**: `{pet_name} is Due for Grooming Soon!`

**Body**:
```
Hi {customer_first_name}! {pet_name} is due for grooming soon based on
their {breed_name} breed. Book now to keep their coat healthy!

Book your appointment now: https://thepuppyday.com/booking?pet={pet_id}&tracking={tracking_id}
```

### SMS Template

```
{pet_name} is due for grooming! Book now: https://thepuppyday.com/booking?pet={pet_id}&tracking={tracking_id} - The Puppy Day
```

### Custom Breed Messages

Breeds can have custom messages in `breeds.reminder_message`:

```sql
UPDATE breeds
SET reminder_message = 'Hi! Your Poodle needs their curls maintained. Regular grooming prevents matting!'
WHERE name = 'Poodle';
```

## Conversion Tracking

### Tracking Flow

1. **Reminder sent** → `tracking_id` generated
2. **Customer clicks link** → URL includes `?tracking={tracking_id}`
3. **Customer books** → Appointment created with `tracking_id`
4. **Conversion recorded** → `campaign_sends.booking_id` updated

### Analytics Queries

**Track conversion rate**:
```sql
SELECT
  COUNT(*) as total_sends,
  COUNT(booking_id) as conversions,
  ROUND(COUNT(booking_id)::numeric / COUNT(*) * 100, 2) as conversion_rate
FROM campaign_sends
WHERE campaign_id IS NULL -- Breed reminders only
  AND created_at >= NOW() - INTERVAL '30 days';
```

**Revenue attribution**:
```sql
SELECT
  SUM(a.total_price) as revenue_generated
FROM campaign_sends cs
JOIN appointments a ON a.id = cs.booking_id
WHERE cs.campaign_id IS NULL
  AND cs.created_at >= NOW() - INTERVAL '30 days';
```

## Dependencies

### Database Schema
- ✅ `marketing_campaigns` table (Phase 6, Task 0001)
- ✅ `campaign_sends` table (Phase 6, Task 0001)
- ✅ `notifications_log` enhancements (Phase 6, Task 0001)
- ✅ New migration: `20241213_phase6_campaign_sends_enhancements.sql`

### Code Dependencies
- `@/lib/supabase/server` - Database client
- `@/types/database` - Core types
- `@/types/marketing` - Campaign types
- `crypto.randomUUID()` - Tracking ID generation

### External Services (Production)
- Resend (email delivery)
- Twilio (SMS delivery)
- Vercel Crons or alternative scheduler

## Mock Mode Support

In development (`NEXT_PUBLIC_USE_MOCKS=true`):
- All database calls work with mock data
- Notifications logged but not actually sent
- No external API calls made
- `CRON_SECRET` validation skipped

## Security Considerations

1. **CRON_SECRET**: Use strong random string (32+ characters)
2. **Rate limiting**: Consider adding rate limits in production
3. **Duplicate prevention**: `tracking_id` ensures no duplicate sends
4. **PII protection**: Email/phone stored securely, logged minimally
5. **Unsubscribe support**: Respects `preferences.email_promotional` / `sms_promotional`

## Future Enhancements

1. **A/B Testing**: Test different message variations
2. **Smart timing**: Send at customer's preferred time of day
3. **Multi-pet households**: Bundle reminders for same customer
4. **Dynamic frequency**: Adjust based on actual grooming history
5. **Reminder sequences**: Follow-up reminders if no response
6. **SMS delivery reports**: Track delivery via Twilio webhooks

## Requirements Satisfied

- ✅ **REQ-6.8.1**: Automated breed-based reminder system
- ✅ **REQ-6.8.4**: Conversion tracking and analytics
- ✅ Daily cron job execution
- ✅ 7-day advance reminder timing
- ✅ Skip if upcoming appointment exists
- ✅ Skip if appointment within 14 days
- ✅ Campaign_sends tracking
- ✅ Duplicate prevention
- ✅ Max 2 attempts enforcement

## Migration Instructions

### 1. Apply Database Migration

```bash
# Using Supabase CLI
supabase db push

# Or manually apply
psql $DATABASE_URL < supabase/migrations/20241213_phase6_campaign_sends_enhancements.sql
```

### 2. Set Environment Variables

```bash
# .env.local (development)
CRON_SECRET=dev_secret_123

# Production (Vercel)
vercel env add CRON_SECRET production
```

### 3. Configure Cron Schedule

**Option A: Vercel** (Recommended)
```json
{
  "crons": [{
    "path": "/api/cron/breed-reminders",
    "schedule": "0 9 * * *"
  }]
}
```

**Option B: External Service**
- Set up daily trigger at 9:00 AM
- POST to `/api/cron/breed-reminders`
- Include `Authorization: Bearer <CRON_SECRET>` header

### 4. Test Endpoint

```bash
# Development
curl http://localhost:3000/api/cron/breed-reminders

# Production
curl https://thepuppyday.com/api/cron/breed-reminders \
  -H "Authorization: Bearer $CRON_SECRET"
```

### 5. Monitor Logs

Check Vercel logs or application logs for:
- Daily execution confirmation
- Statistics (eligible, sent, skipped counts)
- Any errors or warnings

## Files Summary

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `src/lib/admin/breed-reminder-scheduler.ts` | Scheduling logic | 500+ | ✅ Created |
| `src/app/api/cron/breed-reminders/route.ts` | Cron endpoint | 100+ | ✅ Created |
| `supabase/migrations/20241213_phase6_campaign_sends_enhancements.sql` | Schema updates | 25 | ✅ Created |
| `src/types/marketing.ts` | Type updates | - | ✅ Updated |

## Code Quality

- ✅ ESLint: No errors or warnings
- ✅ TypeScript: Strict mode compliant
- ✅ Error handling: Comprehensive try/catch blocks
- ✅ Logging: Detailed console logs for debugging
- ✅ Comments: Inline documentation throughout
- ✅ Type safety: Full TypeScript coverage

## Conclusion

Task 0037 is fully implemented and ready for testing. The breed-based reminder scheduler provides automated retention marketing with intelligent eligibility detection, proper skip logic, conversion tracking, and comprehensive error handling.

Next steps:
1. Apply database migration
2. Configure CRON_SECRET
3. Set up daily cron schedule
4. Monitor first execution
5. Analyze conversion metrics after 30 days
