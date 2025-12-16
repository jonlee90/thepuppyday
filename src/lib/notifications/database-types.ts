/**
 * Phase 8: Notification System Database Types
 * Type definitions for notification_templates, notification_settings, and notification_template_history tables
 */

import type { NotificationChannel } from '../../types/database';
import type { TemplateVariable } from './types';

// ============================================================================
// NOTIFICATION TEMPLATES TABLE
// ============================================================================

/**
 * notification_templates table row
 */
export interface NotificationTemplateRow {
  id: string;
  name: string;
  description: string | null;
  type: string; // notification_type (e.g., 'booking_confirmation')
  trigger_event: string; // (e.g., 'appointment_created')
  channel: NotificationChannel; // 'email' | 'sms'
  subject_template: string | null; // For email only
  html_template: string | null; // For email only
  text_template: string; // For SMS or email plain text
  variables: TemplateVariable[]; // JSONB array
  is_active: boolean;
  version: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string; // TIMESTAMPTZ as ISO string
  updated_at: string; // TIMESTAMPTZ as ISO string
}

/**
 * Insert type for notification_templates
 */
export interface NotificationTemplateInsert {
  id?: string;
  name: string;
  description?: string | null;
  type: string;
  trigger_event: string;
  channel: NotificationChannel;
  subject_template?: string | null;
  html_template?: string | null;
  text_template: string;
  variables?: TemplateVariable[];
  is_active?: boolean;
  version?: number;
  created_by?: string | null;
  updated_by?: string | null;
}

/**
 * Update type for notification_templates
 */
export interface NotificationTemplateUpdate {
  name?: string;
  description?: string | null;
  type?: string;
  trigger_event?: string;
  channel?: NotificationChannel;
  subject_template?: string | null;
  html_template?: string | null;
  text_template?: string;
  variables?: TemplateVariable[];
  is_active?: boolean;
  version?: number;
  updated_by?: string | null;
}

// ============================================================================
// NOTIFICATION SETTINGS TABLE
// ============================================================================

/**
 * notification_settings table row
 */
export interface NotificationSettingsRow {
  notification_type: string; // Primary key
  email_enabled: boolean;
  sms_enabled: boolean;
  email_template_id: string | null;
  sms_template_id: string | null;
  schedule_cron: string | null;
  schedule_enabled: boolean;
  max_retries: number;
  retry_delays_seconds: number[]; // Array of delays
  last_sent_at: string | null; // TIMESTAMPTZ as ISO string
  total_sent_count: number;
  total_failed_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Insert type for notification_settings
 */
export interface NotificationSettingsInsert {
  notification_type: string;
  email_enabled?: boolean;
  sms_enabled?: boolean;
  email_template_id?: string | null;
  sms_template_id?: string | null;
  schedule_cron?: string | null;
  schedule_enabled?: boolean;
  max_retries?: number;
  retry_delays_seconds?: number[];
}

/**
 * Update type for notification_settings
 */
export interface NotificationSettingsUpdate {
  email_enabled?: boolean;
  sms_enabled?: boolean;
  email_template_id?: string | null;
  sms_template_id?: string | null;
  schedule_cron?: string | null;
  schedule_enabled?: boolean;
  max_retries?: number;
  retry_delays_seconds?: number[];
  last_sent_at?: string | null;
  total_sent_count?: number;
  total_failed_count?: number;
}

// ============================================================================
// NOTIFICATION TEMPLATE HISTORY TABLE
// ============================================================================

/**
 * notification_template_history table row
 */
export interface NotificationTemplateHistoryRow {
  id: string;
  template_id: string;
  version: number;
  name: string;
  description: string | null;
  type: string;
  trigger_event: string;
  channel: NotificationChannel;
  subject_template: string | null;
  html_template: string | null;
  text_template: string;
  variables: TemplateVariable[] | null;
  changed_by: string | null;
  change_reason: string | null;
  created_at: string;
}

/**
 * Insert type for notification_template_history
 */
export interface NotificationTemplateHistoryInsert {
  id?: string;
  template_id: string;
  version: number;
  name: string;
  description?: string | null;
  type: string;
  trigger_event: string;
  channel: NotificationChannel;
  subject_template?: string | null;
  html_template?: string | null;
  text_template: string;
  variables?: TemplateVariable[] | null;
  changed_by?: string | null;
  change_reason?: string | null;
}

// ============================================================================
// ENHANCED NOTIFICATIONS_LOG TABLE
// ============================================================================

/**
 * Enhanced notifications_log table with Phase 8 additions
 */
export interface NotificationLogRow {
  id: string;
  customer_id: string | null;
  type: string;
  channel: NotificationChannel;
  recipient: string;
  subject: string | null;
  content: string;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  sent_at: string | null;
  // Phase 6 additions
  campaign_id: string | null;
  campaign_send_id: string | null;
  tracking_id: string | null;
  clicked_at: string | null;
  delivered_at: string | null;
  cost_cents: number | null;
  // Phase 8 additions
  template_id: string | null;
  template_data: Record<string, unknown> | null; // JSONB
  retry_count: number;
  retry_after: string | null; // TIMESTAMPTZ
  is_test: boolean;
  message_id: string | null; // Provider message ID (Resend/Twilio)
  created_at: string;
}

/**
 * Insert type for notifications_log
 */
export interface NotificationLogInsert {
  id?: string;
  customer_id?: string | null;
  type: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string | null;
  content: string;
  status?: 'pending' | 'sent' | 'failed';
  error_message?: string | null;
  sent_at?: string | null;
  campaign_id?: string | null;
  campaign_send_id?: string | null;
  tracking_id?: string | null;
  clicked_at?: string | null;
  delivered_at?: string | null;
  cost_cents?: number | null;
  template_id?: string | null;
  template_data?: Record<string, unknown> | null;
  retry_count?: number;
  retry_after?: string | null;
  is_test?: boolean;
  message_id?: string | null;
}

/**
 * Update type for notifications_log
 */
export interface NotificationLogUpdate {
  status?: 'pending' | 'sent' | 'failed';
  error_message?: string | null;
  sent_at?: string | null;
  clicked_at?: string | null;
  delivered_at?: string | null;
  retry_count?: number;
  retry_after?: string | null;
  message_id?: string | null;
}

// ============================================================================
// DATABASE EXTENSIONS
// ============================================================================

/**
 * Extend the existing Database type with notification tables
 */
export interface NotificationDatabaseSchema {
  public: {
    Tables: {
      notification_templates: {
        Row: NotificationTemplateRow;
        Insert: NotificationTemplateInsert;
        Update: NotificationTemplateUpdate;
      };
      notification_settings: {
        Row: NotificationSettingsRow;
        Insert: NotificationSettingsInsert;
        Update: NotificationSettingsUpdate;
      };
      notification_template_history: {
        Row: NotificationTemplateHistoryRow;
        Insert: NotificationTemplateHistoryInsert;
        Update: Record<string, never>; // History records are read-only
      };
      notifications_log: {
        Row: NotificationLogRow;
        Insert: NotificationLogInsert;
        Update: NotificationLogUpdate;
      };
    };
    Views: {
      notification_template_stats: {
        Row: {
          id: string;
          name: string;
          type: string;
          channel: NotificationChannel;
          is_active: boolean;
          version: number;
          total_sent: number;
          successful_sent: number;
          failed_sent: number;
          last_used_at: string | null;
          version_count: number;
        };
      };
    };
    Functions: {
      get_active_template: {
        Args: { p_type: string; p_channel: NotificationChannel };
        Returns: string | null; // template_id
      };
      render_template: {
        Args: { p_template_id: string; p_variables: Record<string, unknown> };
        Returns: {
          subject: string | null;
          html: string | null;
          text: string;
          character_count: number;
        };
      };
    };
  };
}
