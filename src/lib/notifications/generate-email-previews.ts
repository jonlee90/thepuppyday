/**
 * Phase 8: Email Template Preview Generator
 * Generate HTML files for visual preview of email templates
 *
 * Usage: Run this script to generate preview HTML files in /tmp directory
 * Then open them in your browser to see how emails look
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  createBookingConfirmationEmail,
  createReportCardEmail,
  createRetentionReminderEmail,
  createPaymentFailedEmail,
  createPaymentReminderEmail,
  createPaymentSuccessEmail,
  createPaymentFinalNoticeEmail,
  type BookingConfirmationData,
  type ReportCardData,
  type RetentionReminderData,
  type PaymentFailedData,
  type PaymentReminderData,
  type PaymentSuccessData,
  type PaymentFinalNoticeData,
} from './email-templates';

// ============================================================================
// SAMPLE DATA
// ============================================================================

const sampleBookingData: BookingConfirmationData = {
  customer_name: 'Sarah Johnson',
  pet_name: 'Max',
  appointment_date: 'Monday, December 18, 2025',
  appointment_time: '10:00 AM',
  service_name: 'Premium Grooming',
  total_price: '$95.00',
};

const sampleReportCardData: ReportCardData = {
  pet_name: 'Max',
  report_card_link: 'https://thepuppyday.com/report-cards/12345',
  before_image_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
  after_image_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400',
};

const sampleRetentionData: RetentionReminderData = {
  pet_name: 'Max',
  weeks_since_last: 8,
  breed_name: 'Golden Retriever',
  booking_url: 'https://thepuppyday.com/book',
};

const samplePaymentFailedData: PaymentFailedData = {
  failure_reason: 'Your card was declined. Please contact your bank or update your payment method.',
  amount_due: '$95.00',
  retry_link: 'https://thepuppyday.com/account/payment',
};

const samplePaymentReminderData: PaymentReminderData = {
  charge_date: 'December 20, 2025',
  amount: '$95.00',
  payment_method: 'Visa ending in 4242',
};

const samplePaymentSuccessData: PaymentSuccessData = {
  amount: '$95.00',
  payment_date: 'December 15, 2025',
  payment_method: 'Visa ending in 4242',
};

const samplePaymentFinalNoticeData: PaymentFinalNoticeData = {
  amount_due: '$95.00',
  retry_link: 'https://thepuppyday.com/account/payment',
  suspension_date: 'December 25, 2025',
};

// ============================================================================
// GENERATE PREVIEWS
// ============================================================================

function generatePreviews() {
  // Create output directory
  const outputDir = join(process.cwd(), 'email-previews');
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  // Generate each email preview
  const previews = [
    {
      name: '1-booking-confirmation',
      email: createBookingConfirmationEmail(sampleBookingData),
    },
    {
      name: '2-report-card',
      email: createReportCardEmail(sampleReportCardData),
    },
    {
      name: '3-retention-reminder',
      email: createRetentionReminderEmail(sampleRetentionData),
    },
    {
      name: '4-payment-failed',
      email: createPaymentFailedEmail(samplePaymentFailedData),
    },
    {
      name: '5-payment-reminder',
      email: createPaymentReminderEmail(samplePaymentReminderData),
    },
    {
      name: '6-payment-success',
      email: createPaymentSuccessEmail(samplePaymentSuccessData),
    },
    {
      name: '7-payment-final-notice',
      email: createPaymentFinalNoticeEmail(samplePaymentFinalNoticeData),
    },
  ];

  // Write each preview to a file
  previews.forEach(({ name, email }) => {
    const filename = join(outputDir, `${name}.html`);

    // Replace unsubscribe placeholder with actual link for preview
    const htmlWithUnsubscribe = email.html.replace(
      '{{unsubscribe_link}}',
      'https://thepuppyday.com/unsubscribe'
    );

    writeFileSync(filename, htmlWithUnsubscribe, 'utf-8');
    console.log(`✅ Generated: ${filename}`);
  });

  // Generate index page
  const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Puppy Day - Email Template Previews</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #F8EEE5;
      padding: 40px 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: #434E54;
      font-size: 32px;
      margin-bottom: 8px;
    }
    p {
      color: #6B7280;
      margin-bottom: 32px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(67, 78, 84, 0.08);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(67, 78, 84, 0.12);
    }
    .card h2 {
      color: #434E54;
      font-size: 18px;
      margin-bottom: 8px;
    }
    .card p {
      color: #6B7280;
      font-size: 14px;
      margin-bottom: 16px;
    }
    .card a {
      display: inline-block;
      padding: 10px 20px;
      background-color: #434E54;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      font-size: 14px;
    }
    .card a:hover {
      background-color: #363F44;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>The Puppy Day Email Previews</h1>
    <p>Click any card below to preview the email template in your browser</p>

    <div class="grid">
      ${previews.map(({ name, email }) => `
        <div class="card">
          <h2>${email.subject}</h2>
          <p>${name.replace(/^\d+-/, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
          <a href="${name}.html" target="_blank">Preview Email</a>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>
  `.trim();

  const indexFilename = join(outputDir, 'index.html');
  writeFileSync(indexFilename, indexHtml, 'utf-8');
  console.log(`✅ Generated: ${indexFilename}`);

  console.log('\n🎉 All email previews generated!');
  console.log(`📂 Output directory: ${outputDir}`);
  console.log(`🌐 Open ${indexFilename} in your browser to view all templates\n`);
}

// Run if executed directly
if (require.main === module) {
  generatePreviews();
}

export { generatePreviews };
