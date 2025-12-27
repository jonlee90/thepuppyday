/**
 * Common Validation Schemas
 * Task 0237: Create centralized Zod validation schemas
 *
 * Base validation patterns used across the application.
 * This file has no internal dependencies to avoid circular imports.
 */

import { z } from 'zod';

// ============================================================================
// Basic Types
// ============================================================================

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .toLowerCase();

export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || /^\+?[1-9]\d{9,14}$/.test(val.replace(/[\s-()]/g, '')),
    'Please enter a valid phone number'
  );

export const uuidSchema = z.string().uuid('Invalid ID format');

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const futureDateSchema = dateSchema.refine(
  (date) => {
    const today = new Date().toISOString().split('T')[0];
    return date >= today;
  },
  'Date cannot be in the past'
);

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:MM format');

export const urlSchema = z.string().url('Please enter a valid URL');

export const positiveIntSchema = z
  .number()
  .int('Must be a whole number')
  .positive('Must be greater than zero');

export const nonNegativeIntSchema = z
  .number()
  .int('Must be a whole number')
  .nonnegative('Must be zero or greater');

// ============================================================================
// Pagination & Search
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

export const searchSchema = z.object({
  query: z.string().min(1).max(200),
  ...paginationSchema.shape,
});

export type SearchParams = z.infer<typeof searchSchema>;

// ============================================================================
// Date Range
// ============================================================================

export const dateRangeSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  'End date must be after start date'
);

export type DateRange = z.infer<typeof dateRangeSchema>;

// ============================================================================
// Pet Size
// ============================================================================

export const petSizeSchema = z.enum(['small', 'medium', 'large', 'xlarge'], {
  errorMap: () => ({ message: 'Please select a valid pet size' }),
});

export type PetSize = z.infer<typeof petSizeSchema>;

// ============================================================================
// User Role
// ============================================================================

export const userRoleSchema = z.enum(['customer', 'groomer', 'admin'], {
  errorMap: () => ({ message: 'Invalid user role' }),
});

export type UserRole = z.infer<typeof userRoleSchema>;

// ============================================================================
// Appointment Status
// ============================================================================

export const appointmentStatusSchema = z.enum([
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
], {
  errorMap: () => ({ message: 'Invalid appointment status' }),
});

export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;

// ============================================================================
// Payment Status
// ============================================================================

export const paymentStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
], {
  errorMap: () => ({ message: 'Invalid payment status' }),
});

export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

// ============================================================================
// File Upload
// ============================================================================

export const imageFileSchema = z.object({
  name: z.string(),
  size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
  type: z.enum(['image/jpeg', 'image/png', 'image/webp'], {
    errorMap: () => ({ message: 'File must be JPG, PNG, or WebP' }),
  }),
});

export type ImageFile = z.infer<typeof imageFileSchema>;

// ============================================================================
// Money (in cents)
// ============================================================================

export const moneySchema = z
  .number()
  .int('Amount must be a whole number')
  .nonnegative('Amount cannot be negative');

// ============================================================================
// Notification Type
// ============================================================================

export const notificationTypeSchema = z.enum([
  'booking_confirmation',
  'booking_cancellation',
  'appointment_reminder',
  'status_update',
  'report_card_ready',
  'waitlist_available',
  'retention_reminder',
  'promotional',
  'newsletter',
], {
  errorMap: () => ({ message: 'Invalid notification type' }),
});

export type NotificationType = z.infer<typeof notificationTypeSchema>;

// ============================================================================
// Notification Channel
// ============================================================================

export const notificationChannelSchema = z.enum(['email', 'sms'], {
  errorMap: () => ({ message: 'Invalid notification channel' }),
});

export type NotificationChannel = z.infer<typeof notificationChannelSchema>;
