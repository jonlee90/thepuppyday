/**
 * Phase 8: Mock Twilio Provider Tests
 * Unit tests for MockTwilioProvider SMS implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockTwilioProvider,
  createMockTwilioProvider,
  getMockTwilioProvider,
  resetMockTwilioProvider,
} from '../provider';
import type { SMSParams } from '../../../lib/notifications/types';

describe('MockTwilioProvider', () => {
  let provider: MockTwilioProvider;

  beforeEach(() => {
    provider = new MockTwilioProvider(0); // 0% failure rate for deterministic tests
  });

  // ==========================================================================
  // SEND METHOD TESTS
  // ==========================================================================

  describe('send', () => {
    it('should send SMS successfully', async () => {
      const params: SMSParams = {
        to: '+15551234567',
        body: 'Test message',
      };

      const result = await provider.send(params);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.messageId).toMatch(/^SM[0-9A-Z]+$/);
      expect(result.segmentCount).toBe(1);
      expect(result.error).toBeUndefined();
    });

    it('should generate unique message SIDs', async () => {
      const params: SMSParams = {
        to: '+15551234567',
        body: 'Test',
      };

      const result1 = await provider.send(params);
      const result2 = await provider.send(params);

      expect(result1.messageId).not.toBe(result2.messageId);
    });

    it('should store sent messages in memory', async () => {
      const params: SMSParams = {
        to: '+15551234567',
        body: 'Test SMS',
      };

      await provider.send(params);

      const sentMessages = provider.getSentMessages();
      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0].params).toEqual(params);
      expect(sentMessages[0].success).toBe(true);
      expect(sentMessages[0].sid).toBeDefined();
      expect(sentMessages[0].sentAt).toBeInstanceOf(Date);
      expect(sentMessages[0].segmentCount).toBe(1);
    });

    it('should handle SMS with custom from number', async () => {
      const params: SMSParams = {
        to: '+15551234567',
        from: '+15559876543',
        body: 'Custom from',
      };

      await provider.send(params);

      const lastMessage = provider.getLastMessage();
      expect(lastMessage?.params.from).toBe('+15559876543');
    });
  });

  // ==========================================================================
  // PHONE NUMBER VALIDATION TESTS
  // ==========================================================================

  describe('phone number validation', () => {
    it('should accept valid E.164 format (+1 followed by 10 digits)', async () => {
      const params: SMSParams = {
        to: '+15551234567',
        body: 'Valid number',
      };

      const result = await provider.send(params);

      expect(result.success).toBe(true);
    });

    it('should reject numbers not starting with +1', async () => {
      const params: SMSParams = {
        to: '+44123456789', // UK number
        body: 'Invalid country code',
      };

      const result = await provider.send(params);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid phone number format');
      expect(result.error).toContain('Must start with +1');
    });

    it('should reject numbers without country code', async () => {
      const params: SMSParams = {
        to: '5551234567',
        body: 'No country code',
      };

      const result = await provider.send(params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
    });

    it('should reject invalid format', async () => {
      const params: SMSParams = {
        to: '+1-555-123-4567', // Has dashes
        body: 'Invalid format',
      };

      const result = await provider.send(params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number format');
    });

    it('should reject too short numbers', async () => {
      const params: SMSParams = {
        to: '+1555123',
        body: 'Too short',
      };

      const result = await provider.send(params);

      expect(result.success).toBe(false);
    });

    it('should reject too long numbers', async () => {
      const params: SMSParams = {
        to: '+155512345678901',
        body: 'Too long',
      };

      const result = await provider.send(params);

      expect(result.success).toBe(false);
    });
  });

  // ==========================================================================
  // SEGMENT COUNT TESTS
  // ==========================================================================

  describe('segment count calculation', () => {
    it('should calculate 1 segment for short messages', async () => {
      const params: SMSParams = {
        to: '+15551234567',
        body: 'Short message',
      };

      const result = await provider.send(params);

      expect(result.segmentCount).toBe(1);
    });

    it('should calculate 1 segment for exactly 160 characters', async () => {
      const params: SMSParams = {
        to: '+15551234567',
        body: 'x'.repeat(160),
      };

      const result = await provider.send(params);

      expect(result.segmentCount).toBe(1);
    });

    it('should calculate 2 segments for 161 characters', async () => {
      const params: SMSParams = {
        to: '+15551234567',
        body: 'x'.repeat(161),
      };

      const result = await provider.send(params);

      expect(result.segmentCount).toBe(2);
    });

    it('should calculate 2 segments for 306 characters', async () => {
      const params: SMSParams = {
        to: '+15551234567',
        body: 'x'.repeat(306), // 153 * 2
      };

      const result = await provider.send(params);

      expect(result.segmentCount).toBe(2);
    });

    it('should calculate 3 segments for 307 characters', async () => {
      const params: SMSParams = {
        to: '+15551234567',
        body: 'x'.repeat(307),
      };

      const result = await provider.send(params);

      expect(result.segmentCount).toBe(3);
    });

    it('should return 0 segments for empty message', async () => {
      const params: SMSParams = {
        to: '+15551234567',
        body: '',
      };

      const result = await provider.send(params);

      expect(result.segmentCount).toBe(0);
    });

    it('should store segment count in memory', async () => {
      const params: SMSParams = {
        to: '+15551234567',
        body: 'x'.repeat(200),
      };

      await provider.send(params);

      const lastMessage = provider.getLastMessage();
      expect(lastMessage?.segmentCount).toBe(2);
    });
  });

  // ==========================================================================
  // FAILURE SIMULATION TESTS
  // ==========================================================================

  describe('failure simulation', () => {
    it('should simulate failures based on failure rate', async () => {
      const highFailureProvider = new MockTwilioProvider(1.0); // 100% failure rate

      const params: SMSParams = {
        to: '+15551234567',
        body: 'Will fail',
      };

      const result = await highFailureProvider.send(params);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('simulated random failure');
      expect(result.messageId).toBeUndefined();
    });

    it('should store failed messages with error', async () => {
      const highFailureProvider = new MockTwilioProvider(1.0);

      const params: SMSParams = {
        to: '+15551234567',
        body: 'Will fail',
      };

      await highFailureProvider.send(params);

      const sentMessages = highFailureProvider.getSentMessages();
      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0].success).toBe(false);
      expect(sentMessages[0].error).toBeDefined();
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
      // Send a few test messages
      await provider.send({
        to: '+15551111111',
        body: 'Message 1',
      });

      await provider.send({
        to: '+15552222222',
        body: 'Message 2',
      });

      await provider.send({
        to: '+15551111111',
        body: 'x'.repeat(200), // 2 segments
      });
    });

    it('should get all sent messages', () => {
      const messages = provider.getSentMessages();
      expect(messages).toHaveLength(3);
    });

    it('should get messages by recipient', () => {
      const user1Messages = provider.getMessagesTo('+15551111111');
      expect(user1Messages).toHaveLength(2);

      const user2Messages = provider.getMessagesTo('+15552222222');
      expect(user2Messages).toHaveLength(1);
    });

    it('should get last message', () => {
      const lastMessage = provider.getLastMessage();
      expect(lastMessage?.params.to).toBe('+15551111111');
      expect(lastMessage?.params.body).toHaveLength(200);
    });

    it('should get successful messages', () => {
      const successfulMessages = provider.getSuccessfulMessages();
      expect(successfulMessages).toHaveLength(3);
      expect(successfulMessages.every((m) => m.success)).toBe(true);
    });

    it('should get failed messages', async () => {
      const failProvider = new MockTwilioProvider(1.0);

      await failProvider.send({
        to: '+15551234567',
        body: 'Fail',
      });

      const failedMessages = failProvider.getFailedMessages();
      expect(failedMessages).toHaveLength(1);
      expect(failedMessages[0].success).toBe(false);
    });

    it('should get message count', () => {
      expect(provider.getMessageCount()).toBe(3);
    });

    it('should get total segment count', () => {
      // 1 + 1 + 2 = 4 total segments
      expect(provider.getTotalSegmentCount()).toBe(4);
    });

    it('should clear sent messages', () => {
      provider.clearSentMessages();
      expect(provider.getMessageCount()).toBe(0);
      expect(provider.getSentMessages()).toHaveLength(0);
      expect(provider.getTotalSegmentCount()).toBe(0);
    });
  });

  // ==========================================================================
  // NETWORK DELAY SIMULATION
  // ==========================================================================

  describe('network delay simulation', () => {
    it('should simulate network delay between 150-400ms', async () => {
      const params: SMSParams = {
        to: '+15551234567',
        body: 'Test',
      };

      const startTime = Date.now();
      await provider.send(params);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeGreaterThanOrEqual(150);
      expect(duration).toBeLessThan(450); // Allow some tolerance
    });
  });

  // ==========================================================================
  // FACTORY FUNCTION TESTS
  // ==========================================================================

  describe('factory functions', () => {
    it('should create provider with createMockTwilioProvider', () => {
      const newProvider = createMockTwilioProvider();
      expect(newProvider).toBeInstanceOf(MockTwilioProvider);
    });

    it('should create provider with custom failure rate', () => {
      const newProvider = createMockTwilioProvider(0.15) as MockTwilioProvider;
      expect(newProvider.getFailureRate()).toBe(0.15);
    });

    it('should get global singleton instance', () => {
      resetMockTwilioProvider();
      const instance1 = getMockTwilioProvider();
      const instance2 = getMockTwilioProvider();
      expect(instance1).toBe(instance2);
    });

    it('should reset global instance', () => {
      const instance1 = getMockTwilioProvider();
      resetMockTwilioProvider();
      const instance2 = getMockTwilioProvider();
      expect(instance1).not.toBe(instance2);
    });
  });
});
