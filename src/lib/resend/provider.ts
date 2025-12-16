/**
 * Phase 8: Production Resend Provider for Email Notifications
 * Real implementation using Resend SDK
 */

import type { EmailProvider, EmailParams, EmailResult } from '../notifications/types';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default from email address for The Puppy Day
 */
const DEFAULT_FROM_EMAIL = 'puppyday14936@gmail.com';

// ============================================================================
// RESEND PROVIDER
// ============================================================================

/**
 * Production implementation of Resend email provider
 * Requires: npm install resend
 */
export class ResendProvider implements EmailProvider {
  private apiKey: string;
  private fromEmail: string;
  private resend: unknown; // Will be typed when resend package is installed

  /**
   * Create a new Resend provider
   * @param apiKey - Resend API key (from RESEND_API_KEY environment variable)
   * @param fromEmail - Default from email address
   */
  constructor(apiKey?: string, fromEmail?: string) {
    this.apiKey = apiKey || process.env.RESEND_API_KEY || '';
    this.fromEmail = fromEmail || DEFAULT_FROM_EMAIL;

    if (!this.apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    // Dynamically import Resend SDK
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Resend } = require('resend');
      this.resend = new Resend(this.apiKey);
      console.log('[Resend] Initialized production email provider');
    } catch {
      throw new Error(
        'Resend SDK not installed. Run: npm install resend'
      );
    }
  }

  /**
   * Send an email using Resend SDK
   */
  async send(params: EmailParams): Promise<EmailResult> {
    try {
      // Prepare email data for Resend
      const emailData = {
        from: params.from || this.fromEmail,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
        reply_to: params.replyTo,
        attachments: params.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          content_type: attachment.contentType,
        })),
      };

      // Send email via Resend SDK
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (this.resend as any).emails.send(emailData);

      // Check for errors in response
      if (response.error) {
        console.error('[Resend] ❌ Email send failed:', {
          to: params.to,
          subject: params.subject,
          error: response.error,
        });

        return {
          success: false,
          error: this.transformError(response.error),
        };
      }

      console.log('[Resend] ✅ Email sent:', {
        to: params.to,
        from: params.from || this.fromEmail,
        subject: params.subject,
        messageId: response.data?.id,
      });

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (error) {
      const errorMessage = this.transformError(error);

      console.error('[Resend] ❌ Email send exception:', {
        to: params.to,
        subject: params.subject,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  /**
   * Transform Resend-specific errors into user-friendly messages
   */
  private transformError(error: unknown): string {
    if (error instanceof Error) {
      // Handle specific Resend error codes
      if (error.message.includes('Invalid API key')) {
        return 'Invalid Resend API key. Please check your RESEND_API_KEY environment variable.';
      }

      if (error.message.includes('rate limit')) {
        return 'Resend rate limit exceeded. Please try again later.';
      }

      if (error.message.includes('Invalid email')) {
        return 'Invalid email address format.';
      }

      if (error.message.includes('Invalid from address')) {
        return `Invalid from address. Please verify domain ownership in Resend dashboard.`;
      }

      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }

    return 'Unknown error occurred while sending email';
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a Resend provider instance
 */
export function createResendProvider(apiKey?: string, fromEmail?: string): EmailProvider {
  return new ResendProvider(apiKey, fromEmail);
}

/**
 * Global singleton instance for production use
 */
let globalInstance: ResendProvider | null = null;

/**
 * Get or create the global Resend provider instance
 */
export function getResendProvider(): ResendProvider {
  if (!globalInstance) {
    globalInstance = new ResendProvider();
  }
  return globalInstance;
}

/**
 * Reset the global instance (for testing)
 */
export function resetResendProvider(): void {
  globalInstance = null;
}
