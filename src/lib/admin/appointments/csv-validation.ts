/**
 * CSV Validation Utilities for Admin Appointment Management
 * Extends existing validation schemas from booking system
 */

import { z } from 'zod';
import { guestInfoSchema, petFormSchema } from '@/lib/booking/validation';
import { SIZE_WEIGHT_RANGES, getSizeFromWeight } from '@/lib/booking/pricing';
import type { PetSize, PaymentStatus } from '@/types/database';

/**
 * CSV-specific customer schema
 * Extends guestInfoSchema but allows for name splitting from single field
 */
export const CSVCustomerSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Invalid email format').trim().toLowerCase(),
  customer_phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
});

/**
 * CSV-specific pet schema
 * Size is string in CSV, validated against enum
 */
export const CSVPetSchema = z.object({
  pet_name: z.string().min(1, 'Pet name is required').max(100),
  pet_breed: z.string().min(1, 'Pet breed is required'),
  pet_size: z.string().min(1, 'Pet size is required'),
  pet_weight: z.string().optional(),
});

/**
 * CSV appointment row schema
 * Represents a complete row from CSV with all required and optional fields
 */
export const CSVAppointmentRowSchema = z.object({
  // Customer fields
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Invalid email format').trim().toLowerCase(),
  customer_phone: z.string().min(1, 'Customer phone is required'),

  // Pet fields
  pet_name: z.string().min(1, 'Pet name is required'),
  pet_breed: z.string().min(1, 'Pet breed is required'),
  pet_size: z.string().min(1, 'Pet size is required'),
  pet_weight: z.string().optional(),

  // Service fields
  service_name: z.string().min(1, 'Service name is required'),

  // Date/time fields
  date: z.string().min(1, 'Appointment date is required'),
  time: z.string().min(1, 'Appointment time is required'),

  // Optional fields
  addons: z.string().optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  payment_status: z.string().optional(),
  amount_paid: z.string().optional(),
  payment_method: z.string().optional(),
});

export type CSVAppointmentRow = z.infer<typeof CSVAppointmentRowSchema>;

/**
 * Validation warning type
 */
export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning';
}

/**
 * Parse CSV date and time into ISO timestamp
 * Supports multiple formats:
 * - Dates: YYYY-MM-DD, MM/DD/YYYY, M/D/YYYY
 * - Times: HH:MM, HH:MM AM/PM, H:MM AM/PM
 */
export function parseCSVDateTime(dateStr: string, timeStr: string): string | null {
  try {
    // Parse date
    let date: Date;
    const cleanDateStr = dateStr.trim();

    if (cleanDateStr.includes('-')) {
      // YYYY-MM-DD format
      date = new Date(cleanDateStr + 'T00:00:00');
    } else if (cleanDateStr.includes('/')) {
      // MM/DD/YYYY or M/D/YYYY format
      const parts = cleanDateStr.split('/');
      if (parts.length !== 3) return null;

      const month = parts[0].padStart(2, '0');
      const day = parts[1].padStart(2, '0');
      const year = parts[2];

      date = new Date(`${year}-${month}-${day}T00:00:00`);
    } else {
      return null;
    }

    // Validate date is valid
    if (isNaN(date.getTime())) return null;

    // Parse time
    const cleanTimeStr = timeStr.trim().toUpperCase();
    let hours: number;
    let minutes: number;

    if (cleanTimeStr.includes('AM') || cleanTimeStr.includes('PM')) {
      // 12-hour format
      const isPM = cleanTimeStr.includes('PM');
      const timePart = cleanTimeStr.replace(/\s*(AM|PM)/i, '').trim();
      const [h, m] = timePart.split(':').map(s => parseInt(s.trim(), 10));

      if (isNaN(h) || isNaN(m)) return null;

      hours = h;
      minutes = m;

      // Convert to 24-hour
      if (isPM && hours !== 12) {
        hours += 12;
      } else if (!isPM && hours === 12) {
        hours = 0;
      }
    } else {
      // 24-hour format
      const [h, m] = cleanTimeStr.split(':').map(s => parseInt(s.trim(), 10));

      if (isNaN(h) || isNaN(m)) return null;

      hours = h;
      minutes = m;
    }

    // Validate time values
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }

    // Set time on date
    date.setHours(hours, minutes, 0, 0);

    return date.toISOString();
  } catch (error) {
    return null;
  }
}

/**
 * Normalize payment status from CSV string
 * Handles case-insensitive matching and variations
 */
export function normalizePaymentStatus(status: string | undefined): PaymentStatus {
  if (!status) return 'pending';

  const normalized = status.toLowerCase().trim().replace(/[\s_-]/g, '');

  const mapping: Record<string, PaymentStatus> = {
    'pending': 'pending',
    'paid': 'paid',
    'partiallypaid': 'deposit_paid',
    'depositpaid': 'deposit_paid',
    'deposit': 'deposit_paid',
  };

  return mapping[normalized] || 'pending';
}

/**
 * Normalize pet size from CSV string
 * Handles case-insensitive matching and variations
 */
export function normalizePetSize(size: string): PetSize | null {
  const normalized = size.toLowerCase().trim().replace(/[\s_-]/g, '');

  const mapping: Record<string, PetSize> = {
    'small': 'small',
    's': 'small',
    'medium': 'medium',
    'med': 'medium',
    'm': 'medium',
    'large': 'large',
    'lge': 'large',
    'l': 'large',
    'xlarge': 'xlarge',
    'xtra large': 'xlarge',
    'extralarge': 'xlarge',
    'xl': 'xlarge',
    'xxl': 'xlarge',
  };

  return mapping[normalized] || null;
}

/**
 * Validate weight against size range
 * Returns warning (not error) if weight doesn't match size
 */
export function validateWeightForSize(
  weight: number,
  size: PetSize
): { isValid: boolean; warning?: ValidationWarning } {
  const range = SIZE_WEIGHT_RANGES[size];

  const isInRange = weight >= range.min && weight <= range.max;

  if (!isInRange) {
    const rangeStr = range.max === Infinity
      ? `${range.min}+ lbs`
      : `${range.min}-${range.max} lbs`;

    return {
      isValid: false,
      warning: {
        field: 'pet_weight',
        message: `Weight ${weight} lbs does not match ${size} size range (${rangeStr}). Admin can override.`,
        severity: 'warning',
      },
    };
  }

  return { isValid: true };
}

/**
 * Parse customer name into first and last name
 * Handles various name formats
 */
export function parseCustomerName(fullName: string): {
  first_name: string;
  last_name: string;
} {
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);

  if (parts.length === 0) {
    return { first_name: '', last_name: '' };
  }

  if (parts.length === 1) {
    return { first_name: parts[0], last_name: parts[0] };
  }

  const first_name = parts[0];
  const last_name = parts.slice(1).join(' ');

  return { first_name, last_name };
}

/**
 * Normalize payment method from CSV string
 */
export function normalizePaymentMethod(
  method: string | undefined
): 'cash' | 'card' | 'other' | undefined {
  if (!method) return undefined;

  const normalized = method.toLowerCase().trim();

  if (normalized.includes('cash')) return 'cash';
  if (normalized.includes('card') || normalized.includes('credit') || normalized.includes('debit')) {
    return 'card';
  }

  return 'other';
}

/**
 * Validate and parse amount paid
 */
export function parseAmountPaid(amountStr: string | undefined): number | null {
  if (!amountStr) return null;

  // Remove currency symbols and commas
  const cleaned = amountStr.trim().replace(/[$,]/g, '');

  const amount = parseFloat(cleaned);

  if (isNaN(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100) / 100; // Round to 2 decimal places
}

/**
 * Validate addon names from comma-separated string
 * Returns array of trimmed addon names
 */
export function parseAddons(addonsStr: string | undefined): string[] {
  if (!addonsStr) return [];

  return addonsStr
    .split(',')
    .map(addon => addon.trim())
    .filter(addon => addon.length > 0);
}

/**
 * Sanitize CSV value to prevent formula injection
 * Removes ALL leading =, @, +, - characters and prepends single quote
 */
export function sanitizeCSVValue(value: string): string {
  if (!value || typeof value !== 'string') return value;

  const trimmed = value.trim();

  // Remove ALL leading special characters used in formula injection
  const cleaned = trimmed.replace(/^[=@+\-]+/, '');

  // If we removed characters, prepend with single quote to force text interpretation
  if (cleaned !== trimmed) {
    return `'${cleaned}`;
  }

  return trimmed;
}
