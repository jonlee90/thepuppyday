/**
 * Mock Twilio SMS client for development
 */

import { generateId } from '@/lib/utils';

interface SmsParams {
  to: string;
  body: string;
  from?: string;
}

interface SentSms extends SmsParams {
  sid: string;
  sent_at: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
}

// Store sent SMS for debugging
const sentMessages: SentSms[] = [];

export function createMockTwilioClient() {
  return {
    messages: {
      async create(params: SmsParams): Promise<{ sid: string; status: string; error: Error | null }> {
        const sid = `SM${generateId().replace(/-/g, '').slice(0, 32)}`;

        const sentSms: SentSms = {
          ...params,
          sid,
          sent_at: new Date().toISOString(),
          status: 'sent',
        };

        sentMessages.push(sentSms);

        // Log to console
        console.log('\n[Mock Twilio] SMS sent:');
        console.log('─'.repeat(50));
        console.log(`To: ${params.to}`);
        console.log(`From: ${params.from || '+10000000000'}`);
        console.log(`\nMessage:\n${params.body}`);
        console.log('─'.repeat(50));
        console.log(`SID: ${sid}\n`);

        return { sid, status: 'sent', error: null };
      },
    },

    // Helper methods for debugging
    _getSentMessages(): SentSms[] {
      return [...sentMessages];
    },

    _clearSentMessages(): void {
      sentMessages.length = 0;
    },

    _getLastMessage(): SentSms | undefined {
      return sentMessages[sentMessages.length - 1];
    },
  };
}

export type MockTwilioClient = ReturnType<typeof createMockTwilioClient>;

// Common SMS templates for testing
export const mockSmsTemplates = {
  bookingConfirmation: (data: {
    petName: string;
    date: string;
    time: string;
  }) => `The Puppy Day: ${data.petName}'s appointment confirmed for ${data.date} at ${data.time}. See you soon!`,

  appointmentReminder: (data: {
    petName: string;
    time: string;
  }) => `The Puppy Day: Reminder - ${data.petName}'s grooming appointment is tomorrow at ${data.time}. Reply CONFIRM to confirm.`,

  checkedIn: (data: {
    petName: string;
  }) => `The Puppy Day: We've got ${data.petName}! We'll text you when they're ready for pickup.`,

  readyForPickup: (data: {
    petName: string;
  }) => `The Puppy Day: ${data.petName} is ready for pickup! They look amazing. 🐕`,

  reportCardReady: (data: {
    petName: string;
    reportUrl: string;
  }) => `The Puppy Day: ${data.petName}'s report card is ready! View it here: ${data.reportUrl}`,

  waitlistNotification: (data: {
    petName: string;
    date: string;
    time: string;
  }) => `The Puppy Day: Great news! A spot opened up for ${data.petName} on ${data.date} at ${data.time}. Reply YES for 10% off!`,

  groomingReminder: (data: {
    petName: string;
    message: string;
    bookingUrl: string;
  }) => `The Puppy Day: Hi! ${data.petName} is due for a groom ${data.message}. Book now: ${data.bookingUrl}`,
};
