/**
 * Phase 8: Mock Twilio Provider for SMS Notifications
 * Development and testing implementation of SMSProvider interface
 */

import type { SMSProvider, SMSParams, SMSResult } from '../../lib/notifications/types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Stored SMS for inspection during tests
 */
export interface StoredSMS {
  params: SMSParams;
  sid: string;
  sentAt: Date;
  success: boolean;
  segmentCount: number;
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * SMS segment lengths (GSM 7-bit encoding)
 */
const SMS_SINGLE_SEGMENT_LENGTH = 160;
const SMS_MULTI_SEGMENT_LENGTH = 153;

// ============================================================================
// MOCK TWILIO PROVIDER
// ============================================================================

/**
 * Mock implementation of Twilio SMS provider for development/testing
 */
export class MockTwilioProvider implements SMSProvider {
  private sentMessages: StoredSMS[] = [];
  private failureRate: number;

  /**
   * Create a new mock Twilio provider
   * @param failureRate - Probability of random failures (0.0 to 1.0), defaults to 0.03 (3%)
   */
  constructor(failureRate: number = 0.03) {
    this.failureRate = Math.max(0, Math.min(1, failureRate));
  }

  /**
   * Send an SMS (mocked)
   */
  async send(params: SMSParams): Promise<SMSResult> {
    // Validate phone number format
    if (!this.isValidPhoneNumber(params.to)) {
      const error = `Invalid phone number format: ${params.to}. Must start with +1`;

      console.log('[Mock Twilio] ❌ SMS failed (validation):', {
        to: params.to,
        error,
      });

      return {
        success: false,
        error,
      };
    }

    // Simulate network delay (150-400ms)
    const delay = Math.floor(Math.random() * 250) + 150;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Generate mock SID (Twilio message SID format)
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    const sid = `SM${timestamp.substring(timestamp.length - 8)}${random}`;

    // Calculate segment count
    const segmentCount = this.calculateSegmentCount(params.body);

    // Simulate random failures
    const shouldFail = Math.random() < this.failureRate;

    if (shouldFail) {
      const error = 'Mock SMS send failed (simulated random failure)';

      // Store failed SMS
      this.sentMessages.push({
        params,
        sid,
        sentAt: new Date(),
        success: false,
        segmentCount,
        error,
      });

      console.log('[Mock Twilio] ❌ SMS failed:', {
        to: params.to,
        from: params.from || '+16572522903',
        bodyLength: params.body.length,
        segments: segmentCount,
        error,
        delay: `${delay}ms`,
      });

      return {
        success: false,
        error,
      };
    }

    // Store successful SMS
    this.sentMessages.push({
      params,
      sid,
      sentAt: new Date(),
      success: true,
      segmentCount,
    });

    console.log('[Mock Twilio] ✅ SMS sent:', {
      to: params.to,
      from: params.from || '+16572522903',
      sid,
      bodyLength: params.body.length,
      segments: segmentCount,
      delay: `${delay}ms`,
    });

    return {
      success: true,
      messageId: sid,
      segmentCount,
    };
  }

  // ==========================================================================
  // VALIDATION HELPERS
  // ==========================================================================

  /**
   * Validate phone number format (E.164 format starting with +1)
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Must start with +1 and have 11-12 digits total
    const e164Regex = /^\+1\d{10}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Calculate SMS segment count based on message length
   */
  private calculateSegmentCount(text: string): number {
    const length = text.length;

    if (length === 0) {
      return 0;
    }

    if (length <= SMS_SINGLE_SEGMENT_LENGTH) {
      return 1;
    }

    // Multi-segment messages use 153 characters per segment
    return Math.ceil(length / SMS_MULTI_SEGMENT_LENGTH);
  }

  // ==========================================================================
  // HELPER METHODS FOR TESTING
  // ==========================================================================

  /**
   * Get all sent messages (for testing/inspection)
   */
  getSentMessages(): StoredSMS[] {
    return [...this.sentMessages];
  }

  /**
   * Get messages sent to a specific recipient
   */
  getMessagesTo(recipient: string): StoredSMS[] {
    return this.sentMessages.filter((msg) => msg.params.to === recipient);
  }

  /**
   * Get the most recent message
   */
  getLastMessage(): StoredSMS | undefined {
    return this.sentMessages[this.sentMessages.length - 1];
  }

  /**
   * Get successful messages only
   */
  getSuccessfulMessages(): StoredSMS[] {
    return this.sentMessages.filter((msg) => msg.success);
  }

  /**
   * Get failed messages only
   */
  getFailedMessages(): StoredSMS[] {
    return this.sentMessages.filter((msg) => !msg.success);
  }

  /**
   * Clear all sent messages (for test cleanup)
   */
  clearSentMessages(): void {
    this.sentMessages = [];
    console.log('[Mock Twilio] 🧹 Cleared all sent messages');
  }

  /**
   * Get count of sent messages
   */
  getMessageCount(): number {
    return this.sentMessages.length;
  }

  /**
   * Get total segment count across all messages
   */
  getTotalSegmentCount(): number {
    return this.sentMessages.reduce((total, msg) => total + msg.segmentCount, 0);
  }

  /**
   * Set failure rate (for testing different scenarios)
   */
  setFailureRate(rate: number): void {
    this.failureRate = Math.max(0, Math.min(1, rate));
    console.log(`[Mock Twilio] ⚙️ Set failure rate to ${(rate * 100).toFixed(1)}%`);
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
 * Create a mock Twilio provider instance
 */
export function createMockTwilioProvider(failureRate?: number): SMSProvider {
  return new MockTwilioProvider(failureRate);
}

/**
 * Global singleton instance for use across the app during development
 */
let globalInstance: MockTwilioProvider | null = null;

/**
 * Get or create the global mock Twilio provider instance
 */
export function getMockTwilioProvider(): MockTwilioProvider {
  if (!globalInstance) {
    globalInstance = new MockTwilioProvider();
  }
  return globalInstance;
}

/**
 * Reset the global instance (for testing)
 */
export function resetMockTwilioProvider(): void {
  globalInstance = null;
}
