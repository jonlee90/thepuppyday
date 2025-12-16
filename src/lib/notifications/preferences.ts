/**
 * Phase 8: Notification Preferences Helper Functions
 * Utilities for safely getting and setting customer notification preferences
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  NotificationPreferences,
  DEFAULT_NOTIFICATION_PREFERENCES,
  PartialNotificationPreferences,
  isTransactionalNotification,
  isMarketingNotification,
} from '@/types/preferences';
import type { NotificationChannel } from '@/types/database';

/**
 * Get customer notification preferences
 * Returns default preferences if not found or invalid
 */
export async function getNotificationPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<NotificationPreferences> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.warn(
        `[NotificationPreferences] Failed to fetch preferences for user ${userId}:`,
        error
      );
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }

    // Merge user preferences with defaults to ensure all keys exist
    return mergeWithDefaults(user.preferences as Record<string, unknown>);
  } catch (error) {
    console.error('[NotificationPreferences] Error getting preferences:', error);
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

/**
 * Update customer notification preferences
 * Uses service role client to bypass RLS after authentication
 */
export async function updateNotificationPreferences(
  supabase: SupabaseClient,
  userId: string,
  updates: PartialNotificationPreferences
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current preferences first
    const currentPrefs = await getNotificationPreferences(supabase, userId);

    // Merge updates with current preferences
    const updatedPrefs: NotificationPreferences = {
      ...currentPrefs,
      ...updates,
    };

    // Update in database
    const { error } = await supabase
      .from('users')
      .update({
        preferences: updatedPrefs as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('[NotificationPreferences] Failed to update preferences:', error);
      return { success: false, error: error.message };
    }

    console.log(`[NotificationPreferences] Updated preferences for user ${userId}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[NotificationPreferences] Error updating preferences:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Check if a notification should be sent based on user preferences
 * Returns { allowed: boolean, reason?: string }
 */
export async function checkNotificationAllowed(
  supabase: SupabaseClient,
  userId: string,
  notificationType: string,
  channel: NotificationChannel
): Promise<{ allowed: boolean; reason?: string }> {
  // Transactional notifications are always allowed (except for specific channel preferences)
  if (isTransactionalNotification(notificationType)) {
    // For transactional notifications, still respect channel preferences for appointment reminders
    if (notificationType === 'booking_confirmation' || notificationType.startsWith('appointment_status')) {
      return { allowed: true };
    }
  }

  // Get user preferences
  const preferences = await getNotificationPreferences(supabase, userId);

  // Check marketing enabled for marketing notifications
  if (isMarketingNotification(notificationType)) {
    if (!preferences.marketing_enabled) {
      return {
        allowed: false,
        reason: 'customer_preference_marketing_disabled',
      };
    }
  }

  // Check channel-specific preferences
  if (notificationType === 'appointment_reminder') {
    if (channel === 'email' && !preferences.email_appointment_reminders) {
      return {
        allowed: false,
        reason: 'customer_preference_email_reminders_disabled',
      };
    }
    if (channel === 'sms' && !preferences.sms_appointment_reminders) {
      return {
        allowed: false,
        reason: 'customer_preference_sms_reminders_disabled',
      };
    }
  }

  if (notificationType === 'retention_reminder') {
    if (channel === 'email' && !preferences.email_retention_reminders) {
      return {
        allowed: false,
        reason: 'customer_preference_email_retention_disabled',
      };
    }
    if (channel === 'sms' && !preferences.sms_retention_reminders) {
      return {
        allowed: false,
        reason: 'customer_preference_sms_retention_disabled',
      };
    }
  }

  return { allowed: true };
}

/**
 * Disable marketing notifications for a user (used by unsubscribe)
 */
export async function disableMarketing(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  return updateNotificationPreferences(supabase, userId, {
    marketing_enabled: false,
  });
}

/**
 * Disable specific channel/type combination (used by unsubscribe)
 */
export async function disableNotificationChannel(
  supabase: SupabaseClient,
  userId: string,
  notificationType: string,
  channel: NotificationChannel
): Promise<{ success: boolean; error?: string }> {
  const updates: PartialNotificationPreferences = {};

  if (notificationType === 'appointment_reminder') {
    if (channel === 'email') {
      updates.email_appointment_reminders = false;
    } else if (channel === 'sms') {
      updates.sms_appointment_reminders = false;
    }
  } else if (notificationType === 'retention_reminder') {
    if (channel === 'email') {
      updates.email_retention_reminders = false;
    } else if (channel === 'sms') {
      updates.sms_retention_reminders = false;
    }
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: 'Invalid notification type or channel' };
  }

  return updateNotificationPreferences(supabase, userId, updates);
}

// ============================================================================
// PRIVATE HELPERS
// ============================================================================

/**
 * Merge user preferences with defaults to ensure all keys exist
 */
function mergeWithDefaults(userPrefs: Record<string, unknown>): NotificationPreferences {
  return {
    marketing_enabled:
      typeof userPrefs.marketing_enabled === 'boolean'
        ? userPrefs.marketing_enabled
        : DEFAULT_NOTIFICATION_PREFERENCES.marketing_enabled,
    email_appointment_reminders:
      typeof userPrefs.email_appointment_reminders === 'boolean'
        ? userPrefs.email_appointment_reminders
        : DEFAULT_NOTIFICATION_PREFERENCES.email_appointment_reminders,
    sms_appointment_reminders:
      typeof userPrefs.sms_appointment_reminders === 'boolean'
        ? userPrefs.sms_appointment_reminders
        : DEFAULT_NOTIFICATION_PREFERENCES.sms_appointment_reminders,
    email_retention_reminders:
      typeof userPrefs.email_retention_reminders === 'boolean'
        ? userPrefs.email_retention_reminders
        : DEFAULT_NOTIFICATION_PREFERENCES.email_retention_reminders,
    sms_retention_reminders:
      typeof userPrefs.sms_retention_reminders === 'boolean'
        ? userPrefs.sms_retention_reminders
        : DEFAULT_NOTIFICATION_PREFERENCES.sms_retention_reminders,
  };
}
