# Task 0027: Error Handling & Edge Cases

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0025, 0026
**Estimated Effort**: 4 hours

## Objective

Implement comprehensive error handling and edge case coverage.

## Requirements

- REQ-18.1-18.8: Error handling
- REQ-19.1-19.5: Data integrity

## Implementation Details

### Edge Cases to Handle

**Manual Appointment Creation:**
- Time slot becomes unavailable during form completion
- Customer deleted during selection
- Pet deleted during selection
- Service/addon disabled during selection
- Network errors during submission
- Validation errors (past dates, closed days)
- Email/phone format validation
- Weight/size mismatch warnings

**CSV Import:**
- Empty CSV file
- CSV with only headers
- Malformed CSV (wrong delimiter, missing columns)
- File too large (>5MB)
- Formula injection attempts (=, @, +, - prefixes)
- Duplicate emails with different names
- Time slots double-booked during batch processing
- Network failure during import
- Partial batch failures
- Inactive customer email conflicts

**Account Activation Flow:**
- Customer registers while admin creates appointment
- Email case sensitivity (john@email.com vs JOHN@EMAIL.COM)
- Multiple appointments for inactive customer
- Customer activation during appointment creation
- Inactive profile with existing appointments

### Error Messages

```typescript
// User-friendly error messages
const ERROR_MESSAGES = {
  TIME_SLOT_UNAVAILABLE: 'This time slot is no longer available. Please select another time.',
  CUSTOMER_NOT_FOUND: 'Customer not found. They may have been deleted.',
  SERVICE_DISABLED: 'This service is no longer available. Please select another.',
  EMAIL_EXISTS_ACTIVE: 'A customer with this email already exists.',
  EMAIL_EXISTS_INACTIVE: 'This email belongs to an inactive customer profile. The appointment will be assigned to this profile.',
  CSV_TOO_LARGE: 'File size exceeds 5MB limit.',
  CSV_INVALID_FORMAT: 'Invalid CSV format. Please download the template.',
  FORMULA_INJECTION: 'CSV contains potentially dangerous content. Please remove formulas.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  BATCH_PARTIAL_FAILURE: 'Some appointments failed to import. See error report for details.',
};
```

## Acceptance Criteria

- [ ] All edge cases handled gracefully
- [ ] User-friendly error messages (no technical jargon)
- [ ] Network errors show retry option
- [ ] Validation errors highlight specific fields
- [ ] Formula injection prevented in CSV
- [ ] Email case-insensitive matching
- [ ] Time slot conflicts detected
- [ ] Partial failures don't block successful imports
- [ ] Account activation race conditions handled
- [ ] Loading states prevent double-submission

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-18, 19)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 5)
- **Security**: design.md Section 6
