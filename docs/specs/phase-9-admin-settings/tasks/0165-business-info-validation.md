# Task 0165: Business info validation

## Description
Implement comprehensive validation for business information fields including phone number, email, and address format validation.

## Acceptance Criteria
- [ ] Create validation schema using Zod for BusinessInfo
- [ ] Validate US phone number format: (XXX) XXX-XXXX
- [ ] Validate email format using standard regex
- [ ] Validate address format (non-empty street, city, state, valid zip)
- [ ] Validate zip code format: 5 digits or 5+4 format
- [ ] Validate URL format for social links (must start with https://)
- [ ] Display inline validation errors next to affected fields
- [ ] Show preview of affected notification templates if business info changes
- [ ] Disable save button until validation passes
- [ ] Create reusable validation utility functions

## Implementation Notes
- File: `src/lib/validation/business-info.ts`
- Update `BusinessInfoEditor` component with validation
- Phone validation should accept various input formats and normalize
- Consider using libphonenumber-js for phone validation

## References
- Req 3.3, Req 3.4, Req 3.6, Req 3.7
- Design: Input Validation section

## Complexity
Small

## Category
Validation

## Dependencies
- 0164 (Business info editor)
