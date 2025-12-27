# Calendar Sync Error Recovery and Retry System

This directory contains the error recovery and retry mechanism for Google Calendar sync operations.

## Overview

The retry system provides automatic recovery from transient sync failures with exponential backoff, quota tracking, and automatic pause on consecutive failures.

## Components

### 1. Retry Queue (`retry-queue.ts`)

Manages failed sync operations with automatic retry using exponential backoff.

**Key Functions:**
- `queueForRetry(supabase, appointmentId, operation, errorDetails)` - Add failed operation to retry queue
- `processRetryQueue(supabase)` - Process pending retries (call this on a schedule)
- `removeFromQueue(supabase, appointmentId)` - Remove successful sync from queue
- `getQueueStats(supabase)` - Get queue statistics
- `getRetryBackoffTime(retryCount)` - Calculate backoff time

**Retry Schedule:**
- 0 retries → 1 minute
- 1 retry → 5 minutes
- 2 retries → 15 minutes
- 3+ retries → permanent failure (admin notification)

**Usage Example:**
```typescript
import { queueForRetry, processRetryQueue } from '@/lib/calendar/sync';

// Add failed sync to retry queue
await queueForRetry(supabase, appointmentId, 'create', {
  code: 'HTTP_429',
  message: 'Rate limit exceeded',
  timestamp: new Date().toISOString()
});

// Process retry queue (call this on a schedule, e.g., every minute)
const stats = await processRetryQueue(supabase);
console.log(`Processed: ${stats.processed}, Succeeded: ${stats.succeeded}`);
```

### 2. Error Classifier (`error-classifier.ts`)

Classifies errors as transient (should retry) or permanent (should not retry).

**Key Functions:**
- `isTransientError(error)` - Check if error is transient
- `classifyError(error)` - Classify error and get user-friendly message

**Transient Errors (will retry):**
- 408 - Request Timeout
- 429 - Rate Limit
- 500 - Internal Server Error
- 502 - Bad Gateway
- 503 - Service Unavailable
- 504 - Gateway Timeout
- Network errors (ECONNREFUSED, ENOTFOUND, etc.)

**Permanent Errors (will not retry):**
- 400 - Bad Request
- 401 - Unauthorized
- 403 - Forbidden
- 404 - Not Found
- 409 - Conflict
- 410 - Gone
- 422 - Unprocessable Entity

**Usage Example:**
```typescript
import { isTransientError, classifyError } from '@/lib/calendar/sync';

try {
  await syncToCalendar(appointment);
} catch (error) {
  const classified = classifyError(error);

  if (classified.type === 'transient') {
    // Add to retry queue
    await queueForRetry(supabase, appointmentId, operation, {
      code: classified.code,
      message: classified.message,
    });

    // Show user message
    console.log(classified.userMessage);
    // "Rate limit reached. The sync will be retried after a short delay."
  } else {
    // Log permanent failure
    console.error('Permanent failure:', classified.userMessage);
    // "Authentication failed. Please reconnect your Google Calendar."
  }
}
```

### 3. Pause Manager (`pause-manager.ts`)

Manages automatic pausing of sync when too many consecutive failures occur.

**Key Functions:**
- `trackSyncFailure(supabase, connectionId, error)` - Track sync failure
- `trackSyncSuccess(supabase, connectionId)` - Track sync success (resets counter)
- `pauseAutoSync(supabase, connectionId, reason)` - Manually pause auto-sync
- `resumeAutoSync(supabase, connectionId)` - Resume auto-sync
- `checkPauseStatus(supabase, connectionId)` - Get pause status
- `getPausedConnections(supabase)` - Get all paused connections

**Auto-Pause Threshold:** 10 consecutive failures

**Usage Example:**
```typescript
import { trackSyncSuccess, trackSyncFailure } from '@/lib/calendar/sync';

try {
  await syncToCalendar(appointment);
  // Reset consecutive failures on success
  await trackSyncSuccess(supabase, connectionId);
} catch (error) {
  // Track failure (auto-pauses after 10 consecutive failures)
  await trackSyncFailure(supabase, connectionId, error);
}

// Manually pause sync
await pauseAutoSync(supabase, connectionId, 'Invalid authentication token');

// Resume sync
await resumeAutoSync(supabase, connectionId);
```

## Quota Tracking (`../quota/tracker.ts`)

Tracks daily Google Calendar API usage to prevent quota exhaustion.

**Key Functions:**
- `trackApiCall(supabase)` - Increment quota counter (call before each API request)
- `getQuotaStatus(supabase)` - Get current quota usage
- `isQuotaExceeded(supabase)` - Check if near quota limit (>95%)
- `getQuotaHistory(supabase, days)` - Get quota history for analytics

**Daily Quota Limit:** 1,000,000 requests (conservative limit)
**Warning Threshold:** 95% of limit

**Usage Example:**
```typescript
import { trackApiCall, isQuotaExceeded } from '@/lib/calendar/quota';

// Before making any Google Calendar API call
await trackApiCall(supabase);

// Check if near quota limit
if (await isQuotaExceeded(supabase)) {
  console.warn('API quota nearly exhausted!');
  // Pause non-critical sync operations
}

// Get quota status
const status = await getQuotaStatus(supabase);
console.log(`Usage: ${status.percentage}%, Resets in: ${status.timeUntilReset}`);
```

## Integration with Sync Operations

To integrate the retry system into your sync operations:

```typescript
import { pushAppointmentToCalendar } from '@/lib/calendar/sync/push';
import {
  queueForRetry,
  isTransientError,
  trackSyncSuccess,
  trackSyncFailure
} from '@/lib/calendar/sync';
import { trackApiCall, isQuotaExceeded } from '@/lib/calendar/quota';

async function syncAppointment(supabase, appointment, connectionId) {
  try {
    // Check quota before syncing
    if (await isQuotaExceeded(supabase)) {
      console.warn('Quota nearly exhausted, skipping non-critical sync');
      return;
    }

    // Track API call
    await trackApiCall(supabase);

    // Attempt to sync
    const result = await pushAppointmentToCalendar(supabase, appointment);

    if (result.success) {
      // Track success (resets consecutive failure counter)
      await trackSyncSuccess(supabase, connectionId);
    } else {
      // Check if error is transient
      if (isTransientError(result.error)) {
        // Add to retry queue
        await queueForRetry(
          supabase,
          appointment.id,
          result.operation,
          {
            code: result.error.code,
            message: result.error.message,
          }
        );
      }

      // Track failure (auto-pauses after 10 consecutive failures)
      await trackSyncFailure(supabase, connectionId, new Error(result.error.message));
    }

    return result;
  } catch (error) {
    console.error('Sync error:', error);

    // Track failure
    if (error instanceof Error) {
      await trackSyncFailure(supabase, connectionId, error);
    }

    throw error;
  }
}
```

## Scheduled Jobs

You should set up the following scheduled jobs:

### 1. Retry Queue Processing (Every 1-5 minutes)
```typescript
// Process retry queue every minute
setInterval(async () => {
  const stats = await processRetryQueue(supabase);
  console.log(`Retry queue processed: ${stats.processed} items, ${stats.succeeded} succeeded`);
}, 60000); // 1 minute
```

### 2. Quota Cleanup (Daily)
```typescript
// Clean up old quota records (runs daily at midnight via database function)
// This is handled automatically by the database cleanup_quota_records() function
```

### 3. Retry Queue Cleanup (Daily)
```typescript
// Clean up old retry queue entries (runs daily via database function)
// This is handled automatically by the database cleanup_retry_queue() function
```

## Database Schema

The retry system uses the following database tables:

### `calendar_sync_retry_queue`
- `id` - UUID primary key
- `appointment_id` - Reference to appointment
- `operation` - Sync operation (create, update, delete)
- `retry_count` - Number of retry attempts
- `next_retry_at` - Timestamp of next retry
- `error_details` - JSON error information
- `created_at`, `updated_at` - Timestamps

### `calendar_api_quota`
- `date` - Date (primary key)
- `request_count` - Number of API requests
- `last_updated` - Last update timestamp

### `calendar_connections` (extended)
- `consecutive_failures` - Counter for consecutive sync failures
- `auto_sync_paused` - Boolean flag for auto-pause
- `paused_at` - Timestamp when paused
- `pause_reason` - Human-readable pause reason

## Database Functions

### `increment_quota(target_date DATE)`
Safely increments the daily API quota counter.

### `cleanup_retry_queue()`
Removes old retry queue entries (>7 days) that exceeded retry limit.

### `cleanup_quota_records()`
Removes old quota records (>30 days).

## Monitoring

### Admin Dashboard Views

Check the following views for monitoring:

```sql
-- Retry queue summary
SELECT * FROM retry_queue_summary;

-- Calendar connection health
SELECT * FROM calendar_health_summary;
```

### Get Paused Connections
```typescript
import { getPausedConnections } from '@/lib/calendar/sync';

const paused = await getPausedConnections(supabase);
console.log(`${paused.length} connections are paused`);
paused.forEach(conn => {
  console.log(`- ${conn.calendar_email}: ${conn.pause_reason}`);
});
```

## Error Handling Best Practices

1. **Always classify errors** before deciding to retry
2. **Track all API calls** for quota monitoring
3. **Track sync success/failure** to enable auto-pause
4. **Add transient errors to retry queue** automatically
5. **Log permanent failures** for admin review
6. **Monitor quota usage** and pause non-critical operations when near limit
7. **Set up scheduled jobs** to process retry queue regularly

## Future Enhancements

- [ ] Admin notification integration for permanent failures
- [ ] Admin notification for auto-pause events
- [ ] Retry queue dashboard/UI
- [ ] Quota usage analytics and trends
- [ ] Configurable retry schedules
- [ ] Webhook-based retry triggers
