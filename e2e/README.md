# E2E Tests for Phase 9: Admin Settings

This directory contains end-to-end tests for Phase 9 admin settings using Playwright.

## Setup

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

## Test Files

### Critical Settings Flows (Task 0219)

1. **`e2e/admin/settings/site-content.spec.ts`**
   - Navigate to settings > site content
   - Update hero section (title, subtitle, CTA)
   - Verify changes appear on public homepage
   - Update SEO settings
   - Verify metadata on public page
   - Update business info
   - Verify footer changes

2. **`e2e/admin/settings/banners.spec.ts`**
   - Navigate to banner management
   - Create new banner with image upload
   - Schedule banner (start/end dates)
   - Activate banner
   - Verify banner appears on public site
   - Click banner and track click
   - View analytics (impressions, clicks)

3. **`e2e/admin/settings/booking.spec.ts`**
   - Navigate to booking settings
   - Update booking window (min hours, max days)
   - Add blocked date
   - Update buffer time
   - Navigate to public booking widget
   - Verify date constraints applied
   - Verify blocked date is greyed out
   - Verify time slots respect buffer

4. **`e2e/admin/settings/loyalty.spec.ts`**
   - Navigate to loyalty settings
   - Toggle loyalty program on/off
   - Update punch threshold
   - Update earning rules (qualifying services)
   - Update redemption rules (eligible services)
   - Configure referral program
   - Save and verify settings persist

5. **`e2e/admin/settings/staff.spec.ts`**
   - Navigate to staff management
   - View staff directory (grid/list views)
   - Add new staff member
   - Configure commission settings
   - View earnings report
   - Filter report by date range
   - Export earnings data

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/admin/settings/site-content.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

## Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';

test.describe('Site Content Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await loginAsAdmin(page);
  });

  test('should update hero section and reflect on public site', async ({ page }) => {
    // Navigate to settings
    await page.goto('/admin/settings/site-content');

    // Update hero
    await page.fill('[name="headline"]', 'New Headline');
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('.alert-success')).toBeVisible();

    // Navigate to public site
    await page.goto('/');

    // Verify change
    await expect(page.locator('h1')).toHaveText('New Headline');
  });
});
```

## Authentication Fixture

Create `e2e/fixtures/auth.ts`:

```typescript
import { Page } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('[name="email"]', process.env.TEST_ADMIN_EMAIL);
  await page.fill('[name="password"]', process.env.TEST_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin');
}
```

## Environment Variables

Create `.env.test`:

```
TEST_ADMIN_EMAIL=admin@thepuppyday.com
TEST_ADMIN_PASSWORD=test-password
```

## Test Data Cleanup

All tests should clean up created data:

```typescript
test.afterEach(async ({ page }) => {
  // Delete test banner
  if (testBannerId) {
    await page.request.delete(`/api/admin/settings/banners/${testBannerId}`);
  }

  // Reset settings to defaults
  await page.request.put('/api/admin/settings/booking', {
    data: DEFAULT_BOOKING_SETTINGS,
  });
});
```

## CI/CD Integration

Add to `.github/workflows/e2e.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## Notes

- E2E tests require a running application (dev or staging)
- Tests use real database (use test environment)
- Tests should be idempotent (can run multiple times)
- Use data-testid attributes for reliable selectors
- Mock external services (Stripe, Twilio, etc.) in test environment
- Run tests in parallel for speed: `npx playwright test --workers=4`

## Future Enhancements

- [ ] Visual regression testing with Percy or Chromatic
- [ ] Performance testing with Lighthouse
- [ ] Accessibility testing with axe-core
- [ ] Mobile device testing
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
