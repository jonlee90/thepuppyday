/**
 * Phase 8: Notification Provider Factory
 * Environment-based provider selection (mock vs production)
 */

import type { EmailProvider, SMSProvider } from '../types';
import { getMockResendProvider } from '../../../mocks/resend/provider';
import { getMockTwilioProvider } from '../../../mocks/twilio/provider';

// Production providers - will be imported conditionally
let ResendProvider: unknown;
let TwilioProvider: unknown;

// Try to import production providers if available
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const resendModule = require('../../resend/provider');
  ResendProvider = resendModule.ResendProvider;
} catch {
  // Production provider not available
}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const twilioModule = require('../../twilio/provider');
  TwilioProvider = twilioModule.TwilioProvider;
} catch {
  // Production provider not available
}

// ============================================================================
// ENVIRONMENT CONFIGURATION
// ============================================================================

/**
 * Check if we should use mock providers
 */
function shouldUseMocks(): boolean {
  // Check environment variable
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS;

  // Default to true if not set (safe default for development)
  if (useMocks === undefined) {
    return true;
  }

  // Convert string to boolean
  return useMocks === 'true' || useMocks === '1';
}

// ============================================================================
// EMAIL PROVIDER FACTORY
// ============================================================================

let emailProviderInstance: EmailProvider | null = null;

/**
 * Get the appropriate email provider based on environment configuration
 * Returns MockResendProvider if NEXT_PUBLIC_USE_MOCKS=true, otherwise ResendProvider
 */
export function getEmailProvider(): EmailProvider {
  // Return cached instance if available
  if (emailProviderInstance) {
    return emailProviderInstance;
  }

  const useMocks = shouldUseMocks();

  if (useMocks) {
    console.log('[Provider Factory] Using MockResendProvider for email');
    emailProviderInstance = getMockResendProvider();
  } else {
    if (!ResendProvider) {
      throw new Error(
        'ResendProvider not available. Make sure production provider is implemented and SDK is installed.'
      );
    }

    console.log('[Provider Factory] Using ResendProvider for email (production)');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emailProviderInstance = new (ResendProvider as any)() as EmailProvider;
  }

  return emailProviderInstance;
}

/**
 * Reset the email provider instance (for testing)
 */
export function resetEmailProvider(): void {
  emailProviderInstance = null;
}

// ============================================================================
// SMS PROVIDER FACTORY
// ============================================================================

let smsProviderInstance: SMSProvider | null = null;

/**
 * Get the appropriate SMS provider based on environment configuration
 * Returns MockTwilioProvider if NEXT_PUBLIC_USE_MOCKS=true, otherwise TwilioProvider
 */
export function getSMSProvider(): SMSProvider {
  // Return cached instance if available
  if (smsProviderInstance) {
    return smsProviderInstance;
  }

  const useMocks = shouldUseMocks();

  if (useMocks) {
    console.log('[Provider Factory] Using MockTwilioProvider for SMS');
    smsProviderInstance = getMockTwilioProvider();
  } else {
    if (!TwilioProvider) {
      throw new Error(
        'TwilioProvider not available. Make sure production provider is implemented and SDK is installed.'
      );
    }

    console.log('[Provider Factory] Using TwilioProvider for SMS (production)');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    smsProviderInstance = new (TwilioProvider as any)() as SMSProvider;
  }

  return smsProviderInstance;
}

/**
 * Reset the SMS provider instance (for testing)
 */
export function resetSMSProvider(): void {
  smsProviderInstance = null;
}

/**
 * Reset all provider instances (for testing)
 */
export function resetAllProviders(): void {
  resetEmailProvider();
  resetSMSProvider();
}

/**
 * Get the current provider mode
 */
export function getProviderMode(): 'mock' | 'production' {
  return shouldUseMocks() ? 'mock' : 'production';
}
