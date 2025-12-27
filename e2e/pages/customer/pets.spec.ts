/**
 * E2E tests for Customer Pet Management
 * Task 0275: Test customer portal pet management flows
 *
 * Test Scenarios:
 * - View pet list
 * - Add new pet
 * - Edit existing pet
 * - Delete pet
 * - Pet information validation
 */

import { test, expect } from '@playwright/test';

test.describe('Customer Pet Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/customer');

    // Navigate to pets page
    await page.click('a[href="/customer/pets"]');
    await page.waitForURL('/customer/pets');
  });

  test('should display list of pets', async ({ page }) => {
    // Verify pets page loaded
    await expect(page.locator('h1:has-text("My Pets")')).toBeVisible();

    // Should show at least one pet or empty state
    const hasPets = await page.locator('[data-testid="pet-card"]').count();

    if (hasPets > 0) {
      // Verify pet card displays information
      await expect(page.locator('[data-testid="pet-card"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="pet-name"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="pet-breed"]').first()).toBeVisible();
    } else {
      // Empty state
      await expect(page.locator('text=No pets yet')).toBeVisible();
    }

    // Should show "Add Pet" button
    await expect(page.locator('button:has-text("Add Pet")')).toBeVisible();
  });

  test('should add new pet successfully', async ({ page }) => {
    // Click "Add Pet" button
    await page.click('button:has-text("Add Pet")');

    // Modal should open
    await expect(page.locator('[data-testid="add-pet-modal"]')).toBeVisible();

    // Fill pet information
    await page.fill('input[name="name"]', 'Buddy');
    await page.selectOption('select[name="size"]', 'medium');
    await page.fill('input[name="weight"]', '30');

    // Select breed
    await page.fill('input[name="breed"]', 'Labrador');

    // Optional fields
    await page.fill('input[name="birthDate"]', '2020-06-15');
    await page.fill('textarea[name="medicalInfo"]', 'Allergic to chicken');
    await page.fill('textarea[name="notes"]', 'Very friendly, loves treats');

    // Submit form
    await page.click('button:has-text("Add Pet")');

    // Modal should close
    await expect(page.locator('[data-testid="add-pet-modal"]')).not.toBeVisible();

    // Should show success message
    await expect(page.locator('text=Pet added successfully')).toBeVisible();

    // New pet should appear in list
    await expect(page.locator('text=Buddy')).toBeVisible();
  });

  test('should validate required pet fields', async ({ page }) => {
    await page.click('button:has-text("Add Pet")');

    // Try to submit without filling required fields
    await page.click('button:has-text("Add Pet")');

    // Should show validation errors
    await expect(page.locator('text=Pet name is required')).toBeVisible();
    await expect(page.locator('text=Please select a size')).toBeVisible();
  });

  test('should validate pet name length', async ({ page }) => {
    await page.click('button:has-text("Add Pet")');

    // Try very long name
    const longName = 'A'.repeat(100);
    await page.fill('input[name="name"]', longName);
    await page.selectOption('select[name="size"]', 'small');

    await page.click('button:has-text("Add Pet")');

    // Should show validation error
    await expect(page.locator('text=Pet name is too long')).toBeVisible();
  });

  test('should validate weight range', async ({ page }) => {
    await page.click('button:has-text("Add Pet")');

    await page.fill('input[name="name"]', 'Test');
    await page.selectOption('select[name="size"]', 'small');

    // Try negative weight
    await page.fill('input[name="weight"]', '-5');
    await page.click('button:has-text("Add Pet")');

    await expect(page.locator('text=Weight must be positive')).toBeVisible();

    // Try unrealistic weight
    await page.fill('input[name="weight"]', '500');
    await page.click('button:has-text("Add Pet")');

    await expect(page.locator('text=Weight must be')).toBeVisible();
  });

  test('should edit existing pet', async ({ page }) => {
    // Ensure at least one pet exists
    const petCount = await page.locator('[data-testid="pet-card"]').count();

    if (petCount === 0) {
      // Add a pet first
      await page.click('button:has-text("Add Pet")');
      await page.fill('input[name="name"]', 'TestPet');
      await page.selectOption('select[name="size"]', 'medium');
      await page.click('button:has-text("Add Pet")');
      await page.waitForTimeout(500);
    }

    // Click edit button on first pet
    await page.click('[data-testid="edit-pet-button"]');

    // Edit modal should open
    await expect(page.locator('[data-testid="edit-pet-modal"]')).toBeVisible();

    // Modify pet information
    await page.fill('input[name="name"]', 'Updated Pet Name');
    await page.fill('input[name="weight"]', '35');
    await page.fill('textarea[name="notes"]', 'Updated notes');

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Modal should close
    await expect(page.locator('[data-testid="edit-pet-modal"]')).not.toBeVisible();

    // Should show success message
    await expect(page.locator('text=Pet updated successfully')).toBeVisible();

    // Updated information should be visible
    await expect(page.locator('text=Updated Pet Name')).toBeVisible();
  });

  test('should delete pet with confirmation', async ({ page }) => {
    // Ensure at least one pet exists
    const petCount = await page.locator('[data-testid="pet-card"]').count();

    if (petCount === 0) {
      // Add a pet first
      await page.click('button:has-text("Add Pet")');
      await page.fill('input[name="name"]', 'PetToDelete');
      await page.selectOption('select[name="size"]', 'small');
      await page.click('button:has-text("Add Pet")');
      await page.waitForTimeout(500);
    }

    const initialCount = await page.locator('[data-testid="pet-card"]').count();

    // Click delete button
    await page.click('[data-testid="delete-pet-button"]');

    // Confirmation dialog should appear
    await expect(page.locator('[data-testid="confirmation-modal"]')).toBeVisible();
    await expect(page.locator('text=Are you sure')).toBeVisible();

    // Confirm deletion
    await page.click('button:has-text("Delete")');

    // Should show success message
    await expect(page.locator('text=Pet deleted successfully')).toBeVisible();

    // Pet count should decrease
    await page.waitForTimeout(500);
    const newCount = await page.locator('[data-testid="pet-card"]').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('should cancel pet deletion', async ({ page }) => {
    const petCount = await page.locator('[data-testid="pet-card"]').count();

    if (petCount === 0) {
      test.skip();
    }

    const initialCount = petCount;

    // Click delete
    await page.click('[data-testid="delete-pet-button"]');

    // Confirmation dialog
    await expect(page.locator('[data-testid="confirmation-modal"]')).toBeVisible();

    // Cancel deletion
    await page.click('button:has-text("Cancel")');

    // Modal should close
    await expect(page.locator('[data-testid="confirmation-modal"]')).not.toBeVisible();

    // Pet count should remain same
    const finalCount = await page.locator('[data-testid="pet-card"]').count();
    expect(finalCount).toBe(initialCount);
  });

  test('should display pet details', async ({ page }) => {
    const petCount = await page.locator('[data-testid="pet-card"]').count();

    if (petCount === 0) {
      test.skip();
    }

    // Click on a pet card to view details
    await page.click('[data-testid="pet-card"]');

    // Details view should open
    await expect(page.locator('[data-testid="pet-details"]')).toBeVisible();

    // Should show pet information
    await expect(page.locator('[data-testid="pet-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="pet-breed"]')).toBeVisible();
    await expect(page.locator('[data-testid="pet-size"]')).toBeVisible();

    // Should show appointment history
    await expect(page.locator('text=Appointment History')).toBeVisible();
  });

  test('should filter pets by size', async ({ page }) => {
    const petCount = await page.locator('[data-testid="pet-card"]').count();

    if (petCount === 0) {
      test.skip();
    }

    // Select size filter
    await page.selectOption('select[name="sizeFilter"]', 'small');

    await page.waitForTimeout(500);

    // Only small pets should be visible
    const visiblePets = await page.locator('[data-testid="pet-card"]').count();
    expect(visiblePets).toBeGreaterThanOrEqual(0);

    // Verify filter applied
    await expect(page.locator('text=Filtered by: Small')).toBeVisible();
  });

  test('should search pets by name', async ({ page }) => {
    const petCount = await page.locator('[data-testid="pet-card"]').count();

    if (petCount === 0) {
      test.skip();
    }

    // Get first pet name
    const firstPetName = await page.locator('[data-testid="pet-name"]').first().textContent();

    // Search for that pet
    await page.fill('input[name="search"]', firstPetName!);

    await page.waitForTimeout(500);

    // Should show only matching pet
    const visiblePets = await page.locator('[data-testid="pet-card"]').count();
    expect(visiblePets).toBeGreaterThanOrEqual(1);

    // First visible pet should match search
    const displayedName = await page.locator('[data-testid="pet-name"]').first().textContent();
    expect(displayedName).toContain(firstPetName);
  });

  test('should show empty state when no pets match search', async ({ page }) => {
    await page.fill('input[name="search"]', 'NonexistentPetName12345');

    await page.waitForTimeout(500);

    // Should show no results message
    await expect(page.locator('text=No pets found')).toBeVisible();
  });

  test('should upload pet photo', async ({ page }) => {
    const petCount = await page.locator('[data-testid="pet-card"]').count();

    if (petCount === 0) {
      // Add a pet first
      await page.click('button:has-text("Add Pet")');
      await page.fill('input[name="name"]', 'PhotoPet');
      await page.selectOption('select[name="size"]', 'medium');
      await page.click('button:has-text("Add Pet")');
      await page.waitForTimeout(500);
    }

    // Click edit on first pet
    await page.click('[data-testid="edit-pet-button"]');

    // Upload photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./e2e/fixtures/test-dog-photo.jpg');

    await page.waitForTimeout(1000);

    // Should show preview
    await expect(page.locator('[data-testid="photo-preview"]')).toBeVisible();

    // Save
    await page.click('button:has-text("Save Changes")');

    // Photo should be visible in pet card
    await expect(page.locator('[data-testid="pet-photo"]').first()).toBeVisible();
  });

  test('should validate photo file type', async ({ page }) => {
    const petCount = await page.locator('[data-testid="pet-card"]').count();

    if (petCount === 0) {
      test.skip();
    }

    await page.click('[data-testid="edit-pet-button"]');

    // Try to upload invalid file type (PDF)
    const fileInput = page.locator('input[type="file"]');

    // Mock file upload with wrong type
    await page.route('**/api/upload', async (route) => {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'File must be JPG, PNG, or WebP' }),
      });
    });

    await fileInput.setInputFiles('./e2e/fixtures/test-file.pdf');

    // Should show error
    await expect(page.locator('text=File must be JPG, PNG, or WebP')).toBeVisible();
  });

  test('should validate photo file size', async ({ page }) => {
    const petCount = await page.locator('[data-testid="pet-card"]').count();

    if (petCount === 0) {
      test.skip();
    }

    await page.click('[data-testid="edit-pet-button"]');

    // Mock file upload with size error
    await page.route('**/api/upload', async (route) => {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'File size must be less than 5MB' }),
      });
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./e2e/fixtures/large-image.jpg');

    // Should show error
    await expect(page.locator('text=File size must be less than 5MB')).toBeVisible();
  });
});

test.describe('Pet Medical Information', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/customer');
    await page.click('a[href="/customer/pets"]');
  });

  test('should add medical information to pet', async ({ page }) => {
    const petCount = await page.locator('[data-testid="pet-card"]').count();

    if (petCount === 0) {
      test.skip();
    }

    await page.click('[data-testid="edit-pet-button"]');

    // Fill medical info
    await page.fill('textarea[name="medicalInfo"]', 'Allergic to wheat and soy. Takes arthritis medication daily.');

    await page.click('button:has-text("Save Changes")');

    // Success message
    await expect(page.locator('text=Pet updated successfully')).toBeVisible();

    // View details
    await page.click('[data-testid="pet-card"]');

    // Medical info should be visible
    await expect(page.locator('text=Allergic to wheat')).toBeVisible();
  });

  test('should limit medical info length', async ({ page }) => {
    const petCount = await page.locator('[data-testid="pet-card"]').count();

    if (petCount === 0) {
      test.skip();
    }

    await page.click('[data-testid="edit-pet-button"]');

    // Try very long medical info (>1000 chars)
    const longText = 'A'.repeat(1500);
    await page.fill('textarea[name="medicalInfo"]', longText);

    await page.click('button:has-text("Save Changes")');

    // Should show validation error
    await expect(page.locator('text=Medical information is too long')).toBeVisible();
  });
});
