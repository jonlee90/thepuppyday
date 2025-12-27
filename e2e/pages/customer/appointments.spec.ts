/**
 * E2E tests for Customer Appointment Management
 * Task 0275: Test customer portal appointment flows
 *
 * Test Scenarios:
 * - View appointment list
 * - Filter and sort appointments
 * - View appointment details
 * - Cancel appointment
 * - Update notification preferences
 * - View report cards
 */

import { test, expect } from '@playwright/test';

test.describe('Customer Appointments List', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/customer');

    // Navigate to appointments page
    await page.click('a[href="/customer/appointments"]');
    await page.waitForURL('/customer/appointments');
  });

  test('should display list of appointments', async ({ page }) => {
    // Verify appointments page loaded
    await expect(page.locator('h1:has-text("My Appointments")')).toBeVisible();

    // Should show appointments or empty state
    const hasAppointments = await page.locator('[data-testid="appointment-card"]').count();

    if (hasAppointments > 0) {
      // Verify appointment card displays information
      const firstCard = page.locator('[data-testid="appointment-card"]').first();
      await expect(firstCard).toBeVisible();
      await expect(page.locator('[data-testid="service-name"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="appointment-date"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="appointment-status"]').first()).toBeVisible();
    } else {
      // Empty state
      await expect(page.locator('text=No appointments')).toBeVisible();
      await expect(page.locator('button:has-text("Book Appointment")')).toBeVisible();
    }
  });

  test('should filter appointments by status', async ({ page }) => {
    const appointmentCount = await page.locator('[data-testid="appointment-card"]').count();

    if (appointmentCount === 0) {
      test.skip();
    }

    // Filter by upcoming
    await page.click('[data-testid="filter-upcoming"]');
    await page.waitForTimeout(500);

    // Should show only upcoming appointments
    const upcomingCards = page.locator('[data-testid="appointment-card"]');
    const count = await upcomingCards.count();

    for (let i = 0; i < count; i++) {
      const status = await upcomingCards.nth(i).locator('[data-testid="appointment-status"]').textContent();
      expect(status).toMatch(/upcoming|confirmed/i);
    }
  });

  test('should filter appointments by past', async ({ page }) => {
    const appointmentCount = await page.locator('[data-testid="appointment-card"]').count();

    if (appointmentCount === 0) {
      test.skip();
    }

    // Filter by past
    await page.click('[data-testid="filter-past"]');
    await page.waitForTimeout(500);

    // Should show only past appointments
    const pastCards = page.locator('[data-testid="appointment-card"]');
    const count = await pastCards.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const status = await pastCards.nth(i).locator('[data-testid="appointment-status"]').textContent();
        expect(status).toMatch(/completed|cancelled|no-show/i);
      }
    }
  });

  test('should sort appointments by date', async ({ page }) => {
    const appointmentCount = await page.locator('[data-testid="appointment-card"]').count();

    if (appointmentCount < 2) {
      test.skip();
    }

    // Select "Newest First" sort
    await page.selectOption('select[name="sort"]', 'newest');
    await page.waitForTimeout(500);

    // Get first two dates
    const dates = await page.locator('[data-testid="appointment-date"]').allTextContents();

    // First date should be more recent than second
    const date1 = new Date(dates[0]);
    const date2 = new Date(dates[1]);
    expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
  });

  test('should search appointments', async ({ page }) => {
    const appointmentCount = await page.locator('[data-testid="appointment-card"]').count();

    if (appointmentCount === 0) {
      test.skip();
    }

    // Get first service name
    const firstService = await page.locator('[data-testid="service-name"]').first().textContent();

    // Search for that service
    await page.fill('input[name="search"]', firstService!);
    await page.waitForTimeout(500);

    // Should show only matching appointments
    const visibleCards = await page.locator('[data-testid="appointment-card"]').count();
    expect(visibleCards).toBeGreaterThanOrEqual(1);

    // First result should contain search term
    const displayedService = await page.locator('[data-testid="service-name"]').first().textContent();
    expect(displayedService).toContain(firstService);
  });
});

test.describe('Appointment Details', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/customer');
    await page.click('a[href="/customer/appointments"]');
  });

  test('should view appointment details', async ({ page }) => {
    const appointmentCount = await page.locator('[data-testid="appointment-card"]').count();

    if (appointmentCount === 0) {
      test.skip();
    }

    // Click on first appointment
    await page.click('[data-testid="appointment-card"]');

    // Details modal should open
    await expect(page.locator('[data-testid="appointment-details-modal"]')).toBeVisible();

    // Should show appointment information
    await expect(page.locator('[data-testid="service-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-time"]')).toBeVisible();
    await expect(page.locator('[data-testid="pet-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-status"]')).toBeVisible();
  });

  test('should show add-ons in details', async ({ page }) => {
    const appointmentCount = await page.locator('[data-testid="appointment-card"]').count();

    if (appointmentCount === 0) {
      test.skip();
    }

    await page.click('[data-testid="appointment-card"]');

    await expect(page.locator('[data-testid="appointment-details-modal"]')).toBeVisible();

    // Check if add-ons section exists
    const addonsSection = page.locator('[data-testid="addons-section"]');
    const hasAddons = await addonsSection.isVisible().catch(() => false);

    if (hasAddons) {
      await expect(page.locator('text=Add-ons')).toBeVisible();
    }
  });

  test('should show price breakdown in details', async ({ page }) => {
    const appointmentCount = await page.locator('[data-testid="appointment-card"]').count();

    if (appointmentCount === 0) {
      test.skip();
    }

    await page.click('[data-testid="appointment-card"]');

    // Should show price information
    await expect(page.locator('[data-testid="service-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-price"]')).toBeVisible();

    // Verify price format
    const totalPrice = await page.locator('[data-testid="total-price"]').textContent();
    expect(totalPrice).toMatch(/\$/);
  });

  test('should show booking reference', async ({ page }) => {
    const appointmentCount = await page.locator('[data-testid="appointment-card"]').count();

    if (appointmentCount === 0) {
      test.skip();
    }

    await page.click('[data-testid="appointment-card"]');

    // Should show booking reference
    await expect(page.locator('[data-testid="booking-reference"]')).toBeVisible();
  });
});

test.describe('Cancel Appointment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/customer');
    await page.click('a[href="/customer/appointments"]');
  });

  test('should cancel upcoming appointment', async ({ page }) => {
    // Find upcoming appointment
    const upcomingAppointments = page.locator('[data-testid="appointment-card"]').filter({
      has: page.locator('[data-testid="appointment-status"]:has-text("upcoming")'),
    });

    const count = await upcomingAppointments.count();

    if (count === 0) {
      test.skip();
    }

    // Click on upcoming appointment
    await upcomingAppointments.first().click();

    // Details modal should open
    await expect(page.locator('[data-testid="appointment-details-modal"]')).toBeVisible();

    // Click cancel button
    await page.click('button:has-text("Cancel Appointment")');

    // Confirmation dialog should appear
    await expect(page.locator('[data-testid="confirmation-modal"]')).toBeVisible();
    await expect(page.locator('text=Are you sure')).toBeVisible();

    // Confirm cancellation
    await page.click('button:has-text("Yes, Cancel")');

    // Should show success message
    await expect(page.locator('text=Appointment cancelled')).toBeVisible();

    // Status should update to cancelled
    await page.waitForTimeout(500);
    const status = await page.locator('[data-testid="appointment-status"]').first().textContent();
    expect(status).toMatch(/cancelled/i);
  });

  test('should not allow cancelling past appointments', async ({ page }) => {
    // Find past appointment
    await page.click('[data-testid="filter-past"]');
    await page.waitForTimeout(500);

    const pastCount = await page.locator('[data-testid="appointment-card"]').count();

    if (pastCount === 0) {
      test.skip();
    }

    await page.locator('[data-testid="appointment-card"]').first().click();

    // Cancel button should not be visible or disabled
    const cancelButton = page.locator('button:has-text("Cancel Appointment")');
    const isVisible = await cancelButton.isVisible().catch(() => false);

    if (isVisible) {
      await expect(cancelButton).toBeDisabled();
    } else {
      await expect(cancelButton).not.toBeVisible();
    }
  });

  test('should enforce cancellation window', async ({ page }) => {
    // Mock appointment within cancellation window
    await page.route('/api/customer/appointments/*', async (route) => {
      const url = route.request().url();

      if (url.includes('/cancel')) {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({
            error: 'Cannot cancel appointment within 24 hours of scheduled time',
          }),
        });
      } else {
        await route.continue();
      }
    });

    const count = await page.locator('[data-testid="appointment-card"]').count();

    if (count === 0) {
      test.skip();
    }

    await page.locator('[data-testid="appointment-card"]').first().click();
    await page.click('button:has-text("Cancel Appointment")');
    await page.click('button:has-text("Yes, Cancel")');

    // Should show error message
    await expect(page.locator('text=Cannot cancel appointment within 24 hours')).toBeVisible();
  });

  test('should allow undoing cancellation', async ({ page }) => {
    // Find cancelled appointment
    const cancelledAppointments = page.locator('[data-testid="appointment-card"]').filter({
      has: page.locator('[data-testid="appointment-status"]:has-text("cancelled")'),
    });

    const count = await cancelledAppointments.count();

    if (count === 0) {
      test.skip();
    }

    await cancelledAppointments.first().click();

    // Should show "Restore Appointment" button
    const restoreButton = page.locator('button:has-text("Restore Appointment")');
    const isVisible = await restoreButton.isVisible().catch(() => false);

    if (isVisible) {
      await restoreButton.click();

      // Confirmation
      await page.click('button:has-text("Yes, Restore")');

      // Should show success message
      await expect(page.locator('text=Appointment restored')).toBeVisible();
    }
  });
});

test.describe('Notification Preferences', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/customer');
  });

  test('should navigate to notification preferences', async ({ page }) => {
    // Click on profile or settings
    await page.click('[data-testid="user-menu"]');
    await page.click('a:has-text("Notification Preferences")');

    // Should load preferences page
    await expect(page.locator('h1:has-text("Notification Preferences")')).toBeVisible();
  });

  test('should toggle email notifications', async ({ page }) => {
    await page.click('[data-testid="user-menu"]');
    await page.click('a:has-text("Notification Preferences")');

    // Toggle email notifications
    const emailToggle = page.locator('input[name="emailNotifications"]');
    const isChecked = await emailToggle.isChecked();

    await emailToggle.click();

    // Save preferences
    await page.click('button:has-text("Save Preferences")');

    // Should show success message
    await expect(page.locator('text=Preferences saved')).toBeVisible();

    // Reload and verify persistence
    await page.reload();

    const newState = await emailToggle.isChecked();
    expect(newState).toBe(!isChecked);
  });

  test('should toggle SMS notifications', async ({ page }) => {
    await page.click('[data-testid="user-menu"]');
    await page.click('a:has-text("Notification Preferences")');

    // Toggle SMS notifications
    const smsToggle = page.locator('input[name="smsNotifications"]');
    const isChecked = await smsToggle.isChecked();

    await smsToggle.click();

    await page.click('button:has-text("Save Preferences")');

    await expect(page.locator('text=Preferences saved')).toBeVisible();

    // Verify persistence
    await page.reload();

    const newState = await smsToggle.isChecked();
    expect(newState).toBe(!isChecked);
  });

  test('should configure notification types', async ({ page }) => {
    await page.click('[data-testid="user-menu"]');
    await page.click('a:has-text("Notification Preferences")');

    // Toggle specific notification types
    await page.check('input[name="appointmentReminders"]');
    await page.check('input[name="reportCardReady"]');
    await page.uncheck('input[name="promotional"]');

    await page.click('button:has-text("Save Preferences")');

    await expect(page.locator('text=Preferences saved')).toBeVisible();
  });
});

test.describe('Report Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/customer');
    await page.click('a[href="/customer/appointments"]');
  });

  test('should view report card for completed appointment', async ({ page }) => {
    // Filter to past appointments
    await page.click('[data-testid="filter-past"]');
    await page.waitForTimeout(500);

    const completedAppointments = page.locator('[data-testid="appointment-card"]').filter({
      has: page.locator('[data-testid="appointment-status"]:has-text("completed")'),
    });

    const count = await completedAppointments.count();

    if (count === 0) {
      test.skip();
    }

    // Click on completed appointment
    await completedAppointments.first().click();

    // Check if report card exists
    const reportCardButton = page.locator('button:has-text("View Report Card")');
    const hasReportCard = await reportCardButton.isVisible().catch(() => false);

    if (!hasReportCard) {
      test.skip();
    }

    // Click view report card
    await reportCardButton.click();

    // Report card modal should open
    await expect(page.locator('[data-testid="report-card-modal"]')).toBeVisible();

    // Should show report card sections
    await expect(page.locator('text=Mood')).toBeVisible();
    await expect(page.locator('text=Coat Condition')).toBeVisible();
    await expect(page.locator('text=Behavior')).toBeVisible();

    // Should show photos
    await expect(page.locator('[data-testid="before-photo"]')).toBeVisible();
    await expect(page.locator('[data-testid="after-photo"]')).toBeVisible();
  });

  test('should download report card as PDF', async ({ page }) => {
    await page.click('[data-testid="filter-past"]');
    await page.waitForTimeout(500);

    const completedAppointments = page.locator('[data-testid="appointment-card"]').filter({
      has: page.locator('[data-testid="appointment-status"]:has-text("completed")'),
    });

    const count = await completedAppointments.count();

    if (count === 0) {
      test.skip();
    }

    await completedAppointments.first().click();

    const reportCardButton = page.locator('button:has-text("View Report Card")');
    const hasReportCard = await reportCardButton.isVisible().catch(() => false);

    if (!hasReportCard) {
      test.skip();
    }

    await reportCardButton.click();

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click download PDF button
    await page.click('button:has-text("Download PDF")');

    // Wait for download
    const download = await downloadPromise;

    // Verify file name
    expect(download.suggestedFilename()).toContain('report-card');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should share report card', async ({ page }) => {
    await page.click('[data-testid="filter-past"]');
    await page.waitForTimeout(500);

    const completedAppointments = page.locator('[data-testid="appointment-card"]').filter({
      has: page.locator('[data-testid="appointment-status"]:has-text("completed")'),
    });

    const count = await completedAppointments.count();

    if (count === 0) {
      test.skip();
    }

    await completedAppointments.first().click();

    const reportCardButton = page.locator('button:has-text("View Report Card")');
    const hasReportCard = await reportCardButton.isVisible().catch(() => false);

    if (!hasReportCard) {
      test.skip();
    }

    await reportCardButton.click();

    // Click share button
    await page.click('button:has-text("Share")');

    // Share options should appear
    await expect(page.locator('[data-testid="share-options"]')).toBeVisible();

    // Verify share link
    await expect(page.locator('[data-testid="share-link"]')).toBeVisible();
  });
});

test.describe('Profile Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/customer');
  });

  test('should update profile information', async ({ page }) => {
    // Navigate to profile
    await page.click('[data-testid="user-menu"]');
    await page.click('a:has-text("Profile")');

    // Update fields
    await page.fill('input[name="firstName"]', 'UpdatedFirstName');
    await page.fill('input[name="phone"]', '+15559998888');

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Should show success message
    await expect(page.locator('text=Profile updated')).toBeVisible();

    // Verify changes persisted
    await page.reload();

    const firstName = await page.locator('input[name="firstName"]').inputValue();
    expect(firstName).toBe('UpdatedFirstName');
  });

  test('should change password', async ({ page }) => {
    await page.click('[data-testid="user-menu"]');
    await page.click('a:has-text("Profile")');

    // Click change password
    await page.click('button:has-text("Change Password")');

    // Fill password form
    await page.fill('input[name="currentPassword"]', 'password123');
    await page.fill('input[name="newPassword"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');

    await page.click('button:has-text("Update Password")');

    // Should show success message
    await expect(page.locator('text=Password changed successfully')).toBeVisible();
  });
});
