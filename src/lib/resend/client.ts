/**
 * Resend email client factory - switches between mock and real client
 */

import { config } from '@/lib/config';
import { createMockResendClient, type MockResendClient } from '@/mocks/resend/client';

type ResendSendParams = {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  reply_to?: string;
};

type ResendSendResult = { id: string; error: Error | null };

interface ResendClientInterface {
  emails: {
    send(params: ResendSendParams): Promise<ResendSendResult>;
  };
}

type AnyResendClient = MockResendClient | ResendClientInterface;

let resendClient: AnyResendClient | null = null;

const FROM_EMAIL = 'The Puppy Day <noreply@thepuppyday.com>';

/**
 * Get or create a Resend client
 */
export function getResendClient(): AnyResendClient {
  if (resendClient) {
    return resendClient;
  }

  if (config.useMocks) {
    console.log('[Resend] Using mock client');
    resendClient = createMockResendClient();
  } else {
    if (!config.resend.apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required for production');
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Resend } = require('resend');
    console.log('[Resend] Using production client');
    resendClient = new Resend(config.resend.apiKey) as ResendClientInterface;
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
  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  const filtered = recipients.filter((email) => !email.endsWith('@puppyday.local'));
  if (filtered.length === 0) {
    console.log('[Resend] Skipping email — all recipients are @puppyday.local:', params.to);
    return { id: 'skipped-local', error: null };
  }

  const client = getResendClient();

  return client.emails.send({
    from: FROM_EMAIL,
    to: filtered.length === recipients.length ? params.to : filtered,
    subject: params.subject,
    html: params.html,
    text: params.text,
    reply_to: params.replyTo,
  });
}
