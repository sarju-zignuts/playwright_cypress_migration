import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/migrated/LoginPage';

/**
 * Login Flow Tests for Orange HRM (Migrated from Cypress)
 * 
 * Test Coverage:
 * - Successful login with valid credentials
 * - Failed login with invalid credentials
 * - Empty credentials validation
 * - Session persistence
 * - UI/UX features
 * - Security features
 * 
 * Migration Notes:
 * - Converted from Cypress to Playwright
 * - Improved wait strategies with auto-waiting
 * - Better locator strategies
 * - Web-first assertions
 */

test.describe('Authentication - Login Flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test.describe('Successful Login Scenarios', () => {
    test('should successfully login with valid credentials', async ({ page }) => {
      // Login with default credentials
      await loginPage.login('Admin', 'admin123');
      
      // Wait for dashboard redirect
      await loginPage.waitForDashboard();
      
      // Verify dashboard elements
      await expect(loginPage.topbarBreadcrumb).toContainText('Dashboard');
      await expect(loginPage.userDropdown).toBeVisible();
      
      // Verify navigation menu is visible
      const mainMenu = page.locator('.oxd-main-menu').first();
      await expect(mainMenu).toBeVisible();
      
      // Take screenshot for documentation
      await page.screenshot({ path: `screenshots/successful-login-${Date.now()}.png` });
    });

    test('should maintain session after page reload', async ({ page }) => {
      // Login
      await loginPage.login('Admin', 'admin123');
      await loginPage.waitForDashboard();
      
      // Reload page
      await page.reload();
      
      // Should still be logged in
      await expect(page).toHaveURL(/.*dashboard.*/);
      await expect(loginPage.userDropdown).toBeVisible();
    });
  });

  test.describe('Failed Login Scenarios', () => {
    test('should show error for invalid username', async ({ page }) => {
      await loginPage.fillUsername('InvalidUser');
      await loginPage.fillPassword('admin123');
      await loginPage.clickSubmit();
      
      await loginPage.expectErrorMessage('Invalid credentials');
      
      await page.screenshot({ path: `screenshots/invalid-username-${Date.now()}.png` });
    });

    test('should show error for invalid password', async () => {
      await loginPage.fillUsername('Admin');
      await loginPage.fillPassword('wrongpassword');
      await loginPage.clickSubmit();
      
      await loginPage.expectErrorMessage('Invalid credentials');
    });

    test('should show validation for empty username', async () => {
      await loginPage.fillPassword('admin123');
      await loginPage.clickSubmit();
      
      // Check for validation message
      const firstInputGroup = loginPage.page.locator('.oxd-input-group').first();
      await expect(firstInputGroup.locator('.oxd-text--span')).toContainText('Required');
    });

    test('should show validation for empty password', async () => {
      await loginPage.fillUsername('Admin');
      await loginPage.clickSubmit();
      
      // Check for validation message on password field
      const inputGroups = loginPage.page.locator('.oxd-input-group');
      await expect(inputGroups.nth(1).locator('.oxd-text--span')).toContainText('Required');
    });

    test('should show validation for both empty fields', async () => {
      await loginPage.clickSubmit();
      
      // Should have at least 2 validation messages
      const validationMessages = loginPage.page.locator('.oxd-text--span');
      await expect(validationMessages).toHaveCount(2, { timeout: 5000 });
      await expect(validationMessages.first()).toContainText('Required');
    });
  });

  test.describe('UI/UX Features', () => {
    test('should have visible forgot password link', async () => {
      await expect(loginPage.forgotPasswordLink).toBeVisible();
      await expect(loginPage.forgotPasswordLink).toContainText('Forgot your password');
    });

    test('should display login page logo and branding', async ({ page }) => {
      await expect(loginPage.loginLogo).toBeVisible();
      
      const branding = page.locator('.orangehrm-login-branding');
      await expect(branding).toBeVisible();
    });

    test('should have proper input placeholders', async () => {
      await expect(loginPage.usernameInput).toHaveAttribute('placeholder', 'Username');
      await expect(loginPage.passwordInput).toHaveAttribute('placeholder', 'Password');
    });
  });

  test.describe('Security Features', () => {
    test('should mask password input', async () => {
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('should clear credentials on failed login', async () => {
      await loginPage.fillUsername('Admin');
      await loginPage.fillPassword('wrong');
      await loginPage.clickSubmit();
      
      // Wait for error alert
      await expect(loginPage.errorAlert).toBeVisible();
      
      // Credentials should be cleared after failed login
      await expect(loginPage.usernameInput).toHaveValue('');
      await expect(loginPage.passwordInput).toHaveValue('');
    });
  });
});
