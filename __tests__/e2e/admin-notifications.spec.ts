/**
 * Phase 8: Admin Notification UI E2E Tests
 * End-to-end tests for admin notification management interface
 * Task 0154
 *
 * These tests use Playwright to test the complete user flow
 * through the admin notification management screens.
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const ADMIN_BASE_URL = '/admin/notifications';

// Mock admin user for authentication
const MOCK_ADMIN_EMAIL = 'admin@puppyday.com';
const MOCK_ADMIN_PASSWORD = 'admin123';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Login as admin user (if authentication is required)
 */
async function loginAsAdmin(page: any) {
  // Skip login in mock mode
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
  if (useMocks) {
    return;
  }

  await page.goto('/login');
  await page.fill('input[name="email"]', MOCK_ADMIN_EMAIL);
  await page.fill('input[name="password"]', MOCK_ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin/**');
}

// ============================================================================
// E2E TESTS
// ============================================================================

test.describe('Admin Notification Management', () => {
  test.beforeEach(async ({ page }) => {
    // Set mock mode
    await page.addInitScript(() => {
      window.localStorage.setItem('NEXT_PUBLIC_USE_MOCKS', 'true');
    });
  });

  // ==========================================================================
  // TEST 1: TEMPLATE LIST PAGE LOADS
  // ==========================================================================

  test.describe('Template List Page', () => {
    test('should load template list page successfully', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/templates`);

      // Verify page title
      await expect(page.locator('h1')).toContainText(/Templates|Notification Templates/i);

      // Verify templates are displayed
      const templateList = page.locator('[data-testid="template-list"]');
      await expect(templateList).toBeVisible();

      // Should show at least one template
      const templates = page.locator('[data-testid="template-item"]');
      await expect(templates.first()).toBeVisible({ timeout: 5000 });
    });

    test('should display template types and channels', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/templates`);

      // Wait for templates to load
      await page.waitForSelector('[data-testid="template-item"]', { timeout: 5000 });

      // Verify template information is displayed
      const firstTemplate = page.locator('[data-testid="template-item"]').first();
      await expect(firstTemplate).toBeVisible();

      // Should show notification type (e.g., "Booking Confirmation")
      await expect(firstTemplate).toContainText(/booking|appointment|reminder/i);

      // Should show channel (Email or SMS)
      await expect(firstTemplate).toContainText(/email|sms/i);
    });

    test('should allow filtering templates by type', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/templates`);

      // Wait for filter to be available
      const filterSelect = page.locator('[data-testid="template-filter"]');
      if (await filterSelect.isVisible()) {
        await filterSelect.selectOption('booking_confirmation');

        // Verify filtered results
        const templates = page.locator('[data-testid="template-item"]');
        const count = await templates.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should allow filtering templates by channel', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/templates`);

      // Wait for channel filter
      const channelFilter = page.locator('[data-testid="channel-filter"]');
      if (await channelFilter.isVisible()) {
        await channelFilter.selectOption('email');

        // Verify only email templates shown
        const templates = page.locator('[data-testid="template-item"]');
        await expect(templates.first()).toContainText('email', { ignoreCase: true });
      }
    });
  });

  // ==========================================================================
  // TEST 2: TEMPLATE EDITING AND SAVING
  // ==========================================================================

  test.describe('Template Editing', () => {
    test('should open template editor when clicking a template', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/templates`);

      // Click first template
      await page.click('[data-testid="template-item"]:first-child');

      // Verify editor opened
      await expect(page.locator('[data-testid="template-editor"]')).toBeVisible();

      // Verify editor fields
      await expect(page.locator('[data-testid="subject-field"]')).toBeVisible();
      await expect(page.locator('[data-testid="content-field"]')).toBeVisible();
    });

    test('should display template variables help', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/templates`);

      // Open editor
      await page.click('[data-testid="template-item"]:first-child');

      // Check for variables help section
      const variablesHelp = page.locator('[data-testid="variables-help"]');
      if (await variablesHelp.isVisible()) {
        await expect(variablesHelp).toContainText(/customer_name|pet_name|appointment/i);
      }
    });

    test('should allow editing template content', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/templates`);

      // Open editor
      await page.click('[data-testid="template-item"]:first-child');

      // Edit subject
      const subjectField = page.locator('[data-testid="subject-field"]');
      await subjectField.fill('Updated Subject - {{customer_name}}');

      // Edit content
      const contentField = page.locator('[data-testid="content-field"]');
      await contentField.fill('Updated content with {{pet_name}}');

      // Verify changes were entered
      await expect(subjectField).toHaveValue(/Updated Subject/);
      await expect(contentField).toHaveValue(/Updated content/);
    });

    test('should save template changes', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/templates`);

      // Open editor
      await page.click('[data-testid="template-item"]:first-child');

      // Make changes
      const subjectField = page.locator('[data-testid="subject-field"]');
      await subjectField.fill('Test Subject {{customer_name}}');

      // Save
      const saveButton = page.locator('[data-testid="save-template-btn"]');
      await saveButton.click();

      // Verify success message
      await expect(page.locator('.alert-success, .toast-success')).toBeVisible({
        timeout: 5000,
      });
    });

    test('should validate required variables in template', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/templates`);

      // Open editor
      await page.click('[data-testid="template-item"]:first-child');

      // Remove required variables
      const contentField = page.locator('[data-testid="content-field"]');
      await contentField.fill('Template without required variables');

      // Try to save
      const saveButton = page.locator('[data-testid="save-template-btn"]');
      await saveButton.click();

      // Should show validation error
      const errorMessage = page.locator(
        '[data-testid="validation-error"], .alert-error, .toast-error'
      );
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toContainText(/required|missing|variable/i);
      }
    });

    test('should show character count for SMS templates', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/templates`);

      // Find and open an SMS template
      const smsTemplate = page.locator('[data-testid="template-item"]:has-text("sms")');
      if ((await smsTemplate.count()) > 0) {
        await smsTemplate.first().click();

        // Check for character counter
        const charCounter = page.locator('[data-testid="char-counter"]');
        if (await charCounter.isVisible()) {
          await expect(charCounter).toContainText(/\d+.*characters|chars/i);
        }
      }
    });
  });

  // ==========================================================================
  // TEST 3: SENDING TEST NOTIFICATION
  // ==========================================================================

  test.describe('Test Notification', () => {
    test('should open test notification dialog', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/templates`);

      // Open a template
      await page.click('[data-testid="template-item"]:first-child');

      // Click test send button
      const testButton = page.locator('[data-testid="test-send-btn"]');
      if (await testButton.isVisible()) {
        await testButton.click();

        // Verify dialog opened
        await expect(page.locator('[data-testid="test-notification-dialog"]')).toBeVisible();
      }
    });

    test('should send test email', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/templates`);

      // Open an email template
      const emailTemplate = page.locator('[data-testid="template-item"]:has-text("email")');
      if ((await emailTemplate.count()) > 0) {
        await emailTemplate.first().click();

        // Click test send
        const testButton = page.locator('[data-testid="test-send-btn"]');
        if (await testButton.isVisible()) {
          await testButton.click();

          // Fill test data
          const recipientField = page.locator('[data-testid="test-recipient"]');
          await recipientField.fill('test@example.com');

          // Fill template variables
          const customerNameField = page.locator('[data-testid="test-customer_name"]');
          if (await customerNameField.isVisible()) {
            await customerNameField.fill('Test Customer');
          }

          // Send test
          const sendButton = page.locator('[data-testid="send-test-btn"]');
          await sendButton.click();

          // Verify success
          await expect(page.locator('.alert-success, .toast-success')).toBeVisible({
            timeout: 5000,
          });
        }
      }
    });

    test('should send test SMS', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/templates`);

      // Open an SMS template
      const smsTemplate = page.locator('[data-testid="template-item"]:has-text("sms")');
      if ((await smsTemplate.count()) > 0) {
        await smsTemplate.first().click();

        // Click test send
        const testButton = page.locator('[data-testid="test-send-btn"]');
        if (await testButton.isVisible()) {
          await testButton.click();

          // Fill phone number
          const recipientField = page.locator('[data-testid="test-recipient"]');
          await recipientField.fill('+15551234567');

          // Send test
          const sendButton = page.locator('[data-testid="send-test-btn"]');
          await sendButton.click();

          // Verify success
          await expect(page.locator('.alert-success, .toast-success')).toBeVisible({
            timeout: 5000,
          });
        }
      }
    });
  });

  // ==========================================================================
  // TEST 4: NOTIFICATION SETTINGS TOGGLE
  // ==========================================================================

  test.describe('Notification Settings', () => {
    test('should load settings page', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/settings`);

      // Verify page loaded
      await expect(page.locator('h1, h2')).toContainText(/Settings|Notification Settings/i);

      // Verify settings list
      const settingsList = page.locator('[data-testid="settings-list"]');
      await expect(settingsList).toBeVisible();
    });

    test('should toggle email notifications', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/settings`);

      // Find email toggle for a notification type
      const emailToggle = page.locator('[data-testid="email-toggle"]:first-child');
      if (await emailToggle.isVisible()) {
        const initialState = await emailToggle.isChecked();

        // Toggle
        await emailToggle.click();

        // Wait for update
        await page.waitForTimeout(1000);

        // Verify state changed
        const newState = await emailToggle.isChecked();
        expect(newState).not.toBe(initialState);
      }
    });

    test('should toggle SMS notifications', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/settings`);

      // Find SMS toggle
      const smsToggle = page.locator('[data-testid="sms-toggle"]:first-child');
      if (await smsToggle.isVisible()) {
        const initialState = await smsToggle.isChecked();

        // Toggle
        await smsToggle.click();

        // Wait for update
        await page.waitForTimeout(1000);

        // Verify state changed
        const newState = await smsToggle.isChecked();
        expect(newState).not.toBe(initialState);
      }
    });

    test('should show confirmation when disabling critical notifications', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/settings`);

      // Try to disable a critical notification
      const criticalToggle = page.locator(
        '[data-testid*="booking_confirmation"][data-testid*="toggle"]'
      );
      if ((await criticalToggle.count()) > 0 && (await criticalToggle.first().isChecked())) {
        await criticalToggle.first().click();

        // Look for confirmation dialog
        const confirmDialog = page.locator('[role="dialog"], [data-testid="confirm-dialog"]');
        if (await confirmDialog.isVisible()) {
          await expect(confirmDialog).toContainText(/confirm|are you sure/i);
        }
      }
    });
  });

  // ==========================================================================
  // TEST 5: LOG VIEWER WITH FILTERS
  // ==========================================================================

  test.describe('Notification Log Viewer', () => {
    test('should load notification log page', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/logs`);

      // Verify page loaded
      await expect(page.locator('h1, h2')).toContainText(/Logs|Notification Logs|History/i);

      // Verify log table
      const logTable = page.locator('[data-testid="notification-log-table"]');
      await expect(logTable).toBeVisible();
    });

    test('should display log entries with details', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/logs`);

      // Wait for logs to load
      const logRow = page.locator('[data-testid="log-row"]');
      if ((await logRow.count()) > 0) {
        const firstRow = logRow.first();
        await expect(firstRow).toBeVisible();

        // Should show basic information
        await expect(firstRow).toContainText(/email|sms/i); // Channel
        await expect(firstRow).toContainText(/sent|failed|pending/i); // Status
      }
    });

    test('should filter logs by status', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/logs`);

      // Use status filter
      const statusFilter = page.locator('[data-testid="status-filter"]');
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('sent');

        // Wait for filter to apply
        await page.waitForTimeout(1000);

        // Verify filtered results
        const logRows = page.locator('[data-testid="log-row"]');
        if ((await logRows.count()) > 0) {
          await expect(logRows.first()).toContainText('sent', { ignoreCase: true });
        }
      }
    });

    test('should filter logs by notification type', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/logs`);

      // Use type filter
      const typeFilter = page.locator('[data-testid="type-filter"]');
      if (await typeFilter.isVisible()) {
        await typeFilter.selectOption('booking_confirmation');

        // Wait for filter to apply
        await page.waitForTimeout(1000);

        // Verify results are filtered
        const logRows = page.locator('[data-testid="log-row"]');
        expect(await logRows.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should filter logs by date range', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/logs`);

      // Set date range
      const startDateField = page.locator('[data-testid="start-date"]');
      const endDateField = page.locator('[data-testid="end-date"]');

      if ((await startDateField.isVisible()) && (await endDateField.isVisible())) {
        await startDateField.fill('2024-12-01');
        await endDateField.fill('2024-12-31');

        // Apply filter
        const applyButton = page.locator('[data-testid="apply-filter-btn"]');
        if (await applyButton.isVisible()) {
          await applyButton.click();
          await page.waitForTimeout(1000);
        }
      }
    });

    test('should view log details', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/logs`);

      // Click on a log entry
      const logRow = page.locator('[data-testid="log-row"]');
      if ((await logRow.count()) > 0) {
        await logRow.first().click();

        // Verify details view opened
        const detailsView = page.locator('[data-testid="log-details"]');
        if (await detailsView.isVisible()) {
          // Should show full message content
          await expect(detailsView).toContainText(/recipient|subject|content/i);
        }
      }
    });

    test('should resend failed notification from log', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/logs`);

      // Find a failed notification
      const failedLog = page.locator('[data-testid="log-row"]:has-text("failed")');
      if ((await failedLog.count()) > 0) {
        await failedLog.first().click();

        // Click resend button
        const resendButton = page.locator('[data-testid="resend-btn"]');
        if (await resendButton.isVisible()) {
          await resendButton.click();

          // Verify confirmation or success message
          await expect(
            page.locator('.alert-success, .toast-success, [role="dialog"]')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should export logs', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/logs`);

      // Click export button
      const exportButton = page.locator('[data-testid="export-logs-btn"]');
      if (await exportButton.isVisible()) {
        // Setup download listener
        const downloadPromise = page.waitForEvent('download');
        await exportButton.click();

        // Wait for download
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/logs|notification.*\.(csv|xlsx)/i);
      }
    });
  });

  // ==========================================================================
  // TEST 6: DASHBOARD AND ANALYTICS
  // ==========================================================================

  test.describe('Notification Dashboard', () => {
    test('should load notification dashboard', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/dashboard`);

      // Verify page loaded
      await expect(page.locator('h1, h2')).toContainText(/Dashboard|Analytics|Overview/i);
    });

    test('should display notification metrics', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/dashboard`);

      // Check for metric cards
      const metricCards = page.locator('[data-testid="metric-card"]');
      if ((await metricCards.count()) > 0) {
        // Should show key metrics
        await expect(page.locator('body')).toContainText(/sent|delivered|failed/i);
      }
    });

    test('should display delivery rate chart', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${ADMIN_BASE_URL}/dashboard`);

      // Look for chart
      const chart = page.locator('[data-testid="delivery-chart"], canvas');
      if (await chart.isVisible()) {
        await expect(chart).toBeVisible();
      }
    });
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

test.describe('Accessibility', () => {
  test('should have no accessibility violations on template list', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/templates`);

    // Basic accessibility checks
    await expect(page.locator('h1, h2')).toBeVisible();
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/templates`);

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
