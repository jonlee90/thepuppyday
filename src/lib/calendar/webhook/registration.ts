/**
 * Webhook Registration Service
 * Manages Google Calendar push notification webhooks (watch requests)
 */

import { google } from 'googleapis';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CalendarConnection } from '@/types/calendar';
import { getValidAccessToken, retrieveTokens } from '../token-manager';
import { createAuthenticatedClient } from '../oauth';
import { updateConnectionMetadata } from '../connection';

/**
 * Webhook expiration time (7 days in milliseconds)
 * Google Calendar webhooks expire after ~7 days
 */
const WEBHOOK_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Webhook renewal threshold (24 hours in milliseconds)
 * Renew webhooks when they expire within 24 hours
 */
const WEBHOOK_RENEWAL_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/**
 * Webhook registration result
 */
export interface WebhookRegistrationResult {
  channelId: string;
  resourceId: string;
  expiration: string; // ISO timestamp
}

/**
 * Get webhook callback URL
 *
 * @returns Webhook callback URL
 */
export function getWebhookUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL environment variable is not set. ' +
      'Please configure the application URL for webhook callbacks.'
    );
  }

  return `${appUrl}/api/admin/calendar/webhook`;
}

/**
 * Check if webhook is expired or will expire soon
 *
 * @param webhookExpiration - Webhook expiration timestamp (ISO string)
 * @returns True if webhook needs renewal
 */
export function isWebhookExpired(webhookExpiration: string | null): boolean {
  if (!webhookExpiration) {
    return true;
  }

  const expirationDate = new Date(webhookExpiration).getTime();
  const now = Date.now();

  // Check if webhook expires within the renewal threshold (24 hours)
  return expirationDate - now <= WEBHOOK_RENEWAL_THRESHOLD_MS;
}

/**
 * Register webhook push notification for calendar changes
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param calendarId - Google Calendar ID (default: 'primary')
 * @returns Webhook registration details
 *
 * @throws Error if registration fails
 *
 * @example
 * ```typescript
 * const webhook = await registerWebhook(supabase, connectionId, 'primary');
 * console.log('Webhook registered:', webhook.channelId);
 * console.log('Expires at:', webhook.expiration);
 * ```
 */
export async function registerWebhook(
  supabase: SupabaseClient,
  connectionId: string,
  calendarId: string = 'primary'
): Promise<WebhookRegistrationResult> {
  try {
    // Get valid access token (auto-refreshes if needed)
    await getValidAccessToken(supabase, connectionId);

    // Retrieve tokens for authentication
    const tokens = await retrieveTokens(supabase, connectionId);

    // Create authenticated OAuth client
    const auth = createAuthenticatedClient(tokens);

    // Create calendar client
    const calendar = google.calendar({ version: 'v3', auth });

    // Generate unique channel ID
    const channelId = crypto.randomUUID();

    // Calculate expiration (7 days from now)
    const expiration = Date.now() + WEBHOOK_EXPIRATION_MS;

    // Get webhook callback URL
    const webhookUrl = getWebhookUrl();

    // Register webhook with Google Calendar API
    const response = await calendar.events.watch({
      calendarId: calendarId,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        expiration: expiration.toString(),
      },
    });

    if (!response.data.id) {
      throw new Error('No channel ID returned from Google Calendar');
    }

    if (!response.data.resourceId) {
      throw new Error('No resource ID returned from Google Calendar');
    }

    if (!response.data.expiration) {
      throw new Error('No expiration returned from Google Calendar');
    }

    // Convert expiration to ISO timestamp
    const expirationISO = new Date(parseInt(response.data.expiration)).toISOString();

    // Store webhook info in database
    await updateConnectionMetadata(supabase, connectionId, {
      webhook_channel_id: response.data.id,
      webhook_resource_id: response.data.resourceId,
      webhook_expiration: expirationISO,
    });

    console.log(`Webhook registered successfully:`, {
      channelId: response.data.id,
      resourceId: response.data.resourceId,
      expiration: expirationISO,
    });

    return {
      channelId: response.data.id,
      resourceId: response.data.resourceId,
      expiration: expirationISO,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to register webhook: ${error.message}`);
    }
    throw new Error('Failed to register webhook: Unknown error');
  }
}

/**
 * Stop existing webhook push notification
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 *
 * @throws Error if stopping webhook fails
 *
 * @example
 * ```typescript
 * await stopWebhook(supabase, connectionId);
 * console.log('Webhook stopped');
 * ```
 */
export async function stopWebhook(
  supabase: SupabaseClient,
  connectionId: string
): Promise<void> {
  try {
    // Retrieve connection to get webhook info
    const { data: connection, error } = await supabase
      .from('calendar_connections')
      .select('webhook_channel_id, webhook_resource_id')
      .eq('id', connectionId)
      .single();

    if (error) {
      throw new Error(`Failed to retrieve connection: ${error.message}`);
    }

    if (!connection) {
      throw new Error('Calendar connection not found');
    }

    // Check if webhook exists
    if (!connection.webhook_channel_id || !connection.webhook_resource_id) {
      console.warn('No webhook found for connection, nothing to stop');
      return;
    }

    // Get valid access token
    await getValidAccessToken(supabase, connectionId);

    // Retrieve tokens for authentication
    const tokens = await retrieveTokens(supabase, connectionId);

    // Create authenticated OAuth client
    const auth = createAuthenticatedClient(tokens);

    // Create calendar client
    const calendar = google.calendar({ version: 'v3', auth });

    // Stop webhook
    await calendar.channels.stop({
      requestBody: {
        id: connection.webhook_channel_id,
        resourceId: connection.webhook_resource_id,
      },
    });

    // Clear webhook info in database
    await updateConnectionMetadata(supabase, connectionId, {
      webhook_channel_id: null,
      webhook_resource_id: null,
      webhook_expiration: null,
    });

    console.log(`Webhook stopped successfully:`, {
      channelId: connection.webhook_channel_id,
      resourceId: connection.webhook_resource_id,
    });
  } catch (error) {
    if (error instanceof Error) {
      // If webhook is already invalid/expired, don't throw error
      if (
        error.message.includes('404') ||
        error.message.includes('410') ||
        error.message.includes('not found')
      ) {
        console.warn('Webhook not found or already expired, clearing database entry');

        // Clear webhook info in database
        await updateConnectionMetadata(supabase, connectionId, {
          webhook_channel_id: null,
          webhook_resource_id: null,
          webhook_expiration: null,
        });

        return;
      }

      throw new Error(`Failed to stop webhook: ${error.message}`);
    }
    throw new Error('Failed to stop webhook: Unknown error');
  }
}

/**
 * Check if connection has active webhook
 *
 * @param connection - Calendar connection
 * @returns True if connection has active webhook
 */
export function hasActiveWebhook(connection: CalendarConnection): boolean {
  return (
    connection.webhook_channel_id !== null &&
    connection.webhook_resource_id !== null &&
    connection.webhook_expiration !== null &&
    !isWebhookExpired(connection.webhook_expiration)
  );
}

/**
 * Ensure webhook is registered for connection
 * Registers new webhook if none exists or if existing webhook is expired
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param calendarId - Google Calendar ID (default: 'primary')
 * @returns Webhook registration details
 */
export async function ensureWebhook(
  supabase: SupabaseClient,
  connectionId: string,
  calendarId: string = 'primary'
): Promise<WebhookRegistrationResult> {
  try {
    // Get connection
    const { data: connection, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (error) {
      throw new Error(`Failed to retrieve connection: ${error.message}`);
    }

    if (!connection) {
      throw new Error('Calendar connection not found');
    }

    // Check if webhook exists and is valid
    if (hasActiveWebhook(connection)) {
      return {
        channelId: connection.webhook_channel_id!,
        resourceId: connection.webhook_resource_id!,
        expiration: connection.webhook_expiration!,
      };
    }

    // Stop existing webhook if any (may be expired)
    if (connection.webhook_channel_id && connection.webhook_resource_id) {
      try {
        await stopWebhook(supabase, connectionId);
      } catch (error) {
        // Log error but continue with new registration
        console.warn('Failed to stop existing webhook, continuing with new registration:', error);
      }
    }

    // Register new webhook
    return await registerWebhook(supabase, connectionId, calendarId);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to ensure webhook: ${error.message}`);
    }
    throw new Error('Failed to ensure webhook: Unknown error');
  }
}
