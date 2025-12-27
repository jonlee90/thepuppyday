/**
 * Admin Panel Validation Schemas
 * Task 0239: Add Zod validation to admin API routes
 */

import { z } from 'zod';
import {
  emailSchema,
  phoneSchema,
  uuidSchema,
  moneySchema,
  notificationTypeSchema,
  notificationChannelSchema,
  petSizeSchema,
  positiveIntSchema,
} from './index';

// ============================================================================
// Service Management
// ============================================================================

export const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(100),
  description: z.string().max(1000).optional(),
  duration_minutes: z.number().int().positive().max(480), // Max 8 hours
  base_price_small: moneySchema,
  base_price_medium: moneySchema,
  base_price_large: moneySchema,
  base_price_xlarge: moneySchema,
  is_active: z.boolean().default(true),
  display_order: z.number().int().nonnegative().optional(),
}).refine(
  (data) =>
    data.base_price_small <= data.base_price_medium &&
    data.base_price_medium <= data.base_price_large &&
    data.base_price_large <= data.base_price_xlarge,
  {
    message: 'Prices must increase with pet size',
    path: ['base_price_xlarge'],
  }
);

export type CreateService = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = createServiceSchema.partial();

// ============================================================================
// Addon Management
// ============================================================================

export const createAddonSchema = z.object({
  name: z.string().min(1, 'Addon name is required').max(100),
  description: z.string().max(500).optional(),
  price: moneySchema.max(50000), // Max $500
  is_size_dependent: z.boolean().default(false),
  price_small: moneySchema.optional(),
  price_medium: moneySchema.optional(),
  price_large: moneySchema.optional(),
  price_xlarge: moneySchema.optional(),
  is_active: z.boolean().default(true),
  display_order: z.number().int().nonnegative().optional(),
});

export type CreateAddon = z.infer<typeof createAddonSchema>;

export const updateAddonSchema = createAddonSchema.partial();

// ============================================================================
// Notification Template
// ============================================================================

export const createTemplateSchema = z.object({
  type: notificationTypeSchema,
  channel: notificationChannelSchema,
  subject: z.string().max(200).optional(), // Email only
  body: z.string().min(1, 'Template body is required').max(2000),
  variables: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
});

export type CreateTemplate = z.infer<typeof createTemplateSchema>;

export const updateTemplateSchema = createTemplateSchema.partial();

// ============================================================================
// Admin Settings
// ============================================================================

export const businessHoursSchema = z.object({
  day: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
  open_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  close_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  is_closed: z.boolean().default(false),
}).refine(
  (data) => data.is_closed || data.open_time < data.close_time,
  {
    message: 'Close time must be after open time',
    path: ['close_time'],
  }
);

export const updateSettingsSchema = z.object({
  // Booking settings
  booking_window_days: z.number().int().positive().max(365).optional(),
  cancellation_window_hours: z.number().int().positive().max(168).optional(),
  slot_duration_minutes: z.number().int().positive().max(240).optional(),
  max_daily_appointments: z.number().int().positive().max(100).optional(),
  require_deposit: z.boolean().optional(),
  deposit_percentage: z.number().min(0).max(100).optional(),

  // Loyalty settings
  loyalty_enabled: z.boolean().optional(),
  loyalty_points_per_dollar: z.number().nonnegative().optional(),
  loyalty_redemption_rate: z.number().positive().optional(),

  // Business info
  business_name: z.string().max(100).optional(),
  business_email: emailSchema.optional(),
  business_phone: phoneSchema,
  business_address: z.string().max(200).optional(),

  // Social media
  instagram_handle: z.string().max(50).optional(),
  facebook_url: z.string().url().optional(),
  yelp_url: z.string().url().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one setting must be provided'
);

export type UpdateSettings = z.infer<typeof updateSettingsSchema>;

// ============================================================================
// Banner Management
// ============================================================================

export const createBannerSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  type: z.enum(['info', 'warning', 'success', 'promo']),
  is_active: z.boolean().default(true),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  display_order: z.number().int().nonnegative().optional(),
}).refine(
  (data) => !data.start_date || !data.end_date || data.start_date < data.end_date,
  {
    message: 'End date must be after start date',
    path: ['end_date'],
  }
);

export type CreateBanner = z.infer<typeof createBannerSchema>;

export const updateBannerSchema = createBannerSchema.partial();

// ============================================================================
// Report Card Creation
// ============================================================================

export const createReportCardSchema = z.object({
  appointment_id: uuidSchema,
  mood: z.enum(['happy', 'calm', 'nervous', 'energetic']),
  coat_condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  behavior: z.enum(['excellent', 'good', 'fair', 'challenging']),
  groomer_notes: z.string().max(1000).optional(),
  health_observations: z.string().max(500).optional(),
  before_photo_url: z.string().url(),
  after_photo_url: z.string().url(),
});

export type CreateReportCard = z.infer<typeof createReportCardSchema>;

// ============================================================================
// Customer Search
// ============================================================================

export const customerSearchSchema = z.object({
  query: z.string().min(1).max(200),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  role: z.enum(['customer', 'groomer', 'admin']).optional(),
  is_active: z.coerce.boolean().optional(),
});

export type CustomerSearch = z.infer<typeof customerSearchSchema>;

// ============================================================================
// Staff Management
// ============================================================================

export const createStaffSchema = z.object({
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  email: emailSchema,
  phone: phoneSchema,
  role: z.enum(['groomer', 'admin']),
  is_active: z.boolean().default(true),
});

export type CreateStaff = z.infer<typeof createStaffSchema>;

export const updateStaffSchema = createStaffSchema.partial();
