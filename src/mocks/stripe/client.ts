/**
 * Mock Stripe client for development
 */

import { generateId } from '@/lib/utils';

interface MockCheckoutSession {
  id: string;
  url: string;
  payment_intent: string;
  status: 'open' | 'complete' | 'expired';
  amount_total: number;
  customer_email: string | null;
}

interface MockPaymentIntent {
  id: string;
  amount: number;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
  client_secret: string;
}

interface CreateCheckoutSessionParams {
  line_items: Array<{
    price_data?: {
      currency: string;
      unit_amount: number;
      product_data: {
        name: string;
        description?: string;
      };
    };
    quantity: number;
  }>;
  mode: 'payment' | 'subscription';
  success_url: string;
  cancel_url: string;
  customer_email?: string;
  metadata?: Record<string, string>;
}

interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

// Store for mock data
const mockSessions = new Map<string, MockCheckoutSession>();
const mockPaymentIntents = new Map<string, MockPaymentIntent>();

export function createMockStripeClient() {
  return {
    checkout: {
      sessions: {
        async create(params: CreateCheckoutSessionParams): Promise<MockCheckoutSession> {
          const sessionId = `cs_test_${generateId()}`;
          const paymentIntentId = `pi_test_${generateId()}`;

          const totalAmount = params.line_items.reduce((sum, item) => {
            return sum + (item.price_data?.unit_amount || 0) * item.quantity;
          }, 0);

          const session: MockCheckoutSession = {
            id: sessionId,
            url: `${params.success_url}?session_id=${sessionId}`,
            payment_intent: paymentIntentId,
            status: 'open',
            amount_total: totalAmount,
            customer_email: params.customer_email || null,
          };

          mockSessions.set(sessionId, session);

          console.log('[Mock Stripe] Created checkout session:', {
            id: sessionId,
            amount: totalAmount / 100,
            email: params.customer_email,
          });

          return session;
        },

        async retrieve(sessionId: string): Promise<MockCheckoutSession | null> {
          return mockSessions.get(sessionId) || null;
        },
      },
    },

    paymentIntents: {
      async create(params: CreatePaymentIntentParams): Promise<MockPaymentIntent> {
        const intentId = `pi_test_${generateId()}`;
        const clientSecret = `${intentId}_secret_${generateId()}`;

        const intent: MockPaymentIntent = {
          id: intentId,
          amount: params.amount,
          status: 'requires_payment_method',
          client_secret: clientSecret,
        };

        mockPaymentIntents.set(intentId, intent);

        console.log('[Mock Stripe] Created payment intent:', {
          id: intentId,
          amount: params.amount / 100,
        });

        return intent;
      },

      async retrieve(intentId: string): Promise<MockPaymentIntent | null> {
        return mockPaymentIntents.get(intentId) || null;
      },

      async confirm(intentId: string): Promise<MockPaymentIntent | null> {
        const intent = mockPaymentIntents.get(intentId);
        if (intent) {
          intent.status = 'succeeded';
          mockPaymentIntents.set(intentId, intent);
          console.log('[Mock Stripe] Confirmed payment intent:', intentId);
          return intent;
        }
        return null;
      },
    },

    refunds: {
      async create(params: { payment_intent: string; amount?: number }): Promise<{
        id: string;
        payment_intent: string;
        amount: number;
        status: string;
      }> {
        const refundId = `re_test_${generateId()}`;
        const intent = mockPaymentIntents.get(params.payment_intent);

        console.log('[Mock Stripe] Created refund:', {
          id: refundId,
          payment_intent: params.payment_intent,
          amount: params.amount,
        });

        return {
          id: refundId,
          payment_intent: params.payment_intent,
          amount: params.amount || intent?.amount || 0,
          status: 'succeeded',
        };
      },
    },

    customers: {
      async create(params: { email: string; name?: string }): Promise<{ id: string; email: string }> {
        const customerId = `cus_test_${generateId()}`;
        console.log('[Mock Stripe] Created customer:', { id: customerId, email: params.email });
        return { id: customerId, email: params.email };
      },
    },

    // Helper to simulate successful payment (for testing)
    _simulatePaymentSuccess(sessionId: string): void {
      const session = mockSessions.get(sessionId);
      if (session) {
        session.status = 'complete';
        mockSessions.set(sessionId, session);

        const intent = mockPaymentIntents.get(session.payment_intent);
        if (intent) {
          intent.status = 'succeeded';
          mockPaymentIntents.set(session.payment_intent, intent);
        }

        console.log('[Mock Stripe] Simulated payment success for session:', sessionId);
      }
    },
  };
}

export type MockStripeClient = ReturnType<typeof createMockStripeClient>;
