# Task 0013: Manual Appointment Modal Shell

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0002
**Estimated Effort**: 3 hours

## Objective

Create the main modal component for manual appointment creation with multi-step wizard navigation.

## Requirements

- REQ-1.1: Form access
- REQ-1.2: Modal UI
- REQ-1.3: Step navigation
- REQ-1.4: State management

## Implementation Details

### Files to Create

**`src/components/admin/appointments/ManualAppointmentModal.tsx`**

Implement modal with:
- DaisyUI modal component
- Step progress indicator (1/5, 2/5, 3/5, 4/5, 5/5)
- State management (Zustand or local useState)
- Step navigation (Back, Next, Cancel buttons)
- Validation gating (prevent next if current step invalid)
- Wire up to "Create Appointment" button on appointments page

### Steps

1. Customer Selection
2. Pet Selection
3. Service Selection
4. Date & Time Selection
5. Summary & Confirmation

## Acceptance Criteria

- [ ] Modal opens from appointments page "Create Appointment" button
- [ ] Progress indicator shows current step (e.g., "Step 2 of 5")
- [ ] Back/Next navigation works
- [ ] Validation prevents advancing with invalid data
- [ ] Cancel closes modal without saving
- [ ] State persists during navigation
- [ ] Clean & Elegant Professional design

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-1)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 3.1)
