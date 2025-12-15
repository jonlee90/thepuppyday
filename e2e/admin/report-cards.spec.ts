/**
 * E2E tests for Report Card workflow
 * Task 0077: Test critical Phase 6 flows end-to-end
 *
 * Test Flow: Create report card → view public page → submit review
 */

import { test, expect } from '@playwright/test';

test.describe('Report Card E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@thepuppyday.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('should create report card for completed appointment', async ({ page }) => {
    // Navigate to appointments
    await page.goto('/admin/appointments');
    await page.waitForLoadState('networkidle');

    // Find a completed appointment
    await page.click('text=Completed');
    await page.waitForTimeout(500);

    // Click on first completed appointment
    await page.click('[data-testid="appointment-row"]:first-child');

    // Click "Create Report Card" button
    await page.click('button:has-text("Create Report Card")');

    // Fill report card form
    await page.fill('textarea[name="groomer_notes"]', 'Pet was well-behaved and looked great!');
    await page.fill('textarea[name="customer_notes"]', 'Your pup looks adorable! See you next time.');

    // Upload before photo (mock)
    const beforePhotoInput = await page.locator('input[name="before_photo"]');
    // In real test, would use: await beforePhotoInput.setInputFiles('test-images/before.jpg');

    // Upload after photo (mock)
    const afterPhotoInput = await page.locator('input[name="after_photo"]');
    // In real test, would use: await afterPhotoInput.setInputFiles('test-images/after.jpg');

    // Save as draft
    await page.click('button:has-text("Save Draft")');

    // Verify success message
    await expect(page.locator('text=Report card saved')).toBeVisible();

    // Send report card
    await page.click('button:has-text("Send to Customer")');
    await expect(page.locator('text=Report card sent')).toBeVisible();
  });

  test('should view public report card page', async ({ page, context }) => {
    // Get report card public link from database or admin panel
    const reportCardId = 'test-report-card-id';
    const publicUrl = `/report-cards/${reportCardId}`;

    // Open in new context (as customer)
    const customerPage = await context.newPage();
    await customerPage.goto(publicUrl);

    // Verify public page loads
    await expect(customerPage.locator('h1')).toContainText('Grooming Report Card');

    // Verify before/after images are visible
    await expect(customerPage.locator('[data-testid="before-photo"]')).toBeVisible();
    await expect(customerPage.locator('[data-testid="after-photo"]')).toBeVisible();

    // Verify notes are visible
    await expect(customerPage.locator('text=Your pup looks adorable')).toBeVisible();
  });

  test('should submit 5-star review and route to Google', async ({ page }) => {
    const reportCardId = 'test-report-card-id';
    const publicUrl = `/report-cards/${reportCardId}`;

    await page.goto(publicUrl);

    // Click 5 stars
    await page.click('[data-testid="star-5"]');

    // Fill feedback
    await page.fill('textarea[name="feedback"]', 'Excellent service! My dog looks amazing.');

    // Submit review
    await page.click('button:has-text("Submit Review")');

    // Should be redirected to Google Reviews
    await page.waitForURL(/google\.com/);
    expect(page.url()).toContain('google.com');
    expect(page.url()).toContain('writereview');
  });

  test('should submit 3-star review and stay on private feedback', async ({ page }) => {
    const reportCardId = 'test-report-card-id';
    const publicUrl = `/report-cards/${reportCardId}`;

    await page.goto(publicUrl);

    // Click 3 stars
    await page.click('[data-testid="star-3"]');

    // Fill feedback
    await page.fill('textarea[name="feedback"]', 'Service was okay, but could be better.');

    // Submit review
    await page.click('button:has-text("Submit Review")');

    // Should show thank you message (not redirect to Google)
    await expect(page.locator('text=Thank you for your feedback')).toBeVisible();
    expect(page.url()).not.toContain('google.com');
  });

  test('should edit report card after creation', async ({ page }) => {
    await page.goto('/admin/appointments');

    // Find appointment with report card
    await page.click('[data-testid="appointment-with-report-card"]:first-child');

    // Click "Edit Report Card"
    await page.click('button:has-text("Edit Report Card")');

    // Update notes
    await page.fill('textarea[name="customer_notes"]', 'Updated: Your pup had a great time!');

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Verify success
    await expect(page.locator('text=Report card updated')).toBeVisible();
  });

  test('should view report card analytics', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Navigate to report card metrics
    await page.click('text=Report Cards');

    // Verify metrics are displayed
    await expect(page.locator('[data-testid="total-report-cards"]')).toBeVisible();
    await expect(page.locator('[data-testid="sent-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="viewed-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-count"]')).toBeVisible();
  });
});

test.describe('Report Card Validations', () => {
  test('should require photos before sending', async ({ page }) => {
    await page.goto('/admin/appointments');

    // Try to create report card without photos
    await page.click('[data-testid="appointment-row"]:first-child');
    await page.click('button:has-text("Create Report Card")');

    // Try to send without photos
    await page.click('button:has-text("Send to Customer")');

    // Should show validation error
    await expect(page.locator('text=Please upload before and after photos')).toBeVisible();
  });

  test('should allow saving draft without photos', async ({ page }) => {
    await page.goto('/admin/appointments');

    await page.click('[data-testid="appointment-row"]:first-child');
    await page.click('button:has-text("Create Report Card")');

    // Save as draft without photos
    await page.fill('textarea[name="groomer_notes"]', 'Draft notes');
    await page.click('button:has-text("Save Draft")');

    // Should succeed
    await expect(page.locator('text=Draft saved')).toBeVisible();
  });
});
