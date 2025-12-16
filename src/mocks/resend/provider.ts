/**
 * Phase 8: Mock Resend Provider for Email Notifications
 * Development and testing implementation of EmailProvider interface
 */

import type { EmailProvider, EmailParams, EmailResult } from '../../lib/notifications/types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Stored email for inspection during tests
 */
export interface StoredEmail {
  params: EmailParams;
  messageId: string;
  sentAt: Date;
  success: boolean;
  error?: string;
}

// ============================================================================
// MOCK RESEND PROVIDER
// ============================================================================

/**
 * Mock implementation of Resend email provider for development/testing
 */
export class MockResendProvider implements EmailProvider {
  private sentEmails: StoredEmail[] = [];
  private failureRate: number;

  /**
   * Create a new mock Resend provider
   * @param failureRate - Probability of random failures (0.0 to 1.0), defaults to 0.05 (5%)
   */
  constructor(failureRate: number = 0.05) {
    this.failureRate = Math.max(0, Math.min(1, failureRate));
  }

  /**
   * Send an email (mocked)
   */
  async send(params: EmailParams): Promise<EmailResult> {
    // Simulate network delay (100-300ms)
    const delay = Math.floor(Math.random() * 200) + 100;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Generate mock message ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const messageId = `mock_email_${timestamp}_${random}`;

    // Simulate random failures
    const shouldFail = Math.random() < this.failureRate;

    if (shouldFail) {
      const error = 'Mock email send failed (simulated random failure)';

      // Store failed email
      this.sentEmails.push({
        params,
        messageId,
        sentAt: new Date(),
        success: false,
        error,
      });

      console.log('[Mock Resend] ❌ Email failed:', {
        to: params.to,
        subject: params.subject,
        error,
        delay: `${delay}ms`,
      });

      return {
        success: false,
        error,
      };
    }

    // Store successful email
    this.sentEmails.push({
      params,
      messageId,
      sentAt: new Date(),
      success: true,
    });

    console.log('[Mock Resend] ✅ Email sent:', {
      to: params.to,
      from: params.from || 'puppyday14936@gmail.com',
      subject: params.subject,
      messageId,
      textLength: params.text.length,
      htmlLength: params.html?.length || 0,
      attachments: params.attachments?.length || 0,
      delay: `${delay}ms`,
    });

    return {
      success: true,
      messageId,
    };
  }

  // ==========================================================================
  // HELPER METHODS FOR TESTING
  // ==========================================================================

  /**
   * Get all sent emails (for testing/inspection)
   */
  getSentEmails(): StoredEmail[] {
    return [...this.sentEmails];
  }

  /**
   * Get emails sent to a specific recipient
   */
  getEmailsTo(recipient: string): StoredEmail[] {
    return this.sentEmails.filter((email) => email.params.to === recipient);
  }

  /**
   * Get the most recent email
   */
  getLastEmail(): StoredEmail | undefined {
    return this.sentEmails[this.sentEmails.length - 1];
  }

  /**
   * Get successful emails only
   */
  getSuccessfulEmails(): StoredEmail[] {
    return this.sentEmails.filter((email) => email.success);
  }

  /**
   * Get failed emails only
   */
  getFailedEmails(): StoredEmail[] {
    return this.sentEmails.filter((email) => !email.success);
  }

  /**
   * Clear all sent emails (for test cleanup)
   */
  clearSentEmails(): void {
    this.sentEmails = [];
    console.log('[Mock Resend] 🧹 Cleared all sent emails');
  }

  /**
   * Get count of sent emails
   */
  getEmailCount(): number {
    return this.sentEmails.length;
  }

  /**
   * Set failure rate (for testing different scenarios)
   */
  setFailureRate(rate: number): void {
    this.failureRate = Math.max(0, Math.min(1, rate));
    console.log(`[Mock Resend] ⚙️ Set failure rate to ${(rate * 100).toFixed(1)}%`);
  }

  /**
   * Get current failure rate
   */
  getFailureRate(): number {
    return this.failureRate;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a mock Resend provider instance
 */
export function createMockResendProvider(failureRate?: number): EmailProvider {
  return new MockResendProvider(failureRate);
}

/**
 * Global singleton instance for use across the app during development
 */
let globalInstance: MockResendProvider | null = null;

/**
 * Get or create the global mock Resend provider instance
 */
export function getMockResendProvider(): MockResendProvider {
  if (!globalInstance) {
    globalInstance = new MockResendProvider();
  }
  return globalInstance;
}

/**
 * Reset the global instance (for testing)
 */
export function resetMockResendProvider(): void {
  globalInstance = null;
}
