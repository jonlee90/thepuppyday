/**
 * Twilio Incoming SMS Webhook
 * POST /api/webhooks/twilio/incoming
 *
 * Handles incoming SMS messages from Twilio, specifically for
 * waitlist slot offer responses ("YES" replies).
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { handleWaitlistResponse } from '@/lib/admin/waitlist-response-handler';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/twilio/incoming
 *
 * Twilio Webhook Parameters (URL-encoded form):
 * - From: Sender's phone number
 * - To: Receiver's phone number (Twilio number)
 * - Body: Message body
 * - MessageSid: Unique message ID
 * - X-Twilio-Signature: Signature for validation
 *
 * Response:
 * TwiML response with confirmation message
 */
export async function POST(request: Request) {
  try {
    // Parse form data from Twilio
    const formData = await request.formData();
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;

    // Get Twilio signature for validation
    const twilioSignature = request.headers.get('X-Twilio-Signature');

    console.log('📩 Incoming SMS from Twilio:');
    console.log(`  From: ${from}`);
    console.log(`  To: ${to}`);
    console.log(`  Body: ${body}`);
    console.log(`  MessageSid: ${messageSid}`);

    // Validate Twilio signature (skip in mock mode)
    const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
    if (!useMocks && twilioSignature) {
      const isValid = validateTwilioSignature(
        request.url,
        Object.fromEntries(formData),
        twilioSignature
      );

      if (!isValid) {
        console.warn('⚠️ Invalid Twilio signature');
        return new Response('Invalid signature', { status: 403 });
      }
    }

    // Handle the response
    const supabase = await createServerSupabaseClient();
    const result = await handleWaitlistResponse(supabase, from, body);

    console.log(`✅ Response handled: ${result.action}`);

    // Return TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${result.message}</Message>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('❌ Error handling incoming SMS:', error);

    // Return error TwiML
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>We're sorry, an error occurred. Please contact The Puppy Day at (657) 252-2903.</Message>
</Response>`;

    return new Response(errorTwiml, {
      status: 200, // Still return 200 to Twilio
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}

/**
 * Validate Twilio request signature
 *
 * @param url Full request URL
 * @param params Request parameters
 * @param signature Twilio signature from header
 * @returns True if signature is valid
 */
function validateTwilioSignature(
  url: string,
  params: Record<string, any>,
  signature: string
): boolean {
  try {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      console.warn('TWILIO_AUTH_TOKEN not configured');
      return false;
    }

    // Build the data string (URL + sorted params)
    let data = url;
    Object.keys(params)
      .sort()
      .forEach((key) => {
        data += key + params[key];
      });

    // Calculate HMAC-SHA1
    const hmac = crypto.createHmac('sha1', authToken);
    hmac.update(data);
    const expectedSignature = hmac.digest('base64');

    return signature === expectedSignature;
  } catch (error) {
    console.error('Error validating Twilio signature:', error);
    return false;
  }
}
