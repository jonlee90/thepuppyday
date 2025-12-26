/**
 * Google OAuth 2.0 Client Factory
 * Handles Google Calendar OAuth authentication flow
 */

import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import type { GoogleOAuthTokens } from '@/types/calendar';

/**
 * Google Calendar API scopes required for the integration
 */
export const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
] as const;

/**
 * OAuth configuration from environment variables
 */
interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Get OAuth configuration from environment variables
 * @throws Error if required environment variables are not set
 */
function getOAuthConfig(): OAuthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId) {
    throw new Error(
      'GOOGLE_CLIENT_ID environment variable is not set. ' +
      'Please configure Google OAuth credentials.'
    );
  }

  if (!clientSecret) {
    throw new Error(
      'GOOGLE_CLIENT_SECRET environment variable is not set. ' +
      'Please configure Google OAuth credentials.'
    );
  }

  if (!appUrl) {
    throw new Error(
      'NEXT_PUBLIC_APP_URL environment variable is not set. ' +
      'Please configure the application URL.'
    );
  }

  const redirectUri = `${appUrl}/api/admin/calendar/auth/callback`;

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

/**
 * Create a new Google OAuth2 client
 *
 * @returns Configured OAuth2Client instance
 *
 * @example
 * ```typescript
 * const oauth2Client = createOAuth2Client();
 * const authUrl = generateAuthUrl(oauth2Client, 'admin-user-id');
 * ```
 */
export function createOAuth2Client(): OAuth2Client {
  const config = getOAuthConfig();

  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );
}

/**
 * Generate Google OAuth authorization URL
 *
 * @param adminUserId - Admin user ID to pass as state parameter
 * @returns Authorization URL to redirect user to
 *
 * @example
 * ```typescript
 * const authUrl = generateAuthUrl('user-123-uuid');
 * // Redirect user to authUrl
 * ```
 */
export function generateAuthUrl(adminUserId: string): string {
  const oauth2Client = createOAuth2Client();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request refresh token
    prompt: 'consent', // Force consent screen to ensure refresh token
    scope: GOOGLE_CALENDAR_SCOPES,
    state: adminUserId, // Pass admin ID for verification in callback
  });

  return authUrl;
}

/**
 * Exchange authorization code for OAuth tokens
 *
 * @param code - Authorization code from Google OAuth callback
 * @returns OAuth tokens including access token and refresh token
 *
 * @throws Error if token exchange fails
 *
 * @example
 * ```typescript
 * const tokens = await exchangeCodeForTokens('4/0AY0e-g7...');
 * console.log(tokens.access_token);
 * console.log(tokens.refresh_token);
 * ```
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<GoogleOAuthTokens> {
  if (!code) {
    throw new Error('Authorization code is required');
  }

  try {
    const oauth2Client = createOAuth2Client();

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error('No access token received from Google');
    }

    if (!tokens.refresh_token) {
      throw new Error(
        'No refresh token received from Google. ' +
        'User may have already authorized this app. ' +
        'Try revoking access and re-authorizing.'
      );
    }

    if (!tokens.expiry_date) {
      throw new Error('No expiry date received from Google');
    }

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      token_type: tokens.token_type || 'Bearer',
      scope: tokens.scope || GOOGLE_CALENDAR_SCOPES.join(' '),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to exchange authorization code: ${error.message}`);
    }
    throw new Error('Failed to exchange authorization code: Unknown error');
  }
}

/**
 * Refresh an expired access token using a refresh token
 *
 * @param refreshToken - OAuth refresh token
 * @returns New OAuth tokens
 *
 * @throws Error if token refresh fails
 *
 * @example
 * ```typescript
 * const newTokens = await refreshAccessToken('1//0gWxyz...');
 * console.log(newTokens.access_token);
 * ```
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<GoogleOAuthTokens> {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  try {
    const oauth2Client = createOAuth2Client();

    // Set the refresh token
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // Request new access token
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error('No access token received from Google');
    }

    if (!credentials.expiry_date) {
      throw new Error('No expiry date received from Google');
    }

    return {
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || refreshToken, // Use existing refresh token if not provided
      expiry_date: credentials.expiry_date,
      token_type: credentials.token_type || 'Bearer',
      scope: credentials.scope || GOOGLE_CALENDAR_SCOPES.join(' '),
    };
  } catch (error) {
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('invalid_grant')) {
        throw new Error(
          'Refresh token is invalid or revoked. Please reconnect Google Calendar.'
        );
      }
      throw new Error(`Failed to refresh access token: ${error.message}`);
    }
    throw new Error('Failed to refresh access token: Unknown error');
  }
}

/**
 * Revoke OAuth tokens (disconnect Google Calendar)
 *
 * @param accessToken - Current access token to revoke
 * @returns True if revocation succeeded
 *
 * @throws Error if token revocation fails
 *
 * @example
 * ```typescript
 * await revokeTokens('ya29.a0AfH6...');
 * console.log('Tokens revoked successfully');
 * ```
 */
export async function revokeTokens(accessToken: string): Promise<boolean> {
  if (!accessToken) {
    throw new Error('Access token is required for revocation');
  }

  try {
    const oauth2Client = createOAuth2Client();

    // Set credentials for revocation
    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    // Revoke the token
    await oauth2Client.revokeCredentials();

    return true;
  } catch (error) {
    if (error instanceof Error) {
      // Log error but don't throw - revocation may fail if token is already invalid
      console.error('Token revocation error:', error.message);

      // If token is already invalid, consider it successfully revoked
      if (error.message.includes('invalid_token')) {
        return true;
      }

      throw new Error(`Failed to revoke tokens: ${error.message}`);
    }
    throw new Error('Failed to revoke tokens: Unknown error');
  }
}

/**
 * Create an authenticated OAuth2 client with tokens
 *
 * @param tokens - OAuth tokens to authenticate with
 * @returns Authenticated OAuth2Client
 *
 * @example
 * ```typescript
 * const client = createAuthenticatedClient(tokens);
 * const calendar = google.calendar({ version: 'v3', auth: client });
 * ```
 */
export function createAuthenticatedClient(
  tokens: GoogleOAuthTokens
): OAuth2Client {
  const oauth2Client = createOAuth2Client();

  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    token_type: tokens.token_type,
    scope: tokens.scope,
  });

  return oauth2Client;
}

/**
 * Validate OAuth configuration
 *
 * @throws Error if OAuth is not properly configured
 */
export function validateOAuthConfig(): void {
  try {
    getOAuthConfig();
  } catch (error) {
    throw new Error(
      'OAuth configuration validation failed: ' +
      (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}
