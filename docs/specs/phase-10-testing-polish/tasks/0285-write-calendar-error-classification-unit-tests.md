# Task 0285: Write Calendar Error Classification Unit Tests

## Description
Create unit tests for calendar error classification to ensure proper error handling and retry logic.

## Checklist
- [ ] Test classifyError() for quota exceeded errors (429)
- [ ] Test classifyError() for auth failure errors (401)
- [ ] Test classifyError() for network errors
- [ ] Test shouldRetry() logic for different error types

## Acceptance Criteria
All error types classified correctly, retry logic verified

## References
- Requirement 26.4

## Files to Create/Modify
- `__tests__/lib/calendar/error-classifier.test.ts`

## Implementation Notes
Mock various Google Calendar API error responses to test classification.
