# Task 0015: Pet Selection Step

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0013, 0014
**Estimated Effort**: 3 hours

## Objective

Create pet selection UI with inline pet creation form and price preview.

## Requirements

- REQ-3.1-3.8: Pet selection and creation

## Implementation Details

### Files to Create

**`src/components/admin/appointments/steps/PetSelectionStep.tsx`**

**Note**: Use existing `GET /api/admin/breeds` for breed dropdown

Implement:
- Display customer's existing pets with radio selection
- Show pet details (breed, size, weight) and price preview
- "Add New Pet" expandable form
- Breed autocomplete with custom breed option
- Size buttons with weight range hints (Small: 0-18 lbs, Medium: 19-35 lbs, etc.)
- Weight validation against size (warning, not error)
- Price preview updates based on selected pet size

### Size Selection

Display as button group:
- Small (0-18 lbs)
- Medium (19-35 lbs)
- Large (36-65 lbs)
- X-Large (66+ lbs)

## Acceptance Criteria

- [ ] Existing pets displayed with full details
- [ ] New pet form has all required fields
- [ ] Weight/size mismatch shows warning (not error)
- [ ] Admin can proceed despite warning
- [ ] Breed dropdown populated from database
- [ ] Custom breed option available
- [ ] Price preview shows estimated cost
- [ ] Clean & Elegant Professional design

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-3)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 3.1.2)
- **Existing API**: /api/admin/breeds
