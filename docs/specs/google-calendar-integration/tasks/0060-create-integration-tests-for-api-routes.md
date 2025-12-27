# Task 0060: Create Integration Tests for API Routes

**Phase**: 12 - Testing
**Task ID**: 12.1
**Status**: Pending

## Description

Create integration tests for all calendar API routes to ensure proper request/response handling, authentication, and error cases.

## Requirements

- Create test files in `src/app/api/admin/calendar/__tests__/`
- Test OAuth flow endpoints (start, callback, disconnect)
- Test sync endpoints (manual, bulk, status)
- Test import endpoints (preview, confirm)
- Test settings endpoints (GET, PUT)
- Test webhook endpoint
- Mock Google Calendar API calls
- Use test database for data persistence

## Acceptance Criteria

- [ ] All test files created in correct directory
- [ ] OAuth endpoints tested (start, callback, disconnect)
- [ ] Sync endpoints tested (manual, bulk, status)
- [ ] Import endpoints tested (preview, confirm)
- [ ] Settings endpoints tested
- [ ] Webhook endpoint tested
- [ ] Authentication middleware tested
- [ ] Request validation tested
- [ ] Error responses tested
- [ ] All tests pass successfully
- [ ] Mocked Google API responses

## Related Requirements

- Req 29.2: Integration tests with mocked Google Calendar API
- Req 29.5: API endpoint testing
- Req 29.6: Authentication flow testing

## Test Files Structure

```
src/app/api/admin/calendar/__tests__/
├── auth.test.ts (OAuth flow)
├── sync.test.ts (Manual and bulk sync)
├── import.test.ts (Import preview and confirm)
├── settings.test.ts (Settings CRUD)
├── webhook.test.ts (Webhook notifications)
└── helpers.ts (Test utilities)
```

## Test Coverage Requirements

### auth.test.ts

OAuth Start:
- [ ] Returns authorization URL for admin users
- [ ] Includes correct scopes and state
- [ ] Returns 401 for non-admin users
- [ ] Returns 409 if connection already exists

OAuth Callback:
- [ ] Successfully exchanges code for tokens
- [ ] Stores encrypted tokens in database
- [ ] Creates calendar connection record
- [ ] Redirects to settings with success status
- [ ] Handles invalid state parameter
- [ ] Handles token exchange errors

OAuth Disconnect:
- [ ] Revokes tokens with Google
- [ ] Deletes connection from database
- [ ] Deletes all event mappings
- [ ] Returns success response
- [ ] Handles missing connection gracefully

### sync.test.ts

Manual Sync:
- [ ] Syncs appointment to Google Calendar
- [ ] Creates event mapping
- [ ] Logs sync operation
- [ ] Returns operation result
- [ ] Handles sync criteria check
- [ ] Handles API errors

Bulk Sync:
- [ ] Initiates bulk sync job
- [ ] Returns job ID
- [ ] Processes appointments in batches
- [ ] Respects rate limits
- [ ] Returns summary on completion

Sync Status:
- [ ] Returns connection status
- [ ] Returns recent sync stats
- [ ] Returns webhook status
- [ ] Returns error counts

### import.test.ts

Import Preview:
- [ ] Fetches events from Google Calendar
- [ ] Parses event descriptions
- [ ] Detects duplicates
- [ ] Suggests matches
- [ ] Filters already-imported events
- [ ] Returns preview data

Import Confirm:
- [ ] Creates appointments from events
- [ ] Validates required fields
- [ ] Creates event mappings
- [ ] Returns success/failure results
- [ ] Handles validation errors

### settings.test.ts

Get Settings:
- [ ] Returns current sync settings
- [ ] Returns defaults if not configured
- [ ] Handles missing settings

Update Settings:
- [ ] Updates sync settings
- [ ] Validates settings schema
- [ ] Returns updated settings
- [ ] Handles validation errors

### webhook.test.ts

Webhook Notification:
- [ ] Validates webhook authenticity
- [ ] Parses notification headers
- [ ] Returns 200 immediately
- [ ] Queues event processing
- [ ] Handles invalid webhooks

## Mock Google Calendar API

Create comprehensive mock in `helpers.ts`:

```typescript
export const mockGoogleCalendarAPI = {
  events: {
    list: jest.fn().mockResolvedValue({
      data: {
        items: [
          {
            id: 'event-1',
            summary: 'Grooming - Max (John Doe)',
            start: { dateTime: '2025-12-26T14:00:00-08:00' },
            end: { dateTime: '2025-12-26T15:00:00-08:00' },
            description: 'Phone: 555-1234...',
          },
        ],
      },
    }),
    insert: jest.fn().mockResolvedValue({
      data: { id: 'new-event-id' },
    }),
    update: jest.fn().mockResolvedValue({
      data: { id: 'updated-event-id' },
    }),
    delete: jest.fn().mockResolvedValue({}),
  },
};
```

## Test Database Setup

Use test database for integration tests:

```typescript
beforeAll(async () => {
  // Connect to test database
  await setupTestDatabase();
});

afterAll(async () => {
  // Clean up test database
  await teardownTestDatabase();
});

beforeEach(async () => {
  // Reset database state
  await resetTestData();
});
```

## Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration auth.test.ts

# Run with coverage
npm run test:integration:coverage
```

## Testing Checklist

- [ ] All test files created
- [ ] OAuth flow tests passing
- [ ] Sync endpoint tests passing
- [ ] Import endpoint tests passing
- [ ] Settings endpoint tests passing
- [ ] Webhook endpoint tests passing
- [ ] Mocks properly configured
- [ ] Test database setup working
- [ ] Error cases covered
- [ ] CI/CD integration configured
