# Task 0025: Appointments Page Integration

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0013, 0018, 0019, 0024
**Estimated Effort**: 3 hours

## Objective

Integrate manual creation and CSV import into existing appointments page.

## Requirements

- REQ-1.1-1.6: Feature access and layout

## Implementation Details

### Files to Modify

**`src/app/(admin)/admin/appointments/page.tsx`**

Add:
- "Create Appointment" button in page header
- "Import CSV" button next to create button
- Modal state management for both features
- Refresh appointments list after successful operations
- Success toast notifications

**`src/components/admin/appointments/AppointmentsList.tsx`** (if exists)

Update:
- Refresh function exposed via ref or callback
- Support for newly created appointments
- Handle account activation status indicators

### Page Header Layout

```
Appointments
────────────────────────────────────────
[Create Appointment] [Import CSV] [Filters ▼]

Search: [_____________] [🔍]

[Upcoming] [Past] [Cancelled]

Appointment List...
```

## Acceptance Criteria

- [ ] Create Appointment button opens manual modal
- [ ] Import CSV button opens import modal
- [ ] Both modals close on success
- [ ] Appointments list refreshes after create/import
- [ ] Success toasts show operation results
- [ ] Loading states during operations
- [ ] Inactive customer indicators (if applicable)
- [ ] Clean & Elegant Professional design

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-1)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 3.3)
- **Manual Modal**: Task 0013
- **CSV Modal**: Task 0019
