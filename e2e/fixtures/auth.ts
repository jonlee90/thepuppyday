/**
 * Authentication Test Fixtures
 * Task 0272: Create E2E test fixtures and utilities
 *
 * Helper functions for authentication in E2E tests
 */

import { Page } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  role: 'customer' | 'groomer' | 'admin';
}

export const TEST_USERS: Record<string, TestUser> = {
  customer: {
    email: 'customer@test.com',
    password: 'TestPassword123!',
    role: 'customer',
  },
  groomer: {
    email: 'groomer@test.com',
    password: 'TestPassword123!',
    role: 'groomer',
  },
  admin: {
    email: 'admin@test.com',
    password: 'TestPassword123!',
    role: 'admin',
  },
};

/**
 * Login as a customer
 */
export async function loginAsCustomer(page: Page) {
  await login(page, TEST_USERS.customer);
}

/**
 * Login as a groomer
 */
export async function loginAsGroomer(page: Page) {
  await login(page, TEST_USERS.groomer);
}

/**
 * Login as an admin
 */
export async function loginAsAdmin(page: Page) {
  await login(page, TEST_USERS.admin);
}

/**
 * Generic login function
 */
export async function login(page: Page, user: TestUser) {
  await page.goto('/login');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');

  // Wait for navigation after login
  await page.waitForURL((url) => !url.pathname.includes('/login'));
}

/**
 * Logout
 */
export async function logout(page: Page) {
  // Click user menu or logout button
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');

  // Wait for redirect to login/home
  await page.waitForURL((url) =>
    url.pathname === '/' || url.pathname.includes('/login')
  );
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}
