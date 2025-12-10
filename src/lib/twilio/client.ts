/**
 * Twilio SMS client factory - switches between mock and real client
 */

import { config } from '@/lib/config';
import { createMockTwilioClient, type MockTwilioClient } from '@/mocks/twilio/client';

type TwilioClient = MockTwilioClient;

let twilioClient: TwilioClient | null = null;

/**
 * Get or create a Twilio client
 */
export function getTwilioClient(): TwilioClient {
  if (twilioClient) {
    return twilioClient;
  }

  if (config.useMocks) {
    console.log('[Twilio] Using mock client');
    twilioClient = createMockTwilioClient();
  } else {
    // When real Twilio is needed:
    // twilioClient = new Twilio(config.twilio.accountSid, config.twilio.authToken);
    console.log('[Twilio] Real client not implemented, using mock');
    twilioClient = createMockTwilioClient();
  }

  return twilioClient;
}

/**
 * Send an SMS using the configured client
 */
export async function sendSms(params: {
  to: string;
  body: string;
}): Promise<{ sid: string; error: Error | null }> {
  const client = getTwilioClient();

  return client.messages.create({
    to: params.to,
    body: params.body,
    from: config.twilio.phoneNumber,
  });
}
