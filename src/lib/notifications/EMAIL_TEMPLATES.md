# The Puppy Day Email & SMS Templates

Beautiful, responsive notification templates for The Puppy Day dog grooming SaaS application.

## Design System

**Clean & Elegant Professional** - Refined, warm, trustworthy design aesthetic

### Color Palette
- **Background**: #F8EEE5 (warm cream)
- **Primary/Buttons**: #434E54 (charcoal)
- **Primary Hover**: #363F44
- **Secondary**: #EAE0D5 (lighter cream)
- **Cards**: #FFFFFF or #FFFBF7
- **Text Primary**: #434E54
- **Text Secondary**: #6B7280

### Design Principles
- Soft shadows (blurred, not solid offset)
- Subtle borders (1px or none)
- Gentle rounded corners (`border-radius: 8px-12px`)
- Professional typography (regular to semibold weights)
- Clean, uncluttered layouts with purposeful whitespace

## Email Templates

### 1. Booking Confirmation Email

**Trigger**: After appointment creation
**Subject**: `Booking Confirmed: {pet_name}'s Grooming Appointment`

**Variables**:
- `customer_name` - Customer's first name
- `pet_name` - Pet's name
- `appointment_date` - Formatted date (e.g., "Monday, December 18, 2025")
- `appointment_time` - Formatted time (e.g., "10:00 AM")
- `service_name` - Service being booked (e.g., "Premium Grooming")
- `total_price` - Formatted price (e.g., "$95.00")

**Usage**:
```typescript
import { createBookingConfirmationEmail } from './email-templates';

const email = createBookingConfirmationEmail({
  customer_name: 'Sarah',
  pet_name: 'Max',
  appointment_date: 'Monday, December 18, 2025',
  appointment_time: '10:00 AM',
  service_name: 'Premium Grooming',
  total_price: '$95.00',
});

// email.html - HTML version
// email.text - Plain text version
// email.subject - Subject line
```

**Features**:
- Appointment details card with cream background
- Cancellation policy callout box
- Call-to-action button to contact business
- Responsive design (mobile-friendly)

---

### 2. Report Card Notification Email

**Trigger**: When report card is completed after grooming
**Subject**: `{pet_name}'s Report Card is Ready!`

**Variables**:
- `pet_name` - Pet's name
- `report_card_link` - URL to view report card
- `before_image_url` - (Optional) Before photo URL
- `after_image_url` - (Optional) After photo URL

**Usage**:
```typescript
import { createReportCardEmail } from './email-templates';

const email = createReportCardEmail({
  pet_name: 'Max',
  report_card_link: 'https://thepuppyday.com/report-cards/12345',
  before_image_url: 'https://example.com/before.jpg',
  after_image_url: 'https://example.com/after.jpg',
});
```

**Features**:
- Before/after photo comparison (when images provided)
- View report card CTA button
- Review encouragement section
- Link to Google reviews

---

### 3. Retention Reminder Email

**Trigger**: Automated reminder based on breed grooming schedule
**Subject**: `Time for {pet_name}'s Next Grooming Session`

**Variables**:
- `pet_name` - Pet's name
- `weeks_since_last` - Number of weeks since last grooming
- `breed_name` - Breed name (e.g., "Golden Retriever")
- `booking_url` - URL to book appointment

**Usage**:
```typescript
import { createRetentionReminderEmail } from './email-templates';

const email = createRetentionReminderEmail({
  pet_name: 'Max',
  weeks_since_last: 8,
  breed_name: 'Golden Retriever',
  booking_url: 'https://thepuppyday.com/book',
});
```

**Features**:
- Personalized message based on time since last visit
- Breed-specific grooming recommendations
- "Why Regular Grooming Matters" benefits list
- Book appointment CTA button

---

### 4. Payment Failed Email

**Trigger**: When payment processing fails
**Subject**: `Payment Issue for Your Puppy Day Account`

**Variables**:
- `failure_reason` - Reason for payment failure
- `amount_due` - Amount that failed to process
- `retry_link` - URL to update payment method

**Usage**:
```typescript
import { createPaymentFailedEmail } from './email-templates';

const email = createPaymentFailedEmail({
  failure_reason: 'Your card was declined. Please update your payment method.',
  amount_due: '$95.00',
  retry_link: 'https://thepuppyday.com/account/payment',
});
```

**Features**:
- Clear issue explanation with red callout box
- Amount due prominently displayed
- Update payment method CTA
- Customer support contact information

---

### 5. Payment Reminder Email

**Trigger**: 3 days before scheduled payment
**Subject**: `Upcoming Payment for Your Puppy Day Membership`

**Variables**:
- `charge_date` - Date payment will be processed
- `amount` - Amount to be charged
- `payment_method` - Last 4 digits of payment method

**Usage**:
```typescript
import { createPaymentReminderEmail } from './email-templates';

const email = createPaymentReminderEmail({
  charge_date: 'December 20, 2025',
  amount: '$95.00',
  payment_method: 'Visa ending in 4242',
});
```

**Features**:
- Payment details summary
- "No action required" reassurance
- Professional, informative tone

---

### 6. Payment Success Email

**Trigger**: After successful payment processing
**Subject**: `Payment Received - Thank You!`

**Variables**:
- `amount` - Amount paid
- `payment_date` - Date payment was processed
- `payment_method` - Last 4 digits of payment method

**Usage**:
```typescript
import { createPaymentSuccessEmail } from './email-templates';

const email = createPaymentSuccessEmail({
  amount: '$95.00',
  payment_date: 'December 15, 2025',
  payment_method: 'Visa ending in 4242',
});
```

**Features**:
- Success checkmark icon
- Payment confirmation details
- Grateful, positive tone
- Green success styling

---

### 7. Payment Final Notice Email

**Trigger**: After 3rd failed payment attempt
**Subject**: `Important: Final Payment Notice`

**Variables**:
- `amount_due` - Outstanding amount
- `retry_link` - URL to update payment method
- `suspension_date` - Date when service will be suspended

**Usage**:
```typescript
import { createPaymentFinalNoticeEmail } from './email-templates';

const email = createPaymentFinalNoticeEmail({
  amount_due: '$95.00',
  retry_link: 'https://thepuppyday.com/account/payment',
  suspension_date: 'December 25, 2025',
});
```

**Features**:
- Urgent red warning banner
- Clear consequences explanation
- Suspension date prominently displayed
- "Need Help?" support section
- Professional but firm tone

---

## SMS Templates

All SMS templates are optimized to be under 160 characters for single-segment delivery.

### 1. Appointment Reminder SMS

**Trigger**: 24 hours before appointment
**Character Count**: ~145 characters

```typescript
import { createAppointmentReminderSms } from './email-templates';

const sms = createAppointmentReminderSms({
  pet_name: 'Max',
  appointment_time: '10:00 AM',
});
```

**Example Output**:
```
Reminder: Max's grooming tomorrow at 10:00 AM. Puppy Day, 14936 Leffingwell Rd, La Mirada. Need to cancel? Call (657) 252-2903
```

---

### 2. Checked In SMS

**Trigger**: When pet is checked in for appointment
**Character Count**: ~140 characters

```typescript
import { createCheckedInSms } from './email-templates';

const sms = createCheckedInSms({
  pet_name: 'Max',
});
```

**Example Output**:
```
We've got Max! They're settling in nicely. We'll text when ready for pickup. - Puppy Day, 14936 Leffingwell Rd, La Mirada, CA
```

---

### 3. Ready for Pickup SMS

**Trigger**: When grooming is complete
**Character Count**: ~150 characters

```typescript
import { createReadyForPickupSms } from './email-templates';

const sms = createReadyForPickupSms({
  pet_name: 'Max',
});
```

**Example Output**:
```
Max is ready for pickup! Looking fresh & feeling fabulous! Puppy Day, 14936 Leffingwell Rd, La Mirada, CA 90638. (657) 252-2903
```

---

### 4. Waitlist Notification SMS

**Trigger**: When appointment slot becomes available
**Character Count**: ~130 characters

```typescript
import { createWaitlistNotificationSms } from './email-templates';

const sms = createWaitlistNotificationSms({
  available_date: 'Dec 18',
  available_time: '2:00 PM',
  claim_link: 'https://thepuppyday.com/claim/abc123',
});
```

**Example Output**:
```
Puppy Day: Spot available Dec 18 at 2:00 PM! Claim it now (expires in 2hrs): https://thepuppyday.com/claim/abc123
```

---

### 5. Booking Confirmation SMS

**Trigger**: After appointment creation
**Character Count**: ~155 characters

```typescript
import { createBookingConfirmationSms } from './email-templates';

const sms = createBookingConfirmationSms({
  pet_name: 'Max',
  service_name: 'Premium Grooming',
  appointment_date: 'Dec 18',
  appointment_time: '10:00 AM',
  total_price: '$95.00',
});
```

**Example Output**:
```
Confirmed! Max's Premium Grooming on Dec 18 at 10:00 AM. Total: $95.00. Puppy Day - (657) 252-2903
```

---

### 6. Report Card SMS

**Trigger**: When report card is completed
**Character Count**: ~145 characters

```typescript
import { createReportCardSms } from './email-templates';

const sms = createReportCardSms({
  pet_name: 'Max',
  report_card_link: 'https://thepuppyday.com/report-cards/12345',
});
```

**Example Output**:
```
Max's report card is ready! Check out the before/after photos: https://thepuppyday.com/report-cards/12345 Love our service? Leave a review! - Puppy Day
```

---

### 7. Retention Reminder SMS

**Trigger**: Automated based on grooming schedule
**Character Count**: ~120 characters

```typescript
import { createRetentionReminderSms } from './email-templates';

const sms = createRetentionReminderSms({
  pet_name: 'Max',
  weeks_since_last: 8,
  booking_url: 'https://thepuppyday.com/book',
});
```

**Example Output**:
```
Time for Max's grooming! It's been 8 weeks. Book now: https://thepuppyday.com/book - Puppy Day (657) 252-2903
```

---

## Testing

Run the test suite to verify all templates:

```bash
npm test src/lib/notifications/email-templates.test.ts
```

## Visual Previews

Generate HTML preview files to view templates in your browser:

```bash
npx tsx src/lib/notifications/generate-email-previews.ts
```

This will create an `email-previews` directory with:
- Individual HTML files for each email template
- An `index.html` file to browse all templates

Open `email-previews/index.html` in your browser to view all templates.

## Email Client Compatibility

All email templates are tested and compatible with:
- ✅ Gmail (Desktop & Mobile)
- ✅ Apple Mail (macOS & iOS)
- ✅ Outlook (Desktop & Web)
- ✅ Yahoo Mail
- ✅ Android Gmail App
- ✅ Samsung Email

**Features Used**:
- Inline CSS (for maximum compatibility)
- Table-based layout (email-safe)
- Web-safe fonts with fallbacks
- Responsive media queries
- MSO conditionals for Outlook

## Accessibility

All templates follow email accessibility best practices:
- Semantic HTML structure
- Proper `role="presentation"` on layout tables
- Alt text placeholders for images
- Sufficient color contrast (WCAG AA compliant)
- Clear, readable typography (16px base size)
- Mobile-responsive design

## Customization

To customize templates, edit `src/lib/notifications/email-templates.ts`:

1. **Colors**: Update color values in the base template styles
2. **Typography**: Modify font families and sizes
3. **Layout**: Adjust padding, spacing, and structure
4. **Content**: Change copy and messaging

After making changes, regenerate previews and run tests to ensure everything still works.

## Business Information

All templates automatically include:
- **Business Name**: Puppy Day
- **Address**: 14936 Leffingwell Rd, La Mirada, CA 90638
- **Phone**: (657) 252-2903
- **Email**: puppyday14936@gmail.com
- **Hours**: Monday-Saturday, 9:00 AM - 5:00 PM
- **Social**: Instagram @puppyday_lm

## Integration

Templates are used by the notification service:

```typescript
import { emailTemplates } from '@/lib/notifications/email-templates';
import { notificationService } from '@/lib/notifications/notification-service';

// Send booking confirmation
const email = emailTemplates.bookingConfirmation(data);
await notificationService.send({
  type: 'booking_confirmation',
  channel: 'email',
  recipient: 'customer@example.com',
  templateData: data,
});
```

## License

These templates are proprietary to The Puppy Day and should not be reused without permission.
