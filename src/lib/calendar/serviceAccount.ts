/**
 * Google Calendar Service Account Authentication
 *
 * Replaces OAuth flow with service account for server-to-server authentication.
 * Service account must be granted access to the target Google Calendar.
 */

import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

// Service account JSON structure
export interface ServiceAccountCredentials {
  type: 'service_account';
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// Google Calendar scopes needed
// Using full calendar scope for calendar metadata access
const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
] as const;

/**
 * Validate service account credentials structure
 */
export function validateServiceAccountCredentials(
  credentials: unknown
): credentials is ServiceAccountCredentials {
  if (!credentials || typeof credentials !== 'object') {
    return false;
  }

  const creds = credentials as Record<string, unknown>;

  const requiredFields = [
    'type',
    'project_id',
    'private_key_id',
    'private_key',
    'client_email',
    'client_id',
  ];

  for (const field of requiredFields) {
    if (!creds[field] || typeof creds[field] !== 'string') {
      return false;
    }
  }

  if (creds.type !== 'service_account') {
    return false;
  }

  return true;
}

/**
 * Create authenticated Google Calendar client from service account credentials
 */
export async function createCalendarClient(
  credentials: ServiceAccountCredentials
): Promise<ReturnType<typeof google.calendar>> {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: GOOGLE_CALENDAR_SCOPES,
  });

  const authClient = await auth.getClient();

  return google.calendar({
    version: 'v3',
    auth: authClient,
  });
}

/**
 * Test service account connection by listing calendars
 * Throws error if connection fails
 */
export async function testServiceAccountConnection(
  credentials: ServiceAccountCredentials,
  calendarId: string = 'primary'
): Promise<{
  success: boolean;
  calendarEmail?: string;
  calendarName?: string;
  error?: string;
}> {
  try {
    const calendar = await createCalendarClient(credentials);

    // Try to get calendar metadata
    const response = await calendar.calendars.get({
      calendarId,
    });

    return {
      success: true,
      calendarEmail: response.data.id || undefined,
      calendarName: response.data.summary || undefined,
    };
  } catch (error) {
    console.error('Service account connection test failed:', error);

    let errorMessage = 'Failed to connect to Google Calendar';

    if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = (error as Error).message;
    }

    // Provide helpful error messages
    if (errorMessage.includes('invalid_grant')) {
      errorMessage =
        'Invalid service account credentials. Please check your JSON file.';
    } else if (errorMessage.includes('Not Found')) {
      errorMessage = `Calendar "${calendarId}" not found or service account doesn't have access. Make sure to share the calendar with ${credentials.client_email}`;
    } else if (errorMessage.includes('Insufficient Permission')) {
      errorMessage = `Service account doesn't have permission to access calendar "${calendarId}". Share the calendar with ${credentials.client_email} and grant "Make changes to events" permission.`;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get active calendar connection from database
 */
export async function getActiveConnection(): Promise<{
  id: string;
  credentials: ServiceAccountCredentials;
  calendarId: string;
  serviceAccountEmail: string;
} | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('calendar_connections')
    .select('id, credentials, calendar_id, service_account_email')
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  // Decrypt credentials (they're stored encrypted)
  const credentials = JSON.parse(data.credentials) as ServiceAccountCredentials;

  return {
    id: data.id,
    credentials,
    calendarId: data.calendar_id,
    serviceAccountEmail: data.service_account_email,
  };
}

/**
 * Save service account connection to database
 */
export async function saveConnection(
  credentials: ServiceAccountCredentials,
  calendarId: string,
  adminUserId: string
): Promise<{ success: boolean; error?: string; connectionId?: string }> {
  try {
    // First, test the connection
    const testResult = await testServiceAccountConnection(credentials, calendarId);

    if (!testResult.success) {
      return {
        success: false,
        error: testResult.error,
      };
    }

    const supabase = await createClient();

    // Deactivate any existing connections
    await supabase
      .from('calendar_connections')
      .update({ is_active: false })
      .eq('is_active', true);

    // Create new connection
    const { data, error } = await supabase
      .from('calendar_connections')
      .insert({
        admin_id: adminUserId,
        provider: 'google',
        calendar_id: calendarId,
        calendar_email: testResult.calendarEmail,
        calendar_name: testResult.calendarName,
        service_account_email: credentials.client_email,
        credentials: JSON.stringify(credentials), // Will be encrypted by RLS policy
        is_active: true,
        last_sync_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to save connection:', error);
      return {
        success: false,
        error: `Failed to save connection to database: ${error.message || 'Unknown error'}`,
      };
    }

    return {
      success: true,
      connectionId: data.id,
    };
  } catch (error) {
    console.error('Error saving connection:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * List available calendars for the service account
 */
export async function listCalendars(
  credentials: ServiceAccountCredentials
): Promise<
  Array<{
    id: string;
    name: string;
    description?: string;
    primary?: boolean;
  }>
> {
  try {
    const calendar = await createCalendarClient(credentials);

    const response = await calendar.calendarList.list({
      maxResults: 50,
    });

    const calendars = response.data.items || [];

    return calendars.map((cal) => ({
      id: cal.id || '',
      name: cal.summary || 'Unnamed Calendar',
      description: cal.description,
      primary: cal.primary,
    }));
  } catch (error) {
    console.error('Failed to list calendars:', error);
    return [];
  }
}

/**
 * Disconnect (delete) service account connection
 */
export async function disconnectServiceAccount(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Just deactivate the connection
    const { error } = await supabase
      .from('calendar_connections')
      .update({ is_active: false })
      .eq('is_active', true);

    if (error) {
      console.error('Failed to disconnect:', error);
      return {
        success: false,
        error: 'Failed to disconnect calendar',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error disconnecting:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
