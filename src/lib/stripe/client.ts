/**
 * Stripe client factory - switches between mock and real client
 */

import { config } from '@/lib/config';
import { createMockStripeClient, type MockStripeClient } from '@/mocks/stripe/client';

// Real Stripe would be imported like: import Stripe from 'stripe';
// For now, we'll use a type that matches our mock
type StripeClient = MockStripeClient;

let stripeClient: StripeClient | null = null;

/**
 * Get or create a Stripe client
 */
export function getStripeClient(): StripeClient {
  if (stripeClient) {
    return stripeClient;
  }

  if (config.useMocks) {
    console.log('[Stripe] Using mock client');
    stripeClient = createMockStripeClient();
  } else {
    // When real Stripe is needed:
    // stripeClient = new Stripe(config.stripe.secretKey, {
    //   apiVersion: '2023-10-16',
    // });
    // For now, fall back to mock
    console.log('[Stripe] Real client not implemented, using mock');
    stripeClient = createMockStripeClient();
  }

  return stripeClient;
}

/**
 * Get the Stripe publishable key for client-side use
 */
export function getStripePublishableKey(): string {
  return config.stripe.publishableKey;
}
