/**
 * Booking Validation Schemas
 * Task 0238: Add Zod validation to booking API routes
 */

import { z } from 'zod';
import {
  emailSchema,
  phoneSchema,
  uuidSchema,
  futureDateSchema,
  timeSchema,
  petSizeSchema,
} from './common';

// ============================================================================
// Pet Information
// ============================================================================

export const petInfoSchema = z.object({
  name: z.string().min(1, 'Pet name is required').max(50, 'Pet name is too long'),
  breed_id: z.string().uuid().optional(),
  breed_custom: z.string().max(100).optional(),
  size: petSizeSchema,
  weight: z.number().positive().max(200).optional(),
  birth_date: z.string().optional(),
  medical_info: z.string().max(1000).optional(),
  notes: z.string().max(500).optional(),
});

export type PetInfo = z.infer<typeof petInfoSchema>;

// ============================================================================
// Contact Information
// ============================================================================

export const contactInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: emailSchema,
  phone: phoneSchema,
});

export type ContactInfo = z.infer<typeof contactInfoSchema>;

// ============================================================================
// Service Selection
// ============================================================================

export const serviceSelectionSchema = z.object({
  service_id: uuidSchema,
  addon_ids: z.array(uuidSchema).default([]),
});

export type ServiceSelection = z.infer<typeof serviceSelectionSchema>;

// ============================================================================
// Booking Request
// ============================================================================

export const bookingRequestSchema = z.object({
  // Service & Time
  service_id: uuidSchema,
  addon_ids: z.array(uuidSchema).default([]),
  scheduled_at: z.string().datetime('Invalid date/time format'),

  // Pet
  pet_id: uuidSchema.optional(),
  pet_info: petInfoSchema.optional(),

  // Customer (for guest bookings)
  customer_id: uuidSchema.optional(),
  contact_info: contactInfoSchema.optional(),

  // Additional
  special_instructions: z.string().max(500).optional(),
  booking_reference: z.string().optional(),
}).refine(
  (data) => data.pet_id || data.pet_info,
  {
    message: 'Either pet_id or pet_info must be provided',
    path: ['pet_id'],
  }
).refine(
  (data) => data.customer_id || data.contact_info,
  {
    message: 'Either customer_id or contact_info must be provided',
    path: ['customer_id'],
  }
);

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

// ============================================================================
// Availability Query
// ============================================================================

export const availabilityQuerySchema = z.object({
  date: futureDateSchema,
  service_id: uuidSchema,
  duration_minutes: z.number().int().positive().optional(),
});

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

// ============================================================================
// Appointment Update
// ============================================================================

export const appointmentUpdateSchema = z.object({
  scheduled_at: z.string().datetime().optional(),
  status: z.enum(['confirmed', 'cancelled', 'no_show']).optional(),
  special_instructions: z.string().max(500).optional(),
  admin_notes: z.string().max(1000).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided'
);

export type AppointmentUpdate = z.infer<typeof appointmentUpdateSchema>;

// ============================================================================
// Waitlist Request
// ============================================================================

export const waitlistRequestSchema = z.object({
  customer_id: uuidSchema,
  service_id: uuidSchema,
  pet_id: uuidSchema,
  preferred_date: futureDateSchema,
  preferred_time: timeSchema.optional(),
  flexibility: z.enum(['same_day', 'same_week', 'any']).default('same_day'),
  notes: z.string().max(500).optional(),
});

export type WaitlistRequest = z.infer<typeof waitlistRequestSchema>;
