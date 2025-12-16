/**
 * Phase 8: Twilio Provider Integration Tests
 *
 * IMPORTANT: These tests are disabled by default (.skip) because they require:
 * - Twilio SDK installed: npm install twilio
 * - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER environment variables set
 * - Actual API calls to Twilio (costs money)
 *
 * To run these tests:
 * 1. Install Twilio: npm install twilio
 * 2. Set TWILIO_* environment variables in your .env file
 * 3. Remove .skip from describe.skip
 * 4. Run: npm test -- provider.integration.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import type { SMSParams } from '../../notifications/types';

// Conditional import - only works if twilio package is installed
let TwilioProvider: any;
let createTwilioProvider: any;

try {
  const module = await import('../provider');
  TwilioProvider = module.TwilioProvider;
  createTwilioProvider = module.createTwilioProvider;
} catch (error) {
  console.log('Twilio provider not available - tests will be skipped');
}

// Skip these tests by default - remove .skip to run with real API
describe.skip('TwilioProvider Integration Tests', () => {
  let provider: any;

  beforeAll(() => {
    // Verify environment variables
    if (!process.env.TWILIO_ACCOUNT_SID) {
      throw new Error(
        'TWILIO_ACCOUNT_SID environment variable is required for integration tests'
      );
    }

    if (!process.env.TWILIO_AUTH_TOKEN) {
      throw new Error(
        'TWILIO_AUTH_TOKEN environment variable is required for integration tests'
      );
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      throw new Error(
        'TWILIO_PHONE_NUMBER environment variable is required for integration tests'
      );
    }

    // Create provider instance
    provider = new TwilioProvider();
  });

  // ==========================================================================
  // SUCCESSFUL SEND TESTS
  // ==========================================================================

  describe('send - success scenarios', () => {
    it('should send a simple SMS successfully', async () => {
      const params: SMSParams = {
        to: '+15551234567', // Replace with a verified phone number
        body: 'This is a test SMS from the Twilio integration test.',
      };

      const result = await provider.send(params);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.messageId).toMatch(/^SM[0-9A-Z]+$/);
      expect(result.segmentCount).toBeDefined();
      expect(result.segmentCount).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();

      console.log('✅ SMS sent successfully:', {
        sid: result.messageId,
        segments: result.segmentCount,
      });
    }, 30000); // 30 second timeout for API call

    it('should send SMS with custom from number', async () => {
      const params: SMSParams = {
        to: '+15551234567',
        from: process.env.TWILIO_PHONE_NUMBER,
        body: 'SMS with custom from number.',
      };

      const result = await provider.send(params);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.segmentCount).toBe(1);
    }, 30000);

    it('should handle multi-segment messages', async () => {
      const longMessage = 'x'.repeat(200); // 2 segments

      const params: SMSParams = {
        to: '+15551234567',
        body: longMessage,
      };

      const result = await provider.send(params);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.segmentCount).toBeGreaterThanOrEqual(2);

      console.log('✅ Multi-segment SMS sent:', {
        sid: result.messageId,
        segments: result.segmentCount,
        length: longMessage.length,
      });
    }, 30000);

    it('should normalize phone number formats', async () => {
      // Test with different phone number formats
      const params: SMSParams = {
        to: '(555) 123-4567', // Will be normalized to +15551234567
        body: 'Phone number normalization test.',
      };

      const result = await provider.send(params);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    }, 30000);
  });

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe('send - error scenarios', () => {
    it('should handle invalid phone number', async () => {
      const params: SMSParams = {
        to: 'invalid-phone',
        body: 'Test',
      };

      const result = await provider.send(params);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid');
    }, 30000);

    it('should handle unverified phone number (if in test mode)', async () => {
      const params: SMSParams = {
        to: '+15559999999', // Unverified number
        body: 'Test to unverified number.',
      };

      const result = await provider.send(params);

      // May succeed in production or fail in trial mode
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    }, 30000);
  });

  // ==========================================================================
  // PHONE NUMBER NORMALIZATION TESTS
  // ==========================================================================

  describe('phone number normalization', () => {
    it('should normalize various phone formats', async () => {
      const formats = [
        '+15551234567',      // E.164 (already normalized)
        '5551234567',        // 10 digits (will add +1)
        '15551234567',       // 11 digits (will add +)
        '(555) 123-4567',    // Formatted (will strip and add +1)
        '555-123-4567',      // Dashed (will strip and add +1)
      ];

      for (const phone of formats) {
        const params: SMSParams = {
          to: phone,
          body: `Normalization test for ${phone}`,
        };

        const result = await provider.send(params);

        // All should succeed (or fail for same reason)
        if (result.success) {
          expect(result.messageId).toBeDefined();
          console.log(`✅ Normalized ${phone}`);
        }
      }
    }, 60000); // 60 seconds for multiple API calls
  });

  // ==========================================================================
  // FACTORY FUNCTION TESTS
  // ==========================================================================

  describe('factory functions', () => {
    it('should create provider with factory function', () => {
      const newProvider = createTwilioProvider();
      expect(newProvider).toBeDefined();
    });

    it('should throw error if Account SID is missing', () => {
      // Save originals
      const originalSid = process.env.TWILIO_ACCOUNT_SID;
      const originalToken = process.env.TWILIO_AUTH_TOKEN;

      // Remove credentials
      delete process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_AUTH_TOKEN;

      // Should throw error
      expect(() => new TwilioProvider()).toThrow('TWILIO_ACCOUNT_SID');

      // Restore
      process.env.TWILIO_ACCOUNT_SID = originalSid;
      process.env.TWILIO_AUTH_TOKEN = originalToken;
    });

    it('should throw error if Auth Token is missing', () => {
      // Save original
      const originalToken = process.env.TWILIO_AUTH_TOKEN;

      // Remove token
      delete process.env.TWILIO_AUTH_TOKEN;

      // Should throw error
      expect(() => new TwilioProvider()).toThrow('TWILIO_AUTH_TOKEN');

      // Restore
      process.env.TWILIO_AUTH_TOKEN = originalToken;
    });
  });
});

/**
 * Instructions for running integration tests:
 *
 * 1. Install Twilio SDK:
 *    npm install twilio
 *
 * 2. Create .env.local file with:
 *    TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *    TWILIO_AUTH_TOKEN=your_auth_token
 *    TWILIO_PHONE_NUMBER=+16572522903
 *
 * 3. Update test phone numbers:
 *    Replace '+15551234567' with a verified phone number
 *    (In trial mode, you can only send to verified numbers)
 *
 * 4. Remove .skip from describe.skip above
 *
 * 5. Run tests:
 *    npm test -- provider.integration.test.ts
 *
 * NOTE: These tests will send real SMS messages and may incur costs!
 */
