/**
 * Phase 8: Provider Factory Tests
 * Unit tests for environment-based provider selection
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getEmailProvider,
  getSMSProvider,
  resetEmailProvider,
  resetSMSProvider,
  resetAllProviders,
  getProviderMode,
} from '../index';

describe('Provider Factory', () => {
  // Save original environment variable
  const originalUseMocks = process.env.NEXT_PUBLIC_USE_MOCKS;

  afterEach(() => {
    // Restore original environment variable
    if (originalUseMocks !== undefined) {
      process.env.NEXT_PUBLIC_USE_MOCKS = originalUseMocks;
    } else {
      delete process.env.NEXT_PUBLIC_USE_MOCKS;
    }

    // Reset provider instances
    resetAllProviders();
  });

  // ==========================================================================
  // EMAIL PROVIDER TESTS
  // ==========================================================================

  describe('getEmailProvider', () => {
    it('should return MockResendProvider when NEXT_PUBLIC_USE_MOCKS=true', () => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
      resetEmailProvider();

      const provider = getEmailProvider();

      expect(provider).toBeDefined();
      // Check if it's a mock provider (has getSentEmails method)
      expect('getSentEmails' in provider).toBe(true);
    });

    it('should return MockResendProvider when NEXT_PUBLIC_USE_MOCKS=1', () => {
      process.env.NEXT_PUBLIC_USE_MOCKS = '1';
      resetEmailProvider();

      const provider = getEmailProvider();

      expect(provider).toBeDefined();
      expect('getSentEmails' in provider).toBe(true);
    });

    it('should return MockResendProvider when NEXT_PUBLIC_USE_MOCKS is undefined (default)', () => {
      delete process.env.NEXT_PUBLIC_USE_MOCKS;
      resetEmailProvider();

      const provider = getEmailProvider();

      expect(provider).toBeDefined();
      expect('getSentEmails' in provider).toBe(true);
    });

    it('should return same instance on multiple calls (singleton)', () => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
      resetEmailProvider();

      const provider1 = getEmailProvider();
      const provider2 = getEmailProvider();

      expect(provider1).toBe(provider2);
    });

    it('should return new instance after reset', () => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';

      const provider1 = getEmailProvider();
      resetEmailProvider();
      const provider2 = getEmailProvider();

      expect(provider1).not.toBe(provider2);
    });
  });

  // ==========================================================================
  // SMS PROVIDER TESTS
  // ==========================================================================

  describe('getSMSProvider', () => {
    it('should return MockTwilioProvider when NEXT_PUBLIC_USE_MOCKS=true', () => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
      resetSMSProvider();

      const provider = getSMSProvider();

      expect(provider).toBeDefined();
      // Check if it's a mock provider (has getSentMessages method)
      expect('getSentMessages' in provider).toBe(true);
    });

    it('should return MockTwilioProvider when NEXT_PUBLIC_USE_MOCKS=1', () => {
      process.env.NEXT_PUBLIC_USE_MOCKS = '1';
      resetSMSProvider();

      const provider = getSMSProvider();

      expect(provider).toBeDefined();
      expect('getSentMessages' in provider).toBe(true);
    });

    it('should return MockTwilioProvider when NEXT_PUBLIC_USE_MOCKS is undefined (default)', () => {
      delete process.env.NEXT_PUBLIC_USE_MOCKS;
      resetSMSProvider();

      const provider = getSMSProvider();

      expect(provider).toBeDefined();
      expect('getSentMessages' in provider).toBe(true);
    });

    it('should return same instance on multiple calls (singleton)', () => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
      resetSMSProvider();

      const provider1 = getSMSProvider();
      const provider2 = getSMSProvider();

      expect(provider1).toBe(provider2);
    });

    it('should return new instance after reset', () => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';

      const provider1 = getSMSProvider();
      resetSMSProvider();
      const provider2 = getSMSProvider();

      expect(provider1).not.toBe(provider2);
    });
  });

  // ==========================================================================
  // PROVIDER MODE TESTS
  // ==========================================================================

  describe('getProviderMode', () => {
    it('should return "mock" when NEXT_PUBLIC_USE_MOCKS=true', () => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';

      const mode = getProviderMode();

      expect(mode).toBe('mock');
    });

    it('should return "mock" when NEXT_PUBLIC_USE_MOCKS is undefined', () => {
      delete process.env.NEXT_PUBLIC_USE_MOCKS;

      const mode = getProviderMode();

      expect(mode).toBe('mock');
    });

    it('should return "production" when NEXT_PUBLIC_USE_MOCKS=false', () => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'false';

      const mode = getProviderMode();

      expect(mode).toBe('production');
    });

    it('should return "production" when NEXT_PUBLIC_USE_MOCKS=0', () => {
      process.env.NEXT_PUBLIC_USE_MOCKS = '0';

      const mode = getProviderMode();

      expect(mode).toBe('production');
    });
  });

  // ==========================================================================
  // RESET TESTS
  // ==========================================================================

  describe('reset functions', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_USE_MOCKS = 'true';
    });

    it('should reset email provider only', () => {
      const email1 = getEmailProvider();
      const sms1 = getSMSProvider();

      resetEmailProvider();

      const email2 = getEmailProvider();
      const sms2 = getSMSProvider();

      expect(email1).not.toBe(email2);
      expect(sms1).toBe(sms2);
    });

    it('should reset SMS provider only', () => {
      const email1 = getEmailProvider();
      const sms1 = getSMSProvider();

      resetSMSProvider();

      const email2 = getEmailProvider();
      const sms2 = getSMSProvider();

      expect(email1).toBe(email2);
      expect(sms1).not.toBe(sms2);
    });

    it('should reset all providers', () => {
      const email1 = getEmailProvider();
      const sms1 = getSMSProvider();

      resetAllProviders();

      const email2 = getEmailProvider();
      const sms2 = getSMSProvider();

      expect(email1).not.toBe(email2);
      expect(sms1).not.toBe(sms2);
    });
  });
});
