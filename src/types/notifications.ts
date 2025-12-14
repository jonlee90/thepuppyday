/**
 * Notification types for The Puppy Day
 * Enhanced types for notification center and tracking
 */

import type { NotificationLog, NotificationChannel, NotificationStatus, User } from './database';

/**
 * Notification with enriched customer data
 */
export interface NotificationWithCustomer extends NotificationLog {
  customer?: User | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
}

/**
 * Notification list filters
 */
export interface NotificationFilters {
  channel?: NotificationChannel; // 'email' | 'sms'
  status?: NotificationStatus; // 'pending' | 'sent' | 'failed'
  type?: string; // e.g., 'appointment_confirmed', 'report_card_sent'
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  search?: string; // Search customer name, email, phone
  campaignId?: string; // Filter by campaign
}

/**
 * Notification list response
 */
export interface NotificationListResponse {
  data: NotificationWithCustomer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: NotificationStats;
}

/**
 * Notification summary statistics
 */
export interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalClicked: number;
  totalFailed: number;
  deliveryRate: number; // Percentage
  clickRate: number; // Percentage
  totalCostDollars: number; // For SMS costs
  emailCount: number;
  smsCount: number;
}

/**
 * Resend notification request
 */
export interface ResendNotificationRequest {
  id: string;
}

/**
 * Bulk resend request
 */
export interface BulkResendRequest {
  ids: string[]; // Array of notification IDs
  filters?: NotificationFilters; // Or use filters to select failed notifications
}

/**
 * Resend notification response
 */
export interface ResendNotificationResponse {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * Bulk resend response
 */
export interface BulkResendResponse {
  success: boolean;
  totalResent: number;
  totalFailed: number;
  errors?: string[];
}

/**
 * Notification types enum (for type safety)
 */
export enum NotificationType {
  APPOINTMENT_BOOKED = 'appointment_booked',
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_COMPLETED = 'appointment_completed',
  APPOINTMENT_NO_SHOW = 'appointment_no_show',
  REPORT_CARD_SENT = 'report_card_sent',
  WAITLIST_ADDED = 'waitlist_added',
  WAITLIST_SLOT_AVAILABLE = 'waitlist_slot_available',
  BREED_REMINDER = 'breed_reminder',
  MARKETING_CAMPAIGN = 'marketing_campaign',
  PAYMENT_RECEIVED = 'payment_received',
  USER_REGISTERED = 'user_registered',
  PASSWORD_RESET = 'password_reset',
}

/**
 * Notification type display names
 */
export const NotificationTypeLabels: Record<string, string> = {
  appointment_booked: 'Appointment Booked',
  appointment_confirmed: 'Appointment Confirmed',
  appointment_reminder: 'Appointment Reminder',
  appointment_cancelled: 'Appointment Cancelled',
  appointment_completed: 'Appointment Completed',
  appointment_no_show: 'No Show',
  report_card_sent: 'Report Card',
  waitlist_added: 'Waitlist Added',
  waitlist_slot_available: 'Slot Available',
  breed_reminder: 'Grooming Reminder',
  marketing_campaign: 'Marketing',
  payment_received: 'Payment Received',
  user_registered: 'Welcome Email',
  password_reset: 'Password Reset',
};

/**
 * Get display label for notification type
 */
export function getNotificationTypeLabel(type: string): string {
  return NotificationTypeLabels[type] || type;
}

/**
 * Get icon for notification channel
 */
export function getChannelIcon(channel: NotificationChannel): string {
  return channel === 'email' ? '📧' : '📱';
}

/**
 * Get color for notification status
 */
export function getStatusColor(status: NotificationStatus): string {
  switch (status) {
    case 'sent':
      return 'success';
    case 'failed':
      return 'error';
    case 'pending':
      return 'warning';
    default:
      return 'default';
  }
}
