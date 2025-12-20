# Task 0011: Duplicate Detection Service

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0009, 0010
**Estimated Effort**: 2 hours

## Objective

Implement duplicate detection logic to identify appointments that already exist in the database.

## Requirements

- REQ-14.1: Detect duplicates
- REQ-14.2: Match on multiple criteria
- REQ-14.3: Return duplicate details

## Implementation Details

### Duplicate Matching Criteria

An appointment is considered a duplicate if ALL of the following match:
1. Customer email (case-insensitive)
2. Pet name (case-insensitive)
3. Appointment date (same day)
4. Appointment time (same hour, not exact minute)

### Implementation Logic

```typescript
// Match sequence
1. Find customers by email (case-insensitive)
2. Find pets by name under those customers (case-insensitive)
3. Find appointments for those pets in same hour
4. Return duplicate matches with existing appointment IDs
```

## Acceptance Criteria

- [ ] Duplicates detected based on all four criteria
- [ ] Case-insensitive email matching
- [ ] Case-insensitive pet name matching
- [ ] Same hour considered duplicate (not exact minute)
- [ ] Returns correct existing appointment ID
- [ ] No false positives
- [ ] All unit tests pass

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-14)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 4.3)
