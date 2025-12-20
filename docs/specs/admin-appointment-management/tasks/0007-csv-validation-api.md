# Task 0007: CSV Validation API

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0003
**Estimated Effort**: 4 hours

## Objective

Create API endpoint to validate uploaded CSV file before import, detecting errors and duplicates.

## Requirements

- REQ-11.1-11.8: File and column validation
- REQ-13.1-13.10: Row validation
- REQ-14.1-14.3: Duplicate detection

## Implementation Details

### Files to Create

**`src/app/api/admin/appointments/import/validate/route.ts`**

Validate CSV file with:
- File type validation (.csv only)
- File size limit (5MB max)
- Row count limit (1000 max)
- Required column validation
- Per-row validation using CSV validation schemas
- Duplicate detection against existing appointments
- Return preview (first 5 rows) and validation summary

## Acceptance Criteria

- [ ] Rejects non-CSV files with clear error
- [ ] Rejects files over 5MB
- [ ] Rejects files over 1000 rows
- [ ] Validates all required columns present
- [ ] Returns per-row validation errors/warnings
- [ ] Identifies duplicate appointments
- [ ] Returns preview of first 5 rows
- [ ] Returns validation summary
- [ ] Admin authentication required

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-11, 13, 14)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 3.1.2)
