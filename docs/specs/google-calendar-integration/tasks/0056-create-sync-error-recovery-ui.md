# Task 0056: Create Sync Error Recovery UI

**Phase**: 11 - Error Handling and Recovery
**Task ID**: 11.1
**Status**: Pending

## Description

Create a user interface component that displays failed sync operations and provides recovery actions including retry, resync, and rollback options.

## Requirements

- Create `src/components/admin/calendar/SyncErrorRecovery.tsx`
- Display list of failed syncs with error messages
- Show "Retry" button for individual failures
- Show "Retry All" button for batch retry
- Show "Resync" button to delete and recreate event
- Provide rollback option for bulk sync failures
- Display error details and suggested actions

## Acceptance Criteria

- [ ] Component created at correct path
- [ ] Failed syncs list displayed with appointment details
- [ ] Error messages shown in user-friendly format
- [ ] "Retry" button triggers individual retry
- [ ] "Retry All" button triggers batch retry
- [ ] "Resync" button deletes and recreates event
- [ ] Rollback option available for bulk import failures
- [ ] Loading states shown during operations
- [ ] Success feedback after successful retry
- [ ] Error count badge updates in real-time
- [ ] Filter options (by date, error type)
- [ ] Empty state when no errors
- [ ] Proper TypeScript types defined

## Related Requirements

- Req 20: Rollback and Error Recovery
- Req 11.2: Manual sync triggers

## Dependencies

- Task 0055 (Retry mechanism)
- Sync logger utility (Task 4.1)
- Manual sync endpoint (Task 4.2)

## API Endpoints

- `GET /api/admin/calendar/sync/errors`
  - Returns list of failed syncs
  - Query params: `dateFrom`, `dateTo`, `errorType`

- `POST /api/admin/calendar/sync/retry`
  - Body: `{ appointmentIds: string[] }`
  - Retries failed syncs for specified appointments

- `POST /api/admin/calendar/sync/resync`
  - Body: `{ appointmentId: string, force: true }`
  - Deletes existing event and recreates from scratch

- `POST /api/admin/calendar/sync/rollback`
  - Body: `{ bulkSyncId: string }`
  - Reverses all appointments created in bulk sync

## Component Layout

```
┌─────────────────────────────────────────────┐
│ Calendar Sync Errors (5)                    │
├─────────────────────────────────────────────┤
│ Filters: [All Errors ▼] [Last 7 days ▼]    │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ⚠ Appointment #1234 - Rate Limit       │ │
│ │ Pet: Max | Time: Dec 26, 2pm            │ │
│ │ Error: API quota exceeded (429)         │ │
│ │ Next retry: in 5 minutes                │ │
│ │ [Retry Now] [Resync] [View Details]    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ⚠ Appointment #1235 - Network Timeout   │ │
│ │ Pet: Bella | Time: Dec 26, 3pm          │ │
│ │ Error: Request timeout after 30s        │ │
│ │ Retries: 2/3                            │ │
│ │ [Retry Now] [Resync] [View Details]    │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Retry All Failed (5)] [Clear Resolved]    │
└─────────────────────────────────────────────┘
```

## Error Message Formatting

Map technical errors to user-friendly messages:

| Technical Error | User Message | Suggested Action |
|----------------|--------------|------------------|
| Rate limit (429) | "Too many requests. Google Calendar has temporary rate limits." | "Will retry automatically in X minutes" |
| Network timeout | "Network connection issue prevented sync." | "Retry now or wait for automatic retry" |
| Auth failure (401) | "Calendar connection expired." | "Reconnect Google Calendar in Settings" |
| Not found (404) | "Calendar not found." | "Check calendar selection in Settings" |

## Technical Notes

- Poll for errors every 30 seconds or use WebSocket
- Group errors by type for better UX
- Show retry countdown timer
- Implement optimistic UI for retry actions
- Use confirmation dialog for "Retry All" and "Resync"
- Rollback only available for bulk imports within 1 hour

## Testing Checklist

- [ ] Error list display tests
- [ ] Filter functionality tests
- [ ] Retry button tests
- [ ] Retry all button tests
- [ ] Resync button tests
- [ ] Rollback functionality tests
- [ ] Empty state tests
- [ ] Real-time update tests
- [ ] Error message formatting tests
