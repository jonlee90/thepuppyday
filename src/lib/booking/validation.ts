/**
 * Validation schemas for booking system
 */

import { z } from 'zod';

// Phone number regex - flexible format
const phoneRegex = /^[\d\s\-\(\)\+]+$/;

/**
 * Guest information schema
 */
export const guestInfoSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  phone: z
    .string()
    .min(10, 'Please enter a valid phone number')
    .max(20, 'Phone number is too long')
    .regex(phoneRegex, 'Please enter a valid phone number'),
});

export type GuestInfoFormData = z.infer<typeof guestInfoSchema>;

/**
 * Pet form schema
 */
export const petFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Pet name is required')
    .max(50, 'Pet name is too long'),
  size: z.enum(['small', 'medium', 'large', 'xlarge'], {
    message: 'Please select a size',
  }),
  breed_id: z.string().optional(),
  breed_custom: z.string().max(100, 'Breed name is too long').optional(),
  weight: z
    .number()
    .positive('Weight must be positive')
    .max(300, 'Weight seems too high')
    .optional()
    .nullable(),
  notes: z.string().max(500, 'Notes are too long').optional(),
});

export type PetFormData = z.infer<typeof petFormSchema>;

/**
 * Booking notes schema
 */
export const bookingNotesSchema = z.object({
  notes: z.string().max(500, 'Notes are too long').optional(),
});

export type BookingNotesData = z.infer<typeof bookingNotesSchema>;

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Format as +X (XXX) XXX-XXXX for numbers with country code
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  // Return as-is if it doesn't match expected formats
  return phone;
}

/**
 * Normalize phone number for storage
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Validate email and check basic format
 */
export function isValidEmail(email: string): boolean {
  try {
    guestInfoSchema.shape.email.parse(email);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number
 */
export function isValidPhone(phone: string): boolean {
  try {
    guestInfoSchema.shape.phone.parse(phone);
    return true;
  } catch {
    return false;
  }
}
