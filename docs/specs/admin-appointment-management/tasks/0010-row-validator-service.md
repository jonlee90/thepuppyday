# Task 0010: Row Validator Service

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0003, 0009
**Estimated Effort**: 3 hours

## Objective

Implement row validation logic using CSV validation schemas and database lookups.

## Requirements

- REQ-12.3-12.8: Row validation
- REQ-13.1-13.10: Field validation
- REQ-22.1-22.6: Pricing calculation

## Implementation Details

### Validation Steps per Row

1. Validate against CSV schema (Zod)
2. Parse customer_name into first_name and last_name
3. Normalize pet size (case-insensitive)
4. Calculate size from weight if size not provided
5. Validate weight against size (warning, not error)
6. Parse date/time in multiple formats
7. Match service name against database (case-insensitive)
8. Match addon names against database
9. Calculate pricing using existing `calculatePrice()` utility
10. Normalize payment status

### Date/Time Formats Supported

- Dates: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY
- Times: 12h (9:00 AM), 24h (09:00)

## Acceptance Criteria

- [ ] All date/time formats parsed correctly
- [ ] Case-insensitive matching works for services/addons
- [ ] Service/addon lookup returns correct IDs
- [ ] Pricing calculated using existing utilities
- [ ] Weight/size warnings generated (not errors)
- [ ] Customer name parsed into first/last
- [ ] All unit tests pass

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-12, 13, 22)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 4.2)
- **Existing Utilities**: src/lib/booking/pricing.ts
