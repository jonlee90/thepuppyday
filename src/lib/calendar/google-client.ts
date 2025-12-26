/**
 * Google Calendar API Client Wrapper
 * Wrapper around googleapis with rate limiting and error handling
 */

import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GoogleCalendarEvent } from '@/types/calendar';
import { getValidAccessToken } from './token-manager';
import { createAuthenticatedClient } from './oauth';
import { retrieveTokens } from './token-manager';

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_DELAY_MS = 100; // Delay between requests
const MAX_RETRIES = 3; // Maximum retry attempts
const INITIAL_BACKOFF_MS = 1000; // Initial backoff delay

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 *
 * @param attempt - Retry attempt number (0-indexed)
 * @returns Delay in milliseconds
 */
function getBackoffDelay(attempt: number): number {
  return INITIAL_BACKOFF_MS * Math.pow(2, attempt);
}

/**
 * Check if error is retryable
 *
 * @param error - Error object
 * @returns True if error should be retried
 */
function isRetryableError(error: any): boolean {
  if (!error.response) return false;

  const status = error.response.status;

  // Retry on rate limit (429) and server errors (5xx)
  return status === 429 || (status >= 500 && status < 600);
}

/**
 * Extract error message from Google API error
 *
 * @param error - Error object
 * @returns Error message
 */
function extractErrorMessage(error: any): string {
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Unknown Google Calendar API error';
}

/**
 * Extract error code from Google API error
 *
 * @param error - Error object
 * @returns Error code
 */
function extractErrorCode(error: any): string {
  if (error.response?.status) {
    return `HTTP_${error.response.status}`;
  }
  if (error.code) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}

/**
 * Google Calendar API client wrapper
 */
export class GoogleCalendarClient {
  private supabase: SupabaseClient;
  private connectionId: string;
  private calendarId: string;
  private calendar: calendar_v3.Calendar | null = null;
  private lastRequestTime: number = 0;

  constructor(
    supabase: SupabaseClient,
    connectionId: string,
    calendarId: string = 'primary'
  ) {
    this.supabase = supabase;
    this.connectionId = connectionId;
    this.calendarId = calendarId;
  }

  /**
   * Initialize the calendar client with authentication
   *
   * @throws Error if authentication fails
   */
  private async initializeClient(): Promise<void> {
    if (this.calendar) return;

    try {
      // Get valid access token (auto-refreshes if needed)
      await getValidAccessToken(this.supabase, this.connectionId);

      // Retrieve tokens
      const tokens = await retrieveTokens(this.supabase, this.connectionId);

      // Create authenticated OAuth client
      const auth = createAuthenticatedClient(tokens);

      // Create calendar client
      this.calendar = google.calendar({ version: 'v3', auth });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to initialize Google Calendar client: ${error.message}`);
      }
      throw new Error('Failed to initialize Google Calendar client: Unknown error');
    }
  }

  /**
   * Apply rate limiting
   */
  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < RATE_LIMIT_DELAY_MS) {
      await sleep(RATE_LIMIT_DELAY_MS - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Execute API request with retry logic
   *
   * @param operation - API operation to execute
   * @returns Operation result
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Apply rate limiting before request
        await this.applyRateLimit();

        // Execute operation
        return await operation();
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (!isRetryableError(error)) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < MAX_RETRIES - 1) {
          const backoffDelay = getBackoffDelay(attempt);
          console.warn(
            `Google Calendar API request failed (attempt ${attempt + 1}/${MAX_RETRIES}), ` +
            `retrying in ${backoffDelay}ms...`
          );
          await sleep(backoffDelay);
        }
      }
    }

    // All retries exhausted
    throw lastError;
  }

  /**
   * Create a new calendar event
   *
   * @param eventData - Event data to create
   * @returns Created event with ID
   *
   * @throws Error if creation fails
   */
  async createEvent(
    eventData: Omit<GoogleCalendarEvent, 'id' | 'created' | 'updated'>
  ): Promise<GoogleCalendarEvent> {
    try {
      await this.initializeClient();

      const result = await this.executeWithRetry(async () => {
        return await this.calendar!.events.insert({
          calendarId: this.calendarId,
          requestBody: eventData as calendar_v3.Schema$Event,
        });
      });

      if (!result.data.id) {
        throw new Error('No event ID returned from Google Calendar');
      }

      return result.data as GoogleCalendarEvent;
    } catch (error) {
      const message = extractErrorMessage(error);
      const code = extractErrorCode(error);
      throw new Error(`Failed to create calendar event: ${message} (${code})`);
    }
  }

  /**
   * Update an existing calendar event
   *
   * @param eventId - Google Calendar event ID
   * @param eventData - Updated event data
   * @returns Updated event
   *
   * @throws Error if update fails
   */
  async updateEvent(
    eventId: string,
    eventData: Omit<GoogleCalendarEvent, 'id' | 'created' | 'updated'>
  ): Promise<GoogleCalendarEvent> {
    try {
      await this.initializeClient();

      const result = await this.executeWithRetry(async () => {
        return await this.calendar!.events.update({
          calendarId: this.calendarId,
          eventId,
          requestBody: eventData as calendar_v3.Schema$Event,
        });
      });

      return result.data as GoogleCalendarEvent;
    } catch (error) {
      const message = extractErrorMessage(error);
      const code = extractErrorCode(error);
      throw new Error(`Failed to update calendar event: ${message} (${code})`);
    }
  }

  /**
   * Delete a calendar event
   *
   * @param eventId - Google Calendar event ID
   *
   * @throws Error if deletion fails
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.initializeClient();

      await this.executeWithRetry(async () => {
        return await this.calendar!.events.delete({
          calendarId: this.calendarId,
          eventId,
        });
      });
    } catch (error) {
      const message = extractErrorMessage(error);
      const code = extractErrorCode(error);

      // If event doesn't exist, consider it a successful deletion
      if (code === 'HTTP_404' || code === 'HTTP_410') {
        console.warn(`Event ${eventId} not found, considering it deleted`);
        return;
      }

      throw new Error(`Failed to delete calendar event: ${message} (${code})`);
    }
  }

  /**
   * Get a calendar event by ID
   *
   * @param eventId - Google Calendar event ID
   * @returns Event data
   *
   * @throws Error if retrieval fails or event not found
   */
  async getEvent(eventId: string): Promise<GoogleCalendarEvent> {
    try {
      await this.initializeClient();

      const result = await this.executeWithRetry(async () => {
        return await this.calendar!.events.get({
          calendarId: this.calendarId,
          eventId,
        });
      });

      return result.data as GoogleCalendarEvent;
    } catch (error) {
      const message = extractErrorMessage(error);
      const code = extractErrorCode(error);
      throw new Error(`Failed to get calendar event: ${message} (${code})`);
    }
  }

  /**
   * List calendar events in a date range
   *
   * @param options - List options
   * @returns Array of events
   *
   * @throws Error if list fails
   */
  async listEvents(options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  }): Promise<GoogleCalendarEvent[]> {
    try {
      await this.initializeClient();

      const result = await this.executeWithRetry(async () => {
        return await this.calendar!.events.list({
          calendarId: this.calendarId,
          timeMin: options.timeMin,
          timeMax: options.timeMax,
          maxResults: options.maxResults || 250,
          singleEvents: true,
          orderBy: 'startTime',
        });
      });

      return (result.data.items || []) as GoogleCalendarEvent[];
    } catch (error) {
      const message = extractErrorMessage(error);
      const code = extractErrorCode(error);
      throw new Error(`Failed to list calendar events: ${message} (${code})`);
    }
  }

  /**
   * Check if event exists
   *
   * @param eventId - Google Calendar event ID
   * @returns True if event exists
   */
  async eventExists(eventId: string): Promise<boolean> {
    try {
      await this.getEvent(eventId);
      return true;
    } catch (error) {
      const code = extractErrorCode(error);
      if (code === 'HTTP_404' || code === 'HTTP_410') {
        return false;
      }
      // Re-throw other errors
      throw error;
    }
  }
}

/**
 * Create a Google Calendar client instance
 *
 * @param supabase - Supabase client
 * @param connectionId - Calendar connection ID
 * @param calendarId - Google Calendar ID (default: 'primary')
 * @returns Google Calendar client instance
 *
 * @example
 * ```typescript
 * const client = createGoogleCalendarClient(supabase, connectionId);
 * const event = await client.createEvent(eventData);
 * ```
 */
export function createGoogleCalendarClient(
  supabase: SupabaseClient,
  connectionId: string,
  calendarId: string = 'primary'
): GoogleCalendarClient {
  return new GoogleCalendarClient(supabase, connectionId, calendarId);
}
