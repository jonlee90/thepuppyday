# Task 0053: Add Manual Sync Button to Appointment Row

**Phase**: 10 - Sync Status Indicators
**Task ID**: 10.3
**Status**: Pending

## Description

Add a manual sync button to appointment rows that allows admins to manually trigger calendar sync for individual appointments when auto-sync is disabled or a sync has failed.

## Requirements

- Modify `src/components/admin/appointments/AppointmentRow.tsx`
- Add "Sync to Calendar" button/icon when:
  - Auto-sync is disabled, OR
  - Last sync failed
- Show sync progress indicator during sync
- Update sync status badge after sync completes
- Display success/error toast messages
- Handle edge cases (no connection, not eligible)

## Acceptance Criteria

- [ ] Manual sync button added to appointment row actions
- [ ] Button shown when auto-sync disabled or last sync failed
- [ ] Button hidden when auto-sync enabled and synced successfully
- [ ] Click triggers sync API call
- [ ] Loading spinner shown during sync operation
- [ ] Button disabled while sync in progress
- [ ] Success toast shown on successful sync
- [ ] Error toast shown on failed sync with error message
- [ ] Sync status badge updates immediately after sync
- [ ] No button shown when calendar not connected
- [ ] No button shown for appointments not eligible for sync
- [ ] Proper TypeScript types defined

## Related Requirements

- Req 11.1: Manual sync trigger from appointment detail
- Req 11.2: Sync status update after manual sync

## Dependencies

- Task 0050 (SyncStatusBadge component)
- Manual sync API endpoint (Task 4.2)
- Sync criteria checker (Task 3.1)

## API Endpoint

- `POST /api/admin/calendar/sync/manual`
  - Body: `{ appointmentId: string, force?: boolean }`
  - Response: `{ success: boolean, operation: 'created' | 'updated' | 'deleted' | 'skipped', error?: string }`

## Technical Notes

- Use Lucide React `RefreshCw` icon for sync button
- Show tooltip on hover: "Sync to Google Calendar"
- Implement optimistic UI update (show loading immediately)
- Rollback optimistic update on error
- Use toast notifications from existing notification system
- Consider rate limiting (prevent spam clicking)

## Button States

1. **Default**: Sync icon, enabled, no loading
2. **Loading**: Spinning sync icon, disabled
3. **Success**: Checkmark briefly, then hide button (if auto-sync enabled)
4. **Error**: Alert icon, show error tooltip, keep button enabled

## Testing Checklist

- [ ] Button visibility logic tests
- [ ] Click handler tests
- [ ] Loading state tests
- [ ] Success flow tests
- [ ] Error handling tests
- [ ] Toast notification tests
- [ ] Status badge update tests
- [ ] Edge case tests (no connection, not eligible)
