/**
 * Phase 8: Resend Provider Integration Tests
 *
 * IMPORTANT: These tests are disabled by default (.skip) because they require:
 * - Resend SDK installed: npm install resend
 * - RESEND_API_KEY environment variable set
 * - Actual API calls to Resend (costs money)
 *
 * To run these tests:
 * 1. Install Resend: npm install resend
 * 2. Set RESEND_API_KEY in your .env file
 * 3. Remove .skip from describe.skip
 * 4. Run: npm test -- provider.integration.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import type { EmailParams } from '../../notifications/types';

// Conditional import - only works if resend package is installed
let ResendProvider: any;
let createResendProvider: any;

try {
  const module = await import('../provider');
  ResendProvider = module.ResendProvider;
  createResendProvider = module.createResendProvider;
} catch (error) {
  console.log('Resend provider not available - tests will be skipped');
}

// Skip these tests by default - remove .skip to run with real API
describe.skip('ResendProvider Integration Tests', () => {
  let provider: any;

  beforeAll(() => {
    // Verify environment variables
    if (!process.env.RESEND_API_KEY) {
      throw new Error(
        'RESEND_API_KEY environment variable is required for integration tests'
      );
    }

    // Create provider instance
    provider = new ResendProvider();
  });

  // ==========================================================================
  // SUCCESSFUL SEND TESTS
  // ==========================================================================

  describe('send - success scenarios', () => {
    it('should send a simple email successfully', async () => {
      const params: EmailParams = {
        to: 'test@example.com', // Replace with a real test email
        subject: 'Integration Test Email',
        html: '<p>This is a test email from the Resend integration test.</p>',
        text: 'This is a test email from the Resend integration test.',
      };

      const result = await provider.send(params);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.error).toBeUndefined();

      console.log('✅ Email sent successfully:', result.messageId);
    }, 30000); // 30 second timeout for API call

    it('should send email with custom from address', async () => {
      const params: EmailParams = {
        to: 'test@example.com',
        from: 'puppyday14936@gmail.com',
        subject: 'Custom From Test',
        html: '<p>Email with custom from address.</p>',
        text: 'Email with custom from address.',
      };

      const result = await provider.send(params);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    }, 30000);

    it('should send email with replyTo', async () => {
      const params: EmailParams = {
        to: 'test@example.com',
        subject: 'Reply-To Test',
        html: '<p>Email with reply-to address.</p>',
        text: 'Email with reply-to address.',
        replyTo: 'support@thepuppyday.com',
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
    it('should handle invalid email address', async () => {
      const params: EmailParams = {
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      };

      const result = await provider.send(params);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid email');
    }, 30000);

    it('should handle invalid from address (unverified domain)', async () => {
      const params: EmailParams = {
        to: 'test@example.com',
        from: 'noreply@unverified-domain.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      };

      const result = await provider.send(params);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 30000);
  });

  // ==========================================================================
  // FACTORY FUNCTION TESTS
  // ==========================================================================

  describe('factory functions', () => {
    it('should create provider with factory function', () => {
      const newProvider = createResendProvider();
      expect(newProvider).toBeDefined();
    });

    it('should throw error if API key is missing', () => {
      // Save original API key
      const originalKey = process.env.RESEND_API_KEY;

      // Remove API key
      delete process.env.RESEND_API_KEY;

      // Should throw error
      expect(() => new ResendProvider()).toThrow('RESEND_API_KEY');

      // Restore API key
      process.env.RESEND_API_KEY = originalKey;
    });
  });
});

/**
 * Instructions for running integration tests:
 *
 * 1. Install Resend SDK:
 *    npm install resend
 *
 * 2. Create .env.local file with:
 *    RESEND_API_KEY=re_xxxxxxxxxxxx
 *
 * 3. Update test email addresses:
 *    Replace 'test@example.com' with a real email you can verify
 *
 * 4. Remove .skip from describe.skip above
 *
 * 5. Run tests:
 *    npm test -- provider.integration.test.ts
 *
 * NOTE: These tests will send real emails and may incur costs!
 */
