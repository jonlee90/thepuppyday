/**
 * Extended Notification Log Types
 * For admin notification log viewer (Tasks 0145-0148)
 */

import type { NotificationLog as BaseNotificationLog, NotificationChannel, NotificationStatus } from './database';

/**
 * Extended notification log with template data and customer info
 * Used for log viewer display
 */
export interface NotificationLogExtended extends BaseNotificationLog {
  template_data?: Record<string, unknown> | null;
  is_test?: boolean;
  customer_name?: string | null;
}

/**
 * Notification log list item (API response)
 */
export interface NotificationLogListItem {
  id: string;
  customer_id: string | null;
  customer_name: string | null;
  type: string;
  channel: NotificationChannel;
  recipient: string;
  subject: string | null;
  status: NotificationStatus;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  is_test: boolean;
}

/**
 * Notification log detail (for expanded view)
 */
export interface NotificationLogDetail extends NotificationLogListItem {
  content: string | null;
  template_data: Record<string, unknown> | null;
  clicked_at: string | null;
  delivered_at: string | null;
  message_id: string | null;
  tracking_id: string | null;
}

/**
 * Notification log filters
 */
export interface NotificationLogFilters {
  search?: string;
  type?: string;
  channel?: NotificationChannel | 'all';
  status?: NotificationStatus | 'all';
  start_date?: string;
  end_date?: string;
}

/**
 * Notification log list API response
 */
export interface NotificationLogListResponse {
  logs: NotificationLogListItem[];
  metadata: {
    total: number;
    total_pages: number;
    current_page: number;
    per_page: number;
  };
}

/**
 * Resend notification response
 */
export interface ResendNotificationResponse {
  success: boolean;
  new_log_id?: string;
  message: string;
  error?: string;
}

/**
 * CSV export row
 */
export interface NotificationLogCSVRow {
  Date: string;
  Type: string;
  Channel: string;
  Recipient: string;
  Customer: string;
  Status: string;
  Subject: string;
  'Sent At': string;
  'Error Message': string;
  'Is Test': string;
}
