# Task 0052: Integrate Sync Status into Appointments Table

**Phase**: 10 - Sync Status Indicators
**Task ID**: 10.2
**Status**: Pending

## Description

Integrate the sync status badge component into the appointments table to show calendar sync status for each appointment.

## Requirements

- Modify `src/components/admin/appointments/AppointmentsTable.tsx`
- Add sync status column when calendar is connected
- Fetch sync status for visible appointments
- Update sync status after manual sync operations
- Show/hide column based on calendar connection state
- Handle loading state for sync status data

## Acceptance Criteria

- [ ] Sync status column added to appointments table
- [ ] Column only visible when calendar is connected
- [ ] SyncStatusBadge component integrated for each row
- [ ] Sync status fetched for all visible appointments
- [ ] Status updates in real-time after manual sync
- [ ] Loading skeleton shown while fetching status
- [ ] Column header labeled "Calendar Sync"
- [ ] Column sortable by sync status
- [ ] Proper error handling for status fetch failures
- [ ] Performance optimized (batch fetch, no N+1 queries)

## Related Requirements

- Req 12: Sync Status Tracking

## Dependencies

- Task 0050 (SyncStatusBadge component)
- Task 0051 (SyncHistoryPopover component)
- Calendar connection service (Task 1.5)

## API Endpoint

- `GET /api/admin/appointments/sync-status?ids=id1,id2,id3`
  - Accepts array of appointment IDs
  - Returns map of appointment ID to sync status
  - Response: `{ [appointmentId]: { status, lastSyncedAt, error? } }`

## Technical Notes

- Fetch sync status in batches of 50 appointments
- Use React Query or SWR for data fetching and caching
- Join `calendar_event_mapping` table with appointments
- Query `calendar_sync_log` for last sync time and status
- Update local state when manual sync triggered
- Consider WebSocket for real-time sync updates

## Database Query

```sql
SELECT
  a.id,
  cem.google_event_id,
  csl.status AS sync_status,
  csl.created_at AS last_synced_at,
  csl.error_details
FROM appointments a
LEFT JOIN calendar_event_mapping cem ON a.id = cem.appointment_id
LEFT JOIN LATERAL (
  SELECT status, created_at, error_details
  FROM calendar_sync_log
  WHERE appointment_id = a.id
  ORDER BY created_at DESC
  LIMIT 1
) csl ON true
WHERE a.id = ANY($1);
```

## Testing Checklist

- [ ] Column visibility based on connection status
- [ ] Sync status display for all appointment states
- [ ] Loading state tests
- [ ] Batch fetch performance tests
- [ ] Real-time update tests
- [ ] Error handling tests
- [ ] Sorting functionality tests
