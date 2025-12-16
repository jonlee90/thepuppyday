/**
 * Phase 8: Default Notification Service
 * Core service that orchestrates the entire notification sending workflow
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  NotificationService,
  NotificationMessage,
  NotificationResult,
  RetryResult,
  NotificationMetrics,
  RenderedTemplate,
  EmailProvider,
  SMSProvider,
  TemplateEngine,
  NotificationLogger,
  RetryConfig,
} from './types';
import { createNotificationQueries } from './query-helpers';
import { classifyError, calculateRetryTimestamp, DEFAULT_RETRY_CONFIG } from './errors';
import { createRetryManager } from './retry-manager';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum SMS length before truncation/warning (single segment)
 */
const MAX_SMS_LENGTH = 160;

/**
 * Maximum SMS length for multi-segment messages (each segment)
 */
const MAX_SMS_SEGMENT_LENGTH = 153;

// ============================================================================
// DEFAULT NOTIFICATION SERVICE
// ============================================================================

/**
 * Default implementation of NotificationService
 * Orchestrates template loading, rendering, sending, and logging
 */
export class DefaultNotificationService implements NotificationService {
  private supabase: SupabaseClient;
  private emailProvider: EmailProvider;
  private smsProvider: SMSProvider;
  private templateEngine: TemplateEngine;
  private logger: NotificationLogger;
  private retryConfig: RetryConfig;

  constructor(
    supabase: SupabaseClient,
    emailProvider: EmailProvider,
    smsProvider: SMSProvider,
    templateEngine: TemplateEngine,
    logger: NotificationLogger,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ) {
    this.supabase = supabase;
    this.emailProvider = emailProvider;
    this.smsProvider = smsProvider;
    this.templateEngine = templateEngine;
    this.logger = logger;
    this.retryConfig = retryConfig;
  }

  /**
   * Send a single notification
   * Full workflow:
   * 1. Check if notification type is enabled in settings
   * 2. Check user preferences if userId provided (TODO: Phase 8 later tasks)
   * 3. Load template by type and channel
   * 4. Render template with provided data
   * 5. Validate SMS length if applicable
   * 6. Create pending log entry
   * 7. Send via appropriate provider
   * 8. Update log entry with result
   * 9. Handle errors and schedule retry if transient
   */
  async send(message: NotificationMessage): Promise<NotificationResult> {
    const queries = createNotificationQueries(this.supabase);

    try {
      // Step 1: Check if notification type is enabled for this channel
      const isEnabled = await this.isNotificationEnabled(message.type, message.channel);
      if (!isEnabled) {
        console.log(
          `[NotificationService] Notification type '${message.type}' is disabled for channel '${message.channel}'`
        );
        return {
          success: false,
          error: `Notification type '${message.type}' is disabled for channel '${message.channel}'`,
        };
      }

      // Step 2: Check user preferences (if userId provided)
      if (message.userId) {
        const { checkNotificationAllowed } = await import('./preferences');
        const allowedCheck = await checkNotificationAllowed(
          this.supabase,
          message.userId,
          message.type,
          message.channel
        );

        if (!allowedCheck.allowed) {
          console.log(
            `[NotificationService] Notification blocked by user preference: ${allowedCheck.reason}`
          );

          // Log the skipped notification
          await this.logger.create({
            customerId: message.userId,
            type: message.type,
            channel: message.channel,
            recipient: message.recipient,
            status: 'failed',
            errorMessage: allowedCheck.reason || 'customer_preference',
            isTest: false,
          });

          return {
            success: false,
            error: allowedCheck.reason || 'customer_preference',
          };
        }
      }

      // Step 3: Load template by type and channel
      const { data: template, error: templateError } = await queries.templates.getByTypeAndChannel(
        message.type,
        message.channel
      );

      if (templateError || !template) {
        console.error(
          `[NotificationService] Template not found for type '${message.type}' and channel '${message.channel}':`,
          templateError
        );
        return {
          success: false,
          error: `Template not found for notification type '${message.type}' and channel '${message.channel}'`,
        };
      }

      // Step 4: Render template with provided data
      const rendered = this.renderTemplateFromObject(template, message.templateData);

      // Step 5: Validate SMS length if applicable
      if (message.channel === 'sms') {
        const validation = this.validateSMSLength(rendered.text);
        if (!validation.valid) {
          console.warn(`[NotificationService] SMS validation warning:`, validation.warning);
          // Continue anyway, but log the warning
        }
      }

      // Step 6: Create pending log entry
      const logId = await this.logger.create({
        customerId: message.userId,
        type: message.type,
        channel: message.channel,
        recipient: message.recipient,
        subject: rendered.subject,
        content: rendered.text,
        status: 'pending',
        templateId: template.id,
        templateData: message.templateData,
        retryCount: 0,
        isTest: false,
      });

      // Step 7: Send via appropriate provider
      let sendResult: { success: boolean; messageId?: string; error?: string };

      try {
        if (message.channel === 'email') {
          sendResult = await this.sendEmail(message.recipient, rendered);
        } else {
          sendResult = await this.sendSMS(message.recipient, rendered.text);
        }
      } catch (error) {
        // Provider threw an exception
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        sendResult = { success: false, error: errorMessage };
      }

      // Step 8: Update log entry with result
      if (sendResult.success) {
        await this.logger.update(logId, {
          status: 'sent',
          sentAt: new Date(),
          messageId: sendResult.messageId,
        });

        console.log(
          `[NotificationService] ✅ Notification sent successfully (${message.channel}) to ${message.recipient}`
        );

        return {
          success: true,
          messageId: sendResult.messageId,
          logId,
        };
      } else {
        // Step 9: Handle errors and schedule retry if transient
        const errorMessage = sendResult.error || 'Unknown error';
        await this.handleSendFailure(logId, errorMessage, 0);

        console.error(
          `[NotificationService] ❌ Notification failed (${message.channel}) to ${message.recipient}:`,
          errorMessage
        );

        return {
          success: false,
          error: errorMessage,
          logId,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[NotificationService] Unexpected error in send():', error);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send multiple notifications in batch
   * Process in chunks with brief pauses to avoid overwhelming the system
   */
  async sendBatch(messages: NotificationMessage[]): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    const CHUNK_SIZE = 10;
    const CHUNK_DELAY_MS = 100;

    console.log(`[NotificationService] Starting batch send of ${messages.length} notifications`);

    // Process in chunks
    for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
      const chunk = messages.slice(i, i + CHUNK_SIZE);

      // Send each message in the chunk
      for (const message of chunk) {
        try {
          const result = await this.send(message);
          results.push(result);
        } catch (error) {
          // Handle individual failures gracefully
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Add delay between chunks (except for last chunk)
      if (i + CHUNK_SIZE < messages.length) {
        await new Promise((resolve) => setTimeout(resolve, CHUNK_DELAY_MS));
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(
      `[NotificationService] Batch send complete: ${succeeded} succeeded, ${failed} failed`
    );

    return results;
  }

  /**
   * Render a template with data
   */
  async renderTemplate(
    templateId: string,
    data: Record<string, unknown>
  ): Promise<RenderedTemplate> {
    const queries = createNotificationQueries(this.supabase);

    const { data: template, error } = await queries.templates.getById(templateId);

    if (error || !template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return this.renderTemplateFromObject(template, data);
  }

  /**
   * Process pending retries
   */
  async processRetries(): Promise<RetryResult> {
    const retryManager = createRetryManager(this.supabase, this, this.retryConfig);
    return retryManager.processRetries();
  }

  /**
   * Get notification metrics for a date range
   */
  async getMetrics(startDate: Date, endDate: Date): Promise<NotificationMetrics> {
    const queries = createNotificationQueries(this.supabase);

    try {
      const stats = await queries.logs.getStats(
        startDate.toISOString(),
        endDate.toISOString()
      );

      // Transform database stats into NotificationMetrics
      // TODO: Implement proper transformation based on database function return type
      // For now, return a basic structure
      return {
        totalSent: stats?.total_sent || 0,
        totalDelivered: stats?.total_delivered || 0,
        totalFailed: stats?.total_failed || 0,
        totalClicked: stats?.total_clicked || 0,
        deliveryRate: stats?.delivery_rate || 0,
        clickRate: stats?.click_rate || 0,
        byChannel: {
          email: {
            sent: stats?.email_sent || 0,
            delivered: stats?.email_delivered || 0,
            failed: stats?.email_failed || 0,
            clicked: stats?.email_clicked || 0,
            deliveryRate: stats?.email_delivery_rate || 0,
            clickRate: stats?.email_click_rate || 0,
          },
          sms: {
            sent: stats?.sms_sent || 0,
            delivered: stats?.sms_delivered || 0,
            failed: stats?.sms_failed || 0,
            clicked: stats?.sms_clicked || 0,
            deliveryRate: stats?.sms_delivery_rate || 0,
            clickRate: stats?.sms_click_rate || 0,
          },
        },
        byType: {},
        timeline: [],
        failureReasons: [],
      };
    } catch (error) {
      console.error('[NotificationService] Failed to get metrics:', error);
      throw error;
    }
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  /**
   * Check if notification type is enabled for a channel
   */
  private async isNotificationEnabled(
    notificationType: string,
    channel: 'email' | 'sms'
  ): Promise<boolean> {
    const queries = createNotificationQueries(this.supabase);

    try {
      const isEnabled = await queries.settings.isEnabled(notificationType, channel);
      return isEnabled;
    } catch (error) {
      console.error('[NotificationService] Error checking if notification is enabled:', error);
      // Default to false on error (fail closed)
      return false;
    }
  }

  /**
   * Render a template object with data
   */
  private renderTemplateFromObject(
    template: {
      subject_template: string | null;
      html_template: string | null;
      text_template: string;
    },
    data: Record<string, unknown>
  ): RenderedTemplate {
    const subject = template.subject_template
      ? this.templateEngine.render(template.subject_template, data)
      : undefined;

    const html = template.html_template
      ? this.templateEngine.render(template.html_template, data)
      : undefined;

    const text = this.templateEngine.render(template.text_template, data);

    const characterCount = text.length;
    const segmentCount = this.templateEngine.calculateSegmentCount(text);

    const warnings: string[] = [];
    if (characterCount > MAX_SMS_LENGTH) {
      warnings.push(`Message is ${characterCount} characters (will use ${segmentCount} segments)`);
    }

    return {
      subject,
      html,
      text,
      characterCount,
      segmentCount,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Send email via email provider
   */
  private async sendEmail(
    recipient: string,
    rendered: RenderedTemplate
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!rendered.subject || !rendered.html) {
      return { success: false, error: 'Email requires subject and HTML content' };
    }

    const result = await this.emailProvider.send({
      to: recipient,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    return result;
  }

  /**
   * Send SMS via SMS provider
   */
  private async sendSMS(
    recipient: string,
    text: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const result = await this.smsProvider.send({
      to: recipient,
      body: text,
    });

    return result;
  }

  /**
   * Validate SMS length and return warnings
   */
  private validateSMSLength(text: string): { valid: boolean; warning?: string } {
    const length = text.length;

    if (length <= MAX_SMS_LENGTH) {
      return { valid: true };
    }

    const segments = Math.ceil(length / MAX_SMS_SEGMENT_LENGTH);
    return {
      valid: true, // Still valid, just a warning
      warning: `SMS is ${length} characters and will be sent as ${segments} segments`,
    };
  }

  /**
   * Handle send failure with error classification and retry scheduling
   */
  private async handleSendFailure(
    logId: string,
    errorMessage: string,
    currentRetryCount: number
  ): Promise<void> {
    const classified = classifyError(errorMessage);

    if (classified.retryable && currentRetryCount < this.retryConfig.maxRetries) {
      // Schedule retry with exponential backoff
      const retryAfter = calculateRetryTimestamp(currentRetryCount, this.retryConfig);

      await this.logger.update(logId, {
        status: 'failed',
        errorMessage: `${errorMessage} (${classified.type})`,
        retryAfter,
        retryCount: currentRetryCount + 1,
      });

      console.log(
        `[NotificationService] 🔄 Retry scheduled for ${retryAfter.toISOString()}`
      );
    } else {
      // Permanent failure or max retries exceeded
      const reason = currentRetryCount >= this.retryConfig.maxRetries
        ? 'Max retries exceeded'
        : 'Non-retryable error';

      await this.logger.update(logId, {
        status: 'failed',
        errorMessage: `${errorMessage} (${reason})`,
        retryAfter: undefined,
      });

      console.log(`[NotificationService] ❌ Permanently failed: ${reason}`);
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a notification service instance
 */
export function createNotificationService(
  supabase: SupabaseClient,
  emailProvider: EmailProvider,
  smsProvider: SMSProvider,
  templateEngine: TemplateEngine,
  logger: NotificationLogger,
  retryConfig?: RetryConfig
): NotificationService {
  return new DefaultNotificationService(
    supabase,
    emailProvider,
    smsProvider,
    templateEngine,
    logger,
    retryConfig
  );
}
