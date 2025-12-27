/**
 * Test PetStep loading fix in admin/walkin mode
 * Verifies that selecting an existing customer loads their pets correctly
 */

import { chromium } from '@playwright/test';

async function testPetStepAdmin() {
  console.log('🧪 Testing PetStep loading in admin mode...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to admin dashboard
    console.log('1️⃣ Navigating to admin dashboard...');
    await page.goto('http://localhost:3000/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // Click Walk In button
    console.log('2️⃣ Opening Walk-In booking modal...');
    const walkInButton = page.locator('button:has-text("Walk In")');
    await walkInButton.click();
    await page.waitForTimeout(1000);

    // Step 1: Customer Selection - Search for existing customer
    console.log('3️⃣ Searching for existing customer...');
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="customer" i]').first();
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    // Select first customer from search results
    console.log('4️⃣ Selecting customer from search results...');
    const firstCustomer = page.locator('[role="option"], .customer-option, button:has-text("@")').first();
    await firstCustomer.click();
    await page.waitForTimeout(500);

    // Click Continue to go to Pet step
    console.log('5️⃣ Navigating to Pet step...');
    const continueButton = page.locator('button:has-text("Continue"), button:has-text("Select Pet")').first();
    await continueButton.click();
    await page.waitForTimeout(2000);

    // Check if PetStep loaded correctly
    console.log('6️⃣ Checking if Pet step loaded...');

    // Wait for loading to complete (skeletons should disappear)
    const hasSkeletons = await page.locator('.skeleton').count();
    console.log(`   - Found ${hasSkeletons} skeleton loaders`);

    if (hasSkeletons > 0) {
      console.log('⏳ Waiting for loading to complete...');
      await page.waitForTimeout(3000);

      const stillHasSkeletons = await page.locator('.skeleton').count();
      if (stillHasSkeletons > 0) {
        console.error('❌ FAILED: PetStep still stuck loading after 3 seconds');
        console.error(`   Still showing ${stillHasSkeletons} skeleton loaders`);
        await page.screenshot({ path: 'petstep-stuck-loading.png', fullPage: true });
        console.log('   Screenshot saved to petstep-stuck-loading.png');
        return false;
      }
    }

    // Check for actual pet cards or "Add New Pet" button
    const hasPetCards = await page.locator('button:has-text("Add New Pet"), .pet-card, button:has-text("Select this pet")').count();
    console.log(`   - Found ${hasPetCards} pet options`);

    if (hasPetCards > 0) {
      console.log('✅ SUCCESS: Pet step loaded correctly!');
      console.log('   Pets are displayed and selectable');
      await page.screenshot({ path: 'petstep-loaded-success.png', fullPage: true });
      console.log('   Screenshot saved to petstep-loaded-success.png');
      return true;
    } else {
      console.error('❌ FAILED: No pet options found');
      await page.screenshot({ path: 'petstep-no-pets.png', fullPage: true });
      console.log('   Screenshot saved to petstep-no-pets.png');
      return false;
    }

  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: 'petstep-error.png', fullPage: true });
    console.log('   Screenshot saved to petstep-error.png');
    return false;
  } finally {
    await page.waitForTimeout(2000); // Keep browser open briefly
    await browser.close();
  }
}

// Run test
testPetStepAdmin().then((success) => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ PetStep admin mode test PASSED');
  } else {
    console.log('❌ PetStep admin mode test FAILED');
  }
  console.log('='.repeat(50));
  process.exit(success ? 0 : 1);
});
