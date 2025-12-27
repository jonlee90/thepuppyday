# Task 0062: Create E2E Tests for Calendar Integration

**Phase**: 12 - Testing
**Task ID**: 12.3
**Status**: Pending

## Description

Create end-to-end tests that verify the entire calendar integration workflow from user perspective, testing the full stack including UI, API, and database.

## Requirements

- Create `e2e/calendar-integration.spec.ts`
- Test OAuth connection flow (UI → API → redirect)
- Test calendar settings modification (UI → API → database)
- Test manual sync operation (UI → API → Google Calendar)
- Test import wizard flow (UI → API → database)
- Test sync status display (database → API → UI)
- Use Playwright or Cypress for browser automation
- Use test database and mocked Google API

## Acceptance Criteria

- [ ] E2E test file created
- [ ] OAuth connection flow tested
- [ ] Calendar settings modification tested
- [ ] Manual sync operation tested
- [ ] Import wizard flow tested
- [ ] Sync status display tested
- [ ] All tests pass successfully
- [ ] Tests run in CI/CD pipeline
- [ ] Screenshots captured on failure
- [ ] Test data cleanup implemented

## Related Requirements

- Req 29.1-29.8: Comprehensive test coverage
- Req 29.7: End-to-end testing
- Req 29.8: User flow testing

## E2E Test Scenarios

### 1. OAuth Connection Flow

**Steps:**
1. Navigate to `/admin/settings/calendar`
2. Verify "Connect Google Calendar" button visible
3. Click "Connect" button
4. Verify redirect to Google OAuth consent page (mocked)
5. Simulate OAuth callback with auth code
6. Verify redirect back to settings with success message
7. Verify connection status shows "Connected"
8. Verify calendar email displayed

**Expected:**
- [ ] Button click initiates OAuth flow
- [ ] Callback URL includes state parameter
- [ ] Success message displayed
- [ ] Connection status updated
- [ ] Calendar email visible

### 2. Calendar Settings Modification

**Steps:**
1. Navigate to `/admin/settings/calendar` (logged in as admin)
2. Ensure calendar is connected
3. Toggle "Auto-sync enabled" switch
4. Select sync statuses (confirmed, checked_in)
5. Toggle "Sync past appointments"
6. Click "Save Settings"
7. Verify success message
8. Refresh page
9. Verify settings persisted

**Expected:**
- [ ] Form displays current settings
- [ ] Changes save successfully
- [ ] Success feedback shown
- [ ] Settings persist after refresh

### 3. Manual Sync Operation

**Steps:**
1. Navigate to `/admin/appointments`
2. Locate appointment row with sync status
3. Click "Sync to Calendar" button
4. Verify loading state shown
5. Wait for sync to complete
6. Verify success message
7. Verify sync status badge updates to "Synced"
8. Verify last sync timestamp updated

**Expected:**
- [ ] Sync button triggers API call
- [ ] Loading state displayed
- [ ] Success feedback shown
- [ ] Status badge updates
- [ ] Timestamp refreshed

### 4. Import Wizard Flow

**Steps:**
1. Navigate to `/admin/settings/calendar`
2. Click "Import from Calendar" button
3. **Step 1**: Select date range (next 7 days)
4. Click "Preview Events"
5. Verify loading state
6. **Step 2**: Verify events list displayed
7. Select 2 events with checkboxes
8. Click "Next"
9. **Step 3**: For each event, select:
   - Customer (search and select existing)
   - Pet (select from customer's pets)
   - Service (select from dropdown)
10. Click "Next"
11. **Step 4**: Review summary
12. Click "Confirm Import"
13. Verify progress bar
14. Verify success message
15. Verify 2 appointments created

**Expected:**
- [ ] Wizard opens in modal
- [ ] Events fetched and displayed
- [ ] Selection state managed correctly
- [ ] Mapping forms validate required fields
- [ ] Import creates appointments
- [ ] Success feedback shown

### 5. Sync Status Display

**Steps:**
1. Create test appointment in database
2. Create calendar event mapping for appointment
3. Navigate to `/admin/appointments`
4. Locate appointment row
5. Verify sync status badge shows "Synced"
6. Hover over badge
7. Verify tooltip shows last sync time
8. Click badge
9. Verify sync history popover opens
10. Verify sync log entries displayed

**Expected:**
- [ ] Badge displays correct status
- [ ] Tooltip shows timestamp
- [ ] Popover opens on click
- [ ] History entries visible

## Test Setup

```typescript
import { test, expect } from '@playwright/test';

test.describe('Calendar Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@thepuppyday.com');
    await page.fill('[name="password"]', 'test-password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin/dashboard');
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test data
    await cleanupTestData();
  });
});
```

## Mock Google OAuth

Intercept OAuth redirect and simulate callback:

```typescript
test('OAuth connection flow', async ({ page, context }) => {
  // Intercept Google OAuth redirect
  await page.route('https://accounts.google.com/o/oauth2/v2/auth**', async (route) => {
    const url = new URL(route.request().url());
    const state = url.searchParams.get('state');

    // Simulate successful OAuth callback
    await page.goto(`/api/admin/calendar/auth/callback?code=mock-code&state=${state}`);
  });

  await page.goto('/admin/settings/calendar');
  await page.click('button:has-text("Connect Google Calendar")');

  await expect(page).toHaveURL('/admin/settings/calendar?success=true');
  await expect(page.locator('text=Successfully connected')).toBeVisible();
});
```

## Visual Regression Testing

Capture screenshots for visual comparison:

```typescript
test('Import wizard UI', async ({ page }) => {
  await page.goto('/admin/settings/calendar');
  await page.click('button:has-text("Import from Calendar")');

  // Screenshot each step
  await page.screenshot({ path: 'screenshots/import-step-1.png' });

  await page.click('button:has-text("Next")');
  await page.screenshot({ path: 'screenshots/import-step-2.png' });
});
```

## Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npm run test:e2e calendar-integration.spec.ts

# Update screenshots
npm run test:e2e:update-screenshots
```

## Testing Checklist

- [ ] E2E test file created
- [ ] All 5 scenarios implemented
- [ ] Tests pass successfully
- [ ] Mocked Google OAuth working
- [ ] Test data cleanup implemented
- [ ] Screenshots captured on failure
- [ ] CI/CD integration configured
- [ ] Visual regression tests added
- [ ] Documentation complete
