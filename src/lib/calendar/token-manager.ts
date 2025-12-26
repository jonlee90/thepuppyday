/**
 * Token Manager
 * Handles OAuth token lifecycle with auto-refresh and encryption
 */

import { encryptToken, decryptToken } from './encryption';
import { refreshAccessToken } from './oauth';
import type { GoogleOAuthTokens, CalendarConnection } from '@/types/calendar';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Token refresh buffer time (5 minutes before expiry)
 * Refresh tokens 5 minutes before they expire to avoid race conditions
 */
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

/**
 * Check if access token is expired or about to expire
 *
 * @param expiryDate - Token expiry timestamp in milliseconds
 * @returns True if token is expired or will expire within buffer time
 */
export function isTokenExpired(expiryDate: number): boolean {
  const now = Date.now();
  const expiryWithBuffer = expiryDate - TOKEN_REFRESH_BUFFER_MS;
  return now >= expiryWithBuffer;
}

/**
 * Store OAuth tokens in database (encrypted)
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param tokens - OAuth tokens to store
 *
 * @throws Error if storage fails
 */
export async function storeTokens(
  supabase: SupabaseClient,
  connectionId: string,
  tokens: GoogleOAuthTokens
): Promise<void> {
  try {
    // Encrypt tokens before storage
    const encryptedAccessToken = encryptToken(tokens.access_token);
    const encryptedRefreshToken = encryptToken(tokens.refresh_token);

    // Convert expiry_date to ISO timestamp
    const tokenExpiry = new Date(tokens.expiry_date).toISOString();

    // Update connection with encrypted tokens
    const { error } = await supabase
      .from('calendar_connections')
      .update({
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expiry: tokenExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    if (error) {
      throw new Error(`Failed to store tokens: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Token storage failed: ${error.message}`);
    }
    throw new Error('Token storage failed: Unknown error');
  }
}

/**
 * Retrieve and decrypt OAuth tokens from database
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @returns Decrypted OAuth tokens
 *
 * @throws Error if retrieval or decryption fails
 */
export async function retrieveTokens(
  supabase: SupabaseClient,
  connectionId: string
): Promise<GoogleOAuthTokens> {
  try {
    const { data, error } = await supabase
      .from('calendar_connections')
      .select('access_token, refresh_token, token_expiry')
      .eq('id', connectionId)
      .single();

    if (error) {
      throw new Error(`Failed to retrieve tokens: ${error.message}`);
    }

    if (!data) {
      throw new Error('Calendar connection not found');
    }

    // Decrypt tokens
    const accessToken = decryptToken(data.access_token);
    const refreshToken = decryptToken(data.refresh_token);

    // Convert ISO timestamp to milliseconds
    const expiryDate = new Date(data.token_expiry).getTime();

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expiry_date: expiryDate,
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/calendar.events',
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Token retrieval failed: ${error.message}`);
    }
    throw new Error('Token retrieval failed: Unknown error');
  }
}

/**
 * Get valid access token (auto-refresh if expired)
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @returns Valid access token
 *
 * @throws Error if token refresh fails or connection is invalid
 */
export async function getValidAccessToken(
  supabase: SupabaseClient,
  connectionId: string
): Promise<string> {
  try {
    // Retrieve current tokens
    const tokens = await retrieveTokens(supabase, connectionId);

    // Check if token is expired or about to expire
    if (isTokenExpired(tokens.expiry_date)) {
      // Refresh the access token
      const newTokens = await refreshAccessToken(tokens.refresh_token);

      // Store updated tokens
      await storeTokens(supabase, connectionId, newTokens);

      return newTokens.access_token;
    }

    // Token is still valid
    return tokens.access_token;
  } catch (error) {
    if (error instanceof Error) {
      // Check for specific errors that require disconnection
      if (
        error.message.includes('invalid or revoked') ||
        error.message.includes('invalid_grant')
      ) {
        // Token is permanently invalid - mark connection as inactive
        await disconnectOnTokenError(supabase, connectionId);
        throw new Error(
          'Calendar connection is invalid. Please reconnect Google Calendar.'
        );
      }

      throw new Error(`Failed to get valid access token: ${error.message}`);
    }
    throw new Error('Failed to get valid access token: Unknown error');
  }
}

/**
 * Disconnect calendar connection due to token error
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 */
async function disconnectOnTokenError(
  supabase: SupabaseClient,
  connectionId: string
): Promise<void> {
  try {
    await supabase
      .from('calendar_connections')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);
  } catch (error) {
    // Log error but don't throw - this is a cleanup operation
    console.error('Failed to disconnect connection on token error:', error);
  }
}

/**
 * Refresh OAuth tokens manually
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @returns New OAuth tokens
 *
 * @throws Error if refresh fails
 */
export async function refreshTokens(
  supabase: SupabaseClient,
  connectionId: string
): Promise<GoogleOAuthTokens> {
  try {
    // Retrieve current tokens
    const tokens = await retrieveTokens(supabase, connectionId);

    // Refresh access token using refresh token
    const newTokens = await refreshAccessToken(tokens.refresh_token);

    // Store updated tokens
    await storeTokens(supabase, connectionId, newTokens);

    return newTokens;
  } catch (error) {
    if (error instanceof Error) {
      // Check for invalid refresh token errors
      if (
        error.message.includes('invalid or revoked') ||
        error.message.includes('invalid_grant')
      ) {
        // Mark connection as inactive
        await disconnectOnTokenError(supabase, connectionId);
        throw new Error(
          'Refresh token is invalid. Please reconnect Google Calendar.'
        );
      }

      throw new Error(`Token refresh failed: ${error.message}`);
    }
    throw new Error('Token refresh failed: Unknown error');
  }
}

/**
 * Create initial encrypted token storage
 *
 * @param tokens - OAuth tokens from initial authorization
 * @returns Encrypted token data for database insertion
 */
export function prepareTokensForStorage(tokens: GoogleOAuthTokens): {
  access_token: string;
  refresh_token: string;
  token_expiry: string;
} {
  return {
    access_token: encryptToken(tokens.access_token),
    refresh_token: encryptToken(tokens.refresh_token),
    token_expiry: new Date(tokens.expiry_date).toISOString(),
  };
}

/**
 * Validate that token expiry is in the future
 *
 * @param expiryDate - Token expiry timestamp in milliseconds
 * @returns True if token expiry is valid
 */
export function isTokenExpiryValid(expiryDate: number): boolean {
  const now = Date.now();
  // Token should expire in the future (at least 1 minute from now)
  return expiryDate > now + 60000;
}
