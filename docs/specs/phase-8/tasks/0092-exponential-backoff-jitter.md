# Task 0092: Implement exponential backoff with jitter

## Description
Create retry delay calculation logic with exponential backoff and jitter to prevent thundering herd problems.

## Acceptance Criteria
- [x] Create `RetryConfig` interface with maxRetries, baseDelay, maxDelay, jitterFactor
- [x] Implement `calculateRetryDelay()` function with exponential backoff formula
- [x] Add jitter (randomness) to prevent thundering herd
- [x] Create `DEFAULT_RETRY_CONFIG` constant (2 retries, 30s base, 300s max, 0.3 jitter)
- [x] Write unit tests for delay calculation

## References
- Req 15.1, Req 15.2, Req 15.8

## Complexity
Small

## Category
Error Handling & Retry Logic

## Status
✅ **COMPLETED**

## Implementation Notes
- Implemented in `src/lib/notifications/errors.ts` (combined with error classification)
- `RetryConfig` interface: maxRetries, baseDelay, maxDelay, jitterFactor
- `DEFAULT_RETRY_CONFIG`: 2 retries, 30s base, 300s max, 0.3 jitter factor
- Exponential backoff formula: `delay = min(baseDelay * 2^retryCount, maxDelay) * (1 ± jitterFactor)`
- Jitter implementation: Random variance of ±30% to prevent thundering herd
- Retry delay progression (with default config):
  - Attempt 0 (first retry): 21-39 seconds (30s ± 30%)
  - Attempt 1 (second retry): 42-78 seconds (60s ± 30%)
  - Attempt 2 (third retry): 84-156 seconds (120s ± 30%)
  - Higher attempts: capped at 210-390 seconds (300s ± 30%)
- Helper functions:
  - `calculateRetryDelay(retryCount, config)`: Returns delay in seconds
  - `calculateRetryTimestamp(retryCount, config)`: Returns Date for retry_after
  - `hasExceededMaxRetries(retryCount, maxRetries)`: Boolean check
- Comprehensive unit tests in `src/lib/notifications/__tests__/errors.test.ts`
- Tests verify: delay ranges, jitter randomness, max delay capping, custom configs
- Commit: a54e4de
