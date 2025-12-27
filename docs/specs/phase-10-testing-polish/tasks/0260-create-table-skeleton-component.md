# Task 0260: Create TableSkeleton Component

## Description
Create reusable skeleton component for data tables to show loading state for tabular data.

## Checklist
- [ ] Create `src/components/ui/skeletons/TableSkeleton.tsx`
- [ ] Support configurable columns and rows
- [ ] Include optional header skeleton
- [ ] Match data table column widths

## Acceptance Criteria
Table skeleton renders correctly for admin appointment, customer, notification tables

## References
- Requirement 16.8
- Design 10.4.1

## Files to Create/Modify
- `src/components/ui/skeletons/TableSkeleton.tsx`

## Implementation Notes
Accept columns array with width percentages to match actual table layout.
