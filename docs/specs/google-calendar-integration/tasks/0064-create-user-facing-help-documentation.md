# Task 0064: Create User-Facing Help Documentation

**Phase**: 13 - Documentation and Deployment
**Task ID**: 13.1
**Status**: Pending

## Description

Create comprehensive user-facing documentation that guides admins through setting up and using the Google Calendar integration feature with screenshots and troubleshooting guidance.

## Requirements

- Create `docs/help/calendar-integration.md`
- Include step-by-step setup instructions with screenshots
- Include troubleshooting guide for common errors
- Document sync behavior and settings
- Document import wizard usage
- Write in clear, non-technical language
- Include visual examples

## Acceptance Criteria

- [ ] Help documentation file created
- [ ] Setup instructions complete with screenshots
- [ ] Troubleshooting guide comprehensive
- [ ] Sync settings explained clearly
- [ ] Import wizard guide complete
- [ ] Common questions answered (FAQ)
- [ ] Screenshots added for key steps
- [ ] Written in accessible language
- [ ] Reviewed for clarity and accuracy
- [ ] Linked from settings page

## Related Requirements

- Req 30.1: User-facing documentation
- Req 30.2: Screenshots and examples
- Req 30.3: Troubleshooting guide

## Documentation Structure

### 1. Overview

```markdown
# Google Calendar Integration Guide

## What is Calendar Integration?

The Google Calendar integration automatically syncs your grooming appointments to Google Calendar, keeping your schedule up-to-date across all devices.

### Benefits

- **Automatic Sync**: New and updated appointments appear in Google Calendar within seconds
- **Two-Way Import**: Import existing Google Calendar events as appointments
- **Real-Time Updates**: Changes in The Puppy Day instantly reflect in your calendar
- **Mobile Access**: View your schedule on any device with Google Calendar access

### What Gets Synced?

✅ Appointment date and time
✅ Customer and pet names
✅ Service details
✅ Addons and special notes
✅ Appointment status (color-coded)

❌ Customer contact information (for privacy)
❌ Payment details
❌ Internal notes
```

### 2. Setup Instructions

```markdown
## Setting Up Calendar Integration

### Step 1: Connect Your Google Account

1. Navigate to **Settings → Calendar Integration**
2. Click the **"Connect Google Calendar"** button
3. Sign in to your Google account (if not already signed in)
4. Review the permissions requested:
   - View and edit events on all your calendars
5. Click **"Allow"** to grant access
6. You'll be redirected back to The Puppy Day

![Screenshot: Connect button](screenshots/connect-button.png)
![Screenshot: Google OAuth consent](screenshots/oauth-consent.png)
![Screenshot: Connected status](screenshots/connected-status.png)

### Step 2: Choose Your Calendar

After connecting, select which Google Calendar to sync with:

1. Find the **"Calendar Selection"** dropdown
2. Choose from your available calendars:
   - **Primary Calendar** (recommended for most users)
   - **Custom Calendar** (if you have separate business calendar)
3. Click **"Save"**

![Screenshot: Calendar selector](screenshots/calendar-selector.png)

### Step 3: Configure Sync Settings

Customize what gets synced to your calendar:

1. **Auto-Sync**: Enable to automatically sync appointments (recommended)
2. **Sync Statuses**: Choose which statuses to sync:
   - ✅ Confirmed (recommended)
   - ✅ Checked In (recommended)
   - Pending (optional)
   - Cancelled (not recommended)
3. **Sync Past Appointments**: Enable to include past bookings
4. **Sync Completed Appointments**: Enable to keep history
5. Click **"Save Settings"**

![Screenshot: Sync settings form](screenshots/sync-settings.png)

### You're All Set!

Your appointments will now automatically appear in Google Calendar. 🎉
```

### 3. Using the Import Wizard

```markdown
## Importing from Google Calendar

Import existing Google Calendar events as appointments:

### Step 1: Open the Import Wizard

1. Go to **Settings → Calendar Integration**
2. Click **"Import from Calendar"** button
3. The import wizard opens

### Step 2: Select Date Range

1. Choose start date (default: today)
2. Choose end date (default: +30 days)
3. Click **"Preview Events"**

![Screenshot: Date range selection](screenshots/import-step-1.png)

### Step 3: Select Events

1. Review the list of calendar events
2. Check boxes next to events you want to import
3. Events are color-coded:
   - 🟢 Green: Ready to import
   - 🟡 Yellow: Possible duplicate
   - 🔴 Red: Missing required information
4. Click **"Next"**

![Screenshot: Event selection](screenshots/import-step-2.png)

### Step 4: Map Event Details

For each event, select:

1. **Customer**: Search existing or create new
2. **Pet**: Select from customer's pets or create new
3. **Service**: Choose the grooming service
4. **Add-ons** (optional): Select any add-ons
5. **Notes** (optional): Add internal notes

![Screenshot: Event mapping form](screenshots/import-step-3.png)

### Step 5: Review and Confirm

1. Review all appointments to be created
2. Check for any warnings (duplicates, past events)
3. Click **"Confirm Import"**
4. Wait for import to complete
5. Success! Your appointments are now in the system

![Screenshot: Review step](screenshots/import-step-4.png)
![Screenshot: Import success](screenshots/import-success.png)
```

### 4. Understanding Sync Status

```markdown
## Sync Status Indicators

Each appointment shows its calendar sync status:

| Icon | Status | Meaning |
|------|--------|---------|
| ✅ Green Checkmark | Synced | Successfully synced to Google Calendar |
| ⏰ Clock | Pending | Sync in progress or queued |
| ⚠️ Warning | Failed | Sync failed (click for details) |
| - No Icon | Not Synced | Doesn't match sync criteria |

### Viewing Sync History

Click any sync status badge to see:
- When the appointment was synced
- What action was taken (created, updated, deleted)
- Any errors that occurred
- Link to view in Google Calendar

### Manual Sync

If auto-sync is disabled or a sync failed:

1. Find the appointment in the appointments table
2. Click the **sync icon** button
3. Wait for sync to complete
4. Status badge updates to show result
```

### 5. Troubleshooting

```markdown
## Troubleshooting Common Issues

### Connection Issues

**Problem**: "Failed to connect Google Calendar"

**Solutions**:
1. Make sure you're using a Google account with calendar access
2. Check that you clicked "Allow" on all permissions
3. Try disconnecting and reconnecting
4. Clear your browser cache and try again

---

**Problem**: "Connection expired" message

**Solution**:
The integration automatically refreshes your connection, but if you see this:
1. Go to Settings → Calendar Integration
2. Click "Disconnect"
3. Click "Connect Google Calendar" again

### Sync Issues

**Problem**: Appointments not appearing in Google Calendar

**Checks**:
1. ✅ Is auto-sync enabled in settings?
2. ✅ Does the appointment status match your sync settings?
3. ✅ Is the appointment in the past (check "Sync past appointments")?
4. ✅ Check the sync status badge for errors

**Solution**:
Try manual sync:
1. Find the appointment
2. Click the sync icon
3. Check for error messages

---

**Problem**: "Rate limit exceeded" error

**Explanation**:
Google Calendar has daily limits on API requests.

**Solution**:
1. Wait 1 hour and try again
2. Avoid bulk syncing large numbers of appointments at once
3. Sync will automatically retry later

---

**Problem**: Duplicate appointments appearing

**Cause**:
You may have imported events that were already synced.

**Solution**:
1. Check for duplicate warnings in the import wizard
2. Enable "Skip duplicate events" in import options
3. Manually delete duplicates from either system

### Import Issues

**Problem**: Can't find customer/pet in import wizard

**Solution**:
Create them first:
1. Cancel the import
2. Go to Customers → Add New
3. Add the customer and pet
4. Return to import wizard and try again

Or use "Create New" option in the import wizard.

---

**Problem**: Import wizard shows "No events found"

**Checks**:
1. ✅ Do you have events in the selected date range?
2. ✅ Are you using the correct Google Calendar?
3. ✅ Have those events already been imported?

**Solution**:
Try a different date range or check your Google Calendar directly.
```

### 6. FAQ

```markdown
## Frequently Asked Questions

**Q: Will customers see my Google Calendar events?**
A: No, the integration is admin-only. Customers cannot see your calendar.

**Q: Can I sync to multiple calendars?**
A: Currently, you can sync to one Google Calendar at a time. You can change which calendar by updating the calendar selection in settings.

**Q: What happens if I delete an appointment?**
A: The corresponding Google Calendar event is automatically deleted (if auto-sync is enabled).

**Q: Can I sync from Google Calendar to The Puppy Day automatically?**
A: Not yet. You need to use the Import Wizard to bring events from Google Calendar into The Puppy Day. Automatic two-way sync is planned for a future update.

**Q: How do I stop syncing?**
A: Go to Settings → Calendar Integration and click "Disconnect". This will:
- Stop all future syncing
- Remove the connection
- Keep existing calendar events (not deleted)

**Q: What if I change services on an appointment?**
A: The calendar event is automatically updated with the new service and duration (if auto-sync is enabled).

**Q: Is my data secure?**
A: Yes. All calendar access tokens are encrypted and stored securely. We only access the minimum necessary data.
```

## Screenshots Needed

- [ ] Connect button (initial state)
- [ ] Google OAuth consent screen
- [ ] Connected status with calendar email
- [ ] Calendar selector dropdown
- [ ] Sync settings form
- [ ] Import wizard step 1 (date range)
- [ ] Import wizard step 2 (event selection)
- [ ] Import wizard step 3 (mapping)
- [ ] Import wizard step 4 (review)
- [ ] Import success message
- [ ] Sync status badges (all states)
- [ ] Sync history popover
- [ ] Manual sync button
- [ ] Error messages

## Testing Checklist

- [ ] Documentation complete
- [ ] All screenshots captured
- [ ] Steps tested and accurate
- [ ] Troubleshooting solutions verified
- [ ] FAQ answers complete
- [ ] Clarity review completed
- [ ] Linked from settings page
- [ ] User testing feedback incorporated
