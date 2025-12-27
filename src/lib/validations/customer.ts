/**
 * Customer Portal Validation Schemas
 * Task 0238: Add Zod validation to customer API routes
 */

import { z } from 'zod';
import { emailSchema, phoneSchema, uuidSchema } from './index';

// ============================================================================
// Profile Update
// ============================================================================

export const profileUpdateSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  phone: phoneSchema,
  avatar_url: z.string().url().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided'
);

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

// ============================================================================
// Pet Create/Update
// ============================================================================

export const createPetSchema = z.object({
  name: z.string().min(1, 'Pet name is required').max(50),
  breed_id: uuidSchema.optional(),
  breed_custom: z.string().max(100).optional(),
  size: z.enum(['small', 'medium', 'large', 'xlarge']),
  weight: z.number().positive().max(200).optional(),
  birth_date: z.string().optional(),
  medical_info: z.string().max(1000).optional(),
  notes: z.string().max(500).optional(),
  photo_url: z.string().url().optional(),
}).refine(
  (data) => data.breed_id || data.breed_custom,
  {
    message: 'Either select a breed or enter a custom breed',
    path: ['breed_id'],
  }
);

export type CreatePet = z.infer<typeof createPetSchema>;

export const updatePetSchema = createPetSchema.partial();

export type UpdatePet = z.infer<typeof updatePetSchema>;

// ============================================================================
// Notification Preferences
// ============================================================================

export const notificationPreferencesSchema = z.object({
  marketing_enabled: z.boolean(),
  email_appointment_reminders: z.boolean(),
  sms_appointment_reminders: z.boolean(),
  email_retention_reminders: z.boolean(),
  sms_retention_reminders: z.boolean(),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

// ============================================================================
// Password Change
// ============================================================================

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and a number'
    ),
  confirm_password: z.string(),
}).refine(
  (data) => data.new_password === data.confirm_password,
  {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  }
);

export type ChangePassword = z.infer<typeof changePasswordSchema>;

// ============================================================================
// Appointment Cancellation
// ============================================================================

export const cancelAppointmentSchema = z.object({
  reason: z.enum([
    'schedule_conflict',
    'pet_sick',
    'emergency',
    'no_longer_needed',
    'other',
  ]),
  notes: z.string().max(500).optional(),
});

export type CancelAppointment = z.infer<typeof cancelAppointmentSchema>;
