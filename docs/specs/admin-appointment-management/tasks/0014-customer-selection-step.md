# Task 0014: Customer Selection Step

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0013
**Estimated Effort**: 3 hours

## Objective

Create customer search and selection UI with inline customer creation form.

## Requirements

- REQ-2.1-2.8: Customer selection and creation

## Implementation Details

### Files to Create

**`src/components/admin/appointments/steps/CustomerSelectionStep.tsx`**

**Note**: Use existing `GET /api/admin/customers?search={query}` endpoint

Implement:
- Search input with debouncing (300ms)
- Real-time customer search (name, email, phone)
- Customer results display with radio selection
- "Create New Customer" expandable form
- Email/phone validation using existing schemas from `src/lib/booking/validation.ts`
- Duplicate email detection

### Search UX

- Minimum 2 characters to search
- Loading indicator during search
- "No results found" message
- Clear button to reset search

## Acceptance Criteria

- [ ] Real-time search with 300ms debounce
- [ ] Existing customers selectable via radio buttons
- [ ] Customer details shown (name, email, phone)
- [ ] New customer form validates email/phone
- [ ] Duplicate email shows error
- [ ] Search works for name, email, or phone
- [ ] Clean & Elegant Professional design

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-2)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 3.1.1)
- **Existing API**: /api/admin/customers?search={query}
- **Existing Utilities**: src/lib/booking/validation.ts
