# Task 0019: CSV Import Modal Shell

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0003, 0007, 0008
**Estimated Effort**: 3 hours

## Objective

Create modal container for CSV import workflow with multi-step navigation.

## Requirements

- REQ-10.1-10.8: CSV import UI

## Implementation Details

### Files to Create

**`src/components/admin/appointments/CSVImportModal.tsx`**

Implement:
- Modal dialog with steps indicator (Upload → Validate → Review → Import)
- Step state management
- Progress tracking
- Cancel/back/next navigation
- Upload → validation → duplicate resolution → import execution flow
- Success/error state handling
- Import summary display

### Step Flow

```
Step 1: Upload File
  ↓
Step 2: Validate & Preview (automatic)
  ↓
Step 3: Resolve Duplicates (if any)
  ↓
Step 4: Import Progress & Summary
```

### Modal States

- **Upload**: File selection and CSV template download
- **Validating**: Loading state while validation runs
- **Review**: Show validation results and duplicates
- **Importing**: Progress bar during batch processing
- **Complete**: Success/error summary with counts

## Acceptance Criteria

- [ ] Modal has clear step indicator
- [ ] Back/next navigation between steps
- [ ] Close/cancel confirmation for unsaved work
- [ ] Loading states for async operations
- [ ] Step progression logic prevents skipping
- [ ] Success state shows import summary
- [ ] Clean & Elegant Professional design

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-10)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 3.2.1)
- **Validation API**: Task 0007
- **Import API**: Task 0008
