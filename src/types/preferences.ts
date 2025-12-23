/**
 * Phase 8: Notification Preferences Types
 * Defines structure for customer notification preferences
 */

/**
 * Customer notification preferences
 * Stored in users.preferences JSON column
 */
export interface NotificationPreferences {
  /** Master switch for marketing communications */
  marketing_enabled: boolean;

  /** Email notifications for appointment reminders */
  email_appointment_reminders: boolean;

  /** SMS notifications for appointment reminders */
  sms_appointment_reminders: boolean;

  /** Email notifications for retention reminders */
  email_retention_reminders: boolean;

  /** SMS notifications for retention reminders */
  sms_retention_reminders: boolean;
}

/**
 * Default notification preferences
 * All opt-in by default for good UX
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  marketing_enabled: true,
  email_appointment_reminders: true,
  sms_appointment_reminders: true,
  email_retention_reminders: true,
  sms_retention_reminders: true,
};

/**
 * Partial preferences for updates
 */
export type PartialNotificationPreferences = Partial<NotificationPreferences>;

/**
 * Notification type categories
 */
export const TRANSACTIONAL_NOTIFICATION_TYPES = [
  'booking_confirmation',
  'appointment_status_checkin',
  'report_card_completion',
  'waitlist_notification',
] as const;

export const MARKETING_NOTIFICATION_TYPES = [
  'appointment_reminder',
  'retention_reminder',
] as const;

export type TransactionalNotificationType = typeof TRANSACTIONAL_NOTIFICATION_TYPES[number];
export type MarketingNotificationType = typeof MARKETING_NOTIFICATION_TYPES[number];
export type NotificationType = TransactionalNotificationType | MarketingNotificationType;

/**
 * Check if a notification type is transactional
 */
export function isTransactionalNotification(type: string): type is TransactionalNotificationType {
  return TRANSACTIONAL_NOTIFICATION_TYPES.includes(type as TransactionalNotificationType);
}

/**
 * Check if a notification type is marketing
 */
export function isMarketingNotification(type: string): type is MarketingNotificationType {
  return MARKETING_NOTIFICATION_TYPES.includes(type as MarketingNotificationType);
}
