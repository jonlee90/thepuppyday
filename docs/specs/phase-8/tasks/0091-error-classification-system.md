# Task 0091: Implement error classification system

## Description
Create a system to classify notification errors into different types for appropriate handling.

## Acceptance Criteria
- [x] Create `ErrorType` enum with TRANSIENT, PERMANENT, RATE_LIMIT, VALIDATION
- [x] Create `ClassifiedError` interface with type, message, retryable, statusCode
- [x] Implement `classifyError()` function to categorize errors
- [x] Handle network errors (ECONNRESET, ETIMEDOUT) as transient
- [x] Handle HTTP status codes: 429 (rate limit), 5xx (transient), 4xx (permanent/validation)
- [x] Write unit tests for all error classification scenarios
- [x] Place in `src/lib/notifications/errors.ts`

## References
- Req 15.1, Req 15.5

## Complexity
Small

## Category
Error Handling & Retry Logic

## Status
✅ **COMPLETED**

## Implementation Notes
- Created comprehensive error classification system in `src/lib/notifications/errors.ts`
- `ErrorType` enum: TRANSIENT, PERMANENT, RATE_LIMIT, VALIDATION
- `ClassifiedError` interface with type, message, retryable, statusCode, originalError
- `classifyError()` function handles Error instances, strings, objects with message
- Network error detection: ECONNRESET, ETIMEDOUT, ECONNREFUSED, EHOSTUNREACH, etc.
- Rate limit detection: "rate limit", "too many requests", "429", "throttled", "quota exceeded"
- Validation detection: "invalid", "validation", "malformed", "bad request", etc.
- HTTP status code classification:
  - 429: RATE_LIMIT (retryable)
  - 500-504: TRANSIENT (retryable)
  - 400, 422: VALIDATION (permanent)
  - 401, 403, 404: PERMANENT (non-retryable)
- Helper functions: `shouldRetry()`, `getErrorMessage()`, `getErrorType()`
- Extensive unit tests in `src/lib/notifications/__tests__/errors.test.ts`
- Test coverage: 50+ test cases for all error types and scenarios
- Commit: a54e4de
