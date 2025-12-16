/**
 * Phase 8: Production Twilio Provider for SMS Notifications
 * Real implementation using Twilio SDK
 */

import type { SMSProvider, SMSParams, SMSResult } from '../notifications/types';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default from phone number for The Puppy Day (E.164 format)
 */
const DEFAULT_FROM_PHONE = '+16572522903'; // (657) 252-2903

// ============================================================================
// TWILIO PROVIDER
// ============================================================================

/**
 * Production implementation of Twilio SMS provider
 * Requires: npm install twilio
 */
export class TwilioProvider implements SMSProvider {
  private accountSid: string;
  private authToken: string;
  private fromPhone: string;
  private client: unknown; // Will be typed when twilio package is installed

  /**
   * Create a new Twilio provider
   * @param accountSid - Twilio Account SID (from TWILIO_ACCOUNT_SID environment variable)
   * @param authToken - Twilio Auth Token (from TWILIO_AUTH_TOKEN environment variable)
   * @param fromPhone - From phone number in E.164 format (from TWILIO_PHONE_NUMBER environment variable)
   */
  constructor(accountSid?: string, authToken?: string, fromPhone?: string) {
    this.accountSid = accountSid || process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = authToken || process.env.TWILIO_AUTH_TOKEN || '';
    this.fromPhone = fromPhone || process.env.TWILIO_PHONE_NUMBER || DEFAULT_FROM_PHONE;

    if (!this.accountSid) {
      throw new Error('TWILIO_ACCOUNT_SID environment variable is required');
    }

    if (!this.authToken) {
      throw new Error('TWILIO_AUTH_TOKEN environment variable is required');
    }

    // Ensure phone number is in E.164 format
    this.fromPhone = this.normalizePhoneNumber(this.fromPhone);

    // Dynamically import Twilio SDK
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = require('twilio');
      this.client = twilio(this.accountSid, this.authToken);
      console.log('[Twilio] Initialized production SMS provider');
    } catch {
      throw new Error(
        'Twilio SDK not installed. Run: npm install twilio'
      );
    }
  }

  /**
   * Send an SMS using Twilio SDK
   */
  async send(params: SMSParams): Promise<SMSResult> {
    try {
      // Normalize phone numbers to E.164 format
      const toPhone = this.normalizePhoneNumber(params.to);
      const fromPhone = params.from
        ? this.normalizePhoneNumber(params.from)
        : this.fromPhone;

      // Send SMS via Twilio SDK
      const message = await this.client.messages.create({
        body: params.body,
        to: toPhone,
        from: fromPhone,
      });

      // Calculate segment count from Twilio response
      const segmentCount = message.numSegments || this.calculateSegmentCount(params.body);

      console.log('[Twilio] ✅ SMS sent:', {
        to: toPhone,
        from: fromPhone,
        sid: message.sid,
        status: message.status,
        segments: segmentCount,
        bodyLength: params.body.length,
      });

      return {
        success: true,
        messageId: message.sid,
        segmentCount,
      };
    } catch (error) {
      const errorMessage = this.transformError(error);

      console.error('[Twilio] ❌ SMS send failed:', {
        to: params.to,
        bodyLength: params.body.length,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // ==========================================================================
  // PHONE NUMBER UTILITIES
  // ==========================================================================

  /**
   * Normalize phone number to E.164 format
   * Converts formats like (657) 252-2903 to +16572522903
   */
  private normalizePhoneNumber(phone: string): string {
    // Already in E.164 format
    if (phone.startsWith('+')) {
      return phone;
    }

    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Add +1 country code if not present
    if (digits.length === 10) {
      return `+1${digits}`;
    }

    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }

    // Return as-is if already formatted correctly
    return phone;
  }

  /**
   * Calculate SMS segment count based on message length
   * Single segment: up to 160 characters
   * Multi-segment: 153 characters per segment
   */
  private calculateSegmentCount(text: string): number {
    const length = text.length;

    if (length === 0) {
      return 0;
    }

    if (length <= 160) {
      return 1;
    }

    // Multi-segment messages use 153 characters per segment
    return Math.ceil(length / 153);
  }

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  /**
   * Transform Twilio-specific errors into user-friendly messages
   */
  private transformError(error: unknown): string {
    if (error instanceof Error) {
      const message = error.message;

      // Handle specific Twilio error codes
      if (message.includes('20003')) {
        return 'Invalid Twilio credentials. Please check your Account SID and Auth Token.';
      }

      if (message.includes('21211')) {
        return 'Invalid "To" phone number. Please use E.164 format (e.g., +15551234567).';
      }

      if (message.includes('21212')) {
        return 'Invalid "From" phone number. Please verify your Twilio phone number.';
      }

      if (message.includes('21408')) {
        return 'Phone number not verified in Twilio. Please verify the number in your Twilio console.';
      }

      if (message.includes('21610')) {
        return 'Message cannot be sent to this destination. The recipient may have opted out.';
      }

      if (message.includes('30007')) {
        return 'Message filtered by carrier. The content may have been flagged as spam.';
      }

      if (message.includes('rate limit') || message.includes('429')) {
        return 'Twilio rate limit exceeded. Please try again later.';
      }

      if (message.includes('insufficient balance')) {
        return 'Insufficient Twilio account balance. Please add funds to your account.';
      }

      return message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }

    return 'Unknown error occurred while sending SMS';
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a Twilio provider instance
 */
export function createTwilioProvider(
  accountSid?: string,
  authToken?: string,
  fromPhone?: string
): SMSProvider {
  return new TwilioProvider(accountSid, authToken, fromPhone);
}

/**
 * Global singleton instance for production use
 */
let globalInstance: TwilioProvider | null = null;

/**
 * Get or create the global Twilio provider instance
 */
export function getTwilioProvider(): TwilioProvider {
  if (!globalInstance) {
    globalInstance = new TwilioProvider();
  }
  return globalInstance;
}

/**
 * Reset the global instance (for testing)
 */
export function resetTwilioProvider(): void {
  globalInstance = null;
}
