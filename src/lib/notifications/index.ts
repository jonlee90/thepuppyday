/**
 * Phase 8: Notification System Main Export
 * Factory functions and convenience exports for easy notification service usage
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  NotificationService,
  NotificationMessage,
  NotificationResult,
  RetryConfig,
} from './types';
import { getEmailProvider } from './providers/index';
import { getSMSProvider } from './providers/index';
import { HandlebarsTemplateEngine } from './template-engine';
import { createNotificationLogger } from './logger';
import { createNotificationService } from './service';
import { DEFAULT_RETRY_CONFIG } from './types';

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let notificationServiceInstance: NotificationService | null = null;

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Get the notification service singleton instance
 * Assembles service with correct providers based on environment
 *
 * @param supabase - Supabase client instance
 * @param retryConfig - Optional retry configuration (defaults to DEFAULT_RETRY_CONFIG)
 * @returns Singleton NotificationService instance
 */
export function getNotificationService(
  supabase: SupabaseClient,
  retryConfig?: RetryConfig
): NotificationService {
  // Return cached instance if available
  if (notificationServiceInstance) {
    return notificationServiceInstance;
  }

  console.log('[NotificationService] Initializing notification service...');

  // Get environment-appropriate providers
  const emailProvider = getEmailProvider();
  const smsProvider = getSMSProvider();

  // Create template engine
  const templateEngine = new HandlebarsTemplateEngine();

  // Create logger
  const logger = createNotificationLogger(supabase);

  // Assemble service
  notificationServiceInstance = createNotificationService(
    supabase,
    emailProvider,
    smsProvider,
    templateEngine,
    logger,
    retryConfig || DEFAULT_RETRY_CONFIG
  );

  console.log('[NotificationService] ✅ Notification service initialized');

  return notificationServiceInstance;
}

/**
 * Reset the notification service instance (for testing)
 */
export function resetNotificationService(): void {
  notificationServiceInstance = null;
}

// ============================================================================
// CONVENIENCE FUNCTION
// ============================================================================

/**
 * Convenience function for sending a single notification
 * Automatically creates/retrieves the notification service
 *
 * @param supabase - Supabase client instance
 * @param message - Notification message to send
 * @returns Notification result
 *
 * @example
 * const result = await sendNotification(supabase, {
 *   type: 'booking_confirmation',
 *   channel: 'email',
 *   recipient: 'customer@example.com',
 *   templateData: {
 *     customer_name: 'John Doe',
 *     pet_name: 'Max',
 *     appointment_date: '2025-12-20',
 *   },
 *   userId: 'user-123',
 * });
 */
export async function sendNotification(
  supabase: SupabaseClient,
  message: NotificationMessage
): Promise<NotificationResult> {
  const service = getNotificationService(supabase);
  return service.send(message);
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Export all types
export * from './types';
export * from './database-types';

// Export error handling utilities
export {
  classifyError,
  shouldRetry,
  getErrorMessage,
  getErrorType,
  calculateRetryDelay,
  calculateRetryTimestamp,
  hasExceededMaxRetries,
} from './errors';

// Export provider factories
export { getEmailProvider, getSMSProvider, getProviderMode, resetAllProviders } from './providers/index';

// Export template engine
export { HandlebarsTemplateEngine } from './template-engine';

// Export logger
export { createNotificationLogger } from './logger';

// Export service
export { createNotificationService } from './service';

// Export retry manager
export { createRetryManager } from './retry-manager';

// Export query helpers
export { createNotificationQueries } from './query-helpers';
