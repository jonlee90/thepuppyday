/**
 * E2E tests for Waitlist workflow
 * Task 0077: Test critical Phase 6 flows end-to-end
 *
 * Test Flow: Fill slot from waitlist → simulate SMS response
 */

import { test, expect } from '@playwright/test';

test.describe('Waitlist E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@thepuppyday.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('should fill appointment slot from waitlist', async ({ page }) => {
    // Navigate to appointments calendar
    await page.goto('/admin/appointments');
    await page.waitForLoadState('networkidle');

    // Click on empty time slot
    await page.click('[data-testid="empty-slot-2024-02-15-10:00"]');

    // Modal should open showing "Fill from Waitlist" option
    await expect(page.locator('text=Fill from Waitlist')).toBeVisible();

    // Should show waitlist match count
    await expect(page.locator('[data-testid="waitlist-match-count"]')).toBeVisible();

    // Click "Fill from Waitlist" button
    await page.click('button:has-text("Fill from Waitlist")');

    // Fill slot modal should open
    await expect(page.locator('h2:has-text("Fill Slot from Waitlist")')).toBeVisible();

    // Select first waitlist entry
    await page.click('[data-testid="waitlist-entry-1"]');

    // Click "Send Offer" button
    await page.click('button:has-text("Send Offer")');

    // Verify success message
    await expect(page.locator('text=Offer sent successfully')).toBeVisible();

    // Verify SMS was sent (check notification log)
    await page.goto('/admin/notifications');
    await expect(page.locator('text=Waitlist slot offer sent')).toBeVisible();
  });

  test('should show matching waitlist entries for slot', async ({ page }) => {
    await page.goto('/admin/appointments');

    // Click empty slot
    await page.click('[data-testid="empty-slot-2024-02-15-14:00"]');
    await page.click('button:has-text("Fill from Waitlist")');

    // Verify matching criteria displayed
    await expect(page.locator('text=Service: Basic Grooming')).toBeVisible();
    await expect(page.locator('text=Date: Feb 15, 2024')).toBeVisible();

    // Verify waitlist entries are shown
    await expect(page.locator('[data-testid="waitlist-entry"]')).toHaveCount.greaterThan(0);

    // Verify each entry shows customer and pet info
    const firstEntry = page.locator('[data-testid="waitlist-entry"]').first();
    await expect(firstEntry.locator('[data-testid="customer-name"]')).toBeVisible();
    await expect(firstEntry.locator('[data-testid="pet-name"]')).toBeVisible();
    await expect(firstEntry.locator('[data-testid="requested-date"]')).toBeVisible();
  });

  test('should handle waitlist offer acceptance', async ({ page }) => {
    // Navigate to waitlist management
    await page.goto('/admin/waitlist');

    // Find entry with pending offer
    const pendingOffer = page.locator('[data-testid="waitlist-entry-pending-offer"]').first();
    await pendingOffer.click();

    // View offer details
    await expect(page.locator('text=Offer sent:')).toBeVisible();
    await expect(page.locator('text=Expires at:')).toBeVisible();

    // Simulate customer accepting offer (would happen via SMS in real scenario)
    // For testing, manually mark as accepted
    await page.click('button:has-text("Mark as Accepted")');

    // Verify appointment was created
    await page.goto('/admin/appointments');
    await expect(page.locator('[data-testid="appointment-from-waitlist"]')).toBeVisible();
  });

  test('should handle waitlist offer expiration', async ({ page }) => {
    await page.goto('/admin/waitlist');

    // Filter for expired offers
    await page.click('select[name="status"]');
    await page.selectOption('select[name="status"]', 'expired');

    // Verify expired entries are shown
    await expect(page.locator('[data-testid="expired-offer"]')).toHaveCount.greaterThan(0);

    // Click expired entry
    await page.click('[data-testid="expired-offer"]').first();

    // Should show option to send new offer
    await expect(page.locator('button:has-text("Send New Offer")')).toBeVisible();
  });

  test('should filter waitlist entries', async ({ page }) => {
    await page.goto('/admin/waitlist');

    // Filter by status
    await page.selectOption('select[name="status"]', 'active');
    await page.waitForTimeout(500);

    // Verify only active entries shown
    const entries = page.locator('[data-testid="waitlist-entry"]');
    const count = await entries.count();
    for (let i = 0; i < count; i++) {
      await expect(entries.nth(i).locator('[data-testid="status-badge"]')).toHaveText('Active');
    }

    // Filter by service
    await page.selectOption('select[name="service"]', 'basic-grooming');
    await page.waitForTimeout(500);

    // Verify only Basic Grooming entries shown
    await expect(page.locator('text=Premium Grooming')).not.toBeVisible();
  });

  test('should manually remove from waitlist', async ({ page }) => {
    await page.goto('/admin/waitlist');

    // Click on waitlist entry
    await page.click('[data-testid="waitlist-entry"]').first();

    // Click remove button
    await page.click('button:has-text("Remove from Waitlist")');

    // Confirm removal
    await page.click('button:has-text("Confirm")');

    // Verify success message
    await expect(page.locator('text=Removed from waitlist')).toBeVisible();

    // Verify entry is no longer in active list
    await page.selectOption('select[name="status"]', 'active');
    // Entry should be gone or marked as cancelled
  });

  test('should show waitlist statistics', async ({ page }) => {
    await page.goto('/admin/waitlist');

    // Verify stats cards are visible
    await expect(page.locator('[data-testid="total-active"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-offers"]')).toBeVisible();
    await expect(page.locator('[data-testid="filled-today"]')).toBeVisible();

    // Verify stats have values
    const totalActive = await page.locator('[data-testid="total-active"]').textContent();
    expect(totalActive).toMatch(/\d+/);
  });
});

test.describe('Waitlist SMS Integration', () => {
  test('should send SMS offer with correct format', async ({ page }) => {
    await page.goto('/admin/appointments');

    // Send waitlist offer
    await page.click('[data-testid="empty-slot"]').first();
    await page.click('button:has-text("Fill from Waitlist")');
    await page.click('[data-testid="waitlist-entry"]').first();
    await page.click('button:has-text("Send Offer")');

    // Check notification log for SMS
    await page.goto('/admin/notifications');

    // Find SMS notification
    const smsNotification = page.locator('[data-testid="notification-sms"]').first();
    await smsNotification.click();

    // Verify SMS contains required elements
    await expect(page.locator('text=A slot opened up for')).toBeVisible();
    await expect(page.locator('text=Reply YES to book')).toBeVisible();
    await expect(page.locator('text=Offer expires')).toBeVisible();
  });

  test('should handle "YES" response to waitlist offer', async ({ page }) => {
    // This would typically be triggered by webhook
    // For E2E test, simulate the response handler

    await page.goto('/admin/waitlist');

    const pendingEntry = page.locator('[data-testid="waitlist-pending-offer"]').first();
    const customerName = await pendingEntry.locator('[data-testid="customer-name"]').textContent();

    // Simulate YES response (in real scenario, webhook would trigger this)
    await page.click('button[data-testid="simulate-yes-response"]');

    // Verify appointment created
    await page.goto('/admin/appointments');
    await expect(page.locator(`text=${customerName}`)).toBeVisible();
  });

  test('should handle "NO" response to waitlist offer', async ({ page }) => {
    await page.goto('/admin/waitlist');

    const pendingEntry = page.locator('[data-testid="waitlist-pending-offer"]').first();

    // Simulate NO response
    await page.click('button[data-testid="simulate-no-response"]');

    // Entry should be marked as declined
    await page.selectOption('select[name="status"]', 'declined');
    await expect(page.locator('[data-testid="declined-entry"]')).toBeVisible();
  });
});

test.describe('Waitlist Priority', () => {
  test('should display entries in priority order (FIFO)', async ({ page }) => {
    await page.goto('/admin/appointments');

    await page.click('[data-testid="empty-slot"]').first();
    await page.click('button:has-text("Fill from Waitlist")');

    // First entry should be oldest (created first)
    const entries = page.locator('[data-testid="waitlist-entry"]');
    const firstEntryDate = await entries.first().locator('[data-testid="created-at"]').textContent();
    const secondEntryDate = await entries.nth(1).locator('[data-testid="created-at"]').textContent();

    // First entry should have earlier or same date as second
    expect(new Date(firstEntryDate || '')).toBeLessThanOrEqual(new Date(secondEntryDate || ''));
  });
});
