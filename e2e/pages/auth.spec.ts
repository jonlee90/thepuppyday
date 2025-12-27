/**
 * E2E tests for Authentication Flows
 * Task 0274: Test authentication flows end-to-end
 *
 * Test Scenarios:
 * - Customer registration flow
 * - Customer login flow
 * - Admin login flow
 * - Session expiration and re-authentication
 * - Password reset flow
 */

import { test, expect } from '@playwright/test';

test.describe('Customer Registration', () => {
  test('should register new customer successfully', async ({ page }) => {
    await page.goto('/register');

    // Fill registration form
    await page.fill('input[name="firstName"]', 'Alice');
    await page.fill('input[name="lastName"]', 'Johnson');
    await page.fill('input[name="email"]', `alice.${Date.now()}@example.com`);
    await page.fill('input[name="phone"]', '+15551234567');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to customer portal
    await page.waitForURL('/customer', { timeout: 5000 });

    // Verify welcome message or customer portal content
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should validate password requirements', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');

    // Try weak password (no uppercase)
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=Password must contain')).toBeVisible();
    await expect(page.locator('text=uppercase')).toBeVisible();
  });

  test('should validate password confirmation match', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');

    await page.click('button[type="submit"]');

    // Should show mismatch error
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');

    await page.click('button[type="submit"]');

    // Should show email validation error
    await expect(page.locator('text=valid email')).toBeVisible();
  });

  test('should validate phone number format', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '123'); // Too short
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');

    await page.click('button[type="submit"]');

    // Should show phone validation error
    await expect(page.locator('text=valid phone')).toBeVisible();
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    const email = 'existing@example.com';

    // Mock API to return email already exists error
    await page.route('/api/auth/register', async (route) => {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'Email already registered' }),
      });
    });

    await page.goto('/register');

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');

    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Email already registered')).toBeVisible();
  });

  test('should show loading state during registration', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', `test.${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');

    // Click submit
    await page.click('button[type="submit"]');

    // Should show loading state
    await expect(page.locator('button[type="submit"]:disabled')).toBeVisible();
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
  });
});

test.describe('Customer Login', () => {
  test('should login customer successfully', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'password123');

    await page.click('button[type="submit"]');

    // Should redirect to customer portal
    await page.waitForURL('/customer');

    // Verify customer portal loaded
    await expect(page.locator('[data-testid="customer-dashboard"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();

    // Should remain on login page
    await expect(page).toHaveURL('/login');
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="password"]', 'testpassword');

    // Password should be hidden by default
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click show password toggle
    await page.click('[data-testid="toggle-password-visibility"]');

    // Password should now be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide
    await page.click('[data-testid="toggle-password-visibility"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should persist session after page reload', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/customer');

    // Reload page
    await page.reload();

    // Should still be on customer portal (session persisted)
    await expect(page).toHaveURL('/customer');
    await expect(page.locator('[data-testid="customer-dashboard"]')).toBeVisible();
  });

  test('should have link to registration page', async ({ page }) => {
    await page.goto('/login');

    // Click "Sign up" or "Create account" link
    await page.click('a:has-text("Sign up")');

    // Should navigate to registration page
    await expect(page).toHaveURL('/register');
  });
});

test.describe('Admin Login', () => {
  test('should login admin successfully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'admin@thepuppyday.com');
    await page.fill('input[name="password"]', 'adminpassword');

    await page.click('button[type="submit"]');

    // Should redirect to admin dashboard
    await page.waitForURL('/admin');

    // Verify admin panel loaded
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();
  });

  test('should prevent customer from accessing admin routes', async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/customer');

    // Try to access admin page
    await page.goto('/admin/appointments');

    // Should be redirected or show access denied
    await expect(
      page.locator('text=Access Denied').or(page.locator('text=Unauthorized'))
    ).toBeVisible();
  });

  test('should show groomer limited access', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'groomer@thepuppyday.com');
    await page.fill('input[name="password"]', 'groomerpassword');

    await page.click('button[type="submit"]');

    await page.waitForURL('/admin');

    // Groomer should see admin panel
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();

    // But should not see owner-only features
    await expect(page.locator('[data-testid="analytics-link"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="settings-link"]')).not.toBeVisible();
  });
});

test.describe('Logout', () => {
  test('should logout customer successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/customer');

    // Click logout
    await page.click('[data-testid="user-menu"]');
    await page.click('button:has-text("Logout")');

    // Should redirect to home or login page
    await page.waitForURL(/\/(login|$)/);

    // Try to access customer portal
    await page.goto('/customer');

    // Should redirect to login
    await page.waitForURL('/login');
  });

  test('should logout admin successfully', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@thepuppyday.com');
    await page.fill('input[name="password"]', 'adminpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('button:has-text("Logout")');

    await page.waitForURL(/\/(login|$)/);

    // Try to access admin
    await page.goto('/admin');

    // Should redirect to login
    await page.waitForURL('/login');
  });
});

test.describe('Password Reset', () => {
  test('should request password reset successfully', async ({ page }) => {
    await page.goto('/forgot-password');

    // Fill email
    await page.fill('input[name="email"]', 'customer@example.com');

    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Check your email')).toBeVisible();
    await expect(page.locator('text=password reset link')).toBeVisible();
  });

  test('should validate email in forgot password', async ({ page }) => {
    await page.goto('/forgot-password');

    // Try with invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=valid email')).toBeVisible();
  });

  test('should handle non-existent email gracefully', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.click('button[type="submit"]');

    // For security, should still show success message (don't reveal if email exists)
    await expect(page.locator('text=Check your email')).toBeVisible();
  });

  test('should reset password with valid token', async ({ page }) => {
    // Mock valid reset token
    const resetToken = 'valid-reset-token-123';

    await page.goto(`/reset-password?token=${resetToken}`);

    // Fill new password
    await page.fill('input[name="password"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');

    await page.click('button[type="submit"]');

    // Should redirect to login with success message
    await page.waitForURL('/login');
    await expect(page.locator('text=Password reset successful')).toBeVisible();
  });

  test('should reject invalid reset token', async ({ page }) => {
    // Mock API to return invalid token error
    await page.route('/api/auth/reset-password', async (route) => {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'Invalid or expired reset token' }),
      });
    });

    await page.goto('/reset-password?token=invalid-token');

    await page.fill('input[name="password"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');

    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('text=Invalid or expired')).toBeVisible();
  });

  test('should validate new password requirements in reset', async ({ page }) => {
    await page.goto('/reset-password?token=valid-token');

    // Try weak password
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');

    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=at least 8 characters')).toBeVisible();
  });
});

test.describe('Session Management', () => {
  test('should redirect unauthenticated user to login', async ({ page }) => {
    // Try to access protected route without logging in
    await page.goto('/customer/appointments');

    // Should redirect to login
    await page.waitForURL(/\/login/);
  });

  test('should handle expired session', async ({ page, context }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/customer');

    // Clear session cookies to simulate expiration
    await context.clearCookies();

    // Try to navigate to protected page
    await page.goto('/customer/appointments');

    // Should redirect to login
    await page.waitForURL('/login');

    // Should show session expired message
    await expect(page.locator('text=session expired')).toBeVisible();
  });

  test('should refresh session on activity', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'customer@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/customer');

    // Perform some activity
    await page.click('a:has-text("Appointments")');
    await page.waitForTimeout(1000);

    await page.click('a:has-text("Pets")');
    await page.waitForTimeout(1000);

    // Reload page
    await page.reload();

    // Should still be authenticated
    await expect(page).toHaveURL(/\/customer/);
  });
});

test.describe('Social Login (Future)', () => {
  test.skip('should login with Google OAuth', async ({ page }) => {
    // Placeholder for future Google OAuth implementation
    await page.goto('/login');

    await page.click('button:has-text("Continue with Google")');

    // Would redirect to Google OAuth flow
  });

  test.skip('should login with Facebook OAuth', async ({ page }) => {
    // Placeholder for future Facebook OAuth implementation
    await page.goto('/login');

    await page.click('button:has-text("Continue with Facebook")');

    // Would redirect to Facebook OAuth flow
  });
});

test.describe('Multi-Factor Authentication (Future)', () => {
  test.skip('should prompt for 2FA code when enabled', async ({ page }) => {
    // Placeholder for future 2FA implementation
    await page.goto('/login');

    await page.fill('input[name="email"]', 'admin-with-2fa@thepuppyday.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should prompt for 2FA code
    await expect(page.locator('text=Enter verification code')).toBeVisible();
  });
});
