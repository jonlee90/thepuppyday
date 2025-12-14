# Settings UI - User Guide

## Overview

The Settings page (`/admin/settings`) provides a comprehensive interface for configuring all aspects of The Puppy Day business operations, automated notifications, and customer communications.

## Navigation

The settings page uses a tabbed interface with 5 main sections:

### 1. Business Hours
Configure operating hours for each day of the week.

**Features:**
- Toggle each day open/closed
- Set custom open and close times
- Visual time pickers
- Save changes with one click

### 2. Report Cards
Manage report card automation and review settings.

**Settings:**
- **Auto-Send Delay**: How long after appointment completion to send report cards (5-60 minutes)
- **Link Expiration**: How long report card links remain accessible (30-365 days)
- **Google Review URL**: Where to direct customers with 4-5 star ratings

**Recommended Values:**
- Auto-Send Delay: 15 minutes (gives groomers time to finalize)
- Link Expiration: 90 days (standard retention period)

### 3. Waitlist
Configure waitlist offer settings.

**Settings:**
- **Response Window**: How long customers have to respond to slot offers (1-24 hours)
- **Default Discount**: Default discount percentage for waitlist offers (0-50%)

**Recommended Values:**
- Response Window: 2 hours (creates urgency while being fair)
- Default Discount: 10% (incentivizes booking without excessive discount)

**Quick-Select Buttons:**
- Hours: 1h, 2h, 4h, 8h, 12h, 24h
- Discount: 0%, 5%, 10%, 15%, 20%, 25%

### 4. Marketing
Configure marketing automation settings.

**Settings:**
- **Retention Reminder Advance**: How many days before recommended grooming date to send reminders (1-30 days)

**How It Works:**
If a Golden Retriever needs grooming every 8 weeks and their last appointment was Jan 1:
- With 7-day advance: Reminder sent around Feb 19 (56 days - 7 days advance)
- With 14-day advance: Reminder sent around Feb 12 (56 days - 14 days advance)

**Recommended Values:**
- Retention Reminder Advance: 7 days (gives customers time to schedule)

### 5. Templates
Customize notification templates for SMS and email communications.

## Template Editor Deep Dive

### Template Types

1. **Report Card Notification**
   - Sent when grooming report card is ready
   - Includes review routing (4-5 stars → Google, 1-3 stars → private)

2. **Waitlist Offer**
   - Sent when slot becomes available
   - Includes discount code and expiration

3. **Breed-Based Grooming Reminder**
   - Automated retention reminders based on breed grooming frequency
   - Personalized to pet's breed

4. **Appointment Confirmation**
   - Sent immediately after booking
   - Includes all appointment details

5. **Appointment Reminder**
   - Sent 24 hours before appointment
   - Quick reference for customers

### Template Editor Features

#### SMS Editor
- **Character Counter**: Shows character count and SMS segment count
- **Segment Warning**: Alerts when message exceeds 160 characters (requires multiple segments)
- **Best Practice**: Keep under 160 characters for single-segment delivery

#### Email Editor
- **Subject Line**: Customizable subject with variables
- **Email Body**: Full HTML-capable message body
- **Formatting**: Supports line breaks and basic formatting

#### Variables System

Each template has specific variables available:

**Report Card Variables:**
- `{customer_name}` - Customer's first name
- `{pet_name}` - Pet's name
- `{report_card_url}` - Unique link to report card
- `{review_url}` - Review link (Google or private feedback)
- `{groomer_name}` - Groomer who serviced the pet
- `{date}` - Appointment date

**Waitlist Variables:**
- `{customer_name}`, `{pet_name}`
- `{date}`, `{time}` - Available slot details
- `{discount}` - Discount percentage
- `{booking_url}` - Direct booking link
- `{expiry_hours}` - How long offer is valid

**Breed Reminder Variables:**
- `{customer_name}`, `{pet_name}`, `{breed_name}`
- `{weeks_since}` - Weeks since last appointment
- `{recommended_frequency}` - Breed-specific recommendation
- `{booking_url}`, `{last_appointment_date}`

**Appointment Variables:**
- `{customer_name}`, `{pet_name}`
- `{service_name}` - Service booked
- `{date}`, `{time}` - Appointment timing
- `{total}` - Total cost
- `{groomer_name}` - Assigned groomer
- `{addons}` - Selected add-ons
- `{special_requests}` - Customer notes

#### Using Variables

1. **Copy Variable**: Click any variable badge to copy it to clipboard
2. **Paste in Template**: Place cursor where you want variable, paste
3. **Preview**: Toggle preview to see how it looks with sample data

#### Template Preview

**SMS Preview:**
- Shows exactly how SMS will appear on customer's phone
- Variables replaced with realistic sample data

**Email Preview:**
- Shows formatted email with subject line
- Mimics email client appearance
- Variables replaced with sample data

#### Save vs Reset

**Save Template:**
- Saves current template content
- Changes apply to all future notifications of that type
- No confirmation required

**Reset to Default:**
- Restores original template content
- Requires confirmation to prevent accidental loss
- Useful if customizations didn't work as expected

## Best Practices

### Report Card Settings
- **Auto-Send Delay**: Give groomers 10-20 minutes to finalize photos and notes
- **Expiration**: 90 days balances accessibility with data management
- **Google URL**: Verify URL works before saving (test by opening in browser)

### Waitlist Settings
- **Response Window**: Shorter windows (2-4 hours) create urgency
- **Discount**: Test different values to find optimal conversion rate
- **Monitor**: Check waitlist analytics to optimize settings

### Marketing Settings
- **Retention Advance**: Balance between too early (ignored) and too late (already booked elsewhere)
- **Seasonal Adjustment**: Consider adjusting for busy/slow seasons

### Template Customization
- **Brand Voice**: Maintain warm, professional, trustworthy tone
- **Test First**: Preview templates before saving
- **Variables**: Always use variables for personalization
- **SMS Length**: Aim for under 160 characters when possible
- **Mobile-First**: Most customers read on mobile devices
- **Clear CTAs**: Make action items obvious (links, next steps)
- **Professional**: Avoid excessive punctuation (!!!), all caps, or overly casual language

### Template Tone Guidelines

**DO:**
- "Hi {customer_name}! {pet_name}'s report card is ready!"
- "We'd love to hear about your experience"
- "Thank you for trusting us with {pet_name}"

**DON'T:**
- "OMG!! {pet_name} looks AMAZING!!!"
- "CLICK HERE NOW!!!"
- "Hey bestie! Your fur baby is done!"

## Common Tasks

### Change Business Hours
1. Navigate to Settings → Business Hours tab
2. Toggle days open/closed
3. Adjust times using time pickers
4. Click "Save Changes"

### Update Waitlist Discount
1. Navigate to Settings → Waitlist tab
2. Adjust "Default Discount Percentage" slider
3. Or click quick-select button (0%, 5%, 10%, etc.)
4. Click "Save Changes"

### Customize Report Card Email
1. Navigate to Settings → Templates tab
2. Select "Report Card Notification" from dropdown
3. Edit "Email Subject" and "Email Body"
4. Click variable badges to copy variables
5. Toggle "Show Preview" to see result
6. Click "Save Template"

### Reset a Template
1. Navigate to Settings → Templates tab
2. Select template type to reset
3. Click "Reset to Default"
4. Confirm in modal dialog
5. Template reverts to original content

## Troubleshooting

### Settings Not Saving
- Check browser console for errors
- Verify you have admin permissions
- Ensure all required fields are filled
- Try refreshing page and re-entering

### Template Preview Not Updating
- Preview updates automatically when you type
- If stuck, toggle preview off and back on
- Refresh page if issues persist

### Variables Not Working in Sent Messages
- Variables are case-sensitive: `{pet_name}` not `{Pet_Name}`
- Must include curly braces: `{customer_name}` not `customer_name`
- Check spelling matches available variables exactly
- Test with preview feature before saving

### SMS Too Long
- Aim for 160 characters or less
- Each segment over 160 chars costs extra
- Use abbreviations where appropriate
- Remove unnecessary punctuation or words
- Link shorteners can help (booking URLs)

## Technical Notes

### Auto-Save
- Settings require manual save (no auto-save)
- Unsaved changes are lost when switching tabs
- Save message appears for 3 seconds after successful save

### Data Persistence
- All settings stored in database
- Changes apply immediately after save
- Backend validates all values before saving

### Character Encoding
- SMS supports standard ASCII
- Emoji and special characters may count as multiple characters
- Test SMS with special characters using preview

### Template Variables
- Variables replaced at send-time, not save-time
- Invalid variables show as empty string in sent messages
- System validates variables exist before sending

## Support

For issues or questions:
1. Check this guide first
2. Review error messages carefully
3. Contact system administrator
4. Check backend logs for detailed errors

---

**Last Updated:** 2025-12-14
**Version:** 1.0
**Phase:** Phase 6 - Settings & Configuration
