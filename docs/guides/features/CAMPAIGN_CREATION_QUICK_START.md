# Campaign Creation - Quick Start Guide

## How to Use the Campaign Builder

### 1. Open the Modal

Navigate to `/admin/marketing/campaigns` and click the **"Create Campaign"** button.

### 2. Choose Your Starting Point

**Option A: Use a Template** (Recommended for beginners)
- Click on any of the 5 pre-built templates
- Everything auto-fills (name, message, audience)
- Edit as needed in following steps

**Option B: Start from Scratch**
- Click the "Start from Scratch" button
- Build your campaign step-by-step

### 3. Set Campaign Type (Step 1)

1. Enter a **Campaign Name** (e.g., "Spring Grooming Special")
2. Optionally add a **Description**
3. Choose campaign type:
   - **One-Time**: Send once, either now or scheduled
   - **Recurring**: Automatically send on a schedule (daily/weekly/monthly)

### 4. Define Your Audience (Step 2)

Add filters to target specific customers:

**Common Filters:**
- **Last Visit Within**: Customers who visited recently (e.g., 30 days)
- **Not Visited Since**: Win back inactive customers (e.g., 60 days)
- **Min/Max Appointments**: Target by loyalty (e.g., 5+ visits)
- **Min Total Spend**: High-value customers (e.g., $100+)
- **Has Membership**: Only members or non-members
- **Has Upcoming Appointment**: Customers with future bookings

**Watch the Preview:**
- Real-time count of matching customers
- See first 5 sample customers
- Adjust filters until you get the right audience size

### 5. Compose Your Message (Step 3)

**Choose Channel:**
- **Email Only**: Professional, detailed messages
- **SMS Only**: Quick, urgent messages
- **Both**: Maximum reach

**Email Tips:**
- Subject: 100 characters max (be clear and compelling)
- Body: 5000 characters max (include value proposition)
- Use the preview to see how it looks

**SMS Tips:**
- 160 characters max (be concise!)
- Watch the character counter
- Use variables to save space

**Add Personalization:**
Click any variable button to insert:
- `{customer_name}` → "Sarah"
- `{pet_name}` → "Max"
- `{booking_link}` → Clickable booking URL
- `{business_name}` → "The Puppy Day"
- `{business_phone}` → "(657) 252-2903"
- `{business_address}` → Full business address

**Optional: A/B Testing**
1. Toggle "Enable A/B Testing"
2. Adjust traffic split (default: 50/50)
3. Enter alternative message for Variant B
4. System will automatically test which performs better

### 6. Schedule Your Campaign (Step 4)

**Send Now:**
- Campaign sends immediately after creation
- Good for urgent announcements

**Schedule Later:**
1. Pick date and time (must be future, max 1 year)
2. Campaign sends automatically at that time

**Recurring Campaigns:**
- Set frequency: Daily, Weekly, or Monthly
- Choose day and time
- Campaign sends automatically on schedule

### 7. Submit

Click **"Send Now"** or **"Schedule Campaign"** depending on your choice.

✅ Success: Campaign created! Modal closes, list refreshes.
❌ Error: Fix validation issues shown in toast notification.

---

## Pre-Built Templates

### 1. Welcome New Customers
**Use Case**: Onboard new signups
**Audience**: New customers (0 appointments, last 7 days)
**Channel**: Email + SMS
**Goal**: Get first booking

### 2. Win Back Inactive Customers
**Use Case**: Re-engage inactive customers
**Audience**: Haven't visited in 60+ days, have visited before
**Channel**: Email + SMS
**Includes**: 15% off offer

### 3. Birthday & Anniversary Wishes
**Use Case**: Celebrate pet birthdays
**Audience**: Customers with pets having birthdays
**Channel**: Email + SMS
**Includes**: Free teeth brushing add-on

### 4. Seasonal Promotion
**Use Case**: Drive bookings during slow periods
**Audience**: All active customers
**Channel**: Email + SMS
**Includes**: 20% off limited-time offer

### 5. Membership Renewal Reminder
**Use Case**: Retain members
**Audience**: Active members nearing renewal
**Channel**: Email
**Goal**: Prevent churn

---

## Common Use Cases

### 🎯 "I want to fill slow days next week"
1. Use **Seasonal Promotion** template
2. Audience: All customers OR customers without upcoming appointments
3. Offer discount for specific dates
4. Send Now or Schedule 2-3 days before

### 🎯 "I want to win back customers who stopped coming"
1. Use **Win Back Inactive** template
2. Audience: Not visited since 60+ days, min 1 appointment
3. Offer special discount
4. Send Now

### 🎯 "I want to thank my VIP customers"
1. Start from Scratch
2. Audience: Min $500 total spend OR min 10 appointments
3. Personalized thank you message
4. Consider exclusive offer

### 🎯 "I want to send monthly grooming reminders"
1. Start from Scratch, select Recurring
2. Audience: All active customers
3. Remind about grooming benefits
4. Frequency: Monthly, 1st of month, 9:00 AM

---

## Best Practices

### Audience Segmentation
✅ **Do:**
- Use multiple filters for precise targeting
- Check preview to verify audience size
- Test with small audience first

❌ **Don't:**
- Send to everyone for every campaign
- Use too many filters (might get 0 matches)
- Ignore the preview data

### Message Content
✅ **Do:**
- Use personalization variables
- Include clear call-to-action (CTA)
- Keep SMS under 160 characters
- Preview before sending

❌ **Don't:**
- Write generic messages
- Forget to include {booking_link}
- Use all caps or excessive punctuation
- Send without previewing

### Scheduling
✅ **Do:**
- Send during business hours (9 AM - 5 PM)
- Avoid weekends for email
- Test send times with A/B testing

❌ **Don't:**
- Send late at night
- Schedule too far in advance
- Forget timezone (system uses local time)

### A/B Testing
✅ **Do:**
- Test one element at a time (subject OR body)
- Use meaningful differences between variants
- Give tests time to collect data

❌ **Don't:**
- Test too many things at once
- Use identical variants
- Stop tests too early

---

## Troubleshooting

### "No customers match your filters"
- **Solution**: Remove some filters or adjust values
- **Tip**: Start broad, then narrow down

### "SMS message too long"
- **Solution**: Shorten message or remove variables
- **Tip**: Use abbreviations, remove filler words

### "Can't click Next button"
- **Solution**: Campaign type must be selected
- **Check**: Name field is required

### "Validation failed"
- **Solution**: Check toast message for specific error
- **Common**: Missing required fields, character limits exceeded

### "Preview not loading"
- **Solution**: Wait 500ms after changing filters (debounced)
- **Check**: At least one filter must be set

---

## Keyboard Shortcuts

- **Escape**: Close modal
- **Tab**: Navigate between fields
- **Enter**: Submit (when on button)
- **Arrow Keys**: Change date/time picker

---

## Support

**Questions?** Check the implementation summary:
- `.claude/doc/campaign-creation-implementation-summary.md`

**Found a bug?**
- Provide: Browser, steps to reproduce, expected vs actual behavior

**Feature request?**
- See "Future Enhancements" in implementation summary
