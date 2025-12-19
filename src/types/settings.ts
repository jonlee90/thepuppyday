/**
 * Settings types for The Puppy Day
 */

import { z } from 'zod';

// ===== BUSINESS HOURS =====

/**
 * Time range for a single period (e.g., 9:00-12:00)
 */
export interface TimeRange {
  start: string; // "09:00" format (HH:mm)
  end: string; // "17:00" format (HH:mm)
}

export const TimeRangeSchema = z.object({
  start: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  end: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
});

/**
 * Hours configuration for a single day
 * Supports multiple time ranges for split shifts/lunch breaks
 */
export interface DayHours {
  isOpen: boolean;
  ranges: TimeRange[]; // Can have 1-3 ranges per day
}

export const DayHoursSchema = z.object({
  isOpen: z.boolean(),
  ranges: z.array(TimeRangeSchema).min(0).max(3),
});

/**
 * Complete weekly business hours
 */
export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export const BusinessHoursSchema = z.object({
  monday: DayHoursSchema,
  tuesday: DayHoursSchema,
  wednesday: DayHoursSchema,
  thursday: DayHoursSchema,
  friday: DayHoursSchema,
  saturday: DayHoursSchema,
  sunday: DayHoursSchema,
});

/**
 * @deprecated Legacy format - use DayHours instead
 */
export interface DaySchedule {
  is_open: boolean;
  open: string;
  close: string;
}

// ===== PHASE 6 SETTINGS =====

// Report Card Settings
export interface ReportCardSettings {
  auto_send_delay_minutes: number;
  expiration_days: number;
  google_review_url: string;
}

// Waitlist Settings
export interface WaitlistSettings {
  response_window_hours: number;
  default_discount_percent: number;
}

// Marketing Settings
export interface MarketingSettings {
  retention_reminder_advance_days: number;
}

// Combined Phase 6 Settings
export interface Phase6Settings {
  report_card: ReportCardSettings;
  waitlist: WaitlistSettings;
  marketing: MarketingSettings;
}

// Default Phase 6 Settings
export const DEFAULT_PHASE6_SETTINGS: Phase6Settings = {
  report_card: {
    auto_send_delay_minutes: 15,
    expiration_days: 90,
    google_review_url: 'https://www.google.com/maps/place/Puppy+Day/@33.9176,-118.0086,17z',
  },
  waitlist: {
    response_window_hours: 2,
    default_discount_percent: 10,
  },
  marketing: {
    retention_reminder_advance_days: 7,
  },
};

// ===== NOTIFICATION TEMPLATES =====

export type NotificationTemplateType =
  | 'report_card'
  | 'waitlist_offer'
  | 'breed_reminder'
  | 'appointment_confirmation'
  | 'appointment_reminder';

export interface NotificationTemplate {
  type: NotificationTemplateType;
  name: string;
  description: string;
  sms_content: string;
  email_subject: string;
  email_body: string;
  available_variables: string[];
}

export interface NotificationTemplates {
  report_card: NotificationTemplate;
  waitlist_offer: NotificationTemplate;
  breed_reminder: NotificationTemplate;
  appointment_confirmation: NotificationTemplate;
  appointment_reminder: NotificationTemplate;
}

// Default Templates with proper variable placeholders
export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplates = {
  report_card: {
    type: 'report_card',
    name: 'Report Card Notification',
    description: 'Sent when a grooming report card is ready',
    sms_content:
      'Hi {customer_name}! {pet_name}\'s grooming report card is ready! View it here: {report_card_url} - Puppy Day',
    email_subject: '{pet_name}\'s Grooming Report Card from Puppy Day',
    email_body: `Hi {customer_name},

{pet_name} had a great grooming session today! We've prepared a detailed report card with photos and notes.

View the full report card: {report_card_url}

We'd love to hear about your experience! Please share your feedback:
{review_url}

Thank you for trusting us with {pet_name}!

Best,
The Puppy Day Team
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903`,
    available_variables: [
      '{customer_name}',
      '{pet_name}',
      '{report_card_url}',
      '{review_url}',
      '{groomer_name}',
      '{date}',
    ],
  },

  waitlist_offer: {
    type: 'waitlist_offer',
    name: 'Waitlist Offer',
    description: 'Sent when a time slot becomes available for waitlisted customer',
    sms_content:
      'Good news {customer_name}! A slot opened for {date} at {time}. Book now with {discount}% off: {booking_url} (Expires in {expiry_hours}h) - Puppy Day',
    email_subject: 'Good News! Time Slot Available for {pet_name} - {discount}% Off',
    email_body: `Hi {customer_name},

Great news! A grooming appointment slot has opened up for {pet_name}.

Date: {date}
Time: {time}
Special Waitlist Discount: {discount}% off

Click here to claim your spot: {booking_url}

This offer expires in {expiry_hours} hours, so book soon!

We look forward to pampering {pet_name}!

Best,
The Puppy Day Team
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903`,
    available_variables: [
      '{customer_name}',
      '{pet_name}',
      '{date}',
      '{time}',
      '{discount}',
      '{booking_url}',
      '{expiry_hours}',
    ],
  },

  breed_reminder: {
    type: 'breed_reminder',
    name: 'Breed-Based Grooming Reminder',
    description: 'Sent based on breed grooming frequency recommendations',
    sms_content:
      'Hi {customer_name}! It\'s been {weeks_since} weeks since {pet_name}\'s last groom. Time to book? {booking_url} - Puppy Day',
    email_subject: 'Time for {pet_name}\'s Grooming Appointment',
    email_body: `Hi {customer_name},

We hope {pet_name} is doing great!

It's been {weeks_since} weeks since their last grooming appointment. For {breed_name} breeds, we recommend grooming every {recommended_frequency} weeks to keep their coat healthy and beautiful.

Ready to schedule? Book online: {booking_url}

Or give us a call: (657) 252-2903

We can't wait to see {pet_name} again!

Best,
The Puppy Day Team
14936 Leffingwell Rd, La Mirada, CA 90638`,
    available_variables: [
      '{customer_name}',
      '{pet_name}',
      '{breed_name}',
      '{weeks_since}',
      '{recommended_frequency}',
      '{booking_url}',
      '{last_appointment_date}',
    ],
  },

  appointment_confirmation: {
    type: 'appointment_confirmation',
    name: 'Appointment Confirmation',
    description: 'Sent immediately after booking confirmation',
    sms_content:
      'Hi {customer_name}! {pet_name}\'s grooming is confirmed for {date} at {time}. See you soon! - Puppy Day',
    email_subject: 'Appointment Confirmed for {pet_name} - {date}',
    email_body: `Hi {customer_name},

Your grooming appointment has been confirmed!

Pet: {pet_name}
Service: {service_name}
Date: {date}
Time: {time}
Total: {total}

Location:
Puppy Day
14936 Leffingwell Rd
La Mirada, CA 90638

Need to make changes? Contact us at (657) 252-2903 or reply to this email.

We look forward to pampering {pet_name}!

Best,
The Puppy Day Team`,
    available_variables: [
      '{customer_name}',
      '{pet_name}',
      '{service_name}',
      '{date}',
      '{time}',
      '{total}',
      '{addons}',
      '{special_requests}',
    ],
  },

  appointment_reminder: {
    type: 'appointment_reminder',
    name: 'Appointment Reminder',
    description: 'Sent 24 hours before appointment',
    sms_content:
      'Reminder: {pet_name}\'s grooming appointment is tomorrow at {time}. See you then! - Puppy Day',
    email_subject: 'Reminder: {pet_name}\'s Appointment Tomorrow at {time}',
    email_body: `Hi {customer_name},

This is a friendly reminder about {pet_name}'s grooming appointment tomorrow.

Date: {date}
Time: {time}
Service: {service_name}

Please arrive a few minutes early. If you need to cancel or reschedule, please contact us at least 24 hours in advance.

Location:
Puppy Day
14936 Leffingwell Rd
La Mirada, CA 90638
(657) 252-2903

See you soon!

Best,
The Puppy Day Team`,
    available_variables: [
      '{customer_name}',
      '{pet_name}',
      '{service_name}',
      '{date}',
      '{time}',
      '{groomer_name}',
      '{special_requests}',
    ],
  },
};

// ===== API TYPES =====

export interface UpdatePhase6SettingsRequest {
  report_card?: Partial<ReportCardSettings>;
  waitlist?: Partial<WaitlistSettings>;
  marketing?: Partial<MarketingSettings>;
}

export interface UpdateTemplatesRequest {
  templates: Partial<NotificationTemplates>;
}

export interface ResetTemplatesRequest {
  types?: NotificationTemplateType[];
}

// =============================================
// PHASE 9: ADMIN SETTINGS & CONTENT MANAGEMENT
// =============================================

// ===== BOOKING SETTINGS =====

/**
 * Blocked date entry for calendar
 */
export interface BlockedDate {
  date: string; // ISO date string
  end_date?: string | null; // For multi-day blocks
  reason: string;
}

export const BlockedDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  reason: z.string().min(1).max(200),
});

/**
 * Booking window and policy settings
 */
export interface BookingSettings {
  min_advance_hours: number; // Minimum hours in advance for booking
  max_advance_days: number; // Maximum days in advance for booking
  cancellation_cutoff_hours: number; // Hours before appointment when cancellation is allowed
  buffer_minutes: number; // Buffer time between appointments
  blocked_dates: BlockedDate[]; // Specific blocked dates
  recurring_blocked_days: number[]; // Day of week (0=Sun, 6=Sat)
  business_hours?: BusinessHours; // Weekly business hours (optional for backward compatibility)
}

export const BookingSettingsSchema = z.object({
  min_advance_hours: z.number().int().min(0).max(168),
  max_advance_days: z.number().int().min(1).max(365),
  cancellation_cutoff_hours: z.number().int().min(0).max(168),
  buffer_minutes: z.number().int().min(0).max(120),
  blocked_dates: z.array(BlockedDateSchema),
  recurring_blocked_days: z.array(z.number().int().min(0).max(6)),
  business_hours: BusinessHoursSchema.optional(),
});

// ===== SITE CONTENT =====

/**
 * CTA button for hero section
 */
export interface CtaButton {
  text: string;
  url: string;
  style: 'primary' | 'secondary';
}

export const CtaButtonSchema = z.object({
  text: z.string().min(1).max(50),
  url: z.string().min(1).max(200),
  style: z.enum(['primary', 'secondary']),
});

/**
 * Hero section content
 */
export interface HeroContent {
  headline: string;
  subheadline: string;
  background_image_url: string | null;
  cta_buttons: CtaButton[];
}

export const HeroContentSchema = z.object({
  headline: z.string().min(1).max(100),
  subheadline: z.string().min(1).max(200),
  background_image_url: z.string().url().nullable(),
  cta_buttons: z.array(CtaButtonSchema).max(3),
});

/**
 * SEO and Open Graph settings
 */
export interface SeoSettings {
  page_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  og_image_url: string | null;
}

export const SeoSettingsSchema = z.object({
  page_title: z.string().min(1).max(60),
  meta_description: z.string().min(1).max(160),
  og_title: z.string().min(1).max(60),
  og_description: z.string().min(1).max(160),
  og_image_url: z.string().url().nullable(),
});

/**
 * Social media links
 */
export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  yelp?: string;
  twitter?: string;
}

export const SocialLinksSchema = z.object({
  instagram: z.string().url().optional(),
  facebook: z.string().url().optional(),
  yelp: z.string().url().optional(),
  twitter: z.string().url().optional(),
});

/**
 * Business contact information
 */
export interface BusinessInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  social_links: SocialLinks;
}

export const BusinessInfoSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().length(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/),
  email: z.string().email(),
  social_links: SocialLinksSchema,
});

// ===== LOYALTY PROGRAM =====

/**
 * Loyalty earning rules
 */
export interface LoyaltyEarningRules {
  qualifying_services: string[]; // Service IDs or ['all']
  minimum_spend: number; // Minimum spend to earn punch
  first_visit_bonus: number; // Bonus punches for first visit
}

export const LoyaltyEarningRulesSchema = z.object({
  qualifying_services: z.array(z.string()),
  minimum_spend: z.number().min(0),
  first_visit_bonus: z.number().int().min(0).max(10),
});

/**
 * Loyalty redemption rules
 */
export interface LoyaltyRedemptionRules {
  eligible_services: string[]; // Service IDs or ['all']
  expiration_days: number; // Days until earned punches expire
  max_value: number | null; // Maximum discount value or null for no limit
}

export const LoyaltyRedemptionRulesSchema = z.object({
  eligible_services: z.array(z.string().uuid()).min(1),
  expiration_days: z.number().int().min(0).max(3650),
  max_value: z.number().min(0).nullable(),
});

/**
 * Referral program configuration
 */
export interface ReferralProgram {
  is_enabled: boolean;
  referrer_bonus_punches: number; // Punches for referrer
  referee_bonus_punches: number; // Punches for new customer
}

export const ReferralProgramSchema = z.object({
  is_enabled: z.boolean(),
  referrer_bonus_punches: z.number().int().min(0).max(10),
  referee_bonus_punches: z.number().int().min(0).max(10),
});

// ===== STAFF MANAGEMENT =====

/**
 * Staff commission structure
 */
export interface StaffCommission {
  id: string;
  groomer_id: string;
  rate_type: 'percentage' | 'flat_rate';
  rate: number; // Percentage (0-100) or dollar amount
  include_addons: boolean;
  service_overrides: Record<string, { rate_type: string; rate: number }> | null;
  created_at: string;
  updated_at: string;
}

export const StaffCommissionSchema = z.object({
  groomer_id: z.string().uuid(),
  rate_type: z.enum(['percentage', 'flat_rate']),
  rate: z.number().min(0).max(100),
  include_addons: z.boolean(),
  service_overrides: z.record(z.object({
    rate_type: z.enum(['percentage', 'flat_rate']),
    rate: z.number().min(0).max(100),
  })).nullable(),
});

// ===== REFERRAL SYSTEM =====

/**
 * Customer referral code
 */
export interface ReferralCode {
  id: string;
  customer_id: string;
  code: string;
  uses_count: number;
  max_uses: number | null; // null = unlimited
  is_active: boolean;
  created_at: string;
}

export const ReferralCodeSchema = z.object({
  customer_id: z.string().uuid(),
  code: z.string().min(4).max(20).regex(/^[A-Z0-9]+$/),
  max_uses: z.number().int().min(1).nullable(),
  is_active: z.boolean(),
});

/**
 * Referral relationship
 */
export interface Referral {
  id: string;
  referrer_id: string; // Customer who referred
  referee_id: string; // Customer who was referred
  referral_code_id: string;
  status: 'pending' | 'completed' | 'cancelled';
  referrer_bonus_awarded: boolean;
  referee_bonus_awarded: boolean;
  completed_at: string | null;
  created_at: string;
}

export const ReferralSchema = z.object({
  referrer_id: z.string().uuid(),
  referee_id: z.string().uuid(),
  referral_code_id: z.string().uuid(),
  status: z.enum(['pending', 'completed', 'cancelled']),
});

// ===== AUDIT LOG =====

/**
 * Settings change audit entry
 */
export interface SettingsAuditLog {
  id: string;
  admin_id: string | null;
  setting_type: 'booking' | 'loyalty' | 'site_content' | 'banner' | 'staff' | 'referral' | 'notification' | 'other';
  setting_key: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export const SettingsAuditLogSchema = z.object({
  admin_id: z.string().uuid().nullable(),
  setting_type: z.enum(['booking', 'loyalty', 'site_content', 'banner', 'staff', 'referral', 'notification', 'other']),
  setting_key: z.string().min(1).max(100),
  old_value: z.record(z.unknown()).nullable(),
  new_value: z.record(z.unknown()).nullable(),
});

// ===== SETTINGS DASHBOARD =====

/**
 * Settings card status indicator
 */
export type SettingsStatus = 'configured' | 'needs_attention' | 'not_configured';

/**
 * Settings section summary for dashboard
 */
export interface SettingsSectionSummary {
  section: string;
  title: string;
  description: string;
  icon: string;
  status: SettingsStatus;
  summary: string; // Quick summary text
  last_updated: string | null;
  url: string;
}

// ===== PROMO BANNER (extended) =====

/**
 * Promo banner analytics
 */
export interface BannerAnalytics {
  banner_id: string;
  impression_count: number;
  click_count: number;
  click_through_rate: number; // Percentage
  date_range: {
    start: string;
    end: string;
  };
}

// ===== HELPER TYPES =====

/**
 * Generic settings update request
 */
export interface SettingsUpdateRequest<T> {
  settings: T;
  audit_reason?: string;
}

/**
 * Settings response with metadata
 */
export interface SettingsResponse<T> {
  settings: T;
  last_updated: string;
  updated_by: string | null;
}

// ===== TYPE GUARDS =====

export function isBookingSettings(value: unknown): value is BookingSettings {
  const result = BookingSettingsSchema.safeParse(value);
  return result.success;
}

export function isHeroContent(value: unknown): value is HeroContent {
  const result = HeroContentSchema.safeParse(value);
  return result.success;
}

export function isSeoSettings(value: unknown): value is SeoSettings {
  const result = SeoSettingsSchema.safeParse(value);
  return result.success;
}

export function isBusinessInfo(value: unknown): value is BusinessInfo {
  const result = BusinessInfoSchema.safeParse(value);
  return result.success;
}
