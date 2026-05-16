import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Dashboard Page (Migrated from Cypress)
 * 
 * This follows the Page Object pattern for better test maintainability
 * Migrated from Cypress to Playwright with improved locator strategies
 */

export class DashboardPage {
  readonly page: Page;
  readonly breadcrumb: Locator;
  readonly mainMenu: Locator;
  readonly userDropdown: Locator;
  readonly dashboardWidgets: Locator;
  readonly loadingSpinner: Locator;
  readonly layoutContext: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Locators
    this.breadcrumb = page.locator('.oxd-topbar-header-breadcrumb');
    this.mainMenu = page.locator('.oxd-main-menu').first();
    this.userDropdown = page.locator('.oxd-userdropdown-tab');
    this.dashboardWidgets = page.locator('.orangehrm-dashboard-widget');
    this.loadingSpinner = page.locator('.oxd-loading-spinner');
    this.layoutContext = page.locator('.oxd-layout-context');
  }

  /**
   * Navigate to dashboard page
   */
  async goto() {
    await this.page.goto('/web/index.php/dashboard/index');
  }

  /**
   * Wait for page to load completely
   */
  async waitForLoad() {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      // Spinner might not appear, that's okay
    });
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Assert dashboard is visible
   */
  async expectDashboardVisible() {
    await expect(this.page).toHaveURL(/.*dashboard.*/);
    await expect(this.breadcrumb).toContainText('Dashboard');
  }

  /**
   * Navigate to a specific module
   */
  async navigateToModule(moduleName: string) {
    await this.mainMenu.locator(`text=${moduleName}`).click();
    await this.waitForLoad();
  }

  /**
   * Open user dropdown menu
   */
  async openUserDropdown() {
    await this.userDropdown.click();
  }

  /**
   * Assert widgets are displayed
   */
  async expectWidgetsVisible() {
    const count = await this.dashboardWidgets.count();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * Get widget by name
   */
  getWidgetByName(widgetName: string): Locator {
    return this.page.locator('.orangehrm-dashboard-widget').filter({ hasText: widgetName });
  }

  /**
   * Assert specific widget is visible
   */
  async expectWidgetVisible(widgetName: string) {
    const widget = this.getWidgetByName(widgetName);
    await expect(widget).toBeVisible();
  }
}
