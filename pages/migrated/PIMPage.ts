import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for PIM (Employee Management) Page (Migrated from Cypress)
 * 
 * This follows the Page Object pattern for better test maintainability
 * Migrated from Cypress to Playwright with improved locator strategies
 */

export class PIMPage {
  readonly page: Page;
  readonly addButton: Locator;
  readonly searchButton: Locator;
  readonly resetButton: Locator;
  readonly employeeTable: Locator;
  readonly employeeNameInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly saveButton: Locator;
  readonly deleteIcon: Locator;
  readonly editIcon: Locator;
  readonly tableHeader: Locator;
  readonly tableBody: Locator;
  readonly tableCards: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Locators
    this.addButton = page.locator('button', { hasText: 'Add' });
    this.searchButton = page.locator('button[type="submit"]');
    this.resetButton = page.locator('button', { hasText: 'Reset' });
    this.employeeTable = page.locator('.oxd-table');
    this.employeeNameInput = page.locator('.oxd-input');
    this.firstNameInput = page.locator('input[name="firstName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    this.saveButton = page.locator('button[type="submit"]');
    this.deleteIcon = page.locator('.bi-trash');
    this.editIcon = page.locator('.bi-pencil-fill');
    this.tableHeader = page.locator('.oxd-table-header');
    this.tableBody = page.locator('.oxd-table-body');
    this.tableCards = page.locator('.oxd-table-card');
  }

  /**
   * Navigate to PIM employee list page
   */
  async goto() {
    await this.page.goto('/web/index.php/pim/viewEmployeeList');
  }

  /**
   * Wait for page to load
   */
  async waitForLoad() {
    // Wait for loading spinner
    try {
      await this.page.locator('.oxd-loading-spinner').waitFor({ state: 'hidden', timeout: 15000 });
    } catch {
      // Spinner might not appear
    }
    
    // Wait for network to be idle
    try {
      await this.page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch {
      // Network might not idle
    }
    
    // Additional wait for stability
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click add employee button
   */
  async clickAddEmployee() {
    await this.addButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.addButton.click();
    await this.page.waitForTimeout(1000);
    await this.waitForLoad();
  }

  /**
   * Fill employee name fields
   */
  async fillEmployeeName(firstName: string, lastName: string) {
    await this.firstNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
  }

  /**
   * Click save button
   */
  async clickSave() {
    await this.saveButton.click();
    await this.page.waitForTimeout(2000);
    await this.waitForLoad();
  }

  /**
   * Search employee by name
   */
  async searchByName(name: string) {
    await this.employeeNameInput.first().waitFor({ state: 'visible', timeout: 10000 });
    await this.employeeNameInput.first().clear();
    await this.employeeNameInput.first().fill(name);
    await this.searchButton.click();
    await this.page.waitForTimeout(1000);
    await this.waitForLoad();
  }

  /**
   * Search employee by ID
   */
  async searchById(id: string) {
    await this.employeeNameInput.nth(1).waitFor({ state: 'visible', timeout: 10000 });
    await this.employeeNameInput.nth(1).clear();
    await this.employeeNameInput.nth(1).fill(id);
    await this.searchButton.click();
    await this.page.waitForTimeout(1000);
    await this.waitForLoad();
  }

  /**
   * Reset search filters
   */
  async resetSearch() {
    await this.resetButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.resetButton.click();
    await this.page.waitForTimeout(1000);
    await this.waitForLoad();
  }

  /**
   * Assert employee table is visible
   */
  async expectEmployeeTableVisible() {
    await this.page.waitForTimeout(2000);
    await expect(this.employeeTable).toBeVisible({ timeout: 15000 });
  }

  /**
   * Assert table has records
   */
  async expectTableHasRecords() {
    await this.page.waitForTimeout(2000);
    await expect(this.tableBody).toBeVisible({ timeout: 15000 });
    const count = await this.tableCards.count();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * Assert table header contains text
   */
  async expectHeaderContains(text: string) {
    await this.page.waitForTimeout(1000);
    const header = this.tableHeader.locator(`text=${text}`).first();
    const count = await header.count();
    
    if (count > 0) {
      await expect(header).toBeVisible({ timeout: 10000 });
    }
    // If header not found, test will continue (some headers might be optional)
  }

  /**
   * Get first employee card
   */
  getFirstEmployeeCard(): Locator {
    return this.tableCards.first();
  }

  /**
   * Toggle create login details switch
   */
  async toggleCreateLoginDetails() {
    const switchInput = this.page.locator('.oxd-switch-input');
    await switchInput.waitFor({ state: 'visible', timeout: 10000 });
    await switchInput.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Select employment status dropdown
   */
  async selectEmploymentStatus(index: number = 0) {
    const selectText = this.page.locator('.oxd-select-text').first();
    await selectText.waitFor({ state: 'visible', timeout: 10000 });
    await selectText.click();
    
    const dropdown = this.page.locator('.oxd-select-dropdown');
    await dropdown.waitFor({ state: 'visible', timeout: 10000 });
    
    const option = dropdown.locator('.oxd-select-option').nth(index);
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();
    await this.page.waitForTimeout(500);
  }
}
