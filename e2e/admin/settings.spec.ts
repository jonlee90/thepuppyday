/**
 * E2E tests for Admin Settings
 * Task 0277: Test admin settings management flows
 *
 * Test Scenarios:
 * - Business hours modification
 * - Booking settings modification
 * - Notification template editing
 * - Promo banner management
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Settings - Business Hours', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin/owner
    await page.goto('/login');
    await page.fill('input[name="email"]', 'owner@thepuppyday.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');

    // Navigate to settings
    await page.click('a[href="/admin/settings"]');
    await page.waitForURL('/admin/settings');
  });

  test('should display current business hours', async ({ page }) => {
    // Navigate to business hours tab
    await page.click('[data-testid="business-hours-tab"]');

    // Should show hours for each day
    await expect(page.locator('text=Monday')).toBeVisible();
    await expect(page.locator('text=Tuesday')).toBeVisible();
    await expect(page.locator('text=Wednesday')).toBeVisible();
    await expect(page.locator('text=Thursday')).toBeVisible();
    await expect(page.locator('text=Friday')).toBeVisible();
    await expect(page.locator('text=Saturday')).toBeVisible();
    await expect(page.locator('text=Sunday')).toBeVisible();

    // Each day should have open and close time
    const mondayOpen = await page.locator('[data-testid="monday-open-time"]').inputValue();
    const mondayClose = await page.locator('[data-testid="monday-close-time"]').inputValue();

    expect(mondayOpen).toMatch(/^\d{2}:\d{2}$/);
    expect(mondayClose).toMatch(/^\d{2}:\d{2}$/);
  });

  test('should update business hours for a single day', async ({ page }) => {
    await page.click('[data-testid="business-hours-tab"]');

    // Update Monday hours
    await page.fill('[data-testid="monday-open-time"]', '09:00');
    await page.fill('[data-testid="monday-close-time"]', '18:00');

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Should show success message
    await expect(page.locator('text=Business hours updated')).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await page.click('[data-testid="business-hours-tab"]');

    const mondayOpen = await page.locator('[data-testid="monday-open-time"]').inputValue();
    const mondayClose = await page.locator('[data-testid="monday-close-time"]').inputValue();

    expect(mondayOpen).toBe('09:00');
    expect(mondayClose).toBe('18:00');
  });

  test('should mark day as closed', async ({ page }) => {
    await page.click('[data-testid="business-hours-tab"]');

    // Check "Closed" for Sunday
    await page.check('[data-testid="sunday-closed"]');

    // Open and close time inputs should be disabled
    await expect(page.locator('[data-testid="sunday-open-time"]')).toBeDisabled();
    await expect(page.locator('[data-testid="sunday-close-time"]')).toBeDisabled();

    // Save
    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('text=Business hours updated')).toBeVisible();

    // Verify persistence
    await page.reload();
    await page.click('[data-testid="business-hours-tab"]');

    const isClosed = await page.locator('[data-testid="sunday-closed"]').isChecked();
    expect(isClosed).toBe(true);
  });

  test('should validate close time is after open time', async ({ page }) => {
    await page.click('[data-testid="business-hours-tab"]');

    // Set invalid hours (close before open)
    await page.fill('[data-testid="tuesday-open-time"]', '17:00');
    await page.fill('[data-testid="tuesday-close-time"]', '09:00');

    await page.click('button:has-text("Save Changes")');

    // Should show validation error
    await expect(page.locator('text=Close time must be after open time')).toBeVisible();
  });

  test('should apply same hours to all weekdays', async ({ page }) => {
    await page.click('[data-testid="business-hours-tab"]');

    // Fill weekday hours
    await page.fill('[data-testid="weekday-open-time"]', '08:00');
    await page.fill('[data-testid="weekday-close-time"]', '17:00');

    // Click "Apply to All Weekdays"
    await page.click('button:has-text("Apply to Weekdays")');

    // Verify all weekday fields updated
    const mondayOpen = await page.locator('[data-testid="monday-open-time"]').inputValue();
    const tuesdayOpen = await page.locator('[data-testid="tuesday-open-time"]').inputValue();
    const fridayOpen = await page.locator('[data-testid="friday-open-time"]').inputValue();

    expect(mondayOpen).toBe('08:00');
    expect(tuesdayOpen).toBe('08:00');
    expect(fridayOpen).toBe('08:00');
  });
});

test.describe('Admin Settings - Booking Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'owner@thepuppyday.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
    await page.click('a[href="/admin/settings"]');
  });

  test('should display booking settings', async ({ page }) => {
    await page.click('[data-testid="booking-settings-tab"]');

    // Should show booking configuration fields
    await expect(page.locator('input[name="bookingWindowDays"]')).toBeVisible();
    await expect(page.locator('input[name="cancellationWindowHours"]')).toBeVisible();
    await expect(page.locator('input[name="slotDurationMinutes"]')).toBeVisible();
    await expect(page.locator('input[name="maxDailyAppointments"]')).toBeVisible();
  });

  test('should update booking window', async ({ page }) => {
    await page.click('[data-testid="booking-settings-tab"]');

    // Update booking window to 60 days
    await page.fill('input[name="bookingWindowDays"]', '60');

    await page.click('button:has-text("Save Settings")');

    await expect(page.locator('text=Settings saved')).toBeVisible();

    // Verify persistence
    await page.reload();
    await page.click('[data-testid="booking-settings-tab"]');

    const value = await page.locator('input[name="bookingWindowDays"]').inputValue();
    expect(value).toBe('60');
  });

  test('should validate booking window range', async ({ page }) => {
    await page.click('[data-testid="booking-settings-tab"]');

    // Try invalid value (> 365)
    await page.fill('input[name="bookingWindowDays"]', '400');

    await page.click('button:has-text("Save Settings")');

    // Should show validation error
    await expect(page.locator('text=must be 365 days or less')).toBeVisible();
  });

  test('should update cancellation window', async ({ page }) => {
    await page.click('[data-testid="booking-settings-tab"]');

    // Update to 48 hours
    await page.fill('input[name="cancellationWindowHours"]', '48');

    await page.click('button:has-text("Save Settings")');

    await expect(page.locator('text=Settings saved')).toBeVisible();
  });

  test('should update slot duration', async ({ page }) => {
    await page.click('[data-testid="booking-settings-tab"]');

    // Update slot duration
    await page.selectOption('select[name="slotDurationMinutes"]', '30');

    await page.click('button:has-text("Save Settings")');

    await expect(page.locator('text=Settings saved')).toBeVisible();

    // Verify
    await page.reload();
    await page.click('[data-testid="booking-settings-tab"]');

    const value = await page.locator('select[name="slotDurationMinutes"]').inputValue();
    expect(value).toBe('30');
  });

  test('should toggle deposit requirement', async ({ page }) => {
    await page.click('[data-testid="booking-settings-tab"]');

    // Toggle deposit
    const depositToggle = page.locator('input[name="requireDeposit"]');
    const isChecked = await depositToggle.isChecked();

    await depositToggle.click();

    // Deposit percentage field should become visible/required
    if (!isChecked) {
      await expect(page.locator('input[name="depositPercentage"]')).toBeVisible();
      await expect(page.locator('input[name="depositPercentage"]')).not.toBeDisabled();
    }

    await page.click('button:has-text("Save Settings")');

    await expect(page.locator('text=Settings saved')).toBeVisible();
  });

  test('should update deposit percentage', async ({ page }) => {
    await page.click('[data-testid="booking-settings-tab"]');

    // Enable deposit
    await page.check('input[name="requireDeposit"]');

    // Set deposit percentage
    await page.fill('input[name="depositPercentage"]', '50');

    await page.click('button:has-text("Save Settings")');

    await expect(page.locator('text=Settings saved')).toBeVisible();
  });

  test('should validate deposit percentage range', async ({ page }) => {
    await page.click('[data-testid="booking-settings-tab"]');

    await page.check('input[name="requireDeposit"]');

    // Try invalid percentage (> 100)
    await page.fill('input[name="depositPercentage"]', '150');

    await page.click('button:has-text("Save Settings")');

    // Should show error
    await expect(page.locator('text=must be between 0 and 100')).toBeVisible();
  });
});

test.describe('Admin Settings - Notification Templates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'owner@thepuppyday.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
    await page.click('a[href="/admin/settings"]');
  });

  test('should display notification templates list', async ({ page }) => {
    await page.click('[data-testid="notification-templates-tab"]');

    // Should show template categories
    await expect(page.locator('text=Booking Confirmation')).toBeVisible();
    await expect(page.locator('text=Appointment Reminder')).toBeVisible();
    await expect(page.locator('text=Cancellation')).toBeVisible();

    // Should show email and SMS templates
    await expect(page.locator('[data-testid="template-card"]')).toHaveCount.greaterThan(0);
  });

  test('should edit email template', async ({ page }) => {
    await page.click('[data-testid="notification-templates-tab"]');

    // Click edit on booking confirmation email
    await page.click('[data-testid="edit-template-booking-confirmation-email"]');

    // Template editor should open
    await expect(page.locator('[data-testid="template-editor"]')).toBeVisible();

    // Should show template fields
    await expect(page.locator('input[name="subject"]')).toBeVisible();
    await expect(page.locator('textarea[name="body"]')).toBeVisible();

    // Update subject
    await page.fill('input[name="subject"]', 'Your Appointment at The Puppy Day - Confirmed!');

    // Update body with variables
    const templateBody = `
Hi {{customer_name}},

Your appointment for {{pet_name}} has been confirmed!

Service: {{service_name}}
Date: {{appointment_date}}
Time: {{appointment_time}}

See you soon!
    `.trim();

    await page.fill('textarea[name="body"]', templateBody);

    // Save template
    await page.click('button:has-text("Save Template")');

    await expect(page.locator('text=Template saved')).toBeVisible();
  });

  test('should validate template body length', async ({ page }) => {
    await page.click('[data-testid="notification-templates-tab"]');

    await page.click('[data-testid="edit-template-booking-confirmation-email"]');

    // Try very long body (> 2000 chars)
    const longBody = 'A'.repeat(2500);
    await page.fill('textarea[name="body"]', longBody);

    await page.click('button:has-text("Save Template")');

    // Should show validation error
    await expect(page.locator('text=Template body is too long')).toBeVisible();
  });

  test('should show available variables', async ({ page }) => {
    await page.click('[data-testid="notification-templates-tab"]');

    await page.click('[data-testid="edit-template-booking-confirmation-email"]');

    // Should show variable helper
    await expect(page.locator('[data-testid="available-variables"]')).toBeVisible();

    // Should list common variables
    await expect(page.locator('text={{customer_name}}')).toBeVisible();
    await expect(page.locator('text={{pet_name}}')).toBeVisible();
    await expect(page.locator('text={{service_name}}')).toBeVisible();
  });

  test('should insert variable into template', async ({ page }) => {
    await page.click('[data-testid="notification-templates-tab"]');

    await page.click('[data-testid="edit-template-booking-confirmation-email"]');

    // Click on a variable to insert
    await page.click('[data-testid="insert-variable-customer_name"]');

    // Variable should be inserted in body
    const bodyText = await page.locator('textarea[name="body"]').inputValue();
    expect(bodyText).toContain('{{customer_name}}');
  });

  test('should preview template with sample data', async ({ page }) => {
    await page.click('[data-testid="notification-templates-tab"]');

    await page.click('[data-testid="edit-template-booking-confirmation-email"]');

    // Click preview button
    await page.click('button:has-text("Preview")');

    // Preview modal should open
    await expect(page.locator('[data-testid="template-preview"]')).toBeVisible();

    // Should show rendered template with sample data
    await expect(page.locator('text=John Doe')).toBeVisible(); // Sample customer name
    await expect(page.locator('text=Buddy')).toBeVisible(); // Sample pet name
  });

  test('should edit SMS template', async ({ page }) => {
    await page.click('[data-testid="notification-templates-tab"]');

    await page.click('[data-testid="edit-template-appointment-reminder-sms"]');

    // SMS template editor
    await expect(page.locator('[data-testid="template-editor"]')).toBeVisible();

    // SMS should not have subject field
    await expect(page.locator('input[name="subject"]')).not.toBeVisible();

    // Update body
    const smsBody = 'Reminder: {{pet_name}}\'s grooming appt tomorrow at {{appointment_time}}. See you then!';
    await page.fill('textarea[name="body"]', smsBody);

    await page.click('button:has-text("Save Template")');

    await expect(page.locator('text=Template saved')).toBeVisible();
  });

  test('should validate SMS character limit', async ({ page }) => {
    await page.click('[data-testid="notification-templates-tab"]');

    await page.click('[data-testid="edit-template-appointment-reminder-sms"]');

    // Try very long SMS (> 160 chars without variables)
    const longSms = 'A'.repeat(200);
    await page.fill('textarea[name="body"]', longSms);

    // Should show character count warning
    await expect(page.locator('text=160 characters')).toBeVisible();
    await expect(page.locator('[data-testid="char-count-warning"]')).toBeVisible();
  });

  test('should reset template to default', async ({ page }) => {
    await page.click('[data-testid="notification-templates-tab"]');

    await page.click('[data-testid="edit-template-booking-confirmation-email"]');

    // Make changes
    await page.fill('input[name="subject"]', 'Modified subject');

    // Click reset to default
    await page.click('button:has-text("Reset to Default")');

    // Confirmation dialog
    await expect(page.locator('text=Are you sure')).toBeVisible();
    await page.click('button:has-text("Yes, Reset")');

    // Should restore default template
    await expect(page.locator('text=Template reset')).toBeVisible();

    // Subject should be default
    const subject = await page.locator('input[name="subject"]').inputValue();
    expect(subject).not.toBe('Modified subject');
  });
});

test.describe('Admin Settings - Promo Banners', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'owner@thepuppyday.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
    await page.click('a[href="/admin/settings"]');
  });

  test('should display promo banners list', async ({ page }) => {
    await page.click('[data-testid="promo-banners-tab"]');

    // Should show banners or empty state
    await expect(page.locator('h2:has-text("Promo Banners")')).toBeVisible();

    // Should have "Create Banner" button
    await expect(page.locator('button:has-text("Create Banner")')).toBeVisible();
  });

  test('should create new promo banner', async ({ page }) => {
    await page.click('[data-testid="promo-banners-tab"]');

    // Click create banner
    await page.click('button:has-text("Create Banner")');

    // Banner form should open
    await expect(page.locator('[data-testid="banner-form"]')).toBeVisible();

    // Fill banner details
    await page.fill('input[name="title"]', 'Holiday Special');
    await page.fill('textarea[name="message"]', 'Get 20% off all services this December!');
    await page.selectOption('select[name="type"]', 'promo');

    // Set dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    await page.fill('input[name="startDate"]', startDate.toISOString().split('T')[0]);
    await page.fill('input[name="endDate"]', endDate.toISOString().split('T')[0]);

    // Save banner
    await page.click('button:has-text("Create Banner")');

    // Should show success message
    await expect(page.locator('text=Banner created')).toBeVisible();

    // Banner should appear in list
    await expect(page.locator('text=Holiday Special')).toBeVisible();
  });

  test('should validate banner fields', async ({ page }) => {
    await page.click('[data-testid="promo-banners-tab"]');

    await page.click('button:has-text("Create Banner")');

    // Try to save without required fields
    await page.click('button:has-text("Create Banner")');

    // Should show validation errors
    await expect(page.locator('text=Title is required')).toBeVisible();
    await expect(page.locator('text=Message is required')).toBeVisible();
  });

  test('should validate end date is after start date', async ({ page }) => {
    await page.click('[data-testid="promo-banners-tab"]');

    await page.click('button:has-text("Create Banner")');

    await page.fill('input[name="title"]', 'Test Banner');
    await page.fill('textarea[name="message"]', 'Test message');

    // Set end date before start date
    await page.fill('input[name="startDate"]', '2024-12-31');
    await page.fill('input[name="endDate"]', '2024-12-01');

    await page.click('button:has-text("Create Banner")');

    // Should show validation error
    await expect(page.locator('text=End date must be after start date')).toBeVisible();
  });

  test('should edit existing banner', async ({ page }) => {
    await page.click('[data-testid="promo-banners-tab"]');

    const bannerCount = await page.locator('[data-testid="banner-card"]').count();

    if (bannerCount === 0) {
      // Create one first
      await page.click('button:has-text("Create Banner")');
      await page.fill('input[name="title"]', 'Test Banner');
      await page.fill('textarea[name="message"]', 'Test message');
      await page.selectOption('select[name="type"]', 'info');
      await page.click('button:has-text("Create Banner")');
      await page.waitForTimeout(500);
    }

    // Click edit
    await page.click('[data-testid="edit-banner-button"]');

    // Update title
    await page.fill('input[name="title"]', 'Updated Banner Title');

    // Save changes
    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('text=Banner updated')).toBeVisible();

    // Verify update
    await expect(page.locator('text=Updated Banner Title')).toBeVisible();
  });

  test('should toggle banner active status', async ({ page }) => {
    await page.click('[data-testid="promo-banners-tab"]');

    const bannerCount = await page.locator('[data-testid="banner-card"]').count();

    if (bannerCount === 0) {
      test.skip();
    }

    // Toggle active status
    const activeToggle = page.locator('[data-testid="banner-active-toggle"]').first();
    await activeToggle.click();

    // Should show status change
    await expect(page.locator('text=Banner status updated')).toBeVisible();
  });

  test('should delete banner', async ({ page }) => {
    await page.click('[data-testid="promo-banners-tab"]');

    const bannerCount = await page.locator('[data-testid="banner-card"]').count();

    if (bannerCount === 0) {
      test.skip();
    }

    const initialCount = bannerCount;

    // Click delete
    await page.click('[data-testid="delete-banner-button"]');

    // Confirmation dialog
    await expect(page.locator('text=Are you sure')).toBeVisible();
    await page.click('button:has-text("Delete")');

    // Should show success
    await expect(page.locator('text=Banner deleted')).toBeVisible();

    // Count should decrease
    await page.waitForTimeout(500);
    const newCount = await page.locator('[data-testid="banner-card"]').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('should preview banner', async ({ page }) => {
    await page.click('[data-testid="promo-banners-tab"]');

    await page.click('button:has-text("Create Banner")');

    await page.fill('input[name="title"]', 'Preview Test');
    await page.fill('textarea[name="message"]', 'This is a preview message');
    await page.selectOption('select[name="type"]', 'warning');

    // Click preview
    await page.click('button:has-text("Preview")');

    // Preview should show banner as it will appear
    await expect(page.locator('[data-testid="banner-preview"]')).toBeVisible();
    await expect(page.locator('text=Preview Test')).toBeVisible();
    await expect(page.locator('text=This is a preview message')).toBeVisible();
  });

  test('should reorder banners', async ({ page }) => {
    await page.click('[data-testid="promo-banners-tab"]');

    const bannerCount = await page.locator('[data-testid="banner-card"]').count();

    if (bannerCount < 2) {
      test.skip();
    }

    // Get first banner title
    const firstTitle = await page.locator('[data-testid="banner-title"]').first().textContent();

    // Click move down on first banner
    await page.locator('[data-testid="move-down-button"]').first().click();

    await page.waitForTimeout(500);

    // First banner title should now be second
    const secondTitle = await page.locator('[data-testid="banner-title"]').nth(1).textContent();
    expect(secondTitle).toBe(firstTitle);
  });
});

test.describe('Admin Settings - General Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'owner@thepuppyday.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
    await page.click('a[href="/admin/settings"]');
  });

  test('should update business information', async ({ page }) => {
    await page.click('[data-testid="general-settings-tab"]');

    // Update business details
    await page.fill('input[name="businessName"]', 'The Puppy Day Grooming Salon');
    await page.fill('input[name="businessPhone"]', '+15625551234');
    await page.fill('input[name="businessEmail"]', 'info@thepuppyday.com');
    await page.fill('textarea[name="businessAddress"]', '123 Main St, La Mirada, CA 90638');

    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('text=Settings saved')).toBeVisible();
  });

  test('should update social media links', async ({ page }) => {
    await page.click('[data-testid="general-settings-tab"]');

    // Scroll to social media section
    await page.locator('[data-testid="social-media-section"]').scrollIntoViewIfNeeded();

    // Update social links
    await page.fill('input[name="instagramHandle"]', '@thepuppyday');
    await page.fill('input[name="facebookUrl"]', 'https://facebook.com/thepuppyday');
    await page.fill('input[name="yelpUrl"]', 'https://yelp.com/biz/thepuppyday');

    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('text=Settings saved')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.click('[data-testid="general-settings-tab"]');

    // Enter invalid email
    await page.fill('input[name="businessEmail"]', 'invalid-email');

    await page.click('button:has-text("Save Changes")');

    // Should show validation error
    await expect(page.locator('text=valid email')).toBeVisible();
  });

  test('should validate URL format for social links', async ({ page }) => {
    await page.click('[data-testid="general-settings-tab"]');

    await page.locator('[data-testid="social-media-section"]').scrollIntoViewIfNeeded();

    // Enter invalid URL
    await page.fill('input[name="facebookUrl"]', 'not-a-url');

    await page.click('button:has-text("Save Changes")');

    // Should show validation error
    await expect(page.locator('text=valid URL')).toBeVisible();
  });
});
