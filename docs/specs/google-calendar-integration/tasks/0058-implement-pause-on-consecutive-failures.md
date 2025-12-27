# Task 0058: Implement Pause on Consecutive Failures

**Phase**: 11 - Error Handling and Recovery
**Task ID**: 11.3
**Status**: Pending

## Description

Implement automatic pause of auto-sync functionality after consecutive sync failures to prevent cascading errors and notify admins of issues requiring attention.

## Requirements

- Modify `src/lib/calendar/sync/auto-sync-trigger.ts`
- Track consecutive failures per calendar connection
- Pause auto-sync after 10 consecutive failures
- Send notification to admin when auto-sync paused
- Require manual re-enable of auto-sync
- Reset failure counter on successful sync
- Log pause events for audit trail

## Acceptance Criteria

- [ ] Consecutive failure counter implemented
- [ ] Counter increments on each sync failure
- [ ] Counter resets to 0 on successful sync
- [ ] Auto-sync paused after 10 consecutive failures
- [ ] Admin notification sent when auto-sync paused
- [ ] Auto-sync cannot resume automatically
- [ ] Manual re-enable option in calendar settings
- [ ] Pause event logged to `calendar_sync_log`
- [ ] Resume event logged to `calendar_sync_log`
- [ ] Failure counter persisted to database
- [ ] Unit tests for pause logic

## Related Requirements

- Req 16.3: Pause auto-sync on consecutive failures
- Req 21: Audit Logging

## Dependencies

- Auto-sync trigger (Task 5)
- Calendar connection service (Task 1.5)
- Notification system (existing)

## Database Schema Changes

Add columns to `calendar_connections` table:

```sql
ALTER TABLE calendar_connections
ADD COLUMN consecutive_failures int NOT NULL DEFAULT 0,
ADD COLUMN auto_sync_paused boolean NOT NULL DEFAULT false,
ADD COLUMN paused_at timestamptz,
ADD COLUMN pause_reason text;
```

## Failure Tracking Logic

```typescript
async function trackSyncFailure(connectionId: string, error: Error) {
  const connection = await getConnection(connectionId);
  const newFailureCount = connection.consecutive_failures + 1;

  if (newFailureCount >= 10) {
    await pauseAutoSync(connectionId, 'Too many consecutive failures');
    await notifyAdmin(connectionId, 'Auto-sync paused due to repeated failures');
  } else {
    await updateFailureCount(connectionId, newFailureCount);
  }
}

async function trackSyncSuccess(connectionId: string) {
  await updateFailureCount(connectionId, 0);
}
```

## Admin Notification

Send email and in-app notification when auto-sync paused:

**Subject**: "Google Calendar Auto-Sync Paused"

**Message**:
```
Auto-sync has been paused due to 10 consecutive sync failures.

Recent errors:
• Rate limit exceeded (5 times)
• Network timeout (3 times)
• Authentication failure (2 times)

Action Required:
1. Review sync errors in Calendar Settings
2. Fix underlying issues (reconnect calendar, check settings)
3. Manually re-enable auto-sync when ready

[View Calendar Settings]
```

## Manual Re-enable Flow

1. Admin navigates to Calendar Settings
2. Warning banner shows: "Auto-sync is paused due to repeated failures"
3. "View Errors" button opens error recovery UI (Task 0056)
4. After resolving issues, "Resume Auto-Sync" button becomes available
5. Confirmation dialog: "Are you sure you want to resume auto-sync?"
6. On confirm:
   - Set `auto_sync_paused = false`
   - Reset `consecutive_failures = 0`
   - Clear `paused_at` and `pause_reason`
   - Log resume event

## Pause Reasons

Track and display specific pause reasons:

| Reason | Description |
|--------|-------------|
| `consecutive_failures` | 10 consecutive sync failures |
| `quota_exceeded` | API quota limit reached |
| `auth_failure` | Calendar authentication expired |
| `manual` | Admin manually paused |

## Technical Notes

- Check pause status before every auto-sync attempt
- Return early if auto-sync paused
- Show pause status in sync health widget
- Display pause reason and timestamp
- Track pause/resume events in analytics

## Testing Checklist

- [ ] Failure counter increment tests
- [ ] Failure counter reset tests
- [ ] Auto-pause at 10 failures tests
- [ ] Admin notification tests
- [ ] Manual resume flow tests
- [ ] Pause status check tests
- [ ] Logging tests
- [ ] Edge case tests (concurrent failures)
