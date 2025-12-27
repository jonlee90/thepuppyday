# Task 0059: Create Unit Tests for Core Calendar Utilities

**Phase**: 12 - Testing
**Task ID**: 12
**Status**: Pending

## Description

Create comprehensive unit tests for all core calendar utility modules to ensure reliability and prevent regressions.

## Requirements

- Create test files in `src/lib/calendar/__tests__/`
- Test encryption/decryption utilities
- Test OAuth client factory
- Test token manager with auto-refresh
- Test appointment-to-event mapping
- Test sync criteria checker
- Achieve minimum 80% code coverage

## Acceptance Criteria

- [ ] All test files created in correct directory
- [ ] `encryption.test.ts` - Tests for AES-256-GCM encryption
- [ ] `oauth.test.ts` - Tests for OAuth client creation
- [ ] `token-manager.test.ts` - Tests for token refresh logic
- [ ] `mapping.test.ts` - Tests for appointment-to-event conversion
- [ ] `sync-criteria.test.ts` - Tests for sync eligibility logic
- [ ] All tests pass successfully
- [ ] Code coverage >= 80% for utility modules
- [ ] Mock external dependencies (googleapis, Supabase)
- [ ] Edge cases covered (null values, errors, etc.)
- [ ] Proper test organization (describe blocks, clear names)

## Related Requirements

- Req 29.1: Unit tests for core utilities
- Req 29.2: Mocked external dependencies
- Req 29.3: Test coverage >= 80%
- Req 29.4: Edge case coverage

## Testing Framework

- **Test Runner**: Jest
- **Assertion Library**: Jest expect
- **Mocking**: Jest mock functions
- **Coverage**: Jest coverage reporter

## Test Files Structure

```
src/lib/calendar/__tests__/
├── encryption.test.ts
├── oauth.test.ts
├── token-manager.test.ts
├── mapping.test.ts
├── sync-criteria.test.ts
└── setup.ts (test utilities and mocks)
```

## Test Coverage Requirements

### encryption.test.ts

- [ ] Successfully encrypts tokens
- [ ] Successfully decrypts tokens
- [ ] Handles encryption errors
- [ ] Handles decryption errors
- [ ] Rejects invalid encrypted data
- [ ] Uses correct encryption algorithm (AES-256-GCM)

### oauth.test.ts

- [ ] Creates OAuth2 client with correct credentials
- [ ] Generates authorization URL with correct scopes
- [ ] Includes offline access and consent prompt
- [ ] Exchanges code for tokens successfully
- [ ] Handles token exchange errors
- [ ] Revokes tokens successfully
- [ ] Handles revocation errors

### token-manager.test.ts

- [ ] Returns valid token when not expired
- [ ] Refreshes token when expired
- [ ] Stores refreshed tokens encrypted
- [ ] Updates expiry time after refresh
- [ ] Handles refresh errors gracefully
- [ ] Disconnects connection on permanent refresh failure
- [ ] Caches tokens to reduce database calls

### mapping.test.ts

- [ ] Maps basic appointment to event correctly
- [ ] Includes customer name in event title
- [ ] Includes pet name in event title
- [ ] Includes service name in event title
- [ ] Calculates duration from service + addons
- [ ] Formats event description with all details
- [ ] Sets correct timezone (America/Los_Angeles)
- [ ] Sets correct event color based on status
- [ ] Handles missing optional fields
- [ ] Handles appointments with multiple addons

### sync-criteria.test.ts

- [ ] Returns true for eligible appointments
- [ ] Returns false when auto-sync disabled
- [ ] Checks appointment status against settings
- [ ] Respects sync_past_appointments setting
- [ ] Respects sync_completed_appointments setting
- [ ] Handles edge cases (null dates, invalid status)
- [ ] Filters appointment list correctly

## Mock Setup Example

```typescript
// setup.ts
import { jest } from '@jest/globals';

export const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

export const mockGoogleAuth = {
  OAuth2: jest.fn().mockImplementation(() => ({
    setCredentials: jest.fn(),
    getToken: jest.fn(),
    revokeToken: jest.fn(),
  })),
};
```

## Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test encryption.test.ts

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Testing Checklist

- [ ] All test files created
- [ ] All tests passing
- [ ] Code coverage >= 80%
- [ ] Mocks properly configured
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Test output clear and descriptive
- [ ] CI/CD integration configured
