/**
 * Report Card types for The Puppy Day
 * Phase 6: Report Cards & Reviews
 */

import type { BaseEntity, Appointment } from "./database";

// Import types for internal use with aliases
import type {
  ReportCardMood as ReportCardMoodType,
  CoatCondition as CoatConditionType,
  BehaviorRating as BehaviorRatingType,
  ReportCard as ReportCardEntity,
  CreateReportCardInput as CreateReportCardInputBase,
} from "./database";

// Re-export types from database.ts to avoid duplication
export type {
  ReportCardMood,
  CoatCondition,
  BehaviorRating,
  ReportCard,
  CreateReportCardInput,
} from "./database";

/**
 * Possible health observations that groomers can note
 */
export type HealthObservation =
  | "ear_infection"
  | "skin_irritation"
  | "fleas_ticks"
  | "matted_fur"
  | "overgrown_nails"
  | "dental_issues"
  | "weight_concern"
  | "mobility_issues"
  | "behavioral_concern"
  | "other";

/**
 * Form state for creating/editing report cards
 * Used in admin panel forms
 */
export interface ReportCardFormState {
  appointment_id: string;
  mood: ReportCardMoodType | null;
  coat_condition: CoatConditionType | null;
  behavior: BehaviorRatingType | null;
  health_observations: HealthObservation[];
  groomer_notes: string;
  before_photo_url: string;
  after_photo_url: string;
}

/**
 * Input for updating an existing report card
 */
export interface UpdateReportCardInput {
  mood?: ReportCardMoodType;
  coat_condition?: CoatConditionType;
  behavior?: BehaviorRatingType;
  health_observations?: string[];
  groomer_notes?: string;
  before_photo_url?: string;
  after_photo_url?: string;
}

/**
 * Public-facing report card data
 * Shown to customers via public link (excludes sensitive admin notes)
 */
export interface PublicReportCard {
  id: string;
  appointment_date: string;
  pet_name: string;
  service_name: string;
  mood: ReportCardMoodType | null;
  coat_condition: CoatConditionType | null;
  behavior: BehaviorRatingType | null;
  health_observations: string[];
  groomer_notes: string | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
  created_at: string;
}

/**
 * Report card with full appointment details
 * Used in admin panel for comprehensive view
 */
export interface ReportCardWithDetails extends ReportCardEntity {
  appointment: Appointment;
  pet_name: string;
  customer_name: string;
  service_name: string;
  groomer_name: string | null;
}
