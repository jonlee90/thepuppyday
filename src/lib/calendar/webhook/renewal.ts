/**
 * Webhook Renewal Service
 * Renews expiring webhooks before they expire (7-day expiration)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CalendarConnection } from '@/types/calendar';
import { registerWebhook, stopWebhook, isWebhookExpired } from './registration';
import { deactivateConnection } from '../connection';

/**
 * Webhook renewal summary
 */
export interface WebhookRenewalSummary {
  total: number;
  renewed: number;
  failed: number;
  skipped: number;
  results: WebhookRenewalResult[];
}

/**
 * Individual webhook renewal result
 */
export interface WebhookRenewalResult {
  connectionId: string;
  calendarEmail: string;
  success: boolean;
  operation: 'renewed' | 'failed' | 'skipped' | 'deactivated';
  error?: string;
  newExpiration?: string;
}

/**
 * Renew expiring webhooks
 * Finds all webhooks expiring within 24 hours and renews them
 *
 * @param supabase - Supabase client
 * @returns Renewal summary
 *
 * @example
 * ```typescript
 * const summary = await renewExpiringWebhooks(supabase);
 * console.log(`Renewed ${summary.renewed}/${summary.total} webhooks`);
 * ```
 */
export async function renewExpiringWebhooks(
  supabase: SupabaseClient
): Promise<WebhookRenewalSummary> {
  const startTime = Date.now();
  const results: WebhookRenewalResult[] = [];

  try {
    console.log('Starting webhook renewal job...');

    // Find connections with webhooks expiring within 24 hours
    const expiringConnections = await findExpiringWebhooks(supabase);

    console.log(`Found ${expiringConnections.length} webhooks to renew`);

    // Renew each webhook
    for (const connection of expiringConnections) {
      const result = await renewWebhook(supabase, connection.id);
      results.push(result);

      // Add small delay between renewals to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const summary: WebhookRenewalSummary = {
      total: results.length,
      renewed: results.filter((r) => r.operation === 'renewed').length,
      failed: results.filter((r) => r.operation === 'failed').length,
      skipped: results.filter((r) => r.operation === 'skipped').length,
      results,
    };

    // Log summary to sync log
    await supabase
      .from('calendar_sync_log')
      .insert({
        connection_id: null,
        sync_type: 'webhook',
        operation: 'update',
        status: summary.failed === 0 ? 'success' : summary.failed === summary.total ? 'failed' : 'partial',
        duration_ms: Date.now() - startTime,
        details: {
          job: 'webhook_renewal',
          total: summary.total,
          renewed: summary.renewed,
          failed: summary.failed,
          skipped: summary.skipped,
          results: summary.results,
        },
      });

    console.log('Webhook renewal job completed:', {
      total: summary.total,
      renewed: summary.renewed,
      failed: summary.failed,
      skipped: summary.skipped,
      duration_ms: Date.now() - startTime,
    });

    return summary;
  } catch (error) {
    console.error('Webhook renewal job error:', error);

    // Log error to sync log
    await supabase
      .from('calendar_sync_log')
      .insert({
        connection_id: null,
        sync_type: 'webhook',
        operation: 'update',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        error_code: 'WEBHOOK_RENEWAL_JOB_ERROR',
        duration_ms: Date.now() - startTime,
      });

    throw error;
  }
}

/**
 * Find connections with webhooks expiring within 24 hours
 *
 * @param supabase - Supabase client
 * @returns Array of connections with expiring webhooks
 */
async function findExpiringWebhooks(
  supabase: SupabaseClient
): Promise<CalendarConnection[]> {
  try {
    // Calculate 24 hours from now
    const renewalThreshold = new Date();
    renewalThreshold.setHours(renewalThreshold.getHours() + 24);

    const { data, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('is_active', true)
      .not('webhook_channel_id', 'is', null)
      .not('webhook_resource_id', 'is', null)
      .not('webhook_expiration', 'is', null)
      .lte('webhook_expiration', renewalThreshold.toISOString())
      .order('webhook_expiration', { ascending: true });

    if (error) {
      throw new Error(`Failed to find expiring webhooks: ${error.message}`);
    }

    return (data as CalendarConnection[]) || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to find expiring webhooks: ${error.message}`);
    }
    throw new Error('Failed to find expiring webhooks: Unknown error');
  }
}

/**
 * Renew specific webhook
 * Stops old webhook and registers new one
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @returns Renewal result
 *
 * @example
 * ```typescript
 * const result = await renewWebhook(supabase, connectionId);
 * if (result.success) {
 *   console.log('Webhook renewed, new expiration:', result.newExpiration);
 * }
 * ```
 */
export async function renewWebhook(
  supabase: SupabaseClient,
  connectionId: string
): Promise<WebhookRenewalResult> {
  try {
    // Get connection
    const { data: connection, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (error || !connection) {
      return {
        connectionId,
        calendarEmail: 'unknown',
        success: false,
        operation: 'failed',
        error: `Connection not found: ${error?.message || 'Unknown error'}`,
      };
    }

    // Check if webhook needs renewal
    if (!isWebhookExpired(connection.webhook_expiration)) {
      console.log(`Webhook for ${connection.calendar_email} does not need renewal yet`);
      return {
        connectionId,
        calendarEmail: connection.calendar_email,
        success: true,
        operation: 'skipped',
      };
    }

    console.log(`Renewing webhook for ${connection.calendar_email}...`);

    // Stop old webhook (ignore errors if webhook already expired)
    try {
      await stopWebhook(supabase, connectionId);
    } catch (error) {
      console.warn('Failed to stop old webhook, continuing with renewal:', error);
    }

    // Register new webhook
    try {
      const newWebhook = await registerWebhook(
        supabase,
        connectionId,
        connection.calendar_id
      );

      console.log(`Webhook renewed for ${connection.calendar_email}:`, {
        channelId: newWebhook.channelId,
        expiration: newWebhook.expiration,
      });

      return {
        connectionId,
        calendarEmail: connection.calendar_email,
        success: true,
        operation: 'renewed',
        newExpiration: newWebhook.expiration,
      };
    } catch (error) {
      // Check for specific errors that require deactivation
      return await handleRenewalError(supabase, connectionId, connection, error);
    }
  } catch (error) {
    console.error('Webhook renewal error:', error);
    return {
      connectionId,
      calendarEmail: 'unknown',
      success: false,
      operation: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle webhook renewal error
 * Deactivates connection if calendar deleted or access revoked
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param connection - Calendar connection
 * @param error - Renewal error
 * @returns Renewal result
 */
async function handleRenewalError(
  supabase: SupabaseClient,
  connectionId: string,
  connection: CalendarConnection,
  error: unknown
): Promise<WebhookRenewalResult> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  // Check for errors that require deactivation
  const shouldDeactivate =
    errorMessage.includes('404') ||
    errorMessage.includes('403') ||
    errorMessage.includes('not found') ||
    errorMessage.includes('access denied') ||
    errorMessage.includes('deleted') ||
    errorMessage.includes('revoked');

  if (shouldDeactivate) {
    console.warn(`Calendar deleted or access revoked for ${connection.calendar_email}, deactivating...`);

    // Deactivate connection
    try {
      await deactivateConnection(supabase, connectionId);

      // Log deactivation to sync log
      await supabase
        .from('calendar_sync_log')
        .insert({
          connection_id: connectionId,
          sync_type: 'webhook',
          operation: 'delete',
          status: 'success',
          details: {
            reason: 'Calendar deleted or access revoked during webhook renewal',
            error: errorMessage,
          },
        });

      // TODO: Create admin notification
      // This would be implemented in Phase 8 (Notifications)
      console.log(`TODO: Notify admin about deactivated calendar connection: ${connection.calendar_email}`);

      return {
        connectionId,
        calendarEmail: connection.calendar_email,
        success: true,
        operation: 'deactivated',
        error: errorMessage,
      };
    } catch (deactivationError) {
      console.error('Failed to deactivate connection:', deactivationError);
      return {
        connectionId,
        calendarEmail: connection.calendar_email,
        success: false,
        operation: 'failed',
        error: `Deactivation failed: ${deactivationError instanceof Error ? deactivationError.message : 'Unknown error'}`,
      };
    }
  }

  // Temporary error (rate limit, network, etc.) - log and retry on next run
  console.error(`Temporary error renewing webhook for ${connection.calendar_email}:`, errorMessage);

  // Log error to sync log
  await supabase
    .from('calendar_sync_log')
    .insert({
      connection_id: connectionId,
      sync_type: 'webhook',
      operation: 'update',
      status: 'failed',
      error_message: errorMessage,
      error_code: 'WEBHOOK_RENEWAL_FAILED',
      details: {
        calendar_email: connection.calendar_email,
        will_retry: true,
      },
    });

  return {
    connectionId,
    calendarEmail: connection.calendar_email,
    success: false,
    operation: 'failed',
    error: errorMessage,
  };
}

/**
 * Check if any webhooks need renewal
 * Useful for monitoring and health checks
 *
 * @param supabase - Supabase client
 * @returns Number of webhooks needing renewal
 */
export async function checkWebhooksNeedingRenewal(
  supabase: SupabaseClient
): Promise<number> {
  try {
    const expiringConnections = await findExpiringWebhooks(supabase);
    return expiringConnections.length;
  } catch (error) {
    console.error('Error checking webhooks needing renewal:', error);
    return 0;
  }
}

/**
 * Get webhook renewal status for all connections
 * Useful for admin dashboard monitoring
 *
 * @param supabase - Supabase client
 * @returns Array of connection webhook statuses
 */
export async function getWebhookRenewalStatus(
  supabase: SupabaseClient
): Promise<Array<{
  connectionId: string;
  calendarEmail: string;
  webhookExpiration: string | null;
  daysUntilExpiration: number | null;
  needsRenewal: boolean;
}>> {
  try {
    const { data: connections, error } = await supabase
      .from('calendar_connections')
      .select('id, calendar_email, webhook_expiration')
      .eq('is_active', true)
      .order('webhook_expiration', { ascending: true });

    if (error) {
      throw new Error(`Failed to get webhook status: ${error.message}`);
    }

    if (!connections) {
      return [];
    }

    const now = new Date();

    return connections.map((conn: CalendarConnection) => {
      let daysUntilExpiration: number | null = null;
      let needsRenewal = false;

      if (conn.webhook_expiration) {
        const expiration = new Date(conn.webhook_expiration);
        const msUntilExpiration = expiration.getTime() - now.getTime();
        daysUntilExpiration = Math.floor(msUntilExpiration / (1000 * 60 * 60 * 24));
        needsRenewal = isWebhookExpired(conn.webhook_expiration);
      }

      return {
        connectionId: conn.id,
        calendarEmail: conn.calendar_email,
        webhookExpiration: conn.webhook_expiration,
        daysUntilExpiration,
        needsRenewal,
      };
    });
  } catch (error) {
    console.error('Error getting webhook renewal status:', error);
    return [];
  }
}
