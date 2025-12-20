# Task 0021: Preview & Validation Display

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0007, 0020
**Estimated Effort**: 4 hours

## Objective

Display validation results with error highlighting and row-level feedback.

## Requirements

- REQ-10.3: Row-level validation feedback
- REQ-11.1-11.6: Validation error display

## Implementation Details

### Files to Create

**`src/components/admin/appointments/csv/ValidationPreview.tsx`**

Implement:
- Validation summary (total rows, valid, invalid)
- Tabbed view: "Valid Rows" vs "Errors"
- Error table with row number, field, and error message
- Preview of first 10 valid rows
- Ability to download error report
- Continue/fix options

### Validation Summary

```
Validation Results
──────────────────
✓ 145 valid rows
✗ 5 rows with errors

[Valid Rows (145)] [Errors (5)]

Errors Tab:
Row  Field           Error
──────────────────────────────────────────
3    email          Invalid email format
7    service_id     Service not found
12   date           Sunday (closed)
18   phone          Invalid phone format
25   pet_weight     Must be positive number

[Download Error Report] [Fix CSV & Re-upload]
[Continue with Valid Rows →]
```

## Acceptance Criteria

- [ ] Summary shows total/valid/invalid counts
- [ ] Tab switching between valid rows and errors
- [ ] Error table shows row number, field, and message
- [ ] Valid rows preview limited to 10 rows
- [ ] Download error report as CSV
- [ ] Can continue with valid rows only (skip errors)
- [ ] Clean & Elegant Professional design

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-10.3, 11)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 3.2.3)
- **Validation API**: Task 0007
