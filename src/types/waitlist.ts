/**
 * Waitlist types for The Puppy Day
 * Phase 6: Enhanced Waitlist Management with Automated Slot Offering
 */

import type {
  BaseEntity,
  User,
  Pet,
  Service,
  WaitlistSlotOffer,
} from "./database";

// Import types for internal use with aliases
import type {
  WaitlistStatus as WaitlistStatusType,
  TimePreference as TimePreferenceType,
  SlotOfferStatus as SlotOfferStatusType,
} from "./database";

// Re-export types from database.ts to avoid duplication
export type {
  WaitlistStatus,
  TimePreference,
  WaitlistSlotOffer,
  SlotOfferStatus,
} from "./database";

/**
 * Waitlist slot offer status (legacy type alias)
 * @deprecated Use SlotOfferStatus from database.ts instead
 */
export type WaitlistSlotOfferStatus = SlotOfferStatusType;

/**
 * Priority level for waitlist entries
 */
export type WaitlistPriority = "low" | "normal" | "high" | "urgent";

/**
 * Enhanced waitlist entry
 * Extends base waitlist with additional fields for Phase 6
 */
export interface EnhancedWaitlistEntry extends BaseEntity {
  customer_id: string;
  pet_id: string;
  service_id: string;
  requested_date: string;
  time_preference: TimePreferenceType;
  status: WaitlistStatusType;
  priority: WaitlistPriority;
  notes: string | null;
  notified_at: string | null;
  offer_expires_at: string | null;
  updated_at: string;
  // Joined data
  customer?: User;
  pet?: Pet;
  service?: Service;
  offers?: WaitlistSlotOffer[];
}

/**
 * Waitlist match result
 * Used by matching algorithm to find suitable slots
 */
export interface WaitlistMatch {
  waitlist_entry_id: string;
  customer_id: string;
  customer_name: string;
  pet_name: string;
  service_name: string;
  requested_date: string;
  time_preference: TimePreferenceType;
  priority: WaitlistPriority;
  match_score: number; // 0-100, higher is better match
  available_slots: Array<{
    start: string;
    end: string;
  }>;
}

/**
 * Request to fill a cancelled/available slot
 */
export interface FillSlotRequest {
  cancelled_appointment_id?: string;
  slot_start: string;
  slot_end: string;
  service_id: string;
  auto_notify?: boolean; // Automatically notify best match
}

/**
 * Slot fill result
 */
export interface SlotFillResult {
  matches_found: number;
  offers_sent: number;
  waitlist_matches: WaitlistMatch[];
}

/**
 * Input for creating waitlist entry
 */
export interface CreateWaitlistEntryInput {
  customer_id: string;
  pet_id: string;
  service_id: string;
  requested_date: string;
  time_preference: TimePreferenceType;
  priority?: WaitlistPriority;
  notes?: string;
}

/**
 * Input for updating waitlist entry
 */
export interface UpdateWaitlistEntryInput {
  requested_date?: string;
  time_preference?: TimePreferenceType;
  priority?: WaitlistPriority;
  status?: WaitlistStatusType;
  notes?: string;
}

/**
 * Waitlist analytics
 */
export interface WaitlistAnalytics {
  total_active: number;
  total_pending_offers: number;
  avg_wait_time_days: number;
  conversion_rate: number; // % that book vs cancel
  offer_acceptance_rate: number;
  most_requested_dates: Array<{
    date: string;
    count: number;
  }>;
  most_requested_services: Array<{
    service_id: string;
    service_name: string;
    count: number;
  }>;
}

/**
 * Waitlist entry with full details
 * Used in admin panel views
 */
export interface WaitlistEntryWithDetails extends EnhancedWaitlistEntry {
  customer: User;
  pet: Pet;
  service: Service;
  latest_offer?: WaitlistSlotOffer;
}

/**
 * Waitlist notification preferences
 */
export interface WaitlistNotificationConfig {
  send_email: boolean;
  send_sms: boolean;
  offer_expiration_hours: number; // Default: 24
  reminder_hours_before_expiration: number; // Default: 6
}
