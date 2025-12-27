# Task 0288: Write Webhook Signature Verification Unit Tests

## Description
Create unit tests for webhook signature verification to ensure webhook security.

## Checklist
- [ ] Test webhook signature validation for valid signatures
- [ ] Test rejection of invalid signatures
- [ ] Test handling of missing headers

## Acceptance Criteria
Webhook security verified, invalid requests rejected

## References
- Requirement 26.3

## Files to Create/Modify
- `__tests__/lib/calendar/webhook.test.ts`

## Implementation Notes
Generate test webhook payloads with valid and invalid signatures using test credentials.
