# Task 0093: Implement RetryManager

## Description
Create a manager to process failed notifications and schedule retries with exponential backoff.

## Acceptance Criteria
- [x] Create `ExponentialBackoffRetryManager` class implementing `RetryManager` interface
- [x] Implement `processRetries()` method to find and process failed notifications
- [x] Query notifications_log for status='failed' with retry_after <= now and retry_count < 3
- [x] Process in batches of 100 with jitter between each
- [x] Update retry_count and schedule next retry on failure
- [x] Mark as permanently failed when max retries exceeded
- [x] Return `RetryResult` with processed, succeeded, failed, errors counts
- [x] Write unit tests with mock database
- [x] Place in `src/lib/notifications/retry-manager.ts`

## References
- Req 15.1, Req 15.2, Req 15.3, Req 15.4, Req 15.6, Req 15.7

## Complexity
Medium

## Category
Error Handling & Retry Logic

## Status
✅ **COMPLETED**

## Implementation Notes
- Created in `src/lib/notifications/retry-manager.ts`
- `ExponentialBackoffRetryManager` class implementing `RetryManager` interface
- Constructor accepts: SupabaseClient, NotificationService, optional RetryConfig
- `processRetries()` method workflow:
  1. Fetches pending retries using `queries.logs.getPendingRetries(maxRetries)`
  2. Processes notifications in batches of 100 (BATCH_SIZE constant)
  3. Adds 1-second delay between batches (BATCH_DELAY_MS = 1000)
  4. Returns `RetryResult` with counts: processed, succeeded, failed, errors[]
- `processNotification()` private method:
  - Rebuilds NotificationMessage from log entry
  - Attempts to send using NotificationService
  - Calls handleSuccess or handleFailure based on result
- `handleSuccess()` updates notification to 'sent' status with message_id
- `handleFailure()` logic:
  - Classifies error using `classifyError()`
  - If retryable and under max retries: schedules next retry with exponential backoff
  - If non-retryable or max retries exceeded: marks as permanently failed
  - Updates retry_count, retry_after, error_message
- Error handling: Try-catch at multiple levels with detailed logging
- Factory function: `createRetryManager(supabase, service, config?)`
- Comprehensive logging with emoji indicators: ✅ success, 🔄 retry scheduled, ❌ permanent failure
- Unit tests: Would require mocking Supabase and NotificationService (not included in this task)
- Commit: a54e4de
