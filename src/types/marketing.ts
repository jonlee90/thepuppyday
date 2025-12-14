/**
 * Marketing Campaign types for The Puppy Day
 * Phase 6: Marketing & Customer Segmentation
 */

import type { BaseEntity, User } from "./database";

/**
 * Campaign type
 */
export type CampaignType = "one_time" | "recurring";

/**
 * Campaign status workflow
 */
export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "cancelled";

/**
 * Communication channel for campaign
 */
export type CampaignChannel = "email" | "sms" | "both";

/**
 * Customer segment criteria for filtering
 * Stored as JSONB in database
 */
export interface SegmentCriteria {
  /** Filter by last visit within X days */
  last_visit_days?: number;
  /** Filter by total visits count */
  min_visits?: number;
  max_visits?: number;
  /** Filter by membership status */
  has_membership?: boolean;
  /** Filter by loyalty status */
  loyalty_eligible?: boolean;
  /** Filter by specific pet size */
  pet_size?: string[];
  /** Filter by specific service history */
  service_ids?: string[];
  /** Filter by specific breed */
  breed_ids?: string[];
  /** Filter by appointment count */
  min_appointments?: number;
  max_appointments?: number;
  /** Filter by total spend */
  min_total_spend?: number;
  /** Filter by customers who haven't visited since date */
  not_visited_since?: string;
  /** Filter by customers with upcoming appointments */
  has_upcoming_appointment?: boolean;
  /** Custom tags */
  tags?: string[];
}

/**
 * Message content structure
 * Supports both SMS and email templates
 */
export interface MessageContent {
  sms_body?: string;
  email_subject?: string;
  email_body?: string;
  email_html?: string;
}

/**
 * A/B test configuration for campaign optimization
 */
export interface ABTestConfig {
  enabled: boolean;
  variant_a: MessageContent;
  variant_b: MessageContent;
  split_percentage: number; // 0-100, percentage for variant_a
}

/**
 * Marketing campaign entity
 */
export interface MarketingCampaign extends BaseEntity {
  name: string;
  description: string | null;
  type: CampaignType;
  status: CampaignStatus;
  channel: CampaignChannel;
  segment_criteria: SegmentCriteria;
  message_content: MessageContent;
  ab_test_config: ABTestConfig | null;
  scheduled_at: string | null;
  sent_at: string | null;
  created_by: string;
  updated_at: string;
  // Joined data
  created_by_user?: User;
  sends?: CampaignSend[];
}

/**
 * Individual campaign send record
 * Tracks each message sent to a customer
 */
export interface CampaignSend extends BaseEntity {
  campaign_id: string | null; // Nullable for non-campaign sends (e.g., breed reminders)
  customer_id: string;
  notification_log_id: string | null;
  variant: string | null; // 'A' or 'B' for A/B tests, NULL otherwise
  sent_at: string | null;
  delivered_at: string | null;
  clicked_at: string | null;
  booking_id: string | null; // Track conversion to appointment
  pet_id: string | null; // Track which pet the reminder was for
  tracking_id: string | null; // Unique tracking ID for click tracking
  attempt_count: number; // Track how many times we've sent this reminder
  // Joined data
  campaign?: MarketingCampaign;
  customer?: User;
}

/**
 * Marketing unsubscribe record
 */
export interface MarketingUnsubscribe extends BaseEntity {
  customer_id: string;
  email: string | null;
  phone: string | null;
  unsubscribed_from: "email" | "sms" | "both";
  reason: string | null;
  // Joined data
  customer?: User;
}

/**
 * Input for creating a new campaign
 */
export interface CreateCampaignInput {
  name: string;
  description?: string;
  type: CampaignType;
  channel: CampaignChannel;
  segment_criteria: SegmentCriteria;
  message_content: MessageContent;
  ab_test_config?: ABTestConfig;
  scheduled_at?: string;
}

/**
 * Input for updating an existing campaign
 */
export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  segment_criteria?: SegmentCriteria;
  message_content?: MessageContent;
  ab_test_config?: ABTestConfig;
  scheduled_at?: string;
  status?: CampaignStatus;
}

/**
 * Campaign performance metrics
 */
export interface CampaignPerformanceMetrics {
  campaign_id: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  failed_count: number;
  conversion_count: number;
  revenue_generated: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  roi: number;
  avg_revenue_per_send: number;
}

/**
 * Segment preview result
 * Shows matching customers before sending campaign
 */
export interface SegmentPreview {
  total_customers: number;
  customers: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    last_visit: string | null;
    total_visits: number;
  }>;
}

/**
 * Campaign template for reusable campaign configurations
 */
export interface CampaignTemplate {
  id: string;
  name: string;
  description: string | null;
  channel: CampaignChannel;
  message_content: MessageContent;
  suggested_criteria: SegmentCriteria;
  created_at: string;
}
