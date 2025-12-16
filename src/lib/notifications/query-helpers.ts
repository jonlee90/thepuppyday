/**
 * Phase 8: Notification System Query Helpers
 * Type-safe query builders for notification tables
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  NotificationTemplateRow,
  NotificationTemplateInsert,
  NotificationTemplateUpdate,
  NotificationSettingsRow,
  NotificationSettingsUpdate,
  NotificationLogRow,
  NotificationLogInsert,
  NotificationLogUpdate,
  NotificationTemplateHistoryRow,
} from './database-types';
import type { NotificationChannel } from '../../types/database';

// ============================================================================
// NOTIFICATION TEMPLATES QUERIES
// ============================================================================

/**
 * Query helper for notification_templates table
 */
export class NotificationTemplateQueries {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all active templates
   */
  async getActiveTemplates() {
    return this.supabase
      .from('notification_templates')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .returns<NotificationTemplateRow[]>();
  }

  /**
   * Get template by ID
   */
  async getById(id: string) {
    return this.supabase
      .from('notification_templates')
      .select('*')
      .eq('id', id)
      .single<NotificationTemplateRow>();
  }

  /**
   * Get template by type and channel
   */
  async getByTypeAndChannel(type: string, channel: NotificationChannel) {
    return this.supabase
      .from('notification_templates')
      .select('*')
      .eq('type', type)
      .eq('channel', channel)
      .eq('is_active', true)
      .single<NotificationTemplateRow>();
  }

  /**
   * Get templates by type (all channels)
   */
  async getByType(type: string) {
    return this.supabase
      .from('notification_templates')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .returns<NotificationTemplateRow[]>();
  }

  /**
   * Get templates by channel
   */
  async getByChannel(channel: NotificationChannel) {
    return this.supabase
      .from('notification_templates')
      .select('*')
      .eq('channel', channel)
      .eq('is_active', true)
      .returns<NotificationTemplateRow[]>();
  }

  /**
   * Create a new template
   */
  async create(template: NotificationTemplateInsert) {
    return this.supabase
      .from('notification_templates')
      .insert(template)
      .select()
      .single<NotificationTemplateRow>();
  }

  /**
   * Update a template
   */
  async update(id: string, updates: NotificationTemplateUpdate) {
    return this.supabase
      .from('notification_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single<NotificationTemplateRow>();
  }

  /**
   * Deactivate a template (soft delete)
   */
  async deactivate(id: string) {
    return this.supabase
      .from('notification_templates')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single<NotificationTemplateRow>();
  }

  /**
   * Delete a template (hard delete)
   */
  async delete(id: string) {
    return this.supabase
      .from('notification_templates')
      .delete()
      .eq('id', id);
  }

  /**
   * Get template history
   */
  async getHistory(templateId: string) {
    return this.supabase
      .from('notification_template_history')
      .select('*')
      .eq('template_id', templateId)
      .order('version', { ascending: false })
      .returns<NotificationTemplateHistoryRow[]>();
  }

  /**
   * Get specific version from history
   */
  async getVersion(templateId: string, version: number) {
    return this.supabase
      .from('notification_template_history')
      .select('*')
      .eq('template_id', templateId)
      .eq('version', version)
      .single<NotificationTemplateHistoryRow>();
  }
}

// ============================================================================
// NOTIFICATION SETTINGS QUERIES
// ============================================================================

/**
 * Query helper for notification_settings table
 */
export class NotificationSettingsQueries {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all notification settings
   */
  async getAll() {
    return this.supabase
      .from('notification_settings')
      .select('*')
      .order('notification_type', { ascending: true })
      .returns<NotificationSettingsRow[]>();
  }

  /**
   * Get settings for a specific notification type
   */
  async getByType(notificationType: string) {
    return this.supabase
      .from('notification_settings')
      .select('*')
      .eq('notification_type', notificationType)
      .single<NotificationSettingsRow>();
  }

  /**
   * Check if notification type is enabled for a channel
   */
  async isEnabled(notificationType: string, channel: NotificationChannel) {
    const { data } = await this.getByType(notificationType);
    if (!data) return false;
    return channel === 'email' ? data.email_enabled : data.sms_enabled;
  }

  /**
   * Update notification settings
   */
  async update(notificationType: string, updates: NotificationSettingsUpdate) {
    return this.supabase
      .from('notification_settings')
      .update(updates)
      .eq('notification_type', notificationType)
      .select()
      .single<NotificationSettingsRow>();
  }

  /**
   * Enable/disable email for a notification type
   */
  async setEmailEnabled(notificationType: string, enabled: boolean) {
    return this.update(notificationType, { email_enabled: enabled });
  }

  /**
   * Enable/disable SMS for a notification type
   */
  async setSmsEnabled(notificationType: string, enabled: boolean) {
    return this.update(notificationType, { sms_enabled: enabled });
  }

  /**
   * Update retry configuration
   */
  async updateRetryConfig(
    notificationType: string,
    maxRetries: number,
    retryDelaysSeconds: number[]
  ) {
    return this.update(notificationType, {
      max_retries: maxRetries,
      retry_delays_seconds: retryDelaysSeconds,
    });
  }

  /**
   * Get enabled scheduled notifications
   */
  async getScheduledNotifications() {
    return this.supabase
      .from('notification_settings')
      .select('*')
      .eq('schedule_enabled', true)
      .not('schedule_cron', 'is', null)
      .returns<NotificationSettingsRow[]>();
  }
}

// ============================================================================
// NOTIFICATION LOG QUERIES
// ============================================================================

/**
 * Query filters for notification logs
 */
export interface NotificationLogFilters {
  type?: string;
  channel?: NotificationChannel;
  status?: 'pending' | 'sent' | 'failed';
  customerId?: string;
  startDate?: string;
  endDate?: string;
  isTest?: boolean;
  templateId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Query helper for notifications_log table
 */
export class NotificationLogQueries {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get notification log by ID
   */
  async getById(id: string) {
    return this.supabase
      .from('notifications_log')
      .select('*')
      .eq('id', id)
      .single<NotificationLogRow>();
  }

  /**
   * Query notifications with filters
   */
  async query(filters: NotificationLogFilters = {}) {
    let query = this.supabase
      .from('notifications_log')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.channel) {
      query = query.eq('channel', filters.channel);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }
    if (filters.isTest !== undefined) {
      query = query.eq('is_test', filters.isTest);
    }
    if (filters.templateId) {
      query = query.eq('template_id', filters.templateId);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    // Pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    // Order by newest first
    query = query.order('created_at', { ascending: false });

    return query.returns<NotificationLogRow[]>();
  }

  /**
   * Create a notification log entry
   */
  async create(log: NotificationLogInsert) {
    return this.supabase
      .from('notifications_log')
      .insert(log)
      .select()
      .single<NotificationLogRow>();
  }

  /**
   * Update a notification log entry
   */
  async update(id: string, updates: NotificationLogUpdate) {
    return this.supabase
      .from('notifications_log')
      .update(updates)
      .eq('id', id)
      .select()
      .single<NotificationLogRow>();
  }

  /**
   * Mark notification as sent
   */
  async markAsSent(id: string, messageId?: string) {
    return this.update(id, {
      status: 'sent',
      sent_at: new Date().toISOString(),
      message_id: messageId,
    });
  }

  /**
   * Mark notification as failed
   */
  async markAsFailed(id: string, errorMessage: string) {
    return this.update(id, {
      status: 'failed',
      error_message: errorMessage,
    });
  }

  /**
   * Schedule retry for a failed notification
   */
  async scheduleRetry(id: string, retryAfter: Date) {
    const { data: current } = await this.getById(id);
    if (!current) throw new Error('Notification not found');

    return this.update(id, {
      retry_count: current.retry_count + 1,
      retry_after: retryAfter.toISOString(),
    });
  }

  /**
   * Get pending retries
   */
  async getPendingRetries(maxRetries: number = 2) {
    return this.supabase
      .from('notifications_log')
      .select('*')
      .eq('status', 'failed')
      .not('retry_after', 'is', null)
      .lte('retry_after', new Date().toISOString())
      .lt('retry_count', maxRetries)
      .eq('is_test', false)
      .order('retry_after', { ascending: true })
      .returns<NotificationLogRow[]>();
  }

  /**
   * Get recent notifications for a customer
   */
  async getRecentByCustomer(customerId: string, limit: number = 10) {
    return this.supabase
      .from('notifications_log')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .returns<NotificationLogRow[]>();
  }

  /**
   * Get failed notifications
   */
  async getFailedNotifications(filters: Omit<NotificationLogFilters, 'status'> = {}) {
    return this.query({ ...filters, status: 'failed' });
  }

  /**
   * Get statistics for a date range
   */
  async getStats(startDate: string, endDate: string) {
    const { data, error } = await this.supabase
      .rpc('get_notification_metrics', {
        p_start_date: startDate,
        p_end_date: endDate,
      });

    if (error) throw error;
    return data;
  }
}

// ============================================================================
// COMBINED QUERY HELPER
// ============================================================================

/**
 * Combined query helper with all notification queries
 */
export class NotificationQueries {
  public templates: NotificationTemplateQueries;
  public settings: NotificationSettingsQueries;
  public logs: NotificationLogQueries;

  constructor(supabase: SupabaseClient) {
    this.templates = new NotificationTemplateQueries(supabase);
    this.settings = new NotificationSettingsQueries(supabase);
    this.logs = new NotificationLogQueries(supabase);
  }
}

/**
 * Create notification queries helper
 */
export function createNotificationQueries(supabase: SupabaseClient) {
  return new NotificationQueries(supabase);
}
