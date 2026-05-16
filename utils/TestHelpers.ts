import { Page } from '@playwright/test';

/**
 * Test Helper Utilities
 * Common functions used across tests
 */

export class TestHelpers {
  /**
   * Login helper function
   */
  static async login(page: Page, username: string = 'Admin', password: string = 'admin123') {
    await page.goto('/web/index.php/auth/login', { waitUntil: 'domcontentloaded' });
    
    // Wait for login form to be ready
    await page.locator('input[name="username"]').waitFor({ state: 'visible', timeout: 15000 });
    
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    
    // Wait for dashboard with longer timeout
    await page.waitForURL('**/dashboard/**', { timeout: 30000 });
    
    // Wait for dashboard to be fully loaded
    await page.locator('.oxd-topbar-header-breadcrumb').waitFor({ state: 'visible', timeout: 15000 });
    
    // Additional wait for page stability
    await this.waitForPageLoad(page);
  }

  /**
   * Logout helper function
   */
  static async logout(page: Page) {
    await page.locator('.oxd-userdropdown-tab').click();
    await page.locator('a[href="/web/index.php/auth/logout"]').click();
    await page.waitForURL('**/auth/login**');
  }

  /**
   * Navigate to menu item
   */
  static async navigateToMenu(page: Page, menuName: string) {
    // Wait for main menu to be visible with longer timeout
    const mainMenu = page.locator('.oxd-main-menu').first();
    await mainMenu.waitFor({ state: 'visible', timeout: 30000 });
    
    // Wait for menu to be fully loaded
    await page.waitForTimeout(2000);
    
    // Simple approach: find menu item by text within main menu (like Cypress)
    const menuItem = mainMenu.locator(`text=${menuName}`).first();
    
    // Wait for menu item to be visible
    await menuItem.waitFor({ state: 'visible', timeout: 20000 });
    
    // Scroll into view if needed
    await menuItem.scrollIntoViewIfNeeded();
    
    // Click the menu item
    await menuItem.click();
    
    // Wait for navigation and page load
    await page.waitForTimeout(2000);
    await page.waitForLoadState('domcontentloaded');
    await this.waitForPageLoad(page);
  }

  /**
   * Wait for loading spinner to disappear
   */
  static async waitForPageLoad(page: Page) {
    // Wait for loading spinner to disappear
    try {
      await page.locator('.oxd-loading-spinner').waitFor({ state: 'hidden', timeout: 15000 });
    } catch {
      // Spinner might not appear, that's okay
    }
    
    // Wait for network to be idle
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch {
      // Network might not idle, continue anyway
    }
    
    // Small buffer for stability
    await page.waitForTimeout(500);
  }

  /**
   * Take screenshot with timestamp
   */
  static async screenshotWithTimestamp(page: Page, name: string) {
    const timestamp = Date.now();
    await page.screenshot({ path: `screenshots/${name}-${timestamp}.png` });
  }

  /**
   * Verify toast message
   */
  static async verifyToast(page: Page, message: string) {
    const toast = page.locator('.oxd-toast-content');
    await toast.waitFor({ state: 'visible' });
    await toast.locator(`text=${message}`).waitFor({ state: 'visible' });
  }

  /**
   * Fill form field by placeholder
   */
  static async fillByPlaceholder(page: Page, placeholder: string, value: string) {
    await page.locator(`input[placeholder*="${placeholder}"]`).fill(value);
  }

  /**
   * Generate random string
   */
  static randomString(length: number = 10): string {
    return Math.random().toString(36).substring(2, length + 2);
  }

  /**
   * Generate random email
   */
  static randomEmail(): string {
    return `test${this.randomString(8)}@example.com`;
  }

  /**
   * Wait for specific time (use sparingly)
   */
  static async wait(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}
