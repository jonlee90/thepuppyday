/**
 * Mock Report Card Email
 * Task 0023: Mock email sending for development
 */

import { generateId } from '@/lib/utils';

export interface MockReportCardEmailParams {
  to: string;
  customerName: string;
  petName: string;
  reportCardUrl: string;
  afterPhotoUrl?: string;
}

export interface MockReportCardEmailResult {
  id: string;
  error: Error | null;
}

/**
 * Mock version of sendReportCardEmail
 * Simulates email sending and logs to console
 */
export async function sendReportCardEmail(
  params: MockReportCardEmailParams
): Promise<MockReportCardEmailResult> {
  // Generate fake email ID
  const emailId = `email_${generateId()}`;

  // Build subject
  const subject = `${params.petName}'s Grooming Report Card is Ready!`;

  // Log to console
  console.log('\n[Mock Resend] Report Card Email:');
  console.log('─'.repeat(50));
  console.log(`To: ${params.to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Pet: ${params.petName}`);
  console.log(`Customer: ${params.customerName}`);
  console.log(`Report URL: ${params.reportCardUrl}`);
  if (params.afterPhotoUrl) {
    console.log(`After Photo: ${params.afterPhotoUrl}`);
  }
  console.log('─'.repeat(50));
  console.log(`Email ID: ${emailId}\n`);

  return {
    id: emailId,
    error: null,
  };
}

/**
 * Preview email content
 */
export function previewReportCardEmail(params: MockReportCardEmailParams): string {
  const { customerName, petName, reportCardUrl, afterPhotoUrl } = params;

  return `
Subject: ${petName}'s Grooming Report Card is Ready!

Hi ${customerName},

Great news! ${petName}'s grooming session is complete! We had a wonderful time pampering your furry friend.

${afterPhotoUrl ? `[After Photo: ${afterPhotoUrl}]` : ''}

We've prepared a detailed report card showing how ${petName} did during the grooming session, including before and after photos, behavior notes, and health observations.

View Report Card: ${reportCardUrl}

Thank you for trusting us with ${petName}'s care. We hope to see you both again soon!

The Puppy Day
14936 Leffingwell Rd, La Mirada, CA 90638
(657) 252-2903
puppyday14936@gmail.com

Hours: Monday-Saturday, 9:00 AM - 5:00 PM
  `.trim();
}
