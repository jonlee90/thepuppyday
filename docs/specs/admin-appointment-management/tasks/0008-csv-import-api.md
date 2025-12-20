# Task 0008: CSV Import Execution API

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0003, 0007
**Estimated Effort**: 5 hours

## Objective

Create API endpoint to execute CSV import, creating appointments in batches with account activation flow support.

## Requirements

- REQ-14.4-14.7: Duplicate handling
- REQ-15.1-15.8: Customer/pet matching with account activation
- REQ-16.1-16.5: Batch processing
- REQ-17.1-17.6: Import summary
- REQ-18.1-18.5: Transaction handling
- REQ-20.2-20.4: Notifications
- REQ-21.1, 21.2: Audit tracking

## Implementation Details

### Customer/Pet Matching (Account Activation Flow)

For each row:
1. Search for customer by email (case-insensitive)
2. If found: Use existing customer_id (active or inactive)
3. If not found: Create inactive customer profile with `is_active=false`, `created_by_admin=true`
4. Find or create pets under each customer

### Batch Processing

- Process 10 rows per batch for stability
- Support duplicate strategies: skip, overwrite
- Track progress and return detailed summary
- Continue processing if individual rows fail

## Acceptance Criteria

- [ ] Batch processing prevents timeouts (10 rows per batch)
- [ ] Email-based customer matching works (case-insensitive)
- [ ] Inactive customer profiles created for new emails
- [ ] Existing customers (active or inactive) reused
- [ ] Duplicate strategy correctly applied
- [ ] Import summary includes all counts
- [ ] Failed rows don't block successful ones
- [ ] Notifications sent when enabled
- [ ] Audit log entry created for import
- [ ] Admin authentication required

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-14-21)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 1.4, 3.1.3)
