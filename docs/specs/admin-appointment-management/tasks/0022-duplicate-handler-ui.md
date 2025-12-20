# Task 0022: Duplicate Handler UI

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0011, 0021
**Estimated Effort**: 4 hours

## Objective

Create UI for reviewing and resolving duplicate appointments before import.

## Requirements

- REQ-12.1-12.6: Duplicate detection and handling

## Implementation Details

### Files to Create

**`src/components/admin/appointments/csv/DuplicateHandler.tsx`**

Implement:
- Duplicate detection summary
- Side-by-side comparison (existing vs new)
- Resolution options per duplicate:
  - Skip (keep existing)
  - Overwrite (replace existing)
  - Create new (allow duplicate)
- Bulk actions (skip all, overwrite all)
- Confirmation before proceeding

### Duplicate Comparison

```
Found 3 Potential Duplicates
────────────────────────────────────────

Duplicate 1 of 3

Existing Appointment          CSV Import
─────────────────────────────────────────
Customer: John Smith          John Smith
Pet: Max                      Max
Service: Basic Grooming       Premium Grooming
Date: Jan 25, 2025 10:00 AM   Jan 25, 2025 10:00 AM
Status: Confirmed             (new)

Resolution:
○ Skip (keep existing)
○ Overwrite (replace with CSV data)
○ Create New (allow duplicate)

[< Previous] [Next >] [Apply to All Similar]

────────────────────────────────────────
[Cancel] [Continue with Selections →]
```

## Acceptance Criteria

- [ ] Duplicate count shown prominently
- [ ] Side-by-side comparison of existing vs new
- [ ] Navigation between duplicates (prev/next)
- [ ] Three resolution options per duplicate
- [ ] Bulk action options available
- [ ] Confirmation summary before proceeding
- [ ] Selection state persists during navigation
- [ ] Clean & Elegant Professional design

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-12)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 3.2.4)
- **Duplicate Detection Service**: Task 0011
