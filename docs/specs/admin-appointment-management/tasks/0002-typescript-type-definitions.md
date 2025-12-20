# Task 0002: TypeScript Type Definitions

**Phase**: Admin Panel Advanced (Phase 6)
**Prerequisites**: 0001
**Estimated Effort**: 2 hours

## Objective

Define TypeScript types and interfaces for manual appointment creation and CSV import features.

## Requirements

- REQ-2, REQ-3, REQ-4, REQ-9: Manual appointment wizard data
- REQ-12, REQ-13, REQ-14, REQ-15: CSV import data structures

## Implementation Details

### Files to Create

**`src/types/admin-appointments.ts`**

Define interfaces for:
```typescript
// Manual Appointment Wizard State
export interface ManualAppointmentState {
  currentStep: number;
  selectedCustomer: SelectedCustomer | null;
  selectedPet: SelectedPet | null;
  selectedService: SelectedService | null;
  selectedAddons: SelectedAddon[];
  selectedDateTime: SelectedDateTime | null;
  notes: string;
  paymentStatus: PaymentStatus;
  paymentDetails?: PaymentDetails;
}

export interface SelectedCustomer {
  id?: string; // undefined for new customers
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  isNew: boolean;
}

export interface SelectedPet {
  id?: string; // undefined for new pets
  name: string;
  breed_id: string;
  breed_name?: string;
  size: 'small' | 'medium' | 'large' | 'x-large';
  weight: number;
  isNew: boolean;
}

export interface SelectedService {
  id: string;
  name: string;
  duration_minutes: number;
  price: number; // size-based price
}

export interface SelectedAddon {
  id: string;
  name: string;
  price: number;
}

export interface SelectedDateTime {
  date: string; // ISO date
  time: string; // HH:mm format
  isPastDate: boolean;
}

export type PaymentStatus = 'pending' | 'paid' | 'partially_paid';

export interface PaymentDetails {
  amount_paid: number;
  payment_method: string;
}

// API Payload
export interface CreateAppointmentPayload {
  customer: SelectedCustomer;
  pet: SelectedPet;
  service_id: string;
  addon_ids: string[];
  appointment_date: string;
  appointment_time: string;
  notes?: string;
  payment_status: PaymentStatus;
  payment_details?: PaymentDetails;
  send_notification?: boolean;
}

// CSV Import Types
export interface CSVRow {
  [key: string]: string; // Raw CSV data
}

export interface ParsedCSVRow {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pet_name: string;
  pet_breed: string;
  pet_size: string;
  pet_weight: string;
  service_name: string;
  addons?: string; // comma-separated
  date: string;
  time: string;
  notes?: string;
  payment_status?: string;
  amount_paid?: string;
  payment_method?: string;
}

export interface ValidatedCSVRow extends ParsedCSVRow {
  rowNumber: number;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error';
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning';
}

export interface DuplicateMatch {
  csvRow: ValidatedCSVRow;
  existingAppointment: {
    id: string;
    customer_name: string;
    pet_name: string;
    service_name: string;
    date: string;
    time: string;
    status: string;
  };
  matchConfidence: 'high' | 'medium';
}

export interface CSVImportResult {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicates_found: number;
  created_count: number;
  skipped_count: number;
  failed_count: number;
  customers_created: number;
  pets_created: number;
  inactive_profiles_created: number;
  errors: ValidationError[];
}

export interface CSVTemplateColumn {
  field: string;
  label: string;
  required: boolean;
  example: string;
}
```

### Files to Modify

**`src/types/database.ts`**

Update existing types:
```typescript
export interface Appointment {
  // ... existing fields
  creation_method?: 'customer_booking' | 'manual_admin' | 'csv_import';
  created_by_admin_id?: string;
}

export interface User {
  // ... existing fields
  is_active?: boolean;
  created_by_admin?: boolean;
  activated_at?: string;
}
```

## Acceptance Criteria

- [ ] All type definitions compile without errors
- [ ] Types exported from admin-appointments.ts
- [ ] Database types updated with new fields
- [ ] Types importable in other files
- [ ] No TypeScript errors in project

## References

- **Requirements**: docs/specs/admin-appointment-management/requirements.md
- **Design**: docs/specs/admin-appointment-management/design.md (Section 2)
