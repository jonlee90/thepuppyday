/**
 * Phase 8: Mock Resend Provider Tests
 * Unit tests for MockResendProvider email implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockResendProvider,
  createMockResendProvider,
  getMockResendProvider,
  resetMockResendProvider,
} from '../provider';
import type { EmailParams } from '../../../lib/notifications/types';

describe('MockResendProvider', () => {
  let provider: MockResendProvider;

  beforeEach(() => {
    provider = new MockResendProvider(0); // 0% failure rate for deterministic tests
  });

  // ==========================================================================
  // SEND METHOD TESTS
  // ==========================================================================

  describe('send', () => {
    it('should send email successfully', async () => {
      const params: EmailParams = {
        to: 'customer@example.com',
        subject: 'Test Email',
        html: '<p>Hello World</p>',
        text: 'Hello World',
      };

      const result = await provider.send(params);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.messageId).toMatch(/^mock_email_\d+_[a-z0-9]+$/);
      expect(result.error).toBeUndefined();
    });

    it('should generate unique message IDs', async () => {
      const params: EmailParams = {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      };

      const result1 = await provider.send(params);
      const result2 = await provider.send(params);

      expect(result1.messageId).not.toBe(result2.messageId);
    });

    it('should store sent emails in memory', async () => {
      const params: EmailParams = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      };

      await provider.send(params);

      const sentEmails = provider.getSentEmails();
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0].params).toEqual(params);
      expect(sentEmails[0].success).toBe(true);
      expect(sentEmails[0].messageId).toBeDefined();
      expect(sentEmails[0].sentAt).toBeInstanceOf(Date);
    });

    it('should handle emails with attachments', async () => {
      const params: EmailParams = {
        to: 'test@example.com',
        subject: 'Email with Attachments',
        html: '<p>See attached</p>',
        text: 'See attached',
        attachments: [
          {
            filename: 'document.pdf',
            content: Buffer.from('mock pdf content'),
            contentType: 'application/pdf',
          },
        ],
      };

      const result = await provider.send(params);

      expect(result.success).toBe(true);
      const lastEmail = provider.getLastEmail();
      expect(lastEmail?.params.attachments).toHaveLength(1);
      expect(lastEmail?.params.attachments?.[0].filename).toBe('document.pdf');
    });

    it('should handle emails with custom from address', async () => {
      const params: EmailParams = {
        to: 'customer@example.com',
        from: 'custom@puppyday.com',
        subject: 'Custom From',
        html: '<p>Custom sender</p>',
        text: 'Custom sender',
      };

      await provider.send(params);

      const lastEmail = provider.getLastEmail();
      expect(lastEmail?.params.from).toBe('custom@puppyday.com');
    });

    it('should handle emails with replyTo', async () => {
      const params: EmailParams = {
        to: 'customer@example.com',
        subject: 'With Reply-To',
        html: '<p>Reply here</p>',
        text: 'Reply here',
        replyTo: 'support@puppyday.com',
      };

      await provider.send(params);

      const lastEmail = provider.getLastEmail();
      expect(lastEmail?.params.replyTo).toBe('support@puppyday.com');
    });
  });

  // ==========================================================================
  // FAILURE SIMULATION TESTS
  // ==========================================================================

  describe('failure simulation', () => {
    it('should simulate failures based on failure rate', async () => {
      const highFailureProvider = new MockResendProvider(1.0); // 100% failure rate

      const params: EmailParams = {
        to: 'test@example.com',
        subject: 'Will Fail',
        html: '<p>Fail</p>',
        text: 'Fail',
      };

      const result = await highFailureProvider.send(params);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('simulated random failure');
      expect(result.messageId).toBeUndefined();
    });

    it('should store failed emails with error messages', async () => {
      const highFailureProvider = new MockResendProvider(1.0);

      const params: EmailParams = {
        to: 'test@example.com',
        subject: 'Will Fail',
        html: '<p>Fail</p>',
        text: 'Fail',
      };

      await highFailureProvider.send(params);

      const sentEmails = highFailureProvider.getSentEmails();
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0].success).toBe(false);
      expect(sentEmails[0].error).toBeDefined();
    });

    it('should allow changing failure rate', () => {
      provider.setFailureRate(0.5);
      expect(provider.getFailureRate()).toBe(0.5);

      provider.setFailureRate(0.1);
      expect(provider.getFailureRate()).toBe(0.1);
    });

    it('should clamp failure rate between 0 and 1', () => {
      provider.setFailureRate(-0.5);
      expect(provider.getFailureRate()).toBe(0);

      provider.setFailureRate(1.5);
      expect(provider.getFailureRate()).toBe(1);
    });
  });

  // ==========================================================================
  // HELPER METHOD TESTS
  // ==========================================================================

  describe('helper methods', () => {
    beforeEach(async () => {
      // Send a few test emails
      await provider.send({
        to: 'user1@example.com',
        subject: 'Email 1',
        html: '<p>1</p>',
        text: '1',
      });

      await provider.send({
        to: 'user2@example.com',
        subject: 'Email 2',
        html: '<p>2</p>',
        text: '2',
      });

      await provider.send({
        to: 'user1@example.com',
        subject: 'Email 3',
        html: '<p>3</p>',
        text: '3',
      });
    });

    it('should get all sent emails', () => {
      const emails = provider.getSentEmails();
      expect(emails).toHaveLength(3);
    });

    it('should get emails by recipient', () => {
      const user1Emails = provider.getEmailsTo('user1@example.com');
      expect(user1Emails).toHaveLength(2);

      const user2Emails = provider.getEmailsTo('user2@example.com');
      expect(user2Emails).toHaveLength(1);
    });

    it('should get last email', () => {
      const lastEmail = provider.getLastEmail();
      expect(lastEmail?.params.subject).toBe('Email 3');
      expect(lastEmail?.params.to).toBe('user1@example.com');
    });

    it('should get successful emails', () => {
      const successfulEmails = provider.getSuccessfulEmails();
      expect(successfulEmails).toHaveLength(3);
      expect(successfulEmails.every((e) => e.success)).toBe(true);
    });

    it('should get failed emails', async () => {
      const failProvider = new MockResendProvider(1.0);

      await failProvider.send({
        to: 'fail@example.com',
        subject: 'Fail',
        html: '<p>Fail</p>',
        text: 'Fail',
      });

      const failedEmails = failProvider.getFailedEmails();
      expect(failedEmails).toHaveLength(1);
      expect(failedEmails[0].success).toBe(false);
    });

    it('should get email count', () => {
      expect(provider.getEmailCount()).toBe(3);
    });

    it('should clear sent emails', () => {
      provider.clearSentEmails();
      expect(provider.getEmailCount()).toBe(0);
      expect(provider.getSentEmails()).toHaveLength(0);
    });
  });

  // ==========================================================================
  // NETWORK DELAY SIMULATION
  // ==========================================================================

  describe('network delay simulation', () => {
    it('should simulate network delay between 100-300ms', async () => {
      const params: EmailParams = {
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      };

      const startTime = Date.now();
      await provider.send(params);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeGreaterThanOrEqual(100);
      expect(duration).toBeLessThan(350); // Allow some tolerance
    });
  });

  // ==========================================================================
  // FACTORY FUNCTION TESTS
  // ==========================================================================

  describe('factory functions', () => {
    it('should create provider with createMockResendProvider', () => {
      const newProvider = createMockResendProvider();
      expect(newProvider).toBeInstanceOf(MockResendProvider);
    });

    it('should create provider with custom failure rate', () => {
      const newProvider = createMockResendProvider(0.25) as MockResendProvider;
      expect(newProvider.getFailureRate()).toBe(0.25);
    });

    it('should get global singleton instance', () => {
      resetMockResendProvider();
      const instance1 = getMockResendProvider();
      const instance2 = getMockResendProvider();
      expect(instance1).toBe(instance2);
    });

    it('should reset global instance', () => {
      const instance1 = getMockResendProvider();
      resetMockResendProvider();
      const instance2 = getMockResendProvider();
      expect(instance1).not.toBe(instance2);
    });
  });
});
