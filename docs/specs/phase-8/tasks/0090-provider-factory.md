# Task 0090: Create provider factory with environment-based selection

## Description
Create factory functions to return the appropriate provider (mock or real) based on environment configuration.

## Acceptance Criteria
- [x] Create `getEmailProvider()` function that returns MockResendProvider or ResendProvider based on `NEXT_PUBLIC_USE_MOCKS`
- [x] Create `getSMSProvider()` function that returns MockTwilioProvider or TwilioProvider based on `NEXT_PUBLIC_USE_MOCKS`
- [x] Implement singleton pattern for provider instances
- [x] Write tests to verify correct provider selection
- [x] Place in `src/lib/notifications/providers/index.ts`

## References
- Req 1.2, Req 1.3, Req 1.7

## Complexity
Small

## Category
Real Provider Implementations

## Status
✅ **COMPLETED**

## Implementation Notes
- Created environment-based provider factory in `src/lib/notifications/providers/index.ts`
- Implemented `getEmailProvider()` and `getSMSProvider()` with environment-based selection
- Uses `NEXT_PUBLIC_USE_MOCKS` environment variable (defaults to true for safety)
- Singleton pattern with caching - returns same instance on multiple calls
- Dynamic SDK imports using require() with graceful error handling
- Reset functions for testing: `resetEmailProvider()`, `resetSMSProvider()`, `resetAllProviders()`
- `getProviderMode()` utility to check current mode (mock/production)
- Comprehensive unit tests in `src/lib/notifications/providers/__tests__/index.test.ts`
- Tests cover: environment switching, singleton pattern, reset functionality, all modes
- All TypeScript and linting checks pass
- Commit: a54e4de
