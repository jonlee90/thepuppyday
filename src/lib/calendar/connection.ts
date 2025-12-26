/**
 * Calendar Connection Service
 * Manages calendar connections in database with CRUD operations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CalendarConnection,
  CreateCalendarConnectionInput,
  UpdateCalendarConnectionInput,
  GoogleOAuthTokens,
} from '@/types/calendar';
import { prepareTokensForStorage } from './token-manager';
import { revokeTokens } from './oauth';
import { decryptToken } from './encryption';

/**
 * Get active calendar connection for an admin user
 *
 * @param supabase - Supabase client
 * @param adminId - Admin user ID
 * @returns Active calendar connection or null if not found
 *
 * @example
 * ```typescript
 * const connection = await getActiveConnection(supabase, 'user-123');
 * if (connection) {
 *   console.log('Connected to:', connection.calendar_email);
 * }
 * ```
 */
export async function getActiveConnection(
  supabase: SupabaseClient,
  adminId: string
): Promise<CalendarConnection | null> {
  try {
    const { data, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .single();

    if (error) {
      // PGRST116 means no rows returned
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch calendar connection: ${error.message}`);
    }

    return data as CalendarConnection;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get active connection: ${error.message}`);
    }
    throw new Error('Failed to get active connection: Unknown error');
  }
}

/**
 * Get calendar connection by ID
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @returns Calendar connection or null if not found
 */
export async function getConnectionById(
  supabase: SupabaseClient,
  connectionId: string
): Promise<CalendarConnection | null> {
  try {
    const { data, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch calendar connection: ${error.message}`);
    }

    return data as CalendarConnection;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get connection by ID: ${error.message}`);
    }
    throw new Error('Failed to get connection by ID: Unknown error');
  }
}

/**
 * Create new calendar connection
 *
 * @param supabase - Supabase client
 * @param adminId - Admin user ID
 * @param tokens - OAuth tokens from authorization
 * @param calendarEmail - Google account email
 * @param calendarId - Google calendar ID (default: 'primary')
 * @returns Created calendar connection
 *
 * @throws Error if connection already exists or creation fails
 *
 * @example
 * ```typescript
 * const connection = await createConnection(
 *   supabase,
 *   'admin-123',
 *   tokens,
 *   'admin@example.com',
 *   'primary'
 * );
 * ```
 */
export async function createConnection(
  supabase: SupabaseClient,
  adminId: string,
  tokens: GoogleOAuthTokens,
  calendarEmail: string,
  calendarId: string = 'primary'
): Promise<CalendarConnection> {
  try {
    // Check if active connection already exists
    const existingConnection = await getActiveConnection(supabase, adminId);
    if (existingConnection) {
      throw new Error(
        'Calendar connection already exists. Please disconnect before creating a new connection.'
      );
    }

    // Prepare encrypted tokens for storage
    const encryptedTokens = prepareTokensForStorage(tokens);

    // Create new connection
    const { data, error } = await supabase
      .from('calendar_connections')
      .insert({
        admin_id: adminId,
        access_token: encryptedTokens.access_token,
        refresh_token: encryptedTokens.refresh_token,
        token_expiry: encryptedTokens.token_expiry,
        calendar_id: calendarId,
        calendar_email: calendarEmail,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create calendar connection: ${error.message}`);
    }

    return data as CalendarConnection;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create connection: ${error.message}`);
    }
    throw new Error('Failed to create connection: Unknown error');
  }
}

/**
 * Update calendar connection metadata
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param updates - Fields to update
 * @returns Updated calendar connection
 *
 * @example
 * ```typescript
 * const updated = await updateConnectionMetadata(supabase, connectionId, {
 *   calendar_id: 'work-calendar',
 *   last_sync_at: new Date().toISOString(),
 * });
 * ```
 */
export async function updateConnectionMetadata(
  supabase: SupabaseClient,
  connectionId: string,
  updates: UpdateCalendarConnectionInput
): Promise<CalendarConnection> {
  try {
    const { data, error } = await supabase
      .from('calendar_connections')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update calendar connection: ${error.message}`);
    }

    return data as CalendarConnection;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update connection metadata: ${error.message}`);
    }
    throw new Error('Failed to update connection metadata: Unknown error');
  }
}

/**
 * Update last sync timestamp
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 */
export async function updateLastSync(
  supabase: SupabaseClient,
  connectionId: string
): Promise<void> {
  try {
    await updateConnectionMetadata(supabase, connectionId, {
      last_sync_at: new Date().toISOString(),
    });
  } catch (error) {
    // Log error but don't throw - this is a non-critical update
    console.error('Failed to update last sync timestamp:', error);
  }
}

/**
 * Delete calendar connection and revoke OAuth tokens
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param revokeOAuthTokens - Whether to revoke tokens with Google (default: true)
 *
 * @example
 * ```typescript
 * await deleteConnection(supabase, connectionId);
 * console.log('Connection deleted and tokens revoked');
 * ```
 */
export async function deleteConnection(
  supabase: SupabaseClient,
  connectionId: string,
  revokeOAuthTokens: boolean = true
): Promise<void> {
  try {
    // Get connection to retrieve access token
    const connection = await getConnectionById(supabase, connectionId);

    if (!connection) {
      throw new Error('Calendar connection not found');
    }

    // Revoke OAuth tokens with Google if requested
    if (revokeOAuthTokens && connection.is_active) {
      try {
        const accessToken = decryptToken(connection.access_token);
        await revokeTokens(accessToken);
      } catch (error) {
        // Log error but continue with deletion
        console.error('Failed to revoke OAuth tokens:', error);
      }
    }

    // Delete connection from database
    // This will cascade delete event mappings due to ON DELETE CASCADE
    const { error } = await supabase
      .from('calendar_connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      throw new Error(`Failed to delete calendar connection: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to delete connection: ${error.message}`);
    }
    throw new Error('Failed to delete connection: Unknown error');
  }
}

/**
 * Mark calendar connection as inactive (soft delete)
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 */
export async function deactivateConnection(
  supabase: SupabaseClient,
  connectionId: string
): Promise<void> {
  try {
    await updateConnectionMetadata(supabase, connectionId, {
      last_sync_at: null,
    });

    const { error } = await supabase
      .from('calendar_connections')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    if (error) {
      throw new Error(`Failed to deactivate connection: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to deactivate connection: ${error.message}`);
    }
    throw new Error('Failed to deactivate connection: Unknown error');
  }
}

/**
 * Update webhook channel information
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param channelId - Google Calendar webhook channel ID
 * @param resourceId - Google Calendar webhook resource ID
 * @param expiration - Webhook expiration timestamp (ISO string)
 */
export async function updateWebhookInfo(
  supabase: SupabaseClient,
  connectionId: string,
  channelId: string,
  resourceId: string,
  expiration: string
): Promise<void> {
  try {
    await updateConnectionMetadata(supabase, connectionId, {
      webhook_channel_id: channelId,
      webhook_resource_id: resourceId,
      webhook_expiration: expiration,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to update webhook info: ${error.message}`);
    }
    throw new Error('Failed to update webhook info: Unknown error');
  }
}

/**
 * Clear webhook channel information
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 */
export async function clearWebhookInfo(
  supabase: SupabaseClient,
  connectionId: string
): Promise<void> {
  try {
    await updateConnectionMetadata(supabase, connectionId, {
      webhook_channel_id: null,
      webhook_resource_id: null,
      webhook_expiration: null,
    });
  } catch (error) {
    // Log error but don't throw - this is a cleanup operation
    console.error('Failed to clear webhook info:', error);
  }
}

/**
 * Get all calendar connections (admin only, for monitoring)
 *
 * @param supabase - Supabase client
 * @param activeOnly - Only return active connections (default: true)
 * @returns Array of calendar connections
 */
export async function getAllConnections(
  supabase: SupabaseClient,
  activeOnly: boolean = true
): Promise<CalendarConnection[]> {
  try {
    let query = supabase
      .from('calendar_connections')
      .select('*')
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch calendar connections: ${error.message}`);
    }

    return (data as CalendarConnection[]) || [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to get all connections: ${error.message}`);
    }
    throw new Error('Failed to get all connections: Unknown error');
  }
}

/**
 * Check if admin has active calendar connection
 *
 * @param supabase - Supabase client
 * @param adminId - Admin user ID
 * @returns True if active connection exists
 */
export async function hasActiveConnection(
  supabase: SupabaseClient,
  adminId: string
): Promise<boolean> {
  const connection = await getActiveConnection(supabase, adminId);
  return connection !== null;
}
