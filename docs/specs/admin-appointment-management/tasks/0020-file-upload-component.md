# Task 0020: File Upload Component

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0006, 0019
**Estimated Effort**: 2 hours

## Objective

Create file upload UI with drag-and-drop support and CSV template download.

## Requirements

- REQ-10.1: File upload interface
- REQ-10.2: Template download

## Implementation Details

### Files to Create

**`src/components/admin/appointments/csv/FileUploadStep.tsx`**

Implement:
- Drag-and-drop zone (react-dropzone)
- File input button (fallback)
- File type validation (.csv only)
- File size limit (5MB max)
- Template download button linked to Task 0006 API
- Clear selected file option
- File preview (name, size)

### Upload Zone Design

```
┌─────────────────────────────────────┐
│  📄 Drag & drop CSV file here       │
│     or click to browse              │
│                                     │
│  [Download CSV Template]            │
└─────────────────────────────────────┘

Selected: appointments.csv (45 KB)
[Clear] [Validate & Continue →]
```

### Validation Rules

- File extension must be `.csv`
- Max file size: 5MB
- Show error message for invalid files
- Clear previous file on new upload

## Acceptance Criteria

- [ ] Drag-and-drop works correctly
- [ ] Click to browse works
- [ ] Only .csv files accepted
- [ ] File size validated (5MB max)
- [ ] Template download button calls API from task 0006
- [ ] Selected file name and size shown
- [ ] Clear file option available
- [ ] Clean & Elegant Professional design

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md (REQ-10.1-10.2)
- **Design**: docs/specs/admin-appointment-management/design.md (Section 3.2.2)
- **Template API**: Task 0006
