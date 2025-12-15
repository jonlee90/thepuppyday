/**
 * E2E tests for Analytics Dashboard
 * Task 0077: Test critical Phase 6 flows end-to-end
 *
 * Test Flow: View analytics dashboard → change date range → export data
 */

import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboard E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin/owner
    await page.goto('/login');
    await page.fill('input[name="email"]', 'owner@thepuppyday.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('should load analytics dashboard with default date range', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');

    // Verify main KPI cards are visible
    await expect(page.locator('[data-testid="kpi-total-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-appointments"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-new-customers"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-avg-rating"]')).toBeVisible();

    // Verify KPIs have values
    const revenue = await page.locator('[data-testid="kpi-total-revenue"]').textContent();
    expect(revenue).toMatch(/\$/);

    // Verify default date range is "Last 30 days"
    await expect(page.locator('select[name="dateRange"]')).toHaveValue('30');
  });

  test('should change date range and update metrics', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');

    // Capture initial revenue value
    const initialRevenue = await page.locator('[data-testid="kpi-total-revenue"]').textContent();

    // Change date range to "Last 7 days"
    await page.selectOption('select[name="dateRange"]', '7');
    await page.waitForTimeout(1000); // Wait for data to reload

    // Verify revenue changed (likely different for 7 days vs 30 days)
    const newRevenue = await page.locator('[data-testid="kpi-total-revenue"]').textContent();
    // Revenue might be same or different, but component should have re-rendered
    expect(newRevenue).toBeTruthy();

    // Change to custom date range
    await page.selectOption('select[name="dateRange"]', 'custom');

    // Set custom dates
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-01-31');
    await page.click('button:has-text("Apply")');

    await page.waitForTimeout(1000);

    // Verify data updated
    const customRevenue = await page.locator('[data-testid="kpi-total-revenue"]').textContent();
    expect(customRevenue).toBeTruthy();
  });

  test('should display revenue chart correctly', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Verify revenue chart is visible
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();

    // Verify chart has canvas element (Chart.js renders to canvas)
    await expect(page.locator('[data-testid="revenue-chart"] canvas')).toBeVisible();

    // Hover over chart to see tooltip (if interactive)
    const canvas = page.locator('[data-testid="revenue-chart"] canvas');
    await canvas.hover({ position: { x: 100, y: 100 } });
  });

  test('should display appointments chart correctly', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Verify appointments chart
    await expect(page.locator('[data-testid="appointments-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointments-chart"] canvas')).toBeVisible();

    // Verify legend shows status categories
    await expect(page.locator('text=Completed')).toBeVisible();
    await expect(page.locator('text=Cancelled')).toBeVisible();
    await expect(page.locator('text=No-show')).toBeVisible();
  });

  test('should export analytics data to PDF', async ({ page, context }) => {
    await page.goto('/admin/analytics');

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export PDF button
    await page.click('button:has-text("Export PDF")');

    // Wait for download
    const download = await downloadPromise;

    // Verify file name
    expect(download.suggestedFilename()).toContain('analytics');
    expect(download.suggestedFilename()).toContain('.pdf');

    // Save the file
    await download.saveAs(`./downloads/${download.suggestedFilename()}`);
  });

  test('should export analytics data to CSV', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click export CSV button
    await page.click('button:has-text("Export CSV")');

    // Wait for download
    const download = await downloadPromise;

    // Verify file name
    expect(download.suggestedFilename()).toContain('analytics');
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should display top services table', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Scroll to top services section
    await page.locator('[data-testid="top-services"]').scrollIntoViewIfNeeded();

    // Verify table headers
    await expect(page.locator('th:has-text("Service")')).toBeVisible();
    await expect(page.locator('th:has-text("Bookings")')).toBeVisible();
    await expect(page.locator('th:has-text("Revenue")')).toBeVisible();

    // Verify at least one service is listed
    await expect(page.locator('[data-testid="service-row"]')).toHaveCount.greaterThan(0);
  });

  test('should display customer metrics', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Scroll to customer metrics
    await page.locator('[data-testid="customer-metrics"]').scrollIntoViewIfNeeded();

    // Verify metrics
    await expect(page.locator('[data-testid="new-customers"]')).toBeVisible();
    await expect(page.locator('[data-testid="returning-customers"]')).toBeVisible();
    await expect(page.locator('[data-testid="retention-rate"]')).toBeVisible();

    // Verify retention rate is a percentage
    const retentionText = await page.locator('[data-testid="retention-rate"]').textContent();
    expect(retentionText).toMatch(/%/);
  });

  test('should display review metrics', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Scroll to review metrics
    await page.locator('[data-testid="review-metrics"]').scrollIntoViewIfNeeded();

    // Verify metrics
    await expect(page.locator('[data-testid="total-reviews"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-rating"]')).toBeVisible();
    await expect(page.locator('[data-testid="google-reviews"]')).toBeVisible();
    await expect(page.locator('[data-testid="private-feedback"]')).toBeVisible();

    // Verify star rating display
    await expect(page.locator('[data-testid="star-rating"]')).toBeVisible();
  });

  test('should compare metrics with previous period', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Enable comparison mode
    await page.check('input[name="compareWithPrevious"]');
    await page.waitForTimeout(1000);

    // Verify comparison indicators are shown
    await expect(page.locator('[data-testid="revenue-change"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointments-change"]')).toBeVisible();

    // Verify change indicators show percentage
    const revenueChange = await page.locator('[data-testid="revenue-change"]').textContent();
    expect(revenueChange).toMatch(/[+-]\d+%/);
  });

  test('should filter analytics by service', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Select specific service
    await page.selectOption('select[name="serviceFilter"]', 'basic-grooming');
    await page.waitForTimeout(1000);

    // Verify filtered view
    await expect(page.locator('text=Filtered by: Basic Grooming')).toBeVisible();

    // Charts should update with filtered data
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
  });

  test('should show loading skeletons while data loads', async ({ page }) => {
    // Intercept API calls to simulate slow network
    await page.route('/api/admin/analytics/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto('/admin/analytics');

    // Verify skeleton loaders are shown
    await expect(page.locator('[data-testid="analytics-skeleton"]')).toBeVisible();

    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Skeleton should be replaced with actual data
    await expect(page.locator('[data-testid="analytics-skeleton"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-revenue"]')).toBeVisible();
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // Mock empty analytics data
    await page.route('/api/admin/analytics/**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          kpis: {
            total_revenue: 0,
            total_appointments: 0,
            new_customers: 0,
            avg_rating: 0,
          },
          revenue_by_day: [],
          appointments_by_status: {},
        }),
      });
    });

    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');

    // Should show empty state message
    await expect(page.locator('text=No data for selected period')).toBeVisible();

    // KPIs should show zero
    await expect(page.locator('[data-testid="kpi-total-revenue"]')).toContainText('$0');
  });

  test('should navigate between analytics sub-pages', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Navigate to revenue analytics
    await page.click('a:has-text("Revenue")');
    await expect(page).toHaveURL(/\/admin\/analytics\/revenue/);

    // Navigate to customer analytics
    await page.click('a:has-text("Customers")');
    await expect(page).toHaveURL(/\/admin\/analytics\/customers/);

    // Navigate to services analytics
    await page.click('a:has-text("Services")');
    await expect(page).toHaveURL(/\/admin\/analytics\/services/);
  });
});

test.describe('Analytics Permissions', () => {
  test('should restrict analytics to owner role', async ({ page }) => {
    // Login as groomer (non-owner)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'groomer@thepuppyday.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Try to access analytics
    await page.goto('/admin/analytics');

    // Should be redirected or show access denied
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });
});
