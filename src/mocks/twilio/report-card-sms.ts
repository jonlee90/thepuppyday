/**
 * Mock Report Card SMS
 * Task 0022: Mock SMS sending for development
 */

import { generateId } from '@/lib/utils';

export interface MockReportCardSmsParams {
  to: string;
  customerName: string;
  petName: string;
  reportCardUrl: string;
}

export interface MockReportCardSmsResult {
  sid: string;
  status: string;
  error: Error | null;
}

/**
 * Mock version of sendReportCardSMS
 * Simulates SMS sending and logs to console
 */
export async function sendReportCardSMS(
  params: MockReportCardSmsParams
): Promise<MockReportCardSmsResult> {
  // Generate fake SID
  const sid = `SM${generateId().replace(/-/g, '').slice(0, 32)}`;

  // Build message
  const message = `Hi ${params.customerName}! ${params.petName}'s grooming report is ready! See how they did: ${params.reportCardUrl}`;

  // Log to console
  console.log('\n[Mock Twilio] Report Card SMS:');
  console.log('─'.repeat(50));
  console.log(`To: ${params.to}`);
  console.log(`Pet: ${params.petName}`);
  console.log(`Customer: ${params.customerName}`);
  console.log(`\nMessage:\n${message}`);
  console.log('─'.repeat(50));
  console.log(`SID: ${sid}`);
  console.log(`Status: sent\n`);

  return {
    sid,
    status: 'sent',
    error: null,
  };
}

/**
 * Preview SMS message without sending
 */
export function previewReportCardSms(params: MockReportCardSmsParams): string {
  return `Hi ${params.customerName}! ${params.petName}'s grooming report is ready! See how they did: ${params.reportCardUrl}`;
}
