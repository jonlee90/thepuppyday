# Task 0051: Create Sync History Popover Component

**Phase**: 10 - Sync Status Indicators
**Task ID**: 10.1
**Status**: Pending

## Description

Create a popover component that displays the complete sync history for an appointment when the sync status badge is clicked.

## Requirements

- Create `src/components/admin/calendar/SyncHistoryPopover.tsx`
- Display sync history on click of sync status badge
- Show list of sync operations with:
  - Timestamp (formatted date/time)
  - Action type (created, updated, deleted)
  - Result (success, failed)
  - Error message (if failed)
- Link to Google Calendar event (if synced and exists)
- Handle loading state while fetching history
- Handle empty state (no sync history)
- Allow closing popover

## Acceptance Criteria

- [ ] Component created at correct path
- [ ] Popover opens on sync status badge click
- [ ] Displays all sync operations in chronological order (newest first)
- [ ] Shows timestamp, action, and result for each operation
- [ ] Error messages displayed for failed operations
- [ ] Link to Google Calendar event (opens in new tab)
- [ ] Loading state with spinner shown during fetch
- [ ] Empty state message when no history exists
- [ ] Close button or click outside to dismiss
- [ ] Proper TypeScript types defined
- [ ] Responsive design (mobile-friendly)

## Related Requirements

- Req 12.6: Display sync history
- Req 12.7: Link to Google Calendar event

## Dependencies

- Task 0050 (SyncStatusBadge component)
- Sync logger utility (Task 4.1)

## API Endpoint

- `GET /api/admin/calendar/sync/history/:appointmentId`
  - Returns array of sync log entries
  - Each entry: `{ timestamp, action, status, error?, google_event_url? }`

## Technical Notes

- Use DaisyUI dropdown or modal for popover
- Fetch sync history from `calendar_sync_log` table filtered by appointment_id
- Format timestamps with relative time (e.g., "2 hours ago")
- Google Calendar event URL format: `https://calendar.google.com/calendar/event?eid={eventId}`
- Limit history display to last 20 operations
- Consider caching history data to reduce API calls

## Testing Checklist

- [ ] Unit tests for history display
- [ ] API endpoint tests
- [ ] Loading state tests
- [ ] Empty state tests
- [ ] Link functionality tests
- [ ] Popover open/close tests
- [ ] Mobile responsiveness tests
