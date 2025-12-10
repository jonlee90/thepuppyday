/**
 * Mock Resend email client for development
 */

import { generateId } from '@/lib/utils';

interface EmailParams {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  reply_to?: string;
}

interface SentEmail extends EmailParams {
  id: string;
  sent_at: string;
}

// Store sent emails for debugging
const sentEmails: SentEmail[] = [];

export function createMockResendClient() {
  return {
    emails: {
      async send(params: EmailParams): Promise<{ id: string; error: Error | null }> {
        const emailId = `email_${generateId()}`;

        const sentEmail: SentEmail = {
          ...params,
          id: emailId,
          sent_at: new Date().toISOString(),
        };

        sentEmails.push(sentEmail);

        // Log to console
        console.log('\n[Mock Resend] Email sent:');
        console.log('─'.repeat(50));
        console.log(`From: ${params.from}`);
        console.log(`To: ${Array.isArray(params.to) ? params.to.join(', ') : params.to}`);
        console.log(`Subject: ${params.subject}`);
        if (params.text) {
          console.log(`\nBody (text):\n${params.text}`);
        }
        console.log('─'.repeat(50));
        console.log(`Email ID: ${emailId}\n`);

        return { id: emailId, error: null };
      },
    },

    // Helper methods for debugging
    _getSentEmails(): SentEmail[] {
      return [...sentEmails];
    },

    _clearSentEmails(): void {
      sentEmails.length = 0;
    },

    _getLastEmail(): SentEmail | undefined {
      return sentEmails[sentEmails.length - 1];
    },
  };
}

export type MockResendClient = ReturnType<typeof createMockResendClient>;

// Common email templates for testing
export const mockEmailTemplates = {
  bookingConfirmation: (data: {
    customerName: string;
    petName: string;
    serviceName: string;
    date: string;
    time: string;
  }) => ({
    subject: `Booking Confirmed - ${data.petName}'s Appointment`,
    text: `
Hi ${data.customerName},

Your appointment has been confirmed!

Details:
- Pet: ${data.petName}
- Service: ${data.serviceName}
- Date: ${data.date}
- Time: ${data.time}

We look forward to seeing you and ${data.petName}!

The Puppy Day Team
    `.trim(),
  }),

  appointmentReminder: (data: {
    customerName: string;
    petName: string;
    date: string;
    time: string;
  }) => ({
    subject: `Reminder: ${data.petName}'s Appointment Tomorrow`,
    text: `
Hi ${data.customerName},

This is a friendly reminder that ${data.petName}'s grooming appointment is tomorrow at ${data.time}.

Date: ${data.date}
Time: ${data.time}

See you soon!

The Puppy Day Team
    `.trim(),
  }),

  reportCardReady: (data: {
    customerName: string;
    petName: string;
    reportUrl: string;
  }) => ({
    subject: `${data.petName}'s Paw-gress Report Card is Ready!`,
    text: `
Hi ${data.customerName},

Great news! ${data.petName}'s grooming session is complete and the report card is ready.

View the report card here: ${data.reportUrl}

Thank you for choosing The Puppy Day!

The Puppy Day Team
    `.trim(),
  }),

  passwordReset: (data: {
    resetUrl: string;
  }) => ({
    subject: 'Reset Your Password - The Puppy Day',
    text: `
You requested to reset your password.

Click here to reset: ${data.resetUrl}

If you didn't request this, please ignore this email.

The Puppy Day Team
    `.trim(),
  }),
};
