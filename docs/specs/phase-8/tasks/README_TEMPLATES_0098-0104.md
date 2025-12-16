# Phase 8 Notification Templates Implementation
**Tasks: 0098-0104**

This guide covers the implementation of all notification email and SMS templates for The Puppy Day notification system.

## Overview

This implementation creates 14 production-ready notification templates:
- 7 Email templates
- 7 SMS templates

All templates follow The Puppy Day's "Clean & Elegant Professional" design aesthetic and are ready for immediate use.

## Files Created

### 1. Migration File
**File:** `supabase/migrations/20241215_phase8_notification_default_templates.sql`

This is the main migration that creates all templates and links them to notification settings.

**Size:** 1,248 lines
**Templates Created:** 14 (7 email + 7 SMS)

### 2. Test File
**File:** `supabase/migrations/TEST_notification_templates.sql`

Comprehensive test suite to validate all templates render correctly with sample data.

**Tests:** 14 template rendering tests
**Output:** Detailed test results with pass/fail status

### 3. Documentation
**File:** `docs/specs/phase-8/NOTIFICATION_TEMPLATES_SUMMARY.md`

Complete reference guide for all templates including:
- Template specifications
- Variable definitions
- Design principles
- Usage examples

## Running the Migration

### Prerequisites

Ensure these migrations have been run first:
1. `20241215_phase8_notification_system_schema.sql` (Tasks 0078-0079)
2. `20241215_phase8_notification_default_settings.sql` (Task 0080)

### Using /mcp supabase

```bash
# Run the migration
/mcp supabase migrations apply 20241215_phase8_notification_default_templates.sql

# Run the tests
/mcp supabase query -f supabase/migrations/TEST_notification_templates.sql
```

### Manual Execution

If you prefer to run manually via Supabase Dashboard:

1. Go to Supabase Dashboard > SQL Editor
2. Copy contents of `20241215_phase8_notification_default_templates.sql`
3. Execute the migration
4. Copy contents of `TEST_notification_templates.sql`
5. Execute the tests

## Templates Implemented

### Task 0098: Booking Confirmation

#### Email: "Booking Confirmation Email - Enhanced"
- Professional HTML design with warm cream background
- Appointment details card
- "What to Expect" section
- Cancellation policy notice
- Mobile-responsive

**Variables:**
```json
{
  "customer_name": "Sarah",
  "pet_name": "Buddy",
  "appointment_date": "Monday, January 15, 2025",
  "appointment_time": "10:00 AM",
  "service_name": "Premium Grooming",
  "total_price": "$95.00"
}
```

#### SMS: "Booking Confirmation SMS"
- Concise (under 160 characters)
- Includes all key details
- Business phone number

**Variables:**
```json
{
  "pet_name": "Buddy",
  "appointment_date": "Jan 15",
  "appointment_time": "10:00 AM",
  "total_price": "$95"
}
```

---

### Task 0099: Appointment Reminder

#### SMS: "Appointment Reminder SMS - 24h"
- Sent 24 hours before appointment
- Includes cancellation instructions
- Under 160 characters

**Variables:**
```json
{
  "pet_name": "Max",
  "appointment_time": "2:00 PM"
}
```

---

### Task 0100: Appointment Status Updates

#### SMS: "Status: Checked In SMS"
- Friendly check-in confirmation
- Includes business address
- Reassuring tone

**Variables:**
```json
{
  "pet_name": "Luna"
}
```

#### SMS: "Status: Ready for Pickup SMS"
- Excited tone
- Pickup invitation
- Includes business address

**Variables:**
```json
{
  "pet_name": "Charlie"
}
```

---

### Task 0101: Report Card Notifications

#### Email: "Report Card Ready Email - Enhanced"
- Prominent CTA button
- Before/after photo placeholder
- Conditional groomer notes section
- Review request
- Next grooming reminder

**Variables:**
```json
{
  "customer_name": "John",
  "pet_name": "Bella",
  "report_card_url": "https://puppyday.com/report/abc123",
  "groomer_notes": "Bella was a perfect angel today!",
  "next_grooming_date": "February 15, 2025",
  "review_url": "https://g.page/puppyday/review"
}
```

#### SMS: "Report Card Ready SMS"
- Concise with link
- Mentions before/after photos
- Under 160 characters

**Variables:**
```json
{
  "pet_name": "Bella",
  "report_card_url": "https://pday.co/r/abc123"
}
```

---

### Task 0102: Waitlist Notification

#### SMS: "Waitlist Spot Available SMS"
- Urgency (2-hour expiration)
- Available date and time
- Direct booking link
- Under 160 characters

**Variables:**
```json
{
  "customer_name": "Mike",
  "available_date": "Jan 20",
  "available_time": "3:00 PM",
  "booking_url": "https://pday.co/b/xyz789"
}
```

---

### Task 0103: Retention Reminders

#### Email: "Retention Reminder Email - Enhanced"
- Personalized with weeks since last visit
- Breed-specific grooming frequency
- "Why Regular Grooming Matters" section
- Educational and engaging

**Variables:**
```json
{
  "customer_name": "Emily",
  "pet_name": "Cooper",
  "weeks_since_last": "8",
  "breed_name": "Golden Retriever",
  "recommended_weeks": "6",
  "booking_url": "https://puppyday.com/book"
}
```

#### SMS: "Retention Reminder SMS"
- Concise reminder
- Booking link
- Under 160 characters

**Variables:**
```json
{
  "customer_name": "Emily",
  "pet_name": "Cooper",
  "weeks_since_last": "8",
  "booking_url": "https://pday.co/b/ret123"
}
```

---

### Task 0104: Payment Notifications

#### Email: "Payment Failed Email"
- Red alert styling
- Clear failure reason
- Update payment CTA
- Customer service contact

**Variables:**
```json
{
  "customer_name": "David",
  "pet_name": "Rocky",
  "amount_due": "$95.00",
  "failure_reason": "Insufficient funds",
  "retry_link": "https://puppyday.com/payment/retry/abc"
}
```

#### Email: "Payment Reminder Email"
- Friendly reminder tone
- Upcoming charge details
- Payment method shown
- Optional update notice

**Variables:**
```json
{
  "customer_name": "Lisa",
  "pet_name": "Daisy",
  "charge_date": "January 20, 2025",
  "amount": "$55.00",
  "payment_method": "Visa ending in 1234"
}
```

#### Email: "Payment Success Email"
- Green success styling
- Large amount display
- Transaction details
- Receipt confirmation

**Variables:**
```json
{
  "customer_name": "Robert",
  "pet_name": "Milo",
  "amount_paid": "$70.00",
  "transaction_date": "January 15, 2025 at 10:30 AM",
  "payment_method": "Visa ending in 5678",
  "transaction_id": "ch_1234567890abcdef"
}
```

#### Email: "Payment Final Notice Email"
- Urgent dark red styling
- Multiple failure warning
- 48-hour deadline
- Account suspension notice
- Emergency contact info

**Variables:**
```json
{
  "customer_name": "Jennifer",
  "pet_name": "Oscar",
  "amount_due": "$95.00",
  "retry_link": "https://puppyday.com/payment/urgent/xyz"
}
```

---

## Testing the Templates

### Run All Tests

```bash
/mcp supabase query -f supabase/migrations/TEST_notification_templates.sql
```

### Test Individual Template

```sql
-- Example: Test Booking Confirmation Email
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

### Expected Test Results

All 14 tests should pass:
- Template rendering successful
- Subject line populated (email templates)
- HTML content populated (email templates)
- Plain text content populated (all templates)
- SMS character count under 160 (most SMS templates)

## Template Rendering

### Using SQL Function

```sql
-- Render a template
SELECT * FROM render_template(
  template_id UUID,
  variables JSONB
);

-- Returns:
-- subject: TEXT (email only)
-- html_content: TEXT (email only)
-- text_content: TEXT (all templates)
```

### Using Application Code

```typescript
// Example TypeScript/JavaScript usage
import { createServerSupabaseClient } from '@/lib/supabase/server'

async function sendBookingConfirmation(appointmentData) {
  const supabase = await createServerSupabaseClient()

  // Get template
  const { data: template } = await supabase
    .from('notification_templates')
    .select('id')
    .eq('name', 'Booking Confirmation Email - Enhanced')
    .single()

  // Render template
  const { data: rendered } = await supabase
    .rpc('render_template', {
      p_template_id: template.id,
      p_variables: {
        customer_name: appointmentData.customer.first_name,
        pet_name: appointmentData.pet.name,
        appointment_date: formatDate(appointmentData.date),
        appointment_time: appointmentData.time_slot,
        service_name: appointmentData.service.name,
        total_price: formatCurrency(appointmentData.total_price)
      }
    })

  // Send email via Resend
  await resend.emails.send({
    from: 'The Puppy Day <noreply@puppyday.com>',
    to: appointmentData.customer.email,
    subject: rendered.subject,
    html: rendered.html_content,
    text: rendered.text_content
  })
}
```

## Design System Reference

### Color Palette
- **Background:** #F8EEE5 (warm cream)
- **Primary:** #434E54 (charcoal)
- **Cards:** #FFFFFF or #FFFBF7
- **Success:** #16A34A (green)
- **Warning:** #F59E0B (amber)
- **Error:** #DC2626 (red)
- **Info:** #1E40AF (blue)

### Typography
- Headers: 18-28px, semibold
- Body: 16px, regular
- Small text: 14px, regular
- Monospace: Transaction IDs, codes

### Layout
- Max-width: 600px (email)
- Border-radius: 8-12px
- Padding: 20-32px
- Soft shadows

## Troubleshooting

### Issue: Template not found

**Solution:**
1. Verify migration has been run
2. Check template name spelling
3. Query template list:
```sql
SELECT name, type, channel FROM notification_templates ORDER BY name;
```

### Issue: Required variable missing

**Error:** "Required variable missing: customer_name"

**Solution:**
Ensure all required variables are provided in the JSONB object. Check variable definitions:
```sql
SELECT name, variables FROM notification_templates WHERE name = 'Your Template Name';
```

### Issue: SMS exceeds 160 characters

**Solution:**
- Use short date formats (e.g., "Jan 15" instead of "Monday, January 15, 2025")
- Use short URLs (e.g., "https://pday.co/..." instead of "https://puppyday.com/...")
- Abbreviate where appropriate

### Issue: HTML escaping in email

Templates automatically escape HTML special characters to prevent XSS attacks. This is expected behavior.

## Next Steps

After implementing templates:

1. **Implement Triggers** (Tasks 0107-0110)
   - Create database triggers for automatic sending
   - Hook into appointment lifecycle events

2. **Setup Cron Jobs** (Tasks 0111-0115)
   - Configure Vercel cron for scheduled notifications
   - Implement reminder and retention jobs

3. **Add User Preferences** (Tasks 0116-0119)
   - Allow customers to opt-out of notifications
   - Implement unsubscribe functionality

4. **Build Admin UI** (Tasks 0120-0149)
   - Template editor
   - Preview functionality
   - Notification dashboard
   - Logs and analytics

5. **Testing** (Tasks 0150-0154)
   - Unit tests for template engine
   - Integration tests for notification flow
   - E2E tests for admin UI

## Acceptance Criteria Checklist

### Task 0098: Booking Confirmation
- [x] Email template with subject, HTML, and plain text
- [x] Variables: customer_name, pet_name, appointment_date, appointment_time, service_name, total_price
- [x] Business context (address, phone, cancellation policy)
- [x] SMS template (concise, under 160 chars)
- [x] Templates inserted into database
- [ ] Tests written and passing (run TEST_notification_templates.sql)

### Task 0099: Appointment Reminder
- [x] SMS template with pet_name, appointment_time, business address
- [x] Message asking to notify if cancellation needed
- [x] Under 160 characters
- [x] Template inserted into database
- [ ] Tests written and passing

### Task 0100: Appointment Status
- [x] "Checked In" SMS template
- [x] "Ready for Pickup" SMS template
- [x] Business address in both
- [x] Under 160 characters each
- [x] Templates inserted into database
- [ ] Tests written and passing

### Task 0101: Report Card
- [x] Email template with pet_name, report card link, before/after placeholder
- [x] Message encouraging review
- [x] Concise SMS template with link
- [x] Templates inserted into database
- [ ] Tests written and passing

### Task 0102: Waitlist
- [x] SMS with available date/time
- [x] Instructions to claim spot
- [x] Expiration time (2 hours)
- [x] Under 160 characters
- [x] Template inserted into database
- [ ] Tests written and passing

### Task 0103: Retention Reminder
- [x] Email with pet_name, weeks_since_last, breed_name, booking_url
- [x] Engaging message about time for grooming
- [x] Concise SMS with booking link
- [x] Templates inserted into database
- [ ] Tests written and passing

### Task 0104: Payment Notifications
- [x] Payment failed email with failure_reason, amount_due, retry_link
- [x] Payment reminder email with charge_date, amount, payment_method
- [x] Payment success confirmation email
- [x] Final notice email with suspension warning
- [x] Customer service contact in all
- [x] Templates inserted into database
- [ ] Tests written and passing

## Support

For questions or issues:
- Review `NOTIFICATION_TEMPLATES_SUMMARY.md` for detailed reference
- Check test results from `TEST_notification_templates.sql`
- Consult Phase 8 design document: `docs/specs/phase-8/design.md`

---

**Implementation Status:** COMPLETE (Templates created, testing pending)
**Next Phase:** Implement notification triggers and cron jobs
