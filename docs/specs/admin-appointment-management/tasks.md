# Admin Appointment Management - Implementation Tasks

This document provides a detailed implementation plan for the Admin Appointment Management features: Manual Appointment Creation and CSV Import.

## Overview

- **Feature**: Admin Appointment Management (Manual Creation + CSV Import)
- **Phase**: Admin Panel Advanced (Phase 6)
- **Dependencies**: Phase 5 (Admin Panel Core) completed
- **Total Estimated Effort**: 3 weeks (approximately 63 hours)
- **Existing Utilities**: This project already has pricing, availability, validation, and audit logging utilities that will be leveraged.

### Key Features

1. **Manual Appointment Creation**: Multi-step wizard for creating appointments via admin panel
2. **CSV Import**: Bulk import with validation, duplicate detection, and batch processing
3. **Account Activation Flow**: Email-based customer matching that creates inactive profiles for customers who haven't registered yet. When customers later register on the website, they automatically claim their existing profile and gain access to their appointment history.

---

## Task Groups

### Group 1: Foundation (Database, Types, Validation)

- [ ] **1.1 Database Schema Modifications**
  - **Appointments Table:**
    - Add `creation_method` ENUM column ('customer_booking', 'manual_admin', 'csv_import')
    - Add `created_by_admin_id` UUID column (foreign key to users)
    - Add indexes for efficient filtering by creation method and admin user
  - **Users Table (Account Activation Flow):**
    - Add `is_active` BOOLEAN column (default true)
    - Add `created_by_admin` BOOLEAN column (default false)
    - Add `activated_at` TIMESTAMP column
    - Add index on (email, role) WHERE is_active = false
    - Add constraint: active accounts must have password_hash
  - Create migration file with ALTER TABLE statements
  - Update mock data service to support new fields
  - **Requirements**: REQ-21.1, REQ-21.2, REQ-21.3, REQ-21.4, REQ-15.1-15.3
  - **Acceptance Criteria**:
    - Appointments table updated with creation tracking columns
    - Existing appointments default to 'customer_booking'
    - Users table updated with activation tracking columns
    - Existing users have is_active=true, created_by_admin=false
    - Indexes created for query performance
    - Constraint enforces password requirement for active accounts
  - **Estimated Effort**: 3 hours

- [ ] **1.2 TypeScript Type Definitions**
  - Create `src/types/admin-appointments.ts` with all interfaces
  - Define `ManualAppointmentState` for wizard state management
  - Define `SelectedCustomer`, `SelectedPet`, `SelectedService`, `SelectedAddon`, `SelectedDateTime`
  - Define `CreateAppointmentPayload` for API request
  - Define all CSV import types: `CSVRow`, `ParsedCSVRow`, `ValidatedCSVRow`, `ValidationError`, `ValidationWarning`
  - Define `DuplicateMatch`, `CSVImportResult`, `CSVTemplateColumn`
  - Update `src/types/database.ts` to include new appointment and user fields:
    - Appointment: `creation_method`, `created_by_admin_id`
    - User: `is_active`, `created_by_admin`, `activated_at`
  - **Requirements**: REQ-2, REQ-3, REQ-4, REQ-9, REQ-12, REQ-13, REQ-14, REQ-15
  - **Acceptance Criteria**:
    - All type definitions compile without errors
    - Types exported and importable from index
    - User type includes account activation fields
  - **Estimated Effort**: 2 hours

- [ ] **1.3 CSV-Specific Validation Utilities**
  - Create `src/lib/admin/appointments/csv-validation.ts`
  - **Note**: Core validation schemas already exist in `src/lib/booking/validation.ts` - leverage these!
  - Implement CSV-specific validators extending existing schemas:
    - `CSVCustomerSchema` - extends existing guestInfoSchema
    - `CSVPetSchema` - extends existing petFormSchema
    - `CSVAppointmentRowSchema` - validates full CSV row
  - Create `parseCSVDateTime()` - handles multiple date/time formats (YYYY-MM-DD, MM/DD/YYYY, 12h/24h time)
  - Create `normalizePaymentStatus()` - case-insensitive normalization
  - Create `normalizePetSize()` - case-insensitive size normalization
  - Create `validateWeightForSize()` - returns warnings for mismatches (not errors)
  - Add unit tests for all CSV validation functions
  - **Requirements**: REQ-2.6, REQ-2.7, REQ-3.5, REQ-3.6, REQ-3.7, REQ-3.8, REQ-6.3, REQ-6.5, REQ-6.7, REQ-9.4, REQ-9.5
  - **Acceptance Criteria**:
    - All CSV-specific Zod schemas validate correctly
    - Multiple date/time formats parsed successfully
    - Weight/size mismatch returns warning, not error
    - 100% test coverage on CSV validation functions
  - **Estimated Effort**: 3 hours

---

### Group 2: API Endpoints - Manual Appointment

**Note**: Several APIs already exist and can be used:
- `GET /api/admin/customers?search={query}` - Already implements customer search
- `GET /api/admin/services` - Already returns services with size-based prices
- `GET /api/admin/addons` - Already returns all addons
- `GET /api/admin/breeds` - Already returns all breeds

- [ ] **2.1 Availability Check API**
  - Create `src/app/api/admin/appointments/availability/route.ts`
  - **Note**: Leverage existing `src/lib/booking/availability.ts` utilities
  - Implement GET endpoint with `date` and `duration_minutes` parameters
  - Use existing `getAvailableSlots()` function from availability.ts
  - Return time slots with availability status based on business hours
  - Check existing appointments for slot conflicts using existing `hasConflict()`
  - Support configurable max concurrent appointments per slot
  - **Requirements**: REQ-6.1, REQ-6.2, REQ-6.4, REQ-6.5, REQ-6.8
  - **Acceptance Criteria**:
    - Business hours (9am-5pm Mon-Sat) enforced
    - Sundays marked as closed
    - Fully booked slots marked unavailable
    - Returns existing appointment count per slot
  - **Estimated Effort**: 2 hours

- [ ] **2.2 Create Appointment API**
  - Add POST handler to existing `src/app/api/admin/appointments/route.ts`
  - **Note**: Leverage existing utilities:
    - `src/lib/booking/pricing.ts` for price calculation
    - `src/lib/booking/validation.ts` for validation
    - `src/lib/admin/audit-log.ts` for audit logging
  - Accept `CreateAppointmentPayload` with customer, pet, service, addons, datetime, payment
  - **Customer Matching (Account Activation Flow):**
    - Search for existing customer by email (case-insensitive)
    - If found: Use existing customer_id (active or inactive)
    - If not found: Create inactive customer profile with:
      - `is_active = false` (no password yet)
      - `created_by_admin = true`
      - `password_hash = null`
  - **Pet Matching:**
    - Find or create pet under the customer
  - Calculate pricing using existing `calculatePrice()` function
  - Create appointment with `creation_method: 'manual_admin'` and `created_by_admin_id`
  - Create appointment_addons records
  - Create payment record if paid/partially_paid
  - Log change using existing `logSettingsChange()` (or create appointment-specific audit log)
  - Trigger confirmation notification (optional via flag)
  - Return created appointment with metadata
  - **Requirements**: REQ-8.3, REQ-8.6, REQ-8.7, REQ-8.8, REQ-8.9, REQ-9.6, REQ-15.1-15.3, REQ-20.1, REQ-21.1, REQ-21.2
  - **Acceptance Criteria**:
    - Email-based customer matching works (case-insensitive)
    - New inactive customer profiles created with correct flags
    - Existing customers (active or inactive) reused
    - New pets created when needed
    - Appointment saved with correct creation_method and created_by_admin_id
    - Price calculated from database using existing utilities
    - Payment records created for paid status
    - Notification sent when enabled
    - Audit log entry created
  - **Estimated Effort**: 5 hours

---

### Group 3: API Endpoints - CSV Import

- [ ] **3.1 CSV Template Download API**
  - Create `src/app/api/admin/appointments/import/template/route.ts`
  - Implement GET endpoint returning CSV file download
  - Include all required and optional column headers
  - Include 2-3 example rows with valid data
  - Set proper content-disposition and content-type headers
  - **Requirements**: REQ-10.4, REQ-10.5, REQ-12.1, REQ-12.2
  - **Acceptance Criteria**:
    - Downloads as `appointment_import_template.csv`
    - Contains all required columns
    - Example data matches business rules
  - **Estimated Effort**: 1 hour

- [ ] **3.2 CSV Validation API**
  - Create `src/app/api/admin/appointments/import/validate/route.ts`
  - Implement POST endpoint accepting multipart/form-data
  - Validate file type, size (5MB max), row count (1000 max)
  - Parse CSV with PapaParse, validate required columns
  - Validate each row using CSV validation schemas from task 1.3
  - Detect duplicates against existing appointments
  - Return preview (first 5 rows) and validation summary
  - **Requirements**: REQ-11.1, REQ-11.2, REQ-11.3, REQ-11.4, REQ-11.5, REQ-11.6, REQ-11.7, REQ-11.8, REQ-13.1-10, REQ-14.1, REQ-14.2, REQ-14.3
  - **Acceptance Criteria**:
    - Rejects non-CSV files with clear error
    - Rejects files over 5MB
    - Rejects files over 1000 rows
    - Returns per-row validation errors/warnings
    - Identifies duplicate appointments
  - **Estimated Effort**: 4 hours

- [ ] **3.3 CSV Import Execution API**
  - Create `src/app/api/admin/appointments/import/route.ts`
  - **Note**: Leverage existing pricing and validation utilities
  - Implement POST endpoint accepting file and options (duplicate_strategy, send_notifications)
  - Process rows in batches of 10 for stability
  - **Customer/Pet Matching (Account Activation Flow):**
    - For each row, search for customer by email (case-insensitive)
    - If found: Use existing customer_id (active or inactive)
    - If not found: Create inactive customer profile with `is_active=false`, `created_by_admin=true`
    - Find or create pets under each customer
  - Create appointments with `creation_method: 'csv_import'` and `created_by_admin_id`
  - Support duplicate strategies: skip, overwrite
  - Track progress and return detailed summary
  - Optionally send confirmation notifications
  - Use existing audit log for tracking imports
  - **Requirements**: REQ-14.4, REQ-14.5, REQ-14.6, REQ-14.7, REQ-15.1-8, REQ-16.1, REQ-16.2, REQ-16.3, REQ-16.4, REQ-16.5, REQ-17.1-6, REQ-18.1-5, REQ-20.2, REQ-20.3, REQ-20.4, REQ-21.1, REQ-21.2
  - **Acceptance Criteria**:
    - Batch processing prevents timeouts (10 rows per batch)
    - Email-based customer matching works (case-insensitive)
    - Inactive customer profiles created for new emails
    - Existing customers (active or inactive) reused
    - Duplicate strategy correctly applied
    - Import summary includes all counts
    - Failed rows don't block successful ones
    - Notifications sent when enabled
    - Audit log entry created for import
  - **Estimated Effort**: 5 hours

---

### Group 4: CSV Processing Logic

- [ ] **4.1 CSV Parser Service**
  - Create `src/lib/admin/appointments/csv-processor.ts`
  - Implement `CSVProcessor` class with PapaParse integration
  - Add file validation (extension, size, MIME type)
  - Add column validation against required headers
  - Implement value sanitization for security (formula injection prevention)
  - Strip dangerous characters (=, @, +, -) from cell values
  - Add unit tests for parsing edge cases
  - **Requirements**: REQ-11.1, REQ-11.2, REQ-11.3, REQ-11.4, REQ-11.5, REQ-11.6, REQ-19.1, REQ-19.2, REQ-19.3, REQ-19.4, REQ-19.7
  - **Acceptance Criteria**:
    - PapaParse correctly parses valid CSV
    - Invalid files rejected with clear errors
    - Formula injection characters stripped
    - Special characters encoded properly
  - **Estimated Effort**: 3 hours

- [ ] **4.2 Row Validator Service**
  - Create validation logic in `csv-processor.ts` or separate file
  - Implement `validateRow()` using CSV validation schemas from task 1.3
  - Parse customer_name into first_name and last_name
  - Use normalization functions from task 1.3
  - Match service_name and addons against database
  - **Note**: Use existing `calculatePrice()` for pricing each row
  - Add unit tests for all normalizations and edge cases
  - **Requirements**: REQ-12.3, REQ-12.4, REQ-12.5, REQ-12.6, REQ-12.7, REQ-12.8, REQ-13.1-10, REQ-22.1-6
  - **Acceptance Criteria**:
    - All date/time formats parsed correctly
    - Case-insensitive matching works
    - Service/addon lookup returns correct IDs
    - Pricing calculated using existing utilities
  - **Estimated Effort**: 3 hours

- [ ] **4.3 Duplicate Detection Service**
  - Implement `detectDuplicates()` method in csv-processor
  - Match on: customer_email + pet_name + appointment_date + appointment_time (same hour)
  - Query existing appointments efficiently
  - Return list of `DuplicateMatch` objects
  - Add unit tests with mock data
  - **Requirements**: REQ-14.1, REQ-14.2, REQ-14.3
  - **Acceptance Criteria**:
    - Duplicates detected based on all four criteria
    - Case-insensitive email/pet name matching
    - Same hour considered duplicate
  - **Estimated Effort**: 2 hours

- [ ] **4.4 Batch Processor Service**
  - Create `src/lib/admin/appointments/batch-processor.ts`
  - Implement `processImport()` with configurable batch size
  - Handle customer/pet find-or-create logic
  - Create appointments with all related records
  - Track progress and return detailed results
  - Handle errors gracefully, continue processing
  - Add integration tests with mock database
  - **Requirements**: REQ-15.1-8, REQ-16.1, REQ-16.2, REQ-16.3, REQ-16.4, REQ-18.1, REQ-18.2, REQ-18.3, REQ-18.4, REQ-18.5
  - **Acceptance Criteria**:
    - Batches of 10 rows processed sequentially
    - Failed rows logged but don't stop import
    - Progress callback invoked correctly
    - All-or-nothing mode rolls back on any failure
  - **Estimated Effort**: 4 hours

---

### Group 5: UI Components - Manual Appointment Wizard

- [ ] **5.1 Manual Appointment Modal Shell**
  - Create `src/components/admin/appointments/ManualAppointmentModal.tsx`
  - Implement modal with DaisyUI modal component
  - Add step progress indicator (1/5, 2/5, etc.)
  - Implement state management with Zustand or local state
  - Add navigation (Back, Next, Cancel) with proper validation gating
  - Wire up to "Create Appointment" button on appointments page
  - **Requirements**: REQ-1.1, REQ-1.2, REQ-1.3, REQ-1.4
  - **Acceptance Criteria**:
    - Modal opens from appointments page button
    - Progress indicator shows current step
    - Back/Next navigation works
    - Cancel closes modal without saving
  - **Estimated Effort**: 3 hours

- [ ] **5.2 Customer Selection Step**
  - Create `src/components/admin/appointments/steps/CustomerSelectionStep.tsx`
  - **Note**: Use existing `GET /api/admin/customers?search={query}` endpoint
  - Implement search input with debouncing (300ms)
  - Display customer results with radio selection
  - Show "Create New Customer" expandable form
  - Use existing validation from `src/lib/booking/validation.ts`
  - Check for duplicate email on new customer
  - **Requirements**: REQ-2.1, REQ-2.2, REQ-2.3, REQ-2.4, REQ-2.5, REQ-2.6, REQ-2.7, REQ-2.8
  - **Acceptance Criteria**:
    - Real-time search with debounce
    - Existing customers selectable via radio
    - New customer form validates email/phone
    - Duplicate email shows error
  - **Estimated Effort**: 3 hours

- [ ] **5.3 Pet Selection Step**
  - Create `src/components/admin/appointments/steps/PetSelectionStep.tsx`
  - Display customer's existing pets with radio selection
  - Show pet details (breed, size, weight) and price preview
  - **Note**: Use existing `GET /api/admin/breeds` for breed dropdown
  - Implement "Add New Pet" expandable form
  - Add breed autocomplete with custom breed option
  - Add size buttons with weight range hints
  - Validate weight against size with warning (not error)
  - **Requirements**: REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4, REQ-3.5, REQ-3.6, REQ-3.7, REQ-3.8
  - **Acceptance Criteria**:
    - Existing pets displayed with details
    - New pet form has all required fields
    - Weight/size mismatch shows warning
    - Admin can proceed despite warning
  - **Estimated Effort**: 3 hours

- [ ] **5.4 Service Selection Step**
  - Create `src/components/admin/appointments/steps/ServiceSelectionStep.tsx`
  - **Note**: Use existing `GET /api/admin/services` and `GET /api/admin/addons` endpoints
  - Display services with radio selection and size-based prices
  - Display addons with checkbox selection
  - Show real-time running total with breakdown using existing pricing utilities
  - Handle disabled state for services without pricing
  - **Requirements**: REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4, REQ-4.5, REQ-4.6, REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4, REQ-5.5, REQ-5.6
  - **Acceptance Criteria**:
    - Prices displayed based on selected pet size
    - Running total updates as selections change
    - Addons cumulative total correct
    - Missing pricing shows disabled state
  - **Estimated Effort**: 3 hours

- [ ] **5.5 Date & Time Selection Step**
  - Create `src/components/admin/appointments/steps/DateTimeStep.tsx`
  - Implement calendar picker (disable Sundays)
  - Use availability API from task 2.1 to fetch available slots
  - Mark booked slots as unavailable
  - Show past date warning with override option
  - Add notes textarea with character counter (1000 max)
  - Add payment status selection with conditional fields
  - **Requirements**: REQ-6.1, REQ-6.2, REQ-6.3, REQ-6.4, REQ-6.5, REQ-6.6, REQ-6.7, REQ-7.1, REQ-7.2, REQ-7.3, REQ-7.4, REQ-7.5, REQ-9.1, REQ-9.2, REQ-9.3, REQ-9.4, REQ-9.5
  - **Acceptance Criteria**:
    - Sundays disabled in calendar
    - Available slots fetched per date
    - Past dates show warning
    - Notes limited to 1000 characters
    - Payment fields show/hide correctly
  - **Estimated Effort**: 4 hours

- [ ] **5.6 Summary & Confirmation Step**
  - Create `src/components/admin/appointments/steps/SummaryStep.tsx`
  - Display read-only summary of all selections
  - Show customer, pet, service, addons, date/time, notes, payment
  - Display total price prominently
  - Show past date warning if applicable
  - Implement "Create Appointment" button with loading state
  - Handle success/error responses with toast notifications
  - **Requirements**: REQ-8.1, REQ-8.2, REQ-8.3, REQ-8.4, REQ-8.5, REQ-8.6, REQ-8.7, REQ-8.8, REQ-8.9
  - **Acceptance Criteria**:
    - All selections displayed correctly
    - Create button calls API
    - Loading state shown during submission
    - Success message includes customer and date
    - Modal closes and list refreshes on success
  - **Estimated Effort**: 2 hours

---

### Group 6: UI Components - CSV Import

- [ ] **6.1 CSV Import Modal Shell**
  - Create `src/components/admin/appointments/CSVImportModal.tsx`
  - Implement modal with multi-phase flow (upload, preview, import, summary)
  - Add template download link (uses API from task 3.1)
  - Wire up to "Import CSV" button on appointments page
  - **Requirements**: REQ-10.1, REQ-10.2, REQ-10.3, REQ-10.4, REQ-10.5
  - **Acceptance Criteria**:
    - Modal opens from import button
    - Template downloads correctly
    - Multi-phase navigation works
  - **Estimated Effort**: 2 hours

- [ ] **6.2 File Upload Component**
  - Create `src/components/admin/appointments/csv/FileUploadZone.tsx`
  - Implement drag-and-drop zone with click-to-browse
  - Validate file type and size client-side
  - Display selected file info with remove option
  - Show upload progress
  - **Requirements**: REQ-11.1, REQ-11.2, REQ-11.3, REQ-11.4
  - **Acceptance Criteria**:
    - Drag-and-drop works
    - Invalid files rejected with error message
    - File info displayed after selection
  - **Estimated Effort**: 2 hours

- [ ] **6.3 Preview & Validation Display**
  - Create `src/components/admin/appointments/csv/ValidationPreview.tsx`
  - Display first 5 rows in table format
  - Show validation summary (valid, invalid, duplicates)
  - Add "View Errors" and "View Duplicates" buttons
  - Display error detail modal with row number and field errors
  - Add "Download Error Report" option
  - **Requirements**: REQ-11.7, REQ-11.8, REQ-13.10, REQ-14.3, REQ-17.2, REQ-17.3
  - **Acceptance Criteria**:
    - Preview table shows sample data
    - Validation counts accurate
    - Error details accessible per row
    - Error report downloadable as CSV
  - **Estimated Effort**: 3 hours

- [ ] **6.4 Duplicate Handler UI**
  - Create `src/components/admin/appointments/csv/DuplicateHandler.tsx`
  - Display list of duplicate matches with details
  - Provide strategy selection (skip, overwrite, cancel)
  - Show matched appointment info
  - **Requirements**: REQ-14.3, REQ-14.4, REQ-14.5, REQ-14.6
  - **Acceptance Criteria**:
    - Duplicates listed with match details
    - Strategy selection works
    - Cancel returns to upload phase
  - **Estimated Effort**: 2 hours

- [ ] **6.5 Import Progress Display**
  - Create `src/components/admin/appointments/csv/ImportProgress.tsx`
  - Display progress bar with percentage
  - Show current row being processed
  - Display running counts (created, skipped, failed)
  - Add cancel import option
  - **Requirements**: REQ-16.1, REQ-16.2, REQ-16.4
  - **Acceptance Criteria**:
    - Progress bar updates in real-time
    - Running counts accurate
    - Cancel stops import gracefully
  - **Estimated Effort**: 2 hours

- [ ] **6.6 Import Summary Display**
  - Create `src/components/admin/appointments/csv/ImportSummary.tsx`
  - Display final counts (total, successful, failed, skipped)
  - Show notification counts if enabled
  - List failed rows with error details
  - Add "Download Full Report" button
  - Add "View Appointments" button to close and navigate
  - **Requirements**: REQ-17.1, REQ-17.2, REQ-17.3, REQ-17.4, REQ-17.5, REQ-17.6, REQ-20.7
  - **Acceptance Criteria**:
    - Summary shows all counts
    - Failed rows listed with reasons
    - Report downloadable
    - Close refreshes appointment list
  - **Estimated Effort**: 2 hours

---

### Group 7: Integration & Polish

- [ ] **7.1 Appointments Page Integration**
  - Update `src/app/(admin)/admin/appointments/page.tsx`
  - Add "Create Appointment" button triggering modal
  - Add "Import CSV" button triggering modal
  - Display creation_method in appointment list/details
  - Show admin user who created manual/CSV appointments
  - **Requirements**: REQ-1.1, REQ-10.1, REQ-21.5
  - **Acceptance Criteria**:
    - Both buttons visible to admin users
    - Creation method displayed in list view
    - Admin creator shown in details
  - **Estimated Effort**: 2 hours

- [ ] **7.2 Notification Integration**
  - Integrate manual appointment creation with existing notification triggers
  - Add "Send notification" checkbox to manual form
  - Add "Send notifications" checkbox to CSV import
  - Use existing notification templates and delivery logic
  - Log notification success/failure in notifications_log
  - **Requirements**: REQ-20.1, REQ-20.2, REQ-20.3, REQ-20.4, REQ-20.5, REQ-20.6
  - **Acceptance Criteria**:
    - Confirmation notifications sent via existing system
    - Notification option toggleable in both flows
    - Failed notifications logged but don't block creation
  - **Estimated Effort**: 2 hours

- [ ] **7.3 Error Handling & Edge Cases**
  - Add comprehensive error handling for all API endpoints
  - Handle network failures gracefully in UI
  - Add retry logic for transient failures
  - Validate edge cases: empty file, all rows invalid, concurrent imports
  - Add proper error messages with actionable guidance
  - **Requirements**: REQ-8.9, REQ-16.4, REQ-18.1, REQ-18.2
  - **Acceptance Criteria**:
    - API errors return appropriate HTTP status codes
    - UI shows user-friendly error messages
    - Network failures allow retry
  - **Estimated Effort**: 2 hours

- [ ] **7.4 Mobile Responsiveness**
  - Ensure manual appointment modal works on mobile
  - Stack form fields vertically on small screens
  - Use bottom action bar for CTAs
  - Ensure touch targets are 44x44px minimum
  - Test file upload on mobile devices
  - **Requirements**: Design Document Section 3.3
  - **Acceptance Criteria**:
    - Modal usable on mobile devices
    - Form fields readable and tappable
    - File upload works on mobile
  - **Estimated Effort**: 2 hours

---

### Group 8: Testing

- [ ] **8.1 Unit Tests - Validation Utilities**
  - Test all CSV validation schemas from task 1.3
  - Test weight/size validation with edge cases
  - Test date/time parsing with multiple formats
  - Test pricing calculation integration
  - Achieve 100% coverage on CSV validation utilities
  - **Requirements**: REQ-2.6, REQ-2.7, REQ-3.5, REQ-3.6, REQ-3.7, REQ-6.3, REQ-6.5, REQ-6.7
  - **Acceptance Criteria**:
    - All validation rules tested
    - Edge cases covered
    - Tests pass with mocked data
  - **Estimated Effort**: 2 hours

- [ ] **8.2 Unit Tests - CSV Processing**
  - Test CSV parser with various file formats
  - Test formula injection prevention
  - Test row validation with invalid data
  - Test duplicate detection logic
  - Test batch processor with success/failure scenarios
  - **Requirements**: REQ-13.1-10, REQ-14.1-3, REQ-19.1-7
  - **Acceptance Criteria**:
    - Parser handles all specified formats
    - Security sanitization tested
    - Batch processing tested with partial failures
  - **Estimated Effort**: 3 hours

- [ ] **8.3 Integration Tests - API Endpoints**
  - Test availability API with different dates
  - Test create appointment API with new/existing customers
  - Test CSV validation API with valid/invalid files
  - Test CSV import API with various scenarios
  - **Note**: Existing customer search and services APIs already tested
  - **Requirements**: All API-related requirements
  - **Acceptance Criteria**:
    - All endpoints return correct responses
    - Authentication enforced
    - Error responses correct
  - **Estimated Effort**: 3 hours

- [ ] **8.4 E2E Tests - Manual Appointment Flow**
  - Test complete wizard flow with new customer and pet
  - Test flow with existing customer and pet
  - Test validation errors at each step
  - Test form submission and success feedback
  - Test appointment appears in list after creation
  - **Requirements**: REQ-1-9
  - **Acceptance Criteria**:
    - Full flow completes successfully
    - Validation prevents invalid submissions
    - Created appointment visible in list
  - **Estimated Effort**: 3 hours

- [ ] **8.5 E2E Tests - CSV Import Flow**
  - Test template download
  - Test valid file upload and preview
  - Test invalid file rejection
  - Test duplicate handling with each strategy
  - Test import completion and summary
  - **Requirements**: REQ-10-19
  - **Acceptance Criteria**:
    - Template downloads correctly
    - Valid files import successfully
    - Invalid files show clear errors
    - Summary accurate after import
  - **Estimated Effort**: 3 hours

---

## Implementation Order

The recommended implementation order ensures dependencies are satisfied:

1. **Week 1**: Tasks 1.1-1.3 (Foundation) + Tasks 2.1-2.2 (Manual APIs)
2. **Week 2**: Tasks 5.1-5.6 (Manual UI) + Task 7.1 (Page Integration)
3. **Week 3**: Tasks 3.1-3.3 (CSV APIs) + Tasks 4.1-4.4 (CSV Processing) + Tasks 6.1-6.6 (CSV UI) + Tasks 7.2-7.4 (Integration) + Tasks 8.1-8.5 (Testing)

---

## Existing Utilities to Leverage

This project already has the following utilities that should be used:

### Pricing Utilities (`src/lib/booking/pricing.ts`)
- `calculatePrice()` - Complete price breakdown with service, addons, tax, deposit
- `getServicePriceForSize()` - Get service price for specific pet size
- `calculateAddonsTotal()` - Calculate total addon costs
- `getSizeFromWeight()` - Determine size from weight
- `formatCurrency()` - Format prices for display

### Availability Utilities (`src/lib/booking/availability.ts`)
- `getAvailableSlots()` - Get available time slots for a date
- `hasConflict()` - Check for appointment conflicts
- `generateTimeSlots()` - Generate time slots within business hours
- `isDateAvailable()` - Check if date is available
- `getDisabledDates()` - Get disabled dates for calendar

### Validation Utilities (`src/lib/booking/validation.ts`)
- `guestInfoSchema` - Customer validation (name, email, phone)
- `petFormSchema` - Pet validation (name, size, breed, weight)
- `appointmentCreationSchema` - Appointment validation
- `isValidEmail()`, `isValidPhone()` - Validation helpers
- `formatPhoneNumber()`, `normalizePhoneNumber()` - Phone formatting

### Audit Logging (`src/lib/admin/audit-log.ts`)
- `logSettingsChange()` - Log any change with old/new values
- `getAuditLog()` - Get audit log entries with filtering
- Adapt for appointment creation tracking

### Existing APIs
- `GET /api/admin/customers?search={query}` - Customer search
- `GET /api/admin/services` - Services with size-based prices
- `GET /api/admin/addons` - All addons
- `GET /api/admin/breeds` - All breeds
- `GET /api/admin/appointments` - List appointments (will be enhanced with POST)

---

## Notes

- All tasks reference the design document at `docs/specs/admin-appointment-management/design.md`
- Tasks assume PapaParse library will be installed: `npm install papaparse @types/papaparse`
- Mock service implementations should support new appointment fields for development mode
- Follow existing project patterns for API routes, components, and testing
- **Leverage existing utilities extensively** - don't reinvent pricing, validation, or availability logic
- Audit logging pattern already established - extend for appointment tracking
