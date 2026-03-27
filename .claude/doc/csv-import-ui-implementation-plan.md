# CSV Import UI Components Implementation Plan
## Tasks 0019-0024: Multi-Step CSV Import Workflow

**Date**: 2025-12-20
**Author**: DaisyUI Expert Agent
**Context**: Building CSV import UI for bulk appointment creation following Clean & Elegant Professional design system

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Component Specifications](#component-specifications)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Styling Guidelines](#styling-guidelines)
8. [Implementation Order](#implementation-order)
9. [Testing Checklist](#testing-checklist)
10. [Important Notes](#important-notes)

---

## Overview

### Goal
Implement a multi-step CSV import workflow for bulk appointment creation with:
- File upload with drag-and-drop
- Real-time validation with error reporting
- Duplicate detection and resolution
- Batch import with progress tracking
- Comprehensive summary with account activation counts

### Flow Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     CSV Import Modal                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Upload File                                        │
│  ├─ FileUploadStep.tsx                                      │
│  ├─ Drag & drop or click to browse                          │
│  ├─ Download CSV template                                   │
│  └─ File validation (type, size)                            │
│                                                             │
│  Step 2: Validation & Preview (auto-triggered)             │
│  ├─ ValidationPreview.tsx                                   │
│  ├─ Call POST /api/.../import/validate                     │
│  ├─ Display validation summary                              │
│  ├─ Tabbed view: Valid Rows vs Errors                       │
│  └─ Download error report option                            │
│                                                             │
│  Step 3: Duplicate Resolution (if found)                   │
│  ├─ DuplicateHandler.tsx                                    │
│  ├─ Side-by-side comparison                                 │
│  ├─ Resolution options: Skip/Overwrite/Create New           │
│  └─ Bulk actions available                                  │
│                                                             │
│  Step 4: Import Progress                                   │
│  ├─ ImportProgress.tsx                                      │
│  ├─ Call POST /api/.../import                              │
│  ├─ Real-time progress bar                                  │
│  ├─ Batch processing feedback                               │
│  └─ Cancel option                                           │
│                                                             │
│  Step 5: Import Summary                                    │
│  ├─ ImportSummary.tsx                                       │
│  ├─ Success/failure counts                                  │
│  ├─ Customer/pet creation counts                            │
│  ├─ Account activation counts (IMPORTANT!)                  │
│  └─ Error report download                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Dependencies Already Installed
- ✅ `papaparse` (5.5.3) - CSV parsing (used by backend)
- ✅ `@types/papaparse` (5.5.2) - TypeScript types
- ✅ `react-hook-form` (7.68.0) - Form management
- ✅ `zod` (4.1.13) - Validation schemas
- ✅ `daisyui` (5.5.8) - Component library
- ✅ `lucide-react` (0.560.0) - Icons

### Dependencies to Install
- ❌ `react-dropzone` - For drag-and-drop file upload

**Installation command**:
```bash
pnpm add react-dropzone
pnpm add -D @types/react-dropzone
```

### Backend APIs (Already Implemented)
- ✅ `GET /api/admin/appointments/import/template` - Download CSV template
- ✅ `POST /api/admin/appointments/import/validate` - Validate CSV file
- ✅ `POST /api/admin/appointments/import` - Execute import

### TypeScript Types (Already Defined)
Location: `src/types/admin-appointments.ts`
- ✅ `CSVRow` - Raw CSV data
- ✅ `ParsedCSVRow` - Parsed CSV with typed fields
- ✅ `ValidatedCSVRow` - Validated row with errors/warnings
- ✅ `ValidationError` - Field-level error
- ✅ `ValidationWarning` - Field-level warning
- ✅ `DuplicateMatch` - Duplicate appointment match
- ✅ `CSVImportResult` - Import summary response
- ✅ `CSVImportOptions` - Import execution options
- ✅ `CSVValidationResponse` - Validation API response

---

## Architecture

### File Structure
```
src/
├── components/admin/appointments/
│   ├── CSVImportModal.tsx              ← Task 0019 (Modal shell)
│   └── csv/
│       ├── FileUploadStep.tsx          ← Task 0020 (Upload UI)
│       ├── ValidationPreview.tsx       ← Task 0021 (Validation display)
│       ├── DuplicateHandler.tsx        ← Task 0022 (Duplicate resolution)
│       ├── ImportProgress.tsx          ← Task 0023 (Progress display)
│       └── ImportSummary.tsx           ← Task 0024 (Summary display)
```

### Component Hierarchy
```
CSVImportModal (orchestrator)
├── FileUploadStep (step 1)
├── ValidationPreview (step 2)
├── DuplicateHandler (step 3, conditional)
├── ImportProgress (step 4)
└── ImportSummary (step 5)
```

---

## Component Specifications

### Task 0019: CSVImportModal.tsx

**Purpose**: Main modal container that orchestrates the multi-step import workflow.

**State Management**:
```typescript
interface CSVImportState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  uploadedFile: File | null;
  validationResponse: CSVValidationResponse | null;
  duplicateResolutions: Map<number, 'skip' | 'overwrite' | 'create_new'>;
  importResult: CSVImportResult | null;
  isLoading: boolean;
  error: string | null;
}
```

**Props**:
```typescript
interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Refresh appointment list
}
```

**Key Features**:
1. Step indicator (5 steps) with progress visualization
2. Auto-advance from Step 1 → Step 2 after file upload
3. Conditional Step 3 (only if duplicates found)
4. Loading states during API calls
5. Confirmation dialog on close if import in progress
6. Success callback triggers parent refresh

**DaisyUI Components**:
- `modal` with `modal-box`
- `steps` for progress indicator
- `btn` for navigation
- `loading` spinner for async operations

**Design Notes**:
- Full-screen on mobile (`max-w-4xl` on desktop)
- Fixed header with step title
- Scrollable content area
- Fixed footer with Back/Next buttons
- Soft shadows (`shadow-lg`)
- Rounded corners (`rounded-xl`)

---

### Task 0020: FileUploadStep.tsx

**Purpose**: File upload UI with drag-and-drop and CSV template download.

**Props**:
```typescript
interface FileUploadStepProps {
  onFileSelected: (file: File) => void;
  onNext: () => void;
  isLoading?: boolean;
}
```

**Key Features**:
1. **Drag & Drop Zone**:
   - Use `react-dropzone` library
   - Accept only `.csv` files
   - Max size: 5MB
   - Visual feedback on drag over (border color change)
   - Error messages for invalid files

2. **File Input Button** (fallback):
   - Click to browse
   - Same validation as drag-and-drop

3. **Template Download**:
   - Button calls `GET /api/admin/appointments/import/template`
   - Downloads file as `appointment_import_template.csv`
   - Use `fetch` with `blob()` response

4. **File Preview**:
   - Show selected file name and size
   - Format size in KB/MB
   - Clear file button

5. **Validation Rules**:
   - Client-side: File extension must be `.csv`
   - Client-side: Max file size 5MB
   - Show error alert for invalid files

**react-dropzone Integration**:
```typescript
import { useDropzone } from 'react-dropzone';

const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
  accept: {
    'text/csv': ['.csv'],
  },
  maxSize: 5 * 1024 * 1024, // 5MB
  multiple: false,
  onDrop: (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileSelected(acceptedFiles[0]);
    }
  },
});
```

**DaisyUI Components**:
- `card` for drop zone
- `btn` for template download and file input
- `alert-error` for validation errors
- `badge` for file size display

**Design Notes**:
- Drop zone: Dashed border (`border-dashed border-2 border-gray-300`)
- Hover state: Change border to `border-[#434E54]`
- Drag active state: Add background tint (`bg-[#F8EEE5]`)
- Icons: Upload icon (Lucide `Upload`), File icon (Lucide `File`)
- Spacing: Generous padding inside drop zone (`p-12`)

---

### Task 0021: ValidationPreview.tsx

**Purpose**: Display validation results with tabbed error view and continue options.

**Props**:
```typescript
interface ValidationPreviewProps {
  validationResponse: CSVValidationResponse;
  onContinue: () => void;
  onReupload: () => void;
  isLoading?: boolean;
}
```

**Key Features**:
1. **Validation Summary**:
   - Total rows parsed
   - Valid rows count (green badge)
   - Invalid rows count (red badge)
   - Duplicates found count (yellow badge)

2. **Tabbed View** (DaisyUI tabs):
   - Tab 1: "Valid Rows" - Preview first 10 rows
   - Tab 2: "Errors" - Error table with row number, field, message
   - Tab 3: "Duplicates" - Duplicate count with link to next step

3. **Valid Rows Preview**:
   - Table with columns: Customer, Pet, Service, Date, Time
   - Show first 10 rows only
   - Use DaisyUI `table` component
   - Responsive: Horizontal scroll on mobile

4. **Errors Table**:
   - Columns: Row #, Field, Error Message
   - Sortable by row number
   - Color-coded severity (red for errors, yellow for warnings)
   - Empty state if no errors

5. **Actions**:
   - Download Error Report (CSV)
   - Continue with Valid Rows (skip invalid)
   - Fix CSV & Re-upload (go back to step 1)

**Error Report Download**:
```typescript
const downloadErrorReport = () => {
  const csv = [
    ['Row', 'Field', 'Error Message'],
    ...errors.map(e => [e.rowNumber, e.field, e.message])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'import_errors.csv';
  a.click();
  URL.revokeObjectURL(url);
};
```

**DaisyUI Components**:
- `tabs` with `tab-lifted`
- `table` with `table-zebra`
- `badge` for counts
- `alert` for summary
- `btn` for actions

**Design Notes**:
- Summary cards use `stats` component
- Green success badge: `badge-success`
- Red error badge: `badge-error`
- Yellow duplicate badge: `badge-warning`
- Table: Striped rows (`table-zebra`)
- Mobile: Tables scroll horizontally (`overflow-x-auto`)

---

### Task 0022: DuplicateHandler.tsx

**Purpose**: Review and resolve duplicate appointments before import.

**Props**:
```typescript
interface DuplicateHandlerProps {
  duplicates: DuplicateMatch[];
  onResolutionsChange: (resolutions: Map<number, 'skip' | 'overwrite' | 'create_new'>) => void;
  onContinue: () => void;
  onBack: () => void;
}
```

**Key Features**:
1. **Duplicate Summary**:
   - Total duplicate count prominently displayed
   - Current duplicate index (e.g., "Duplicate 1 of 12")

2. **Side-by-Side Comparison**:
   - Left column: Existing appointment data
   - Right column: CSV import data
   - Highlight differences (e.g., different service)
   - Use color coding: Gray for matching, Yellow for differences

3. **Resolution Options** (radio buttons):
   - ○ Skip (keep existing) - **Default**
   - ○ Overwrite (replace with CSV data)
   - ○ Create New (allow duplicate)

4. **Navigation**:
   - Previous/Next buttons to cycle through duplicates
   - Preserve resolution selections when navigating
   - Show progress indicator (e.g., "3 of 12 resolved")

5. **Bulk Actions**:
   - "Skip All" button - Set all to skip
   - "Overwrite All" button - Set all to overwrite
   - Confirmation dialog before bulk action

6. **Continue Button**:
   - Enabled only when all duplicates resolved
   - Show summary: "X to skip, Y to overwrite, Z new"

**Comparison Display**:
```typescript
interface ComparisonRow {
  label: string;
  existing: string;
  imported: string;
  isDifferent: boolean;
}

const rows: ComparisonRow[] = [
  { label: 'Customer', existing: 'John Smith', imported: 'John Smith', isDifferent: false },
  { label: 'Pet', existing: 'Max', imported: 'Max', isDifferent: false },
  { label: 'Service', existing: 'Basic Grooming', imported: 'Premium Grooming', isDifferent: true },
  // ...
];
```

**DaisyUI Components**:
- `card` for comparison container
- `radio` for resolution options
- `badge` for difference highlighting
- `btn` for navigation and bulk actions
- `modal` for bulk action confirmation

**Design Notes**:
- Comparison cards: Side-by-side on desktop, stacked on mobile
- Differences highlighted with yellow background (`bg-yellow-100`)
- Current duplicate indicator: Large badge at top
- Navigation buttons: Disabled state when at ends
- Resolution selection: Persist in parent state (Map)

---

### Task 0023: ImportProgress.tsx

**Purpose**: Real-time import progress with batch processing feedback.

**Props**:
```typescript
interface ImportProgressProps {
  file: File;
  duplicateResolutions: Map<number, 'skip' | 'overwrite' | 'create_new'>;
  onComplete: (result: CSVImportResult) => void;
  onCancel: () => void;
}
```

**Key Features**:
1. **Progress Bar**:
   - 0-100% progress
   - DaisyUI `progress` component
   - Smooth animation
   - Color: Primary (`progress-primary`)

2. **Batch Indicator**:
   - Current batch number / total batches
   - Example: "Processing batch 5 of 15"
   - Batch size: 10 rows (from backend)

3. **Real-Time Counts**:
   - Successfully imported: Green count
   - Failed: Red count
   - Remaining: Gray count
   - Update in real-time as batches complete

4. **Recent Errors**:
   - Show last 5 errors as they occur
   - Format: "Row X: Error message"
   - Scrollable if more than 5
   - Use `alert-error` for each

5. **Cancel Option**:
   - Cancel button stops remaining batches
   - Confirmation dialog: "Stop import? (X rows remaining)"
   - Already imported rows are kept

6. **Auto-Transition**:
   - When progress reaches 100%, auto-call `onComplete(result)`
   - Brief success animation (checkmark)

**API Integration**:
```typescript
// Import API expects multipart/form-data
const formData = new FormData();
formData.append('file', file);
formData.append('duplicate_strategy', getDuplicateStrategy(duplicateResolutions));
formData.append('send_notifications', 'false'); // Default false

const response = await fetch('/api/admin/appointments/import', {
  method: 'POST',
  body: formData,
});

const result: CSVImportResult = await response.json();
```

**Important Note**: The backend API returns the **final result** after all batches complete, not streaming updates. For "real-time" progress, we'll use **optimistic updates** based on batch size calculations or polling if the API supports it. Check with backend team if streaming is available.

**DaisyUI Components**:
- `progress` for progress bar
- `stats` for counts
- `alert-error` for recent errors
- `btn` for cancel
- `modal` for cancel confirmation

**Design Notes**:
- Large progress bar (height: `h-4`)
- Counts displayed as stat cards in a row
- Recent errors: Max height with scroll (`max-h-48 overflow-y-auto`)
- Loading spinner next to current batch indicator
- Success checkmark animation using Framer Motion

---

### Task 0024: ImportSummary.tsx

**Purpose**: Display final import results with counts and action options.

**Props**:
```typescript
interface ImportSummaryProps {
  result: CSVImportResult;
  onClose: () => void;
  onViewAppointments: () => void;
}
```

**Key Features**:
1. **Success Message**:
   - Large checkmark icon (Lucide `CheckCircle`)
   - Headline: "Import Complete!"
   - Subtext: "X appointments successfully imported"

2. **Results Summary** (stats cards):
   - ✓ Total rows processed
   - ✓ Successfully imported (green)
   - ✗ Failed (red)
   - ⊖ Skipped (duplicates, gray)

3. **Additional Records Created** (IMPORTANT!):
   - **Customers created**: Count of new customer profiles
   - **Pets created**: Count of new pet records
   - **Inactive accounts created**: Count of inactive customer profiles (for future activation)
   - Use info alert with icon to highlight account activation flow

4. **Account Activation Callout**:
   ```
   ℹ️ Account Activation Notice
   12 inactive customer profiles were created. These customers can claim their
   accounts by registering with the same email address, gaining access to their
   appointment history.
   ```

5. **Failed Imports Table** (if any):
   - Columns: Row #, Customer, Reason
   - Sortable by row number
   - Max 10 rows shown, rest in downloadable report

6. **Actions**:
   - Download Error Report (if failures exist)
   - Close button (resets modal)
   - View Appointments button (calls `onViewAppointments`)

**Error Report Download**:
```typescript
const downloadFullReport = () => {
  const csv = [
    ['Row', 'Customer Email', 'Pet Name', 'Error Message'],
    ...result.errors.map(e => [
      e.rowNumber,
      e.customerEmail || 'N/A',
      e.petName || 'N/A',
      e.errors.map(err => err.message).join('; ')
    ])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `import_summary_${new Date().toISOString()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
```

**DaisyUI Components**:
- `stats` for summary cards
- `alert-info` for account activation notice
- `table` for failed imports
- `btn` for actions
- Icons: `CheckCircle`, `AlertCircle`, `Download`

**Design Notes**:
- Success icon: Large (w-16 h-16), green color
- Stats cards: 3-column grid on desktop, stacked on mobile
- Account activation notice: Prominent, use `alert-info` with blue accent
- Failed imports table: Striped, max-height with scroll
- Action buttons: Primary for "View Appointments", secondary for others

---

## State Management

### Parent Component (appointments/page.tsx) Integration

**Add CSV Import Button**:
```typescript
// In src/app/admin/appointments/page.tsx

const [isCSVImportOpen, setIsCSVImportOpen] = useState(false);

// In JSX:
<div className="flex gap-2">
  <button
    onClick={() => setIsCreateModalOpen(true)}
    className="btn bg-[#434E54] text-white hover:bg-[#363F44]"
  >
    <Plus className="w-5 h-5 mr-2" />
    Create Appointment
  </button>
  <button
    onClick={() => setIsCSVImportOpen(true)}
    className="btn btn-outline border-[#434E54] text-[#434E54] hover:bg-[#434E54] hover:text-white"
  >
    <Upload className="w-5 h-5 mr-2" />
    Import CSV
  </button>
</div>

// Modal:
<CSVImportModal
  isOpen={isCSVImportOpen}
  onClose={() => setIsCSVImportOpen(false)}
  onSuccess={handleCreateSuccess} // Reuses existing refresh logic
/>
```

### CSVImportModal Internal State

**State Interface**:
```typescript
interface CSVImportState {
  // Step tracking
  currentStep: 1 | 2 | 3 | 4 | 5;

  // File upload
  uploadedFile: File | null;

  // Validation
  isValidating: boolean;
  validationResponse: CSVValidationResponse | null;
  validationError: string | null;

  // Duplicate resolution
  duplicateResolutions: Map<number, 'skip' | 'overwrite' | 'create_new'>;

  // Import
  isImporting: boolean;
  importProgress: number; // 0-100
  importResult: CSVImportResult | null;
  importError: string | null;
}
```

**Step Transition Logic**:
```typescript
const handleFileUpload = async (file: File) => {
  setState(prev => ({
    ...prev,
    uploadedFile: file,
    isValidating: true,
    currentStep: 2, // Auto-advance to validation
  }));

  // Call validation API
  const response = await validateCSV(file);

  setState(prev => ({
    ...prev,
    isValidating: false,
    validationResponse: response,
  }));
};

const handleContinueFromValidation = () => {
  const hasDuplicates = validationResponse.duplicates_found > 0;

  setState(prev => ({
    ...prev,
    currentStep: hasDuplicates ? 3 : 4, // Skip duplicate step if none
  }));

  if (!hasDuplicates) {
    startImport(); // Auto-start if no duplicates
  }
};

const handleContinueFromDuplicates = () => {
  setState(prev => ({
    ...prev,
    currentStep: 4,
  }));

  startImport();
};

const startImport = async () => {
  setState(prev => ({
    ...prev,
    isImporting: true,
    importProgress: 0,
  }));

  // Call import API
  const result = await importCSV(uploadedFile, duplicateResolutions);

  setState(prev => ({
    ...prev,
    isImporting: false,
    importProgress: 100,
    importResult: result,
    currentStep: 5,
  }));
};
```

---

## API Integration

### 1. Download CSV Template

**Endpoint**: `GET /api/admin/appointments/import/template`

**Usage**:
```typescript
const downloadTemplate = async () => {
  try {
    const response = await fetch('/api/admin/appointments/import/template');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appointment_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download template:', error);
    // Show error toast
  }
};
```

### 2. Validate CSV File

**Endpoint**: `POST /api/admin/appointments/import/validate`

**Request**:
```typescript
const validateCSV = async (file: File): Promise<CSVValidationResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/admin/appointments/import/validate', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Validation failed');
  }

  return response.json();
};
```

**Response Structure** (from `CSVValidationResponse` type):
```typescript
{
  valid: boolean;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicates_found: number;
  preview: ValidatedCSVRow[]; // First 5 rows
  errors: ValidationError[];
  duplicates: DuplicateMatch[];
}
```

### 3. Import CSV File

**Endpoint**: `POST /api/admin/appointments/import`

**Request**:
```typescript
const importCSV = async (
  file: File,
  duplicateResolutions: Map<number, 'skip' | 'overwrite' | 'create_new'>,
  sendNotifications: boolean = false
): Promise<CSVImportResult> => {
  const formData = new FormData();
  formData.append('file', file);

  // Determine duplicate strategy
  const strategies = Array.from(duplicateResolutions.values());
  const duplicateStrategy = strategies.every(s => s === 'skip')
    ? 'skip'
    : 'overwrite'; // Simplified for API

  formData.append('duplicate_strategy', duplicateStrategy);
  formData.append('send_notifications', String(sendNotifications));

  const response = await fetch('/api/admin/appointments/import', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Import failed');
  }

  return response.json();
};
```

**Response Structure** (from `CSVImportResult` type):
```typescript
{
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicates_found: number;
  created_count: number;
  skipped_count: number;
  failed_count: number;
  customers_created: number;
  pets_created: number;
  inactive_profiles_created: number; // IMPORTANT for account activation
  errors: ValidationError[];
}
```

---

## Styling Guidelines

### Color Palette (Clean & Elegant Professional)

```css
/* From globals.css and design doc */
--background: #F8EEE5;        /* Warm cream */
--primary: #434E54;           /* Charcoal */
--primary-hover: #363F44;     /* Darker charcoal */
--secondary: #EAE0D5;         /* Lighter cream */
--text-primary: #434E54;
--text-secondary: #6B7280;
--success: #6BCB77;
--warning: #FFB347;
--error: #EF4444;
--info: #74B9FF;
```

### DaisyUI Component Styling

**Modal**:
```typescript
<div className="modal modal-open">
  <div className="modal-box max-w-4xl w-full h-[90vh] max-h-[900px] p-0 bg-white rounded-xl shadow-2xl flex flex-col">
    {/* Content */}
  </div>
</div>
```

**Buttons**:
```typescript
// Primary action
<button className="btn bg-[#434E54] text-white hover:bg-[#363F44] shadow-md">
  Continue
</button>

// Secondary action
<button className="btn btn-ghost text-[#434E54] hover:bg-[#EAE0D5]">
  Back
</button>

// Outline
<button className="btn btn-outline border-[#434E54] text-[#434E54] hover:bg-[#434E54] hover:text-white">
  Download
</button>
```

**Cards**:
```typescript
<div className="card bg-white shadow-md hover:shadow-lg transition-shadow rounded-lg">
  <div className="card-body">
    {/* Content */}
  </div>
</div>
```

**Tables**:
```typescript
<div className="overflow-x-auto">
  <table className="table table-zebra w-full">
    <thead className="bg-[#EAE0D5]">
      <tr>
        <th className="text-[#434E54] font-semibold">Column</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td className="text-[#434E54]">Data</td>
      </tr>
    </tbody>
  </table>
</div>
```

**Badges**:
```typescript
// Success
<span className="badge badge-success text-white">145 valid</span>

// Error
<span className="badge badge-error text-white">5 errors</span>

// Warning
<span className="badge badge-warning text-[#434E54]">12 duplicates</span>
```

**Alerts**:
```typescript
// Info (for account activation notice)
<div className="alert alert-info rounded-lg">
  <Info className="w-5 h-5" />
  <div>
    <h3 className="font-semibold text-[#434E54]">Account Activation Notice</h3>
    <p className="text-sm text-[#6B7280]">
      12 inactive customer profiles were created...
    </p>
  </div>
</div>

// Error
<div className="alert alert-error rounded-lg">
  <AlertCircle className="w-5 h-5" />
  <span>Error message</span>
</div>
```

**Progress Bar**:
```typescript
<progress
  className="progress progress-primary w-full h-4"
  value={progress}
  max="100"
/>
```

**Tabs**:
```typescript
<div className="tabs tabs-lifted">
  <button
    className={`tab ${activeTab === 'valid' ? 'tab-active' : ''}`}
    onClick={() => setActiveTab('valid')}
  >
    Valid Rows (145)
  </button>
  <button
    className={`tab ${activeTab === 'errors' ? 'tab-active' : ''}`}
    onClick={() => setActiveTab('errors')}
  >
    Errors (5)
  </button>
</div>
```

### Mobile Responsive Classes

```typescript
// Full-width on mobile, fixed width on desktop
className="w-full md:max-w-4xl"

// Stack on mobile, side-by-side on desktop
className="flex flex-col md:flex-row gap-4"

// Hide on mobile, show on desktop
className="hidden md:block"

// Touch-friendly button sizes
className="btn min-h-[44px]"

// Horizontal scroll for tables
className="overflow-x-auto"
```

### Spacing & Typography

```typescript
// Section spacing
className="space-y-6"

// Headings
className="text-2xl font-bold text-[#434E54]"
className="text-lg font-semibold text-[#434E54]"

// Body text
className="text-sm text-[#6B7280]"

// Line height for readability
className="leading-relaxed"
```

---

## Implementation Order

### Phase 1: Foundation (Task 0019, 0020)
**Estimated Time**: 4-5 hours

1. **Install Dependencies**:
   ```bash
   pnpm add react-dropzone
   pnpm add -D @types/react-dropzone
   ```

2. **Create CSVImportModal.tsx**:
   - Modal shell with step indicator
   - State management setup
   - Step navigation logic
   - Close confirmation dialog

3. **Create FileUploadStep.tsx**:
   - Drag-and-drop zone with react-dropzone
   - File validation (type, size)
   - Template download integration
   - File preview display

4. **Integration**:
   - Add "Import CSV" button to appointments page
   - Wire up modal open/close
   - Test file upload → validation trigger

### Phase 2: Validation & Preview (Task 0021)
**Estimated Time**: 4 hours

1. **Create ValidationPreview.tsx**:
   - Validation summary stats
   - Tabbed view implementation
   - Error table with sorting
   - Valid rows preview table
   - Error report download

2. **API Integration**:
   - Connect to validation endpoint
   - Handle loading states
   - Error handling and display

3. **Testing**:
   - Test with valid CSV
   - Test with invalid rows
   - Test error report download

### Phase 3: Duplicate Resolution (Task 0022)
**Estimated Time**: 4 hours

1. **Create DuplicateHandler.tsx**:
   - Side-by-side comparison layout
   - Resolution radio buttons
   - Navigation between duplicates
   - Bulk action buttons
   - Confirmation dialog

2. **State Management**:
   - Map-based resolution storage
   - Preserve selections during navigation
   - Summary calculation

3. **Testing**:
   - Test with CSV containing duplicates
   - Test navigation prev/next
   - Test bulk actions
   - Verify resolution persistence

### Phase 4: Progress & Summary (Task 0023, 0024)
**Estimated Time**: 5 hours

1. **Create ImportProgress.tsx**:
   - Progress bar component
   - Real-time count updates
   - Recent errors display
   - Cancel functionality

2. **Create ImportSummary.tsx**:
   - Success message and icon
   - Stats cards for counts
   - **Account activation callout** (IMPORTANT!)
   - Failed imports table
   - Full report download
   - Action buttons

3. **API Integration**:
   - Connect to import endpoint
   - Handle progress updates (if streaming available)
   - Error handling

4. **Testing**:
   - Test successful import
   - Test partial failures
   - Test cancel during import
   - **Verify inactive_profiles_created count displays**

### Phase 5: Polish & Testing
**Estimated Time**: 3-4 hours

1. **Mobile Responsiveness**:
   - Test all components on mobile viewport
   - Adjust layouts for small screens
   - Ensure touch targets are 44px minimum

2. **Error Handling**:
   - Test network errors
   - Test API errors
   - Test file validation errors
   - Add retry mechanisms

3. **Accessibility**:
   - Add ARIA labels
   - Keyboard navigation
   - Screen reader testing

4. **Performance**:
   - Test with large CSV files (1000 rows)
   - Optimize re-renders
   - Add loading skeletons

**Total Estimated Time**: 20-22 hours

---

## Testing Checklist

### File Upload (Task 0020)
- [ ] Drag and drop CSV file works
- [ ] Click to browse works
- [ ] Only .csv files accepted (reject .txt, .xlsx)
- [ ] Files > 5MB rejected with error message
- [ ] Template download works and file opens correctly
- [ ] Selected file name and size display correctly
- [ ] Clear file button removes selection
- [ ] Mobile: File input works on iOS and Android

### Validation Preview (Task 0021)
- [ ] Validation API called automatically after upload
- [ ] Summary stats display correctly (total, valid, invalid, duplicates)
- [ ] Tab switching works (Valid Rows, Errors)
- [ ] Error table shows row numbers, fields, and messages
- [ ] Valid rows preview shows first 10 rows max
- [ ] Error report downloads as CSV with correct data
- [ ] Continue button advances to next step
- [ ] Re-upload button goes back to step 1
- [ ] Mobile: Tables scroll horizontally

### Duplicate Resolution (Task 0022)
- [ ] Duplicate count displays correctly
- [ ] Side-by-side comparison shows existing vs new data
- [ ] Differences are highlighted (yellow background)
- [ ] Radio button selection works
- [ ] Previous/Next navigation works
- [ ] Selections persist when navigating
- [ ] Bulk "Skip All" sets all to skip
- [ ] Bulk "Overwrite All" sets all to overwrite
- [ ] Confirmation dialog shows before bulk action
- [ ] Continue button enabled when all resolved
- [ ] Summary shows count breakdown (X skip, Y overwrite, Z new)
- [ ] Mobile: Comparison cards stack vertically

### Import Progress (Task 0023)
- [ ] Progress bar updates from 0-100%
- [ ] Batch indicator shows "X of Y"
- [ ] Success count increments in real-time
- [ ] Failed count increments on errors
- [ ] Remaining count decrements
- [ ] Recent errors display (max 5)
- [ ] Cancel button stops import
- [ ] Cancel confirmation dialog appears
- [ ] Auto-transition to summary at 100%
- [ ] Mobile: Layout remains readable

### Import Summary (Task 0024)
- [ ] Success checkmark icon displays
- [ ] Total rows count is correct
- [ ] Successfully imported count is correct
- [ ] Failed count is correct
- [ ] Skipped count is correct
- [ ] **Customers created count displays**
- [ ] **Pets created count displays**
- [ ] **Inactive profiles created count displays** (CRITICAL!)
- [ ] **Account activation callout appears if inactive_profiles_created > 0**
- [ ] Failed imports table shows correct rows
- [ ] Error report download works
- [ ] Close button resets modal
- [ ] View Appointments button refreshes list and closes modal
- [ ] Mobile: Stats stack vertically

### End-to-End Flow
- [ ] Upload valid CSV → Validation → Import → Summary (no duplicates)
- [ ] Upload CSV with errors → Review errors → Continue with valid
- [ ] Upload CSV with duplicates → Resolve → Import → Summary
- [ ] Upload invalid file → Error message → Retry
- [ ] Cancel during validation → Confirmation → Reset
- [ ] Cancel during import → Partial import → Summary shows partial results
- [ ] Close modal during import → Confirmation warning
- [ ] **Import appointments → Verify inactive customer profiles created in DB**

### Design & Accessibility
- [ ] All buttons follow Clean & Elegant design (soft shadows, charcoal colors)
- [ ] All components use DaisyUI classes
- [ ] Mobile responsive (test on iPhone, Android)
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] ARIA labels present on interactive elements
- [ ] Loading states clear and informative
- [ ] Error states use red badge/alert
- [ ] Success states use green badge/alert
- [ ] Duplicate states use yellow badge/alert

---

## Important Notes

### 1. Account Activation Flow (CRITICAL!)

**Context**: When admins create appointments for customers who don't have accounts, the system creates **inactive customer profiles** that can later be **activated** when the customer registers.

**Database Fields** (from design.md):
```typescript
// Users table
{
  is_active: boolean;          // false for admin-created profiles
  created_by_admin: boolean;   // true for admin-created profiles
  password_hash: string | null; // null until customer activates
  activated_at: timestamp | null;
}
```

**UI Requirements**:
1. **ImportSummary.tsx MUST display**:
   - `inactive_profiles_created` count from API response
   - Info alert explaining the account activation flow
   - Messaging: "X inactive customer profiles were created. These customers can claim their accounts by registering with the same email address, gaining access to their appointment history."

2. **Why This Matters**:
   - Admins need to know that customer accounts were created but not activated
   - This prevents confusion when customers later register and can't sign up (email already exists)
   - Admins can inform customers: "We've already created your profile, just sign up with the same email"

3. **Example Messaging** (use in ImportSummary):
   ```typescript
   {result.inactive_profiles_created > 0 && (
     <div className="alert alert-info rounded-lg mt-4">
       <Info className="w-5 h-5" />
       <div>
         <h3 className="font-semibold text-[#434E54]">
           Account Activation Notice
         </h3>
         <p className="text-sm text-[#6B7280] mt-1">
           {result.inactive_profiles_created} inactive customer profile(s) were
           created during this import. These customers can claim their accounts
           by registering on the website with the same email address, which will
           give them access to their appointment history and allow them to book
           future appointments online.
         </p>
       </div>
     </div>
   )}
   ```

### 2. Duplicate Resolution Strategy

**Backend Constraint**: The import API accepts a single `duplicate_strategy` parameter (`'skip'` or `'overwrite'`), not per-row resolutions.

**Workaround Options**:

**Option A: Simplified Strategy (Recommended)**
- Let user choose ONE strategy for ALL duplicates
- Radio buttons: "Skip all duplicates" or "Overwrite all duplicates"
- Simpler UI, matches API design

**Option B: Per-Row Resolution (Complex)**
- Collect per-row resolutions in DuplicateHandler
- Make multiple API calls (one per resolution type)
- More complex, but gives finer control

**Recommendation**: Use Option A for MVP. Add note in UI: "This strategy will apply to all duplicates."

### 3. Progress Tracking Limitations

**Backend API Note**: The import API likely returns results **after all batches complete**, not streaming progress.

**UI Strategy**:
- Show indeterminate progress initially
- Once API responds, show final counts
- Add loading spinner and "Processing..." message
- Estimated time calculation: `totalRows / 10 (batch size) * 2 seconds per batch`

**Alternative**: If backend supports Server-Sent Events (SSE) or WebSockets, implement real-time streaming. Check with backend team.

### 4. Error Handling Best Practices

**Network Errors**:
```typescript
try {
  const response = await fetch('/api/...');
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
} catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    // Network error
    setError('Network error. Please check your connection and try again.');
  } else {
    setError(error.message);
  }
}
```

**File Validation Errors**:
- Show in-place error alert (don't use browser alert)
- Clear error when new file selected
- Provide actionable error messages:
  - ❌ "Invalid file"
  - ✅ "Please upload a .csv file (max 5MB)"

**API Errors**:
- Display error message from API response
- Provide retry option
- Log to console for debugging

### 5. Performance Considerations

**Large CSV Files (1000 rows)**:
- Use `React.memo` for table rows
- Virtualize long tables (consider `react-window` for >100 rows)
- Debounce search/filter inputs
- Show loading skeletons during validation

**File Size Limits**:
- Client-side: 5MB max
- Server-side: Check backend config (likely also 5MB)
- Show warning if file is large (>2MB): "Large file detected. Validation may take a moment."

### 6. Mobile-Specific Considerations

**Touch Targets**:
- All buttons: `min-h-[44px]` (Apple HIG standard)
- Radio buttons: Larger hit area (wrap label)

**Modal Behavior**:
- Full-screen on mobile (`h-screen` on `sm:` and below)
- Sticky header and footer
- Scrollable content area

**Tables**:
- Always use `overflow-x-auto` wrapper
- Consider card layout for mobile instead of tables
- Stack comparison cards vertically on mobile

**File Upload**:
- Mobile file input opens camera/photos picker
- Test on iOS Safari and Android Chrome
- Drag-and-drop may not work on mobile (click to browse fallback)

### 7. Accessibility Requirements

**Keyboard Navigation**:
- Tab order: Top to bottom, left to right
- Enter key: Submit forms, trigger primary actions
- Escape key: Close modal (with confirmation)
- Arrow keys: Navigate through tabs, duplicates

**ARIA Labels**:
```typescript
// File upload
<div {...getRootProps()} aria-label="CSV file upload area">
  <input {...getInputProps()} aria-label="Upload CSV file" />
</div>

// Progress bar
<progress
  aria-label="Import progress"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
/>

// Tabs
<button
  role="tab"
  aria-selected={activeTab === 'valid'}
  aria-controls="valid-panel"
>
  Valid Rows
</button>
```

**Screen Reader Announcements**:
- Use `role="status"` for progress updates
- Use `role="alert"` for errors
- Announce step changes

### 8. Testing with Mock Data

**Valid CSV Sample**:
```csv
customer_email,customer_name,customer_phone,pet_name,pet_breed,pet_size,pet_weight,service_name,appointment_date,appointment_time,addons,notes,payment_status,payment_method,amount_paid
sarah@example.com,Sarah Johnson,(657) 555-0123,Max,Golden Retriever,Large,55,Basic Grooming,2025-12-15,11:00 AM,Pawdicure,Special instructions,Pending,,
john@example.com,John Smith,(714) 555-0456,Bella,Poodle,Medium,25,Premium Grooming,2025-12-18,2:00 PM,"Teeth Brushing,Pawdicure",,Paid,Card,95.00
```

**Invalid CSV Sample** (for testing errors):
```csv
customer_email,customer_name,customer_phone,pet_name,pet_breed,pet_size,pet_weight,service_name,appointment_date,appointment_time
invalid-email,John Smith,(714) 555-0456,Max,Poodle,Medium,25,Basic Grooming,2025-12-15,11:00 AM
sarah@test.com,Sarah J,123,Bella,Lab,InvalidSize,25,NonexistentService,2025-12-21,10:00 AM
```

### 9. Common Pitfalls to Avoid

1. **Don't use browser `alert()` or `confirm()`** - Use DaisyUI modals
2. **Don't hardcode colors** - Use CSS variables or Tailwind classes
3. **Don't skip loading states** - Always show loading during async operations
4. **Don't forget mobile testing** - Test on actual devices, not just browser resize
5. **Don't skip error boundaries** - Wrap components in error boundaries
6. **Don't mutate state directly** - Always use setState or immutable updates
7. **Don't forget to clean up** - Remove event listeners, abort fetch requests
8. **Don't skip TypeScript types** - Use existing types from `admin-appointments.ts`

### 10. Documentation to Reference

1. **Design Document**: `docs/specs/admin-appointment-management/design.md`
   - Section 1.4: Account Activation Flow (CRITICAL!)
   - Section 3.2: CSV Import Interface
   - Section 5.3: CSV Processing Service

2. **CLAUDE.md**: Project design system
   - Color palette
   - Typography standards
   - Component guidelines

3. **DaisyUI Docs**: https://daisyui.com/components/
   - Modal: https://daisyui.com/components/modal/
   - Table: https://daisyui.com/components/table/
   - Progress: https://daisyui.com/components/progress/
   - Tabs: https://daisyui.com/components/tab/

4. **react-dropzone Docs**: https://react-dropzone.js.org/
   - Basic usage
   - File validation
   - Styling

---

## Summary

This implementation plan provides a complete blueprint for building the CSV Import UI (Tasks 0019-0024). The key priorities are:

1. **Clean & Elegant Professional Design** - Follow established design system
2. **Account Activation Flow** - Prominently display inactive profile counts
3. **Robust Error Handling** - Clear error messages and recovery options
4. **Mobile Responsive** - Full-screen modals, touch-friendly buttons
5. **DaisyUI Components** - Leverage existing component library

**Critical Success Factors**:
- Display `inactive_profiles_created` count in summary
- Show account activation callout with clear explanation
- Handle large CSV files (1000 rows) efficiently
- Provide downloadable error reports
- Mobile-responsive design throughout

**Estimated Total Time**: 20-22 hours

**Next Steps**:
1. Read this document thoroughly
2. Install `react-dropzone` dependency
3. Start with Task 0019 (Modal Shell) and Task 0020 (File Upload)
4. Test each component individually before integration
5. **DO NOT FORGET**: Account activation messaging in ImportSummary

Good luck with the implementation! 🎨
