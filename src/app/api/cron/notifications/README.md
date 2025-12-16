# Notification System Cron Jobs

This directory contains scheduled cron jobs for the notification system (Phase 8, Tasks 0111-0115).

## Overview

Three automated cron jobs handle different aspects of the notification system:

1. **Appointment Reminders** - Send SMS reminders 24 hours before appointments
2. **Retention Reminders** - Send email + SMS to customers with overdue grooming
3. **Retry Processing** - Process failed notifications with exponential backoff

## Cron Jobs

### 1. Appointment Reminders

**Endpoint:** `/api/cron/notifications/reminders`
**Schedule:** Hourly (`0 * * * *`)
**Channel:** SMS only

Sends appointment reminders to customers 24 hours before their scheduled appointments.

**Logic:**
- Queries appointments scheduled 23-25 hours from now (1-hour window)
- Filters to `pending` or `confirmed` status only
- Checks for existing reminders to prevent duplicates
- Sends SMS with appointment details (date, time, pet name, service)
- Tracks all sent reminders in `notifications_log`

**Template Variables:**
- `customer_name` - Customer's first name
- `pet_name` - Pet's name
- `service_name` - Service name (e.g., "Basic Grooming")
- `appointment_date` - Formatted date (e.g., "Monday, December 20")
- `appointment_time` - Formatted time (e.g., "2:00 PM")

**Notification Type:** `appointment_reminder`

---

### 2. Retention Reminders

**Endpoint:** `/api/cron/notifications/retention`
**Schedule:** Daily at 9 AM (`0 9 * * *`)
**Channels:** Email + SMS

Sends retention reminders to customers whose pets are overdue for grooming based on breed frequency.

**Logic:**
- Queries all active pets with their last completed appointment
- Calculates if pet is overdue based on breed grooming frequency
- Checks customer marketing preferences (skips if opted out)
- Checks for recent reminders (within 7 days) to prevent spam
- Sends both email and SMS reminders
- Includes booking link in notifications

**Template Variables:**
- `customer_name` - Customer's first name
- `pet_name` - Pet's name
- `breed_name` - Breed name or "your dog"
- `weeks_since_last` - Number of weeks since last appointment
- `booking_url` - Link to booking page

**Notification Type:** `retention_reminder`

**Default Grooming Frequency:**
- If breed has no specified frequency: 8 weeks
- Otherwise: Uses breed's `grooming_frequency_weeks`

---

### 3. Retry Processing

**Endpoint:** `/api/cron/notifications/retry`
**Schedule:** Every 5 minutes (`*/5 * * * *`)
**Channels:** All (processes failed notifications)

Processes pending notification retries using exponential backoff strategy.

**Logic:**
- Calls `NotificationService.processRetries()`
- Retrieves failed notifications eligible for retry
- Respects retry schedule (exponential backoff with jitter)
- Updates notification status based on retry result
- Marks as permanently failed if max retries exceeded

**Retry Configuration:**
- Max retries: 2 attempts
- Base delay: 30 seconds
- Max delay: 5 minutes (300 seconds)
- Jitter factor: ±30%

**Error Classification:**
- **Transient** - Retry (network errors, rate limits, temporary failures)
- **Permanent** - Don't retry (invalid phone/email, validation errors)

---

## Configuration

### Environment Variables

Required environment variable:

```bash
# Cron job authentication secret
CRON_SECRET=your-secure-random-string-here

# Generate a secure secret:
# openssl rand -hex 32
```

Add this to your `.env.local` file (never commit the actual secret).

### Vercel Configuration

Cron jobs are configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/notifications/reminders",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/notifications/retention",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/notifications/retry",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## Security

### Authentication

All cron endpoints require authentication via the `Authorization` header:

```bash
Authorization: Bearer <CRON_SECRET>
```

Vercel automatically includes this header when invoking cron jobs.

### Concurrent Execution Prevention

Each cron job uses an in-memory lock to prevent concurrent execution:

```typescript
let isProcessing = false;

// At start
if (isProcessing) {
  return NextResponse.json({ success: true, skipped: true });
}
isProcessing = true;

// Always reset in finally block
try {
  // ... job logic
} finally {
  isProcessing = false;
}
```

## Manual Triggering (Development Only)

For testing and development, you can manually trigger jobs via admin endpoints:

### Trigger Appointment Reminders

```bash
POST /api/admin/notifications/jobs/reminders/trigger
Authorization: Bearer <admin-token>
```

### Trigger Retention Reminders

```bash
POST /api/admin/notifications/jobs/retention/trigger
Authorization: Bearer <admin-token>
```

**Requirements:**
- Only available in development mode (`NODE_ENV=development`)
- Requires admin authentication
- Returns same response format as cron jobs

## Response Format

All cron jobs return a consistent JSON response:

### Success Response

```json
{
  "success": true,
  "timestamp": "2025-12-15T12:00:00.000Z",
  "processed": 10,
  "sent": 8,
  "failed": 1,
  "skipped": 1,
  "duration_ms": 1234
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2025-12-15T12:00:00.000Z"
}
```

### Skipped Response (Concurrent Execution)

```json
{
  "success": true,
  "skipped": true,
  "message": "Job already running",
  "timestamp": "2025-12-15T12:00:00.000Z"
}
```

## Monitoring

### Logs

All cron jobs log detailed execution information:

```
[Appointment Reminders Cron] Starting job at: 2025-12-15T12:00:00.000Z
[Appointment Reminders Cron] Time window: {...}
[Appointment Reminders Cron] Found appointments: 5
[Appointment Reminders Cron] ✅ Sent reminder for appointment appt-123
[Appointment Reminders Cron] Job completed. Stats: {...}
```

### Database Tracking

All notifications are logged in the `notifications_log` table:

- `type` - Notification type (e.g., `appointment_reminder`)
- `channel` - Communication channel (`email`, `sms`)
- `status` - Current status (`pending`, `sent`, `failed`)
- `retry_count` - Number of retry attempts
- `retry_after` - Scheduled retry timestamp
- `error_message` - Error details if failed

### Querying Logs

```sql
-- Get recent appointment reminders
SELECT * FROM notifications_log
WHERE type = 'appointment_reminder'
ORDER BY created_at DESC
LIMIT 100;

-- Get failed notifications pending retry
SELECT * FROM notifications_log
WHERE status = 'failed'
  AND retry_after IS NOT NULL
  AND retry_after <= NOW()
ORDER BY retry_after ASC;

-- Get retention reminder stats
SELECT
  status,
  COUNT(*) as count
FROM notifications_log
WHERE type = 'retention_reminder'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY status;
```

## Testing

### Unit Tests

Run unit tests for all cron jobs:

```bash
npm test __tests__/api/cron/notifications
```

Test files:
- `__tests__/api/cron/notifications/reminders.test.ts`
- `__tests__/api/cron/notifications/retention.test.ts`
- `__tests__/api/cron/notifications/retry.test.ts`
- `__tests__/api/admin/notifications/jobs/triggers.test.ts`

### Manual Testing

1. **Set up environment:**
   ```bash
   NODE_ENV=development
   CRON_SECRET=test-secret-123
   NEXT_PUBLIC_USE_MOCKS=true
   ```

2. **Create test appointments** (24 hours from now):
   ```sql
   INSERT INTO appointments (customer_id, pet_id, service_id, scheduled_at, status)
   VALUES ('...', '...', '...', NOW() + INTERVAL '24 hours', 'confirmed');
   ```

3. **Trigger reminder job:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/notifications/jobs/reminders/trigger \
     -H "Authorization: Bearer <admin-token>"
   ```

4. **Check notifications_log table** for sent reminders.

## Troubleshooting

### Reminders Not Sending

1. **Check cron secret:**
   ```bash
   echo $CRON_SECRET
   ```

2. **Check appointment time window:**
   - Job looks for appointments 23-25 hours from execution time
   - Ensure appointments are in this window

3. **Check for duplicates:**
   ```sql
   SELECT * FROM notifications_log
   WHERE type = 'appointment_reminder'
     AND customer_id = '...'
     AND status = 'sent'
     AND created_at >= NOW() - INTERVAL '24 hours';
   ```

### Retention Reminders Not Sending

1. **Check pet last appointment:**
   ```sql
   SELECT * FROM appointments
   WHERE pet_id = '...'
     AND status = 'completed'
   ORDER BY scheduled_at DESC
   LIMIT 1;
   ```

2. **Check breed frequency:**
   ```sql
   SELECT grooming_frequency_weeks FROM breeds WHERE id = '...';
   ```

3. **Check marketing preferences:**
   ```sql
   SELECT preferences FROM users WHERE id = '...';
   -- Look for marketing_opt_out: true
   ```

### Retry Processing Issues

1. **Check pending retries:**
   ```sql
   SELECT * FROM notifications_log
   WHERE status = 'failed'
     AND retry_after IS NOT NULL
     AND retry_after <= NOW()
     AND retry_count < 2;
   ```

2. **Check retry configuration** in notification service.

3. **Review error messages** in notifications_log for classification.

## Related Documentation

- [Notification Service](../../../lib/notifications/README.md) - Core notification service
- [Template Engine](../../../lib/notifications/template-engine.ts) - Template rendering
- [Retry Manager](../../../lib/notifications/retry-manager.ts) - Retry logic
- [Error Classification](../../../lib/notifications/errors.ts) - Error handling
