/**
 * Sample Email Generation - Visual Test
 * Demonstrates the refactored email template system
 *
 * Run this to generate sample HTML for visual testing in browsers/email clients
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  createBookingConfirmationEmail,
  createReportCardEmail,
  createRetentionReminderEmail,
  createPaymentFailedEmail,
  createPaymentSuccessEmail,
} from '../email-templates';

// Sample data
const bookingData = {
  customer_name: 'Sarah Johnson',
  pet_name: 'Max',
  appointment_date: 'Monday, March 18, 2024',
  appointment_time: '10:00 AM',
  service_name: 'Premium Grooming',
  total_price: '$95.00',
};

const reportCardData = {
  pet_name: 'Bella',
  report_card_link: 'https://thepuppyday.com/report-cards/abc123',
  before_image_url: 'https://via.placeholder.com/300x300.png?text=Before',
  after_image_url: 'https://via.placeholder.com/300x300.png?text=After',
};

const retentionData = {
  pet_name: 'Charlie',
  weeks_since_last: 8,
  breed_name: 'Golden Retriever',
  booking_url: 'https://thepuppyday.com/book',
};

const paymentFailedData = {
  failure_reason: 'Your card was declined. Please verify your card details and try again.',
  amount_due: '$45.00',
  retry_link: 'https://thepuppyday.com/payment/retry',
};

const paymentSuccessData = {
  amount: '$45.00',
  payment_date: 'March 15, 2024',
  payment_method: 'Visa ending in 1234',
};

// Generate emails
const emails = [
  {
    name: 'booking-confirmation',
    email: createBookingConfirmationEmail(bookingData),
  },
  {
    name: 'report-card',
    email: createReportCardEmail(reportCardData),
  },
  {
    name: 'retention-reminder',
    email: createRetentionReminderEmail(retentionData),
  },
  {
    name: 'payment-failed',
    email: createPaymentFailedEmail(paymentFailedData),
  },
  {
    name: 'payment-success',
    email: createPaymentSuccessEmail(paymentSuccessData),
  },
];

// Output directory
const outputDir = join(process.cwd(), 'src/lib/notifications/examples/output');

// Create output directory if it doesn't exist
try {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
} catch (error) {
  console.error('Failed to create output directory:', error);
}

// Write HTML files
emails.forEach(({ name, email }) => {
  const htmlPath = join(outputDir, `${name}.html`);
  const textPath = join(outputDir, `${name}.txt`);

  try {
    writeFileSync(htmlPath, email.html, 'utf-8');
    writeFileSync(textPath, email.text, 'utf-8');
    console.log(`✓ Generated ${name}.html and ${name}.txt`);
  } catch (error) {
    console.error(`✗ Failed to generate ${name}:`, error);
  }
});

console.log('\nSample emails generated successfully!');
console.log(`Output directory: ${outputDir}`);
console.log('\nOpen the HTML files in a browser to preview the emails.');
console.log('For email client testing, use tools like Litmus or Email on Acid.');
