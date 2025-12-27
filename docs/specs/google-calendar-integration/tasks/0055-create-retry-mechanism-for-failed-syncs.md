# Task 0055: Create Retry Mechanism for Failed Syncs

**Phase**: 11 - Error Handling and Recovery
**Task ID**: 11
**Status**: Pending

## Description

Create a retry queue system that automatically retries failed sync operations with exponential backoff to handle transient network failures and API rate limits.

## Requirements

- Create `src/lib/calendar/sync/retry-queue.ts`
- Implement `queueForRetry()` to add failed operations to retry queue
- Store retry attempts with exponential backoff timing
- Maximum 3 retry attempts before marking as permanently failed
- Process retry queue periodically (every 5 minutes)
- Track retry history for debugging

## Acceptance Criteria

- [ ] Retry queue module created at correct path
- [ ] `queueForRetry()` function adds failed sync to queue
- [ ] Exponential backoff implemented (1min, 5min, 15min)
- [ ] Maximum 3 retry attempts enforced
- [ ] Failed syncs marked as permanently failed after max retries
- [ ] `processRetryQueue()` function processes queued items
- [ ] Only retries items where backoff time has elapsed
- [ ] Retry history logged to `calendar_sync_log`
- [ ] Queue persisted to database (survives server restarts)
- [ ] Proper error handling and logging
- [ ] Unit tests for retry logic

## Related Requirements

- Req 5.6: Retry logic for failed syncs
- Req 18: Network Failure Handling

## Dependencies

- Sync logger utility (Task 4.1)
- Push sync service (Task 4)

## Database Schema

Create `calendar_sync_retry_queue` table:

```sql
CREATE TABLE calendar_sync_retry_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  operation text NOT NULL, -- 'create', 'update', 'delete'
  retry_count int NOT NULL DEFAULT 0,
  last_retry_at timestamptz,
  next_retry_at timestamptz NOT NULL,
  error_details jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_retry_queue_next_retry ON calendar_sync_retry_queue(next_retry_at) WHERE retry_count < 3;
```

## Backoff Schedule

| Attempt | Delay      | Total Time |
|---------|------------|------------|
| 1       | Immediate  | 0          |
| 2       | 1 minute   | 1 min      |
| 3       | 5 minutes  | 6 min      |
| 4       | 15 minutes | 21 min     |

After 3 retries (4 total attempts), mark as permanently failed.

## Technical Notes

- Use PostgreSQL for retry queue persistence
- Implement `getRetryBackoffTime(retryCount)` for backoff calculation
- Process retry queue via cron job or background worker
- Filter transient errors (network, rate limit) vs permanent errors
- Don't retry permanent errors (auth failure, invalid data)
- Send notification to admin after final failure

## Error Classification

**Transient (retry):**
- Network timeout
- Rate limit exceeded (429)
- Server error (500, 502, 503)
- Temporary Google API failure

**Permanent (don't retry):**
- Authentication failure (401)
- Invalid request (400)
- Calendar not found (404)
- Permission denied (403)

## Testing Checklist

- [ ] Queue add/remove tests
- [ ] Backoff calculation tests
- [ ] Max retry enforcement tests
- [ ] Retry processing tests
- [ ] Error classification tests
- [ ] Database persistence tests
- [ ] Concurrent processing tests
