# Phase 8 Notification Templates Summary
**Tasks: 0098-0104**

This document summarizes all notification templates created for The Puppy Day notification system.

## Migration File

**File:** `supabase/migrations/20241215_phase8_notification_default_templates.sql`

This migration creates production-ready email and SMS templates following The Puppy Day's "Clean & Elegant Professional" design aesthetic.

## Template Overview

### Task 0098: Booking Confirmation Templates

#### Email Template: "Booking Confirmation Email - Enhanced"
- **Type:** `booking_confirmation`
- **Channel:** `email`
- **Subject:** "Appointment Confirmed for {{pet_name}} - {{appointment_date}}"
- **Features:**
  - Responsive HTML design with warm cream (#F8EEE5) background
  - Appointment details card with date, time, service, and price
  - "What to Expect" section with customer instructions
  - Cancellation policy notice (24-hour advance notice required)
  - Complete business contact information
  - Mobile-friendly layout

**Variables:**
- `customer_name` (required, max 50 chars)
- `pet_name` (required, max 50 chars)
- `appointment_date` (required, max 50 chars)
- `appointment_time` (required, max 20 chars)
- `service_name` (required, max 100 chars)
- `total_price` (required, max 20 chars)

#### SMS Template: "Booking Confirmation SMS"
- **Type:** `booking_confirmation`
- **Channel:** `sms`
- **Text:** "{{pet_name}}'s grooming confirmed for {{appointment_date}} at {{appointment_time}}. Total: {{total_price}}. Questions? Call (657) 252-2903 - Puppy Day"
- **Length:** Under 160 characters

**Variables:**
- `pet_name` (required, max 50 chars)
- `appointment_date` (required, max 20 chars)
- `appointment_time` (required, max 20 chars)
- `total_price` (required, max 20 chars)

---

### Task 0099: Appointment Reminder Template

#### SMS Template: "Appointment Reminder SMS - 24h"
- **Type:** `appointment_reminder`
- **Channel:** `sms`
- **Trigger:** 24 hours before appointment
- **Text:** "Reminder: {{pet_name}}'s grooming tomorrow at {{appointment_time}}. Need to cancel? Call (657) 252-2903. See you soon! - Puppy Day"
- **Length:** Under 160 characters

**Variables:**
- `pet_name` (required, max 50 chars)
- `appointment_time` (required, max 20 chars)

---

### Task 0100: Appointment Status Templates

#### SMS Template: "Status: Checked In SMS"
- **Type:** `status_checked_in`
- **Channel:** `sms`
- **Text:** "We've got {{pet_name}}! They're settling in nicely. We'll text you when they're ready for pickup. - Puppy Day, 14936 Leffingwell Rd"
- **Length:** Under 160 characters

**Variables:**
- `pet_name` (required, max 50 chars)

#### SMS Template: "Status: Ready for Pickup SMS"
- **Type:** `status_ready`
- **Channel:** `sms`
- **Text:** "{{pet_name}} is ready for pickup! Come by anytime. We can't wait to show you how great they look! - Puppy Day, 14936 Leffingwell Rd"
- **Length:** Under 160 characters

**Variables:**
- `pet_name` (required, max 50 chars)

---

### Task 0101: Report Card Notification Templates

#### Email Template: "Report Card Ready Email - Enhanced"
- **Type:** `report_card_ready`
- **Channel:** `email`
- **Subject:** "{{pet_name}}'s Grooming Report Card is Ready!"
- **Features:**
  - Prominent CTA button to view report card
  - Before/after photos placeholder section
  - Groomer notes section (conditional)
  - Next grooming reminder (conditional)
  - Review request with Google review link
  - Warm, celebratory design

**Variables:**
- `customer_name` (required, max 50 chars)
- `pet_name` (required, max 50 chars)
- `report_card_url` (required, max 500 chars)
- `groomer_notes` (optional, max 500 chars)
- `next_grooming_date` (optional, max 50 chars)
- `review_url` (required, max 500 chars)

#### SMS Template: "Report Card Ready SMS"
- **Type:** `report_card_ready`
- **Channel:** `sms`
- **Text:** "{{pet_name}}'s grooming report card is ready with before/after photos! View it here: {{report_card_url}} - Puppy Day"
- **Length:** Under 160 characters

**Variables:**
- `pet_name` (required, max 50 chars)
- `report_card_url` (required, max 200 chars - short URL)

---

### Task 0102: Waitlist Notification Template

#### SMS Template: "Waitlist Spot Available SMS"
- **Type:** `waitlist_available`
- **Channel:** `sms`
- **Text:** "Great news {{customer_name}}! Spot available {{available_date}} at {{available_time}}. Book now (expires in 2hrs): {{booking_url}} - Puppy Day"
- **Length:** Under 160 characters
- **Expiration:** 2 hours

**Variables:**
- `customer_name` (required, max 50 chars)
- `available_date` (required, max 20 chars)
- `available_time` (required, max 20 chars)
- `booking_url` (required, max 200 chars - short link)

---

### Task 0103: Retention Reminder Templates

#### Email Template: "Retention Reminder Email - Enhanced"
- **Type:** `retention_reminder`
- **Channel:** `email`
- **Subject:** "Time for {{pet_name}}'s Grooming! We Miss You"
- **Features:**
  - Personalized message with weeks since last visit
  - Breed-specific grooming frequency recommendation
  - "Why Regular Grooming Matters" educational content
  - Prominent booking CTA
  - Warm, inviting tone

**Variables:**
- `customer_name` (required, max 50 chars)
- `pet_name` (required, max 50 chars)
- `weeks_since_last` (required, max 10 chars)
- `breed_name` (required, max 100 chars)
- `recommended_weeks` (required, max 10 chars)
- `booking_url` (required, max 500 chars)

#### SMS Template: "Retention Reminder SMS"
- **Type:** `retention_reminder`
- **Channel:** `sms`
- **Text:** "Hi {{customer_name}}! It's been {{weeks_since_last}} weeks since {{pet_name}}'s last grooming. Time to book! {{booking_url}} - Puppy Day"
- **Length:** Under 160 characters

**Variables:**
- `customer_name` (required, max 50 chars)
- `pet_name` (required, max 50 chars)
- `weeks_since_last` (required, max 10 chars)
- `booking_url` (required, max 200 chars)

---

### Task 0104: Payment Notification Templates

#### Email Template: "Payment Failed Email"
- **Type:** `payment_failed`
- **Channel:** `email`
- **Subject:** "Payment Issue - Action Required for {{pet_name}}"
- **Features:**
  - Clear alert styling (red header)
  - Payment details with amount and failure reason
  - "What to Do Next" action steps
  - Update payment method CTA
  - Customer service contact information

**Variables:**
- `customer_name` (required, max 50 chars)
- `pet_name` (required, max 50 chars)
- `amount_due` (required, max 20 chars)
- `failure_reason` (required, max 200 chars)
- `retry_link` (required, max 500 chars)

#### Email Template: "Payment Reminder Email"
- **Type:** `payment_reminder`
- **Channel:** `email`
- **Subject:** "Upcoming Payment for {{pet_name}} - {{charge_date}}"
- **Features:**
  - Payment information card
  - Charge date, amount, and payment method
  - Optional update reminder
  - Friendly, informative tone

**Variables:**
- `customer_name` (required, max 50 chars)
- `pet_name` (required, max 50 chars)
- `charge_date` (required, max 50 chars)
- `amount` (required, max 20 chars)
- `payment_method` (required, max 50 chars)

#### Email Template: "Payment Success Email"
- **Type:** `payment_success`
- **Channel:** `email`
- **Subject:** "Payment Received - Thank You!"
- **Features:**
  - Success styling (green header)
  - Large amount paid display
  - Transaction details with ID
  - Receipt confirmation notice

**Variables:**
- `customer_name` (required, max 50 chars)
- `pet_name` (required, max 50 chars)
- `amount_paid` (required, max 20 chars)
- `transaction_date` (required, max 50 chars)
- `payment_method` (required, max 50 chars)
- `transaction_id` (required, max 100 chars)

#### Email Template: "Payment Final Notice Email"
- **Type:** `payment_failed`
- **Trigger:** `payment_failure_final`
- **Channel:** `email`
- **Subject:** "URGENT: Final Payment Notice - Account Suspension"
- **Features:**
  - Urgent styling (dark red header)
  - Outstanding balance prominently displayed
  - 3-step action plan
  - 48-hour deadline warning
  - Account suspension notice
  - Customer service emergency contact

**Variables:**
- `customer_name` (required, max 50 chars)
- `pet_name` (required, max 50 chars)
- `amount_due` (required, max 20 chars)
- `retry_link` (required, max 500 chars)

---

## Design Principles

All templates follow The Puppy Day's design system:

### Colors
- **Background:** #F8EEE5 (warm cream)
- **Primary:** #434E54 (charcoal)
- **Cards:** #FFFFFF or #FFFBF7
- **Accents:**
  - Success: #16A34A (green)
  - Warning: #F59E0B (amber)
  - Error: #DC2626 (red)
  - Info: #1E40AF (blue)

### Typography
- Clean, sans-serif fonts
- Clear hierarchy (18-28px headers)
- Readable body text (16px)
- Professional weight (regular to semibold)

### Layout
- Max-width: 600px for email templates
- Rounded corners (8-12px)
- Soft shadows for depth
- Generous padding (20-32px)
- Responsive design

### Email Best Practices
- Plain text fallback for all emails
- Mobile-friendly responsive design
- Clear CTAs with proper styling
- Accessible color contrast
- Professional footer with business info

### SMS Best Practices
- Under 160 characters when possible
- Clear, concise messaging
- Include business name
- Short URLs for links
- Phone number for contact

## Business Information

All templates include:

**The Puppy Day**
- Address: 14936 Leffingwell Rd, La Mirada, CA 90638
- Phone: (657) 252-2903
- Email: puppyday14936@gmail.com
- Hours: Monday-Saturday, 9:00 AM - 5:00 PM

## Template Rendering

Templates use Mustache-style variable substitution:
- Variables: `{{variable_name}}`
- HTML content is automatically escaped for security
- Plain text and subject lines use raw values

## Database Integration

All templates are:
1. Inserted into `notification_templates` table
2. Linked to `notification_settings` via template IDs
3. Version-controlled with automatic history tracking
4. Upserted on conflict (safe to run multiple times)

## Testing

To test templates, use the `render_template()` SQL function:

```sql
SELECT * FROM render_template(
  (SELECT id FROM notification_templates WHERE name = 'Booking Confirmation Email - Enhanced'),
  '{
    "customer_name": "Sarah",
    "pet_name": "Buddy",
    "appointment_date": "Monday, January 15, 2025",
    "appointment_time": "10:00 AM",
    "service_name": "Premium Grooming",
    "total_price": "$95.00"
  }'::jsonb
);
```

## Next Steps

After running this migration:

1. Test each template with sample data
2. Implement trigger logic for automated sending
3. Create cron jobs for scheduled notifications
4. Build admin UI for template management
5. Add customer notification preferences
6. Implement retry logic for failed sends

## Files Modified

- `supabase/migrations/20241215_phase8_notification_default_templates.sql` (created)

## Dependencies

This migration requires:
- `20241215_phase8_notification_system_schema.sql` (must run first)
- `20241215_phase8_notification_default_settings.sql` (recommended)
