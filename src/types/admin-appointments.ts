/**
 * Type definitions for Admin Appointment Management
 * Includes types for manual appointment creation wizard and CSV import
 */

// ============================================================================
// Manual Appointment Wizard Types
// ============================================================================

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
  date: string; // ISO date (YYYY-MM-DD)
  time: string; // HH:mm format
  isPastDate: boolean;
}

export type PaymentStatus = 'pending' | 'paid' | 'partially_paid';

export interface PaymentDetails {
  amount_paid: number;
  payment_method: string;
}

// ============================================================================
// API Payload Types
// ============================================================================

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

export interface CreateAppointmentResponse {
  success: boolean;
  appointment_id: string;
  customer_created: boolean;
  customer_status: 'active' | 'inactive';
  pet_created: boolean;
}

// ============================================================================
// CSV Import Types
// ============================================================================

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

export interface CSVValidationResponse {
  valid: boolean;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicates_found: number;
  preview: ValidatedCSVRow[];
  errors: ValidationError[];
  duplicates: DuplicateMatch[];
}

export interface CSVImportOptions {
  file: File;
  duplicate_strategy: 'skip' | 'overwrite';
  send_notifications: boolean;
}

// ============================================================================
// Availability Types
// ============================================================================

export interface TimeSlot {
  time: string; // HH:mm format
  available: boolean;
  booked_count: number;
  max_concurrent: number;
}

export interface AvailabilityResponse {
  date: string;
  slots: TimeSlot[];
  business_hours: {
    open: string;
    close: string;
  };
}
