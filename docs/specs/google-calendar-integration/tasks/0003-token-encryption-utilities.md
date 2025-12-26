# Task 0003: Create token encryption utilities

## Description
Implement AES-256-GCM encryption and decryption utilities for secure OAuth token storage.

## Files to Create
- `src/lib/calendar/encryption.ts` - Encryption utilities
- `src/lib/calendar/__tests__/encryption.test.ts` - Unit tests

## Dependencies
- Task 0002 (Database migration should be complete)

## Acceptance Criteria
- [ ] `encryptToken()` function implemented using AES-256-GCM
- [ ] `decryptToken()` function implemented for secure token retrieval
- [ ] Error handling for decryption failures (corrupted data, wrong key)
- [ ] Uses environment variable for encryption key (CALENDAR_TOKEN_ENCRYPTION_KEY)
- [ ] Unit tests cover encryption/decryption round-trip
- [ ] Unit tests cover error scenarios (missing key, corrupted data)
- [ ] All tests pass

## Implementation Notes
- Use Node.js crypto module (crypto.createCipheriv, crypto.createDecipheriv)
- Generate random IV for each encryption operation
- Store IV alongside encrypted data (prepend to encrypted string)
- Encryption key should be 32 bytes (256 bits)
- Follow existing Next.js patterns for crypto operations

## Requirements Coverage
- Req 15: Data Privacy and Security

## Estimated Effort
2 hours
