# Task 0017: Date & Time Selection Step

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0004, 0013, 0016
**Estimated Effort**: 4 hours

## Objective

Create date/time picker with availability checking and appointment notes.

## Requirements

- REQ-6.1-6.7: Date/time selection
- REQ-7.1-7.5: Appointment notes
- REQ-9.1-9.5: Payment status

## Implementation Details

### Files to Create

**`src/components/admin/appointments/steps/DateTimeStep.tsx`**

**Note**: Use availability API from task 0004

Implement:
- Calendar picker with disabled dates:
  - Sundays (closed)
  - Past dates (with override option for admin)
- Time slot selector using availability API
- Available/booked status indicators
- Notes textarea with character counter (1000 max)
- Payment status selection:
  - Pending (default)
  - Paid
  - Partially Paid
- Conditional payment fields (amount, method) when paid/partially paid

### Time Slot Display

```
Morning
○ 9:00 AM   Available
○ 9:30 AM   Available
● 10:00 AM  Booked (2 appointments)
○ 10:30 AM  Available

Afternoon
...
```

## Acceptance Criteria

- [ ] Sundays disabled in calendar
- [ ] Available slots fetched from API per date
- [ ] Past dates show warning with override option
- [ ] Notes limited to 1000 characters with counter
- [ ] Payment fields show/hide based on status
- [ ] Fully booked slots marked unavailable
- [ ] Clean & Elegant Professional design

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-6, 7, 9)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 3.1.4)
- **Availability API**: Task 0004
