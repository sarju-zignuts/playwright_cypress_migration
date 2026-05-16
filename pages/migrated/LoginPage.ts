import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Login Page (Migrated from Cypress)
 * 
 * This follows the Page Object pattern for better test maintainability
 * Migrated from Cypress to Playwright with improved locator strategies
 */

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly loginLogo: Locator;
  readonly errorAlert: Locator;
  readonly validationMessage: Locator;
  readonly topbarBreadcrumb: Locator;
  readonly userDropdown: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Locators
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.forgotPasswordLink = page.locator('.orangehrm-login-forgot');
    this.loginLogo = page.locator('.orangehrm-login-logo');
    this.errorAlert = page.locator('.oxd-alert-content');
    this.validationMessage = page.locator('.oxd-text--span');
    this.topbarBreadcrumb = page.locator('.oxd-topbar-header-breadcrumb');
    this.userDropdown = page.locator('.oxd-userdropdown-name');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/web/index.php/auth/login');
  }

  /**
   * Fill username field
   */
  async fillUsername(username: string) {
    await this.usernameInput.clear();
    await this.usernameInput.fill(username);
  }

  /**
   * Fill password field
   */
  async fillPassword(password: string) {
    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
  }

  /**
   * Click submit button
   */
  async clickSubmit() {
    await this.submitButton.click();
  }

  /**
   * Complete login flow
   */
  async login(username: string, password: string) {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickSubmit();
  }

  /**
   * Wait for successful login redirect
   */
  async waitForDashboard() {
    await this.page.waitForURL('**/dashboard/**', { timeout: 30000 });
    await this.topbarBreadcrumb.waitFor({ state: 'visible', timeout: 15000 });
    
    // Wait for page to be fully loaded
    try {
      await this.page.locator('.oxd-loading-spinner').waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Spinner might not appear
    }
  }

  /**
   * Assert error message is displayed
   */
  async expectErrorMessage(message: string) {
    await expect(this.errorAlert).toBeVisible();
    await expect(this.errorAlert).toContainText(message);
  }

  /**
   * Assert validation error is displayed
   */
  async expectValidationError() {
    await expect(this.validationMessage).toContainText('Required');
  }

  /**
   * Assert redirect to dashboard
   */
  async expectDashboardRedirect() {
    await expect(this.page).toHaveURL(/.*dashboard.*/);
  }

  /**
   * Assert user is logged in
   */
  async expectLoggedIn() {
    await expect(this.userDropdown).toBeVisible();
    await expect(this.topbarBreadcrumb).toContainText('Dashboard');
  }
}
