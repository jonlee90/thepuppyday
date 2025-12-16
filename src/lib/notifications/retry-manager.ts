/**
 * Phase 8: Notification Retry Manager
 * Manages retry processing for failed notifications with exponential backoff
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  NotificationMessage,
  NotificationResult,
  RetryResult,
  RetryConfig,
  NotificationService,
} from './types';
import type { NotificationLogRow } from './database-types';
import { createNotificationQueries } from './query-helpers';
import {
  classifyError,
  calculateRetryTimestamp,
  hasExceededMaxRetries,
  DEFAULT_RETRY_CONFIG,
} from './errors';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Number of notifications to process in each batch
 */
const BATCH_SIZE = 100;

/**
 * Delay between batches in milliseconds to avoid overwhelming the system
 */
const BATCH_DELAY_MS = 1000;

// ============================================================================
// RETRY MANAGER INTERFACE
// ============================================================================

/**
 * Interface for retry manager implementations
 */
export interface RetryManager {
  /**
   * Process pending retries
   */
  processRetries(): Promise<RetryResult>;
}

// ============================================================================
// EXPONENTIAL BACKOFF RETRY MANAGER
// ============================================================================

/**
 * Retry manager using exponential backoff with jitter
 */
export class ExponentialBackoffRetryManager implements RetryManager {
  private supabase: SupabaseClient;
  private notificationService: NotificationService;
  private config: RetryConfig;

  /**
   * Create a new retry manager
   *
   * @param supabase - Supabase client for database access
   * @param notificationService - Notification service for sending
   * @param config - Retry configuration (defaults to DEFAULT_RETRY_CONFIG)
   */
  constructor(
    supabase: SupabaseClient,
    notificationService: NotificationService,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ) {
    this.supabase = supabase;
    this.notificationService = notificationService;
    this.config = config;
  }

  /**
   * Process all pending retries
   */
  async processRetries(): Promise<RetryResult> {
    console.log('[RetryManager] Starting retry processing...');

    const queries = createNotificationQueries(this.supabase);
    const result: RetryResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Get pending retries from database
      const { data: pendingRetries, error } = await queries.logs.getPendingRetries(
        this.config.maxRetries
      );

      if (error) {
        console.error('[RetryManager] Failed to fetch pending retries:', error);
        result.errors.push({
          logId: 'QUERY_ERROR',
          error: error.message || 'Failed to fetch pending retries',
        });
        return result;
      }

      if (!pendingRetries || pendingRetries.length === 0) {
        console.log('[RetryManager] No pending retries found');
        return result;
      }

      console.log(`[RetryManager] Found ${pendingRetries.length} pending retries`);

      // Process in batches
      for (let i = 0; i < pendingRetries.length; i += BATCH_SIZE) {
        const batch = pendingRetries.slice(i, i + BATCH_SIZE);

        console.log(
          `[RetryManager] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} notifications)`
        );

        // Process each notification in the batch
        for (const notification of batch) {
          try {
            await this.processNotification(notification, result);
          } catch (error) {
            console.error(
              `[RetryManager] Unexpected error processing notification ${notification.id}:`,
              error
            );
            result.errors.push({
              logId: notification.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // Add delay between batches (except for last batch)
        if (i + BATCH_SIZE < pendingRetries.length) {
          await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
        }
      }

      console.log('[RetryManager] Retry processing complete:', {
        processed: result.processed,
        succeeded: result.succeeded,
        failed: result.failed,
        errors: result.errors.length,
      });

      return result;
    } catch (error) {
      console.error('[RetryManager] Fatal error during retry processing:', error);
      result.errors.push({
        logId: 'FATAL_ERROR',
        error: error instanceof Error ? error.message : 'Unknown fatal error',
      });
      return result;
    }
  }

  /**
   * Process a single notification retry
   */
  private async processNotification(
    notification: NotificationLogRow,
    result: RetryResult
  ): Promise<void> {
    result.processed++;

    console.log(`[RetryManager] Retrying notification ${notification.id} (attempt ${notification.retry_count + 1}/${this.config.maxRetries})`);

    // Build notification message from log entry
    const message: NotificationMessage = {
      type: notification.type,
      channel: notification.channel,
      recipient: notification.recipient,
      templateData: (notification.template_data as Record<string, unknown>) || {},
      userId: notification.customer_id || undefined,
    };

    try {
      // Attempt to send the notification
      const sendResult: NotificationResult = await this.notificationService.send(message);

      if (sendResult.success) {
        // Success - update log entry
        await this.handleSuccess(notification, sendResult);
        result.succeeded++;
      } else {
        // Failed - classify error and schedule next retry or mark as permanently failed
        await this.handleFailure(notification, sendResult.error || 'Unknown error');
        result.failed++;
      }
    } catch (error) {
      // Exception during send - classify and handle
      await this.handleFailure(
        notification,
        error instanceof Error ? error.message : 'Unknown error'
      );
      result.failed++;
      result.errors.push({
        logId: notification.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle successful retry
   */
  private async handleSuccess(
    notification: NotificationLogRow,
    sendResult: NotificationResult
  ): Promise<void> {
    const queries = createNotificationQueries(this.supabase);

    await queries.logs.update(notification.id, {
      status: 'sent',
      sent_at: new Date().toISOString(),
      message_id: sendResult.messageId,
      retry_after: null,
    });

    console.log(`[RetryManager] ✅ Notification ${notification.id} sent successfully`);
  }

  /**
   * Handle failed retry
   */
  private async handleFailure(
    notification: NotificationLogRow,
    errorMessage: string
  ): Promise<void> {
    const queries = createNotificationQueries(this.supabase);
    const newRetryCount = notification.retry_count + 1;

    // Classify the error
    const classifiedError = classifyError(errorMessage);

    // Check if we should retry
    if (
      classifiedError.retryable &&
      !hasExceededMaxRetries(newRetryCount, this.config.maxRetries)
    ) {
      // Schedule next retry with exponential backoff
      const retryAfter = calculateRetryTimestamp(newRetryCount, this.config);

      await queries.logs.update(notification.id, {
        retry_count: newRetryCount,
        retry_after: retryAfter.toISOString(),
        error_message: `${errorMessage} (${classifiedError.type})`,
      });

      console.log(
        `[RetryManager] 🔄 Notification ${notification.id} scheduled for retry at ${retryAfter.toISOString()}`
      );
    } else {
      // Permanently failed - mark as failed with no retry
      const reason = hasExceededMaxRetries(newRetryCount, this.config.maxRetries)
        ? 'Max retries exceeded'
        : 'Non-retryable error';

      await queries.logs.update(notification.id, {
        status: 'failed',
        retry_count: newRetryCount,
        retry_after: null,
        error_message: `${errorMessage} (${reason})`,
      });

      console.log(
        `[RetryManager] ❌ Notification ${notification.id} permanently failed: ${reason}`
      );
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a retry manager instance
 */
export function createRetryManager(
  supabase: SupabaseClient,
  notificationService: NotificationService,
  config?: RetryConfig
): RetryManager {
  return new ExponentialBackoffRetryManager(supabase, notificationService, config);
}
