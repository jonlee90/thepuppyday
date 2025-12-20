# Task 0012: Batch Processor Service

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0009, 0010, 0011
**Estimated Effort**: 4 hours

## Objective

Create batch processor for CSV import with customer/pet find-or-create logic and account activation support.

## Requirements

- REQ-15.1-15.8: Customer/pet matching
- REQ-16.1-16.5: Batch processing
- REQ-18.1-18.5: Transaction handling

## Implementation Details

### Files to Create

**`src/lib/admin/appointments/batch-processor.ts`**

Implement BatchProcessor class with:
- Configurable batch size (default: 10 rows)
- Customer/pet find-or-create with account activation flow
- Appointment creation with all related records
- Progress tracking with callbacks
- Error handling (continue on failure)
- Optional all-or-nothing mode (transaction rollback)

### Account Activation Flow Integration

For each customer in CSV:
1. Search by email (case-insensitive)
2. If found: Use existing customer_id
3. If not found: Create with `is_active=false`, `created_by_admin=true`

## Acceptance Criteria

- [ ] Batches of 10 rows processed sequentially
- [ ] Failed rows logged but don't stop import
- [ ] Progress callback invoked correctly
- [ ] All-or-nothing mode rolls back on any failure
- [ ] Customer/pet find-or-create works correctly
- [ ] Inactive profiles created for new customers
- [ ] Integration tests pass with mock database

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-15, 16, 18)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 1.4, 5.4)
