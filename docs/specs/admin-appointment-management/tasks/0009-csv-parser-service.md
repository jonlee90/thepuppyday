# Task 0009: CSV Parser Service

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0002, 0003
**Estimated Effort**: 3 hours

## Objective

Create CSV processor service with PapaParse integration and security sanitization.

## Requirements

- REQ-11.1-11.6: File and column validation
- REQ-19.1-19.7: Security and sanitization

## Implementation Details

### Files to Create

**`src/lib/admin/appointments/csv-processor.ts`**

Implement CSVProcessor class with:
- File validation (extension, MIME type)
- Formula injection prevention (strip =, @, +, - from cell values)
- CSV parsing with PapaParse
- Column validation
- Value sanitization

### Security Measures

Strip dangerous characters from CSV cells:
- Leading `=` (formula injection)
- Leading `@` (formula injection)
- Leading `+` (formula injection)
- Leading `-` (formula injection)

## Acceptance Criteria

- [ ] PapaParse correctly parses valid CSV
- [ ] Invalid files rejected with clear errors
- [ ] Formula injection characters stripped (=, @, +, -)
- [ ] Special characters encoded properly
- [ ] Column validation works
- [ ] All unit tests pass

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-11, 19)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 4.1)
