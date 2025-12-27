/**
 * E2E tests for Booking Flow
 * Task 0273: Test critical booking flows end-to-end
 *
 * Test Scenarios:
 * - Guest booking flow (service → date → pet → contact → confirm)
 * - Registered customer booking with saved pet
 * - Fully-booked slots with waitlist option
 * - Add-on selection and price calculation
 * - Form validation and error messages
 */

import { test, expect } from '@playwright/test';

test.describe('Booking Flow - Guest Customer', () => {
  test('should complete guest booking flow successfully', async ({ page }) => {
    // Navigate to marketing page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll to trigger sticky booking button
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(500);

    // Click sticky booking button
    await page.click('[data-testid="sticky-booking-button"]');

    // Step 1: Service Selection
    await expect(page.locator('[data-testid="booking-modal"]')).toBeVisible();
    await expect(page.locator('text=Choose Service')).toBeVisible();

    // Select "Basic Grooming" service
    await page.click('[data-testid="service-card-basic-grooming"]');
    await page.click('button:has-text("Continue")');

    // Step 2: Date & Time Selection
    await expect(page.locator('text=Select Date & Time')).toBeVisible();

    // Select date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();
    await page.click(`[data-testid="date-${tomorrowDay}"]`);

    // Select time slot (first available)
    await page.click('[data-testid="time-slot"]:first-child');
    await page.click('button:has-text("Continue")');

    // Step 3: Customer Information (Login/Register for guest)
    await expect(page.locator('text=Customer Information')).toBeVisible();

    // Click "Continue as Guest" or "Book without account"
    await page.click('button:has-text("Continue as Guest")');

    // Fill customer details
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '+15551234567');
    await page.click('button:has-text("Continue")');

    // Step 4: Pet Information
    await expect(page.locator('text=Pet Information')).toBeVisible();

    await page.fill('input[name="petName"]', 'Max');
    await page.selectOption('select[name="size"]', 'medium');
    await page.fill('input[name="weight"]', '25');

    // Optional: Select breed
    await page.fill('input[name="breed"]', 'Golden Retriever');

    await page.click('button:has-text("Continue")');

    // Step 5: Review & Add-ons
    await expect(page.locator('text=Review Booking')).toBeVisible();

    // Verify booking summary
    await expect(page.locator('text=Basic Grooming')).toBeVisible();
    await expect(page.locator('text=Max')).toBeVisible();
    await expect(page.locator('text=john.doe@example.com')).toBeVisible();

    // Select add-ons
    await page.check('[data-testid="addon-nail-trim"]');
    await page.check('[data-testid="addon-teeth-cleaning"]');

    // Verify price calculation
    const totalPrice = await page.locator('[data-testid="total-price"]').textContent();
    expect(totalPrice).toMatch(/\$/);

    // Confirm booking
    await page.click('button:has-text("Confirm Booking")');

    // Step 6: Confirmation
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
    await expect(page.locator('text=Booking Confirmed')).toBeVisible();

    // Verify confirmation details
    await expect(page.locator('text=Max')).toBeVisible();
    await expect(page.locator('[data-testid="booking-reference"]')).toBeVisible();
  });

  test('should validate required fields in guest booking', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(500);

    await page.click('[data-testid="sticky-booking-button"]');

    // Select service and proceed
    await page.click('[data-testid="service-card-basic-grooming"]');
    await page.click('button:has-text("Continue")');

    // Skip date selection and try to continue
    await page.click('button:has-text("Continue")');

    // Should show validation error
    await expect(page.locator('text=Please select a date')).toBeVisible();

    // Select date but not time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();
    await page.click(`[data-testid="date-${tomorrowDay}"]`);
    await page.click('button:has-text("Continue")');

    await expect(page.locator('text=Please select a time')).toBeVisible();
  });

  test('should validate email format in contact step', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(500);

    await page.click('[data-testid="sticky-booking-button"]');

    // Navigate to customer step
    await page.click('[data-testid="service-card-basic-grooming"]');
    await page.click('button:has-text("Continue")');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.click(`[data-testid="date-${tomorrow.getDate()}"]`);
    await page.click('[data-testid="time-slot"]:first-child');
    await page.click('button:has-text("Continue")');

    await page.click('button:has-text("Continue as Guest")');

    // Fill with invalid email
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button:has-text("Continue")');

    // Should show email validation error
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });
});

test.describe('Booking Flow - Registered Customer', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/customer');
  });

  test('should book with saved pet', async ({ page }) => {
    // Navigate to booking from customer portal
    await page.click('[data-testid="new-appointment-button"]');

    // Step 1: Service Selection
    await page.click('[data-testid="service-card-premium-grooming"]');
    await page.click('button:has-text("Continue")');

    // Step 2: Date & Time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.click(`[data-testid="date-${tomorrow.getDate()}"]`);
    await page.click('[data-testid="time-slot"]:first-child');
    await page.click('button:has-text("Continue")');

    // Step 3: Customer - should skip (already logged in)
    // Step 4: Pet Selection - should show saved pets
    await expect(page.locator('text=Select Pet')).toBeVisible();
    await page.click('[data-testid="saved-pet"]:first-child');
    await page.click('button:has-text("Continue")');

    // Step 5: Review
    await expect(page.locator('text=Review Booking')).toBeVisible();

    // Add special instructions
    await page.fill('textarea[name="specialInstructions"]', 'Please be gentle with nails');

    await page.click('button:has-text("Confirm Booking")');

    // Confirmation
    await expect(page.locator('text=Booking Confirmed')).toBeVisible();
  });

  test('should allow adding new pet during booking', async ({ page }) => {
    await page.click('[data-testid="new-appointment-button"]');

    // Navigate to pet step
    await page.click('[data-testid="service-card-basic-grooming"]');
    await page.click('button:has-text("Continue")');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.click(`[data-testid="date-${tomorrow.getDate()}"]`);
    await page.click('[data-testid="time-slot"]:first-child');
    await page.click('button:has-text("Continue")');

    // Click "Add New Pet"
    await page.click('button:has-text("Add New Pet")');

    // Fill new pet details
    await page.fill('input[name="petName"]', 'Bella');
    await page.selectOption('select[name="size"]', 'small');
    await page.fill('input[name="weight"]', '12');
    await page.click('button:has-text("Continue")');

    // Review and confirm
    await expect(page.locator('text=Bella')).toBeVisible();
    await page.click('button:has-text("Confirm Booking")');

    await expect(page.locator('text=Booking Confirmed')).toBeVisible();
  });
});

test.describe('Booking Flow - Add-ons', () => {
  test('should calculate price correctly with add-ons', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(500);

    await page.click('[data-testid="sticky-booking-button"]');

    // Complete booking flow to review step
    await page.click('[data-testid="service-card-basic-grooming"]');
    await page.click('button:has-text("Continue")');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.click(`[data-testid="date-${tomorrow.getDate()}"]`);
    await page.click('[data-testid="time-slot"]:first-child');
    await page.click('button:has-text("Continue")');

    await page.click('button:has-text("Continue as Guest")');
    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="email"]', 'jane@example.com');
    await page.fill('input[name="phone"]', '+15559876543');
    await page.click('button:has-text("Continue")');

    await page.fill('input[name="petName"]', 'Charlie');
    await page.selectOption('select[name="size"]', 'small');
    await page.click('button:has-text("Continue")');

    // Review step - check initial price (service only)
    const basePrice = await page.locator('[data-testid="service-price"]').textContent();
    const basePriceValue = parseFloat(basePrice!.replace('$', ''));

    // Select first add-on
    await page.check('[data-testid="addon-checkbox"]:first-child');
    await page.waitForTimeout(300);

    // Verify price increased
    const newTotal = await page.locator('[data-testid="total-price"]').textContent();
    const newTotalValue = parseFloat(newTotal!.replace('$', ''));
    expect(newTotalValue).toBeGreaterThan(basePriceValue);

    // Uncheck add-on
    await page.uncheck('[data-testid="addon-checkbox"]:first-child');
    await page.waitForTimeout(300);

    // Verify price decreased back
    const finalTotal = await page.locator('[data-testid="total-price"]').textContent();
    expect(finalTotal).toContain(basePriceValue.toFixed(2));
  });

  test('should display add-on descriptions', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(500);

    await page.click('[data-testid="sticky-booking-button"]');

    // Navigate to review step
    await page.click('[data-testid="service-card-basic-grooming"]');
    await page.click('button:has-text("Continue")');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.click(`[data-testid="date-${tomorrow.getDate()}"]`);
    await page.click('[data-testid="time-slot"]:first-child');
    await page.click('button:has-text("Continue")');

    await page.click('button:has-text("Continue as Guest")');
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button:has-text("Continue")');

    await page.fill('input[name="petName"]', 'Buddy');
    await page.selectOption('select[name="size"]', 'medium');
    await page.click('button:has-text("Continue")');

    // Verify add-ons section visible
    await expect(page.locator('text=Add-ons')).toBeVisible();

    // Verify at least one add-on is displayed
    await expect(page.locator('[data-testid="addon-checkbox"]')).toHaveCount.greaterThan(0);
  });
});

test.describe('Booking Flow - Waitlist', () => {
  test('should show waitlist option when slots are full', async ({ page }) => {
    // Mock API to return no available slots
    await page.route('/api/availability*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          available: false,
          slots: [],
        }),
      });
    });

    await page.goto('/');
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(500);

    await page.click('[data-testid="sticky-booking-button"]');

    await page.click('[data-testid="service-card-basic-grooming"]');
    await page.click('button:has-text("Continue")');

    // Select date with no availability
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.click(`[data-testid="date-${tomorrow.getDate()}"]`);

    // Should show "No available slots" message
    await expect(page.locator('text=No available slots')).toBeVisible();

    // Should show waitlist button
    await expect(page.locator('button:has-text("Join Waitlist")')).toBeVisible();
  });

  test('should complete waitlist signup', async ({ page }) => {
    // Mock no availability
    await page.route('/api/availability*', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ available: false, slots: [] }),
      });
    });

    await page.goto('/');
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(500);

    await page.click('[data-testid="sticky-booking-button"]');
    await page.click('[data-testid="service-card-basic-grooming"]');
    await page.click('button:has-text("Continue")');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.click(`[data-testid="date-${tomorrow.getDate()}"]`);

    // Click Join Waitlist
    await page.click('button:has-text("Join Waitlist")');

    // Fill waitlist form
    await expect(page.locator('text=Join Waitlist')).toBeVisible();

    await page.fill('input[name="email"]', 'waitlist@example.com');
    await page.fill('input[name="phone"]', '+15551112222');
    await page.selectOption('select[name="flexibility"]', 'same_week');

    await page.click('button:has-text("Submit")');

    // Verify success message
    await expect(page.locator('text=Added to waitlist')).toBeVisible();
  });
});

test.describe('Booking Flow - Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/bookings', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/');
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(500);

    await page.click('[data-testid="sticky-booking-button"]');

    // Complete booking flow
    await page.click('[data-testid="service-card-basic-grooming"]');
    await page.click('button:has-text("Continue")');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.click(`[data-testid="date-${tomorrow.getDate()}"]`);
    await page.click('[data-testid="time-slot"]:first-child');
    await page.click('button:has-text("Continue")');

    await page.click('button:has-text("Continue as Guest")');
    await page.fill('input[name="firstName"]', 'Error');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'error@test.com');
    await page.click('button:has-text("Continue")');

    await page.fill('input[name="petName"]', 'TestPet');
    await page.selectOption('select[name="size"]', 'medium');
    await page.click('button:has-text("Continue")');

    // Try to confirm booking
    await page.click('button:has-text("Confirm Booking")');

    // Should show error message
    await expect(page.locator('text=Failed to create booking')).toBeVisible();

    // Booking modal should still be open
    await expect(page.locator('[data-testid="booking-modal"]')).toBeVisible();
  });

  test('should prevent booking in the past', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(500);

    await page.click('[data-testid="sticky-booking-button"]');
    await page.click('[data-testid="service-card-basic-grooming"]');
    await page.click('button:has-text("Continue")');

    // Try to select yesterday (should be disabled)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDay = yesterday.getDate();

    const yesterdayButton = page.locator(`[data-testid="date-${yesterdayDay}"]`);

    // Should be disabled or not exist
    const isDisabled = await yesterdayButton.isDisabled().catch(() => true);
    expect(isDisabled).toBe(true);
  });
});

test.describe('Booking Flow - Modal Behavior', () => {
  test('should close modal on cancel', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(500);

    await page.click('[data-testid="sticky-booking-button"]');

    await expect(page.locator('[data-testid="booking-modal"]')).toBeVisible();

    // Click cancel/close button
    await page.click('[data-testid="close-modal"]');

    // Modal should be hidden
    await expect(page.locator('[data-testid="booking-modal"]')).not.toBeVisible();
  });

  test('should allow navigation between steps', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollBy(0, 700));
    await page.waitForTimeout(500);

    await page.click('[data-testid="sticky-booking-button"]');

    // Go to step 2
    await page.click('[data-testid="service-card-basic-grooming"]');
    await page.click('button:has-text("Continue")');

    // Go back to step 1
    await page.click('button:has-text("Back")');

    // Should be back on service selection
    await expect(page.locator('text=Choose Service')).toBeVisible();

    // Service should still be selected
    const selectedService = page.locator('[data-testid="service-card-basic-grooming"][aria-selected="true"]');
    await expect(selectedService).toBeVisible();
  });
});
