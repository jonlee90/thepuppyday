# Task 20: Create Zod Validation Schemas

## Description
Create comprehensive Zod validation schemas for all booking-related forms and API requests.

## Files to create/modify
- `src/lib/booking/schemas.ts` (create if not exists in Task 1)

## Requirements References
- Req 12.1: Highlight required fields and display descriptive error messages
- Req 12.2: Display "Please enter a valid email address" for invalid email
- Req 12.3: Display "Please enter a valid phone number" for invalid phone

## Implementation Details

### schemas.ts
```typescript
import { z } from 'zod';
import type { PetSize, TimePreference } from '@/types/database';

// ==========================================
// Pet Form Schema
// ==========================================
export const petFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Pet name is required')
    .max(50, 'Pet name must be less than 50 characters')
    .trim(),
  size: z.enum(['small', 'medium', 'large', 'xlarge'], {
    required_error: 'Please select a size',
    invalid_type_error: 'Please select a valid size',
  }),
  breed_id: z.string().uuid().optional().nullable(),
  breed_custom: z
    .string()
    .max(100, 'Breed name must be less than 100 characters')
    .optional()
    .nullable(),
  weight: z
    .number()
    .positive('Weight must be a positive number')
    .max(300, 'Please enter a valid weight')
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .nullable(),
});

export type PetFormData = z.infer<typeof petFormSchema>;

// ==========================================
// Guest Info Schema
// ==========================================
const phoneRegex = /^\+?1?\s*\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

export const guestInfoSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters')
    .toLowerCase(),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(phoneRegex, 'Please enter a valid phone number'),
});

export type GuestInfoData = z.infer<typeof guestInfoSchema>;

// ==========================================
// Appointment Creation Schema
// ==========================================
export const createAppointmentSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  pet_id: z.string().uuid('Invalid pet ID'),
  service_id: z.string().uuid('Invalid service ID'),
  scheduled_at: z
    .string()
    .datetime('Invalid date/time format')
    .refine(
      (dt) => new Date(dt) > new Date(),
      'Appointment must be in the future'
    ),
  duration_minutes: z
    .number()
    .int()
    .positive()
    .max(480, 'Duration cannot exceed 8 hours'),
  addon_ids: z.array(z.string().uuid()).optional().default([]),
  total_price: z
    .number()
    .nonnegative('Price cannot be negative')
    .max(1000, 'Price seems too high'),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .nullable(),
  guest_info: guestInfoSchema.optional().nullable(),
});

export type CreateAppointmentData = z.infer<typeof createAppointmentSchema>;

// ==========================================
// Waitlist Entry Schema
// ==========================================
export const waitlistEntrySchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  pet_id: z.string().uuid('Invalid pet ID'),
  service_id: z.string().uuid('Invalid service ID'),
  requested_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine(
      (date) => new Date(date) >= new Date(new Date().toDateString()),
      'Date must be today or in the future'
    ),
  time_preference: z.enum(['morning', 'afternoon', 'any']).default('any'),
});

export type WaitlistEntryData = z.infer<typeof waitlistEntrySchema>;

// ==========================================
// Availability Query Schema
// ==========================================
export const availabilityQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  service_id: z.string().uuid('Invalid service ID'),
});

export type AvailabilityQueryData = z.infer<typeof availabilityQuerySchema>;

// ==========================================
// Helper for form error messages
// ==========================================
export function getFieldError(
  errors: Record<string, { message?: string }>,
  field: string
): string | undefined {
  return errors[field]?.message;
}

// ==========================================
// Phone number formatting helper
// ==========================================
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone; // Return as-is if can't format
}
```

## Acceptance Criteria
- [ ] petFormSchema validates name (required), size (required enum)
- [ ] guestInfoSchema validates firstName, lastName, email, phone (all required)
- [ ] Email validation shows "Please enter a valid email address"
- [ ] Phone validation shows "Please enter a valid phone number"
- [ ] Phone accepts multiple formats: (555) 123-4567, 555-123-4567, 5551234567
- [ ] createAppointmentSchema validates all appointment fields
- [ ] Appointment date must be in the future
- [ ] waitlistEntrySchema validates time_preference enum
- [ ] All schemas export TypeScript types
- [ ] Helper function for extracting field errors

## Estimated Complexity
Low

## Phase
Phase 6: Form Validation & Error Handling

## Dependencies
- None (may be created early in Task 1)
