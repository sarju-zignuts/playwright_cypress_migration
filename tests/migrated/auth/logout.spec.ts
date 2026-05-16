import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/migrated/LoginPage';

/**
 * Logout Flow Tests for Orange HRM (Migrated from Cypress)
 * 
 * Test Coverage:
 * - Successful logout
 * - Redirect to login page after logout
 * - Session termination
 * 
 * Migration Notes:
 * - Converted from Cypress to Playwright
 * - Improved wait strategies
 */

test.describe('Authentication - Logout Flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    
    // Login before each test
    await loginPage.goto();
    await loginPage.login('Admin', 'admin123');
    await loginPage.waitForDashboard();
  });

  test('should successfully logout', async ({ page }) => {
    // Click user dropdown
    const userDropdown = page.locator('.oxd-userdropdown-tab');
    await userDropdown.click();
    
    // Click logout link
    const logoutLink = page.locator('a[href="/web/index.php/auth/logout"]');
    await logoutLink.click();
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*auth\/login.*/);
    
    // Login form should be visible
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('should terminate session after logout', async ({ page }) => {
    // Logout
    const userDropdown = page.locator('.oxd-userdropdown-tab');
    await userDropdown.click();
    
    const logoutLink = page.locator('a[href="/web/index.php/auth/logout"]');
    await logoutLink.click();
    
    await expect(page).toHaveURL(/.*auth\/login.*/);
    
    // Try to navigate to dashboard directly
    await page.goto('/web/index.php/dashboard/index');
    
    // Should redirect back to login
    await expect(page).toHaveURL(/.*auth\/login.*/);
  });

  test('should display logout option in user dropdown', async ({ page }) => {
    // Click user dropdown
    const userDropdown = page.locator('.oxd-userdropdown-tab');
    await userDropdown.click();
    
    // Verify logout link is visible
    const logoutLink = page.locator('a[href="/web/index.php/auth/logout"]');
    await expect(logoutLink).toBeVisible();
    await expect(logoutLink).toContainText('Logout');
  });
});
