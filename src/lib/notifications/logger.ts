/**
 * Phase 8: Notification Logger
 * Tracks notification sends in the database
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  NotificationLogger,
  NotificationLogEntry,
  NotificationLogQueryFilters,
} from './types';
import type { NotificationLogInsert, NotificationLogUpdate } from './database-types';
import { createNotificationQueries } from './query-helpers';

// ============================================================================
// NOTIFICATION LOGGER IMPLEMENTATION
// ============================================================================

/**
 * Default notification logger implementation
 * Wraps query helpers with the NotificationLogger interface
 */
export class DefaultNotificationLogger implements NotificationLogger {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Create a new notification log entry
   */
  async create(entry: Partial<NotificationLogEntry>): Promise<string> {
    const queries = createNotificationQueries(this.supabase);

    // Convert from interface format to database format
    const insertData: NotificationLogInsert = {
      customer_id: entry.customerId || null,
      type: entry.type || 'unknown',
      channel: entry.channel || 'email',
      recipient: entry.recipient || '',
      subject: entry.subject || null,
      content: entry.content || '',
      status: entry.status || 'pending',
      error_message: entry.errorMessage || null,
      sent_at: entry.sentAt?.toISOString() || null,
      template_id: entry.templateId || null,
      template_data: entry.templateData || null,
      retry_count: entry.retryCount || 0,
      retry_after: entry.retryAfter?.toISOString() || null,
      is_test: entry.isTest || false,
      message_id: entry.messageId || null,
      campaign_id: entry.campaignId || null,
      campaign_send_id: entry.campaignSendId || null,
      tracking_id: entry.trackingId || null,
    };

    const { data, error } = await queries.logs.create(insertData);

    if (error) {
      console.error('[NotificationLogger] Failed to create log entry:', error);
      throw new Error(`Failed to create log entry: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create log entry: No data returned');
    }

    return data.id;
  }

  /**
   * Update a notification log entry
   */
  async update(id: string, updates: Partial<NotificationLogEntry>): Promise<void> {
    const queries = createNotificationQueries(this.supabase);

    // Convert from interface format to database format
    const updateData: NotificationLogUpdate = {};

    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.errorMessage !== undefined) updateData.error_message = updates.errorMessage;
    if (updates.sentAt !== undefined) updateData.sent_at = updates.sentAt.toISOString();
    if (updates.clickedAt !== undefined) updateData.clicked_at = updates.clickedAt.toISOString();
    if (updates.deliveredAt !== undefined) updateData.delivered_at = updates.deliveredAt.toISOString();
    if (updates.retryCount !== undefined) updateData.retry_count = updates.retryCount;
    if (updates.retryAfter !== undefined) updateData.retry_after = updates.retryAfter?.toISOString() || null;
    if (updates.messageId !== undefined) updateData.message_id = updates.messageId;

    const { error } = await queries.logs.update(id, updateData);

    if (error) {
      console.error(`[NotificationLogger] Failed to update log entry ${id}:`, error);
      throw new Error(`Failed to update log entry: ${error.message}`);
    }
  }

  /**
   * Get a notification log entry by ID
   */
  async get(id: string): Promise<NotificationLogEntry | null> {
    const queries = createNotificationQueries(this.supabase);

    const { data, error } = await queries.logs.getById(id);

    if (error) {
      console.error(`[NotificationLogger] Failed to get log entry ${id}:`, error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Convert from database format to interface format
    return this.convertToLogEntry(data);
  }

  /**
   * Query notification log entries with filters
   */
  async query(filters: NotificationLogQueryFilters): Promise<NotificationLogEntry[]> {
    const queries = createNotificationQueries(this.supabase);

    // Convert interface filters to query filters
    const queryFilters = {
      type: filters.type,
      channel: filters.channel,
      status: filters.status,
      customerId: filters.customerId,
      isTest: filters.isTest,
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString(),
      limit: filters.limit,
      offset: filters.offset,
    };

    const { data, error } = await queries.logs.query(queryFilters);

    if (error) {
      console.error('[NotificationLogger] Failed to query log entries:', error);
      throw new Error(`Failed to query log entries: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // Convert from database format to interface format
    return data.map((row) => this.convertToLogEntry(row));
  }

  /**
   * Convert database row to NotificationLogEntry interface
   */
  private convertToLogEntry(row: {
    id: string;
    customer_id: string | null;
    type: string;
    channel: 'email' | 'sms';
    recipient: string;
    subject: string | null;
    content: string;
    status: 'pending' | 'sent' | 'failed';
    error_message: string | null;
    sent_at: string | null;
    template_id: string | null;
    template_data: Record<string, unknown> | null;
    retry_count: number;
    retry_after: string | null;
    is_test: boolean;
    message_id: string | null;
    campaign_id: string | null;
    campaign_send_id: string | null;
    tracking_id: string | null;
    clicked_at: string | null;
    delivered_at: string | null;
    cost_cents: number | null;
    created_at: string;
  }): NotificationLogEntry {
    return {
      id: row.id,
      customerId: row.customer_id || undefined,
      type: row.type,
      channel: row.channel,
      recipient: row.recipient,
      subject: row.subject || undefined,
      content: row.content,
      status: row.status,
      errorMessage: row.error_message || undefined,
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      templateId: row.template_id || undefined,
      templateData: row.template_data || undefined,
      retryCount: row.retry_count,
      retryAfter: row.retry_after ? new Date(row.retry_after) : undefined,
      isTest: row.is_test,
      messageId: row.message_id || undefined,
      campaignId: row.campaign_id || undefined,
      campaignSendId: row.campaign_send_id || undefined,
      trackingId: row.tracking_id || undefined,
      clickedAt: row.clicked_at ? new Date(row.clicked_at) : undefined,
      deliveredAt: row.delivered_at ? new Date(row.delivered_at) : undefined,
      costCents: row.cost_cents || undefined,
      createdAt: new Date(row.created_at),
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a notification logger instance
 */
export function createNotificationLogger(supabase: SupabaseClient): NotificationLogger {
  return new DefaultNotificationLogger(supabase);
}
