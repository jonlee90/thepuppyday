/**
 * Resend email client factory - switches between mock and real client
 */

import { config } from '@/lib/config';
import { createMockResendClient, type MockResendClient } from '@/mocks/resend/client';

type ResendClient = MockResendClient;

let resendClient: ResendClient | null = null;

/**
 * Get or create a Resend client
 */
export function getResendClient(): ResendClient {
  if (resendClient) {
    return resendClient;
  }

  if (config.useMocks) {
    console.log('[Resend] Using mock client');
    resendClient = createMockResendClient();
  } else {
    // When real Resend is needed:
    // resendClient = new Resend(config.resend.apiKey);
    console.log('[Resend] Real client not implemented, using mock');
    resendClient = createMockResendClient();
  }

  return resendClient;
}

/**
 * Send an email using the configured client
 */
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}): Promise<{ id: string; error: Error | null }> {
  const client = getResendClient();

  return client.emails.send({
    from: `The Puppy Day <noreply@${config.useMocks ? 'thepuppyday.local' : 'thepuppyday.com'}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    reply_to: params.replyTo,
  });
}
