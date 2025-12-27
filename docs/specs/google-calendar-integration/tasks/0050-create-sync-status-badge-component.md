# Task 0050: Create Sync Status Badge Component

**Phase**: 10 - Sync Status Indicators
**Task ID**: 10
**Status**: Pending

## Description

Create a reusable sync status badge component that displays the current sync status of an appointment with visual indicators and tooltips.

## Requirements

- Create `src/components/admin/calendar/SyncStatusBadge.tsx`
- Display sync status icon based on appointment sync state:
  - **Synced**: Green checkmark icon
  - **Pending/In Progress**: Clock/pending icon
  - **Failed**: Red error icon with error message tooltip
  - **Not Eligible**: No indicator shown
- Show last sync timestamp on hover
- Support click interaction to show more details

## Acceptance Criteria

- [ ] Component created at correct path
- [ ] Displays appropriate icon for each sync status
- [ ] Green checkmark shown for successfully synced appointments
- [ ] Clock icon shown for sync in progress
- [ ] Red error icon shown for failed syncs
- [ ] Tooltip displays error message on failed syncs
- [ ] Last sync timestamp shown on hover
- [ ] No indicator for appointments not eligible for sync
- [ ] Component follows The Puppy Day design system
- [ ] Proper TypeScript types defined

## Related Requirements

- Req 12.1: Display sync status icon
- Req 12.2: Checkmark for synced
- Req 12.3: Pending indicator
- Req 12.4: Error indicator with tooltip
- Req 12.5: No indicator for non-eligible

## Dependencies

- None (can be implemented independently)

## Technical Notes

- Use Lucide React icons (Check, Clock, AlertTriangle, XCircle)
- Color palette:
  - Success: `#10B981` (green)
  - Pending: `#F59E0B` (amber)
  - Error: `#EF4444` (red)
- Use DaisyUI tooltip component for hover interactions
- Consider loading state for real-time sync updates

## Testing Checklist

- [ ] Unit tests for all sync status states
- [ ] Visual regression tests for icon display
- [ ] Tooltip interaction tests
- [ ] Hover state tests
- [ ] Accessibility tests (screen reader, keyboard navigation)
