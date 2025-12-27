# Task 0054: Create Dashboard Sync Health Widget

**Phase**: 10 - Sync Status Indicators
**Task ID**: 10.4
**Status**: Pending

## Description

Create a dashboard widget that displays calendar sync health metrics including connection status, sync counts, and quick actions.

## Requirements

- Create `src/components/admin/dashboard/CalendarSyncWidget.tsx`
- Display calendar connection status
- Show sync statistics:
  - Total appointments synced
  - Pending sync count
  - Failed sync count
- Display last sync timestamp
- Show "Sync All Now" quick action button
- Link to calendar settings page
- Auto-refresh metrics periodically

## Acceptance Criteria

- [ ] Widget component created at correct path
- [ ] Connection status displayed (connected/disconnected)
- [ ] Sync statistics shown with icon indicators
- [ ] Last sync time displayed with relative formatting
- [ ] "Sync All Now" button triggers bulk sync
- [ ] "Settings" link navigates to calendar settings
- [ ] Widget only shown when calendar is connected
- [ ] Metrics auto-refresh every 60 seconds
- [ ] Loading state shown during metric fetch
- [ ] Error state shown on fetch failure
- [ ] Proper TypeScript types defined
- [ ] Responsive design (mobile-friendly)

## Related Requirements

- Req 26: Admin Dashboard integration
- Req 12.8: Sync health metrics display

## Dependencies

- Sync status API endpoint (Task 4.5)
- Bulk sync API endpoint (Task 4.4)
- Calendar connection service (Task 1.5)

## API Endpoint

- `GET /api/admin/calendar/sync/status`
  - Response:
    ```json
    {
      "connected": true,
      "lastSyncAt": "2025-12-26T10:30:00Z",
      "totalSynced": 245,
      "pending": 3,
      "failed": 2,
      "webhookStatus": "active",
      "recentErrors": [...]
    }
    ```

## Widget Layout

```
┌─────────────────────────────────────┐
│ 📅 Calendar Sync                    │
├─────────────────────────────────────┤
│ ✓ Connected to Google Calendar      │
│                                     │
│ 📊 Sync Statistics                  │
│   ✓ 245 Synced                      │
│   ⏱ 3 Pending                       │
│   ⚠ 2 Failed                        │
│                                     │
│ Last sync: 5 minutes ago            │
│                                     │
│ [Sync All Now]    [Settings →]     │
└─────────────────────────────────────┘
```

## Technical Notes

- Use DaisyUI card component for widget container
- Color coding:
  - Synced: Green `#10B981`
  - Pending: Amber `#F59E0B`
  - Failed: Red `#EF4444`
- Use React Query or SWR with `refetchInterval: 60000`
- Show loading skeleton while fetching
- Use relative time formatting (e.g., "5 minutes ago")
- "Sync All Now" should show confirmation dialog
- Display sync progress modal when bulk sync triggered

## Testing Checklist

- [ ] Widget visibility based on connection status
- [ ] Metrics display tests
- [ ] Auto-refresh functionality tests
- [ ] "Sync All Now" button tests
- [ ] Settings link navigation tests
- [ ] Loading state tests
- [ ] Error state tests
- [ ] Mobile responsiveness tests
