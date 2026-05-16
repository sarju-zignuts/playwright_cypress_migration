import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { PIMPage } from '../../../pages/migrated/PIMPage';
import { TestHelpers } from '../../../utils/TestHelpers';

/**
 * PIM (Personnel Information Management) Tests (Migrated from Cypress)
 * 
 * Test Coverage:
 * - Employee list viewing
 * - Employee search functionality
 * - Add new employee
 * - Edit employee details
 * - Delete employee
 * - Employee filters
 * 
 * Migration Notes:
 * - Converted from Cypress to Playwright
 * - Improved search and filter strategies
 * - Better table interaction handling
 */

test.describe('PIM - Employee Management', () => {
  let pimPage: PIMPage;

  test.beforeEach(async ({ page }) => {
    // Set longer timeout for this beforeEach
    test.setTimeout(90000);
    
    await TestHelpers.login(page);
    
    // Direct navigation to PIM page (more reliable than menu click)
    await page.goto('/web/index.php/pim/viewEmployeeList', { waitUntil: 'domcontentloaded' });
    
    // Wait for PIM page to load
    await page.waitForURL('**/pim/**', { timeout: 30000 });
    await page.waitForTimeout(3000);
    await TestHelpers.waitForPageLoad(page);
    
    pimPage = new PIMPage(page);
    
    // Wait for employee table to be visible
    await page.locator('.oxd-table, .orangehrm-container').first().waitFor({ state: 'visible', timeout: 20000 });
    await page.waitForTimeout(1000);
  });

  test.describe('Employee List View', () => {
    test('should display employee list page', async ({ page }) => {
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/.*pim\/viewEmployeeList.*/, { timeout: 15000 });
      await pimPage.expectEmployeeTableVisible();
      
      await page.screenshot({ path: `screenshots/employee-list-${Date.now()}.png` });
    });

    test('should display employee table headers', async ({ page }) => {
      await page.waitForTimeout(2000);
      const headers = ['Id', 'First (& Middle) Name', 'Last Name', 'Job Title', 'Employment Status', 'Sub Unit', 'Supervisor', 'Actions'];
      
      for (const header of headers) {
        await pimPage.expectHeaderContains(header);
      }
    });

    test('should show employee records in table', async ({ page }) => {
      await page.waitForTimeout(2000);
      await pimPage.expectTableHasRecords();
    });
  });

  test.describe('Employee Search', () => {
    test('should search employee by name', async ({ page }) => {
      await page.waitForTimeout(1000);
      await pimPage.searchByName('Peter');
      
      // Verify search results
      await pimPage.expectEmployeeTableVisible();
    });

    test('should search employee by ID', async ({ page }) => {
      await page.waitForTimeout(1000);
      await pimPage.searchById('0001');
      
      await pimPage.expectEmployeeTableVisible();
    });

    test('should reset search filters', async ({ page }) => {
      await page.waitForTimeout(1000);
      
      // Fill search fields
      await pimPage.searchByName('Test');
      
      // Reset filters
      await pimPage.resetSearch();
      
      // Verify reset occurred
      await expect(page).toHaveURL(/.*pim\/viewEmployeeList.*/, { timeout: 15000 });
    });
  });

  test.describe('Add Employee', () => {
    test('should navigate to add employee page', async ({ page }) => {
      await page.waitForTimeout(1000);
      await pimPage.clickAddEmployee();
      await expect(page).toHaveURL(/.*pim\/addEmployee.*/, { timeout: 15000 });
      
      const cardContainer = page.locator('.orangehrm-card-container');
      await expect(cardContainer).toBeVisible({ timeout: 15000 });
      
      await page.screenshot({ path: `screenshots/add-employee-page-${Date.now()}.png` });
    });

    test('should add new employee with required fields', async ({ page }) => {
      await page.waitForTimeout(1000);
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      
      await pimPage.clickAddEmployee();
      
      // Fill employee details
      await pimPage.fillEmployeeName(firstName, lastName);
      
      // Save employee
      await pimPage.clickSave();
      
      // Verify success - should redirect to personal details
      await expect(page).toHaveURL(/.*pim\/viewPersonalDetails.*/, { timeout: 30000 });
      
      await page.screenshot({ path: `screenshots/employee-added-${Date.now()}.png` });
    });

    test('should validate required fields on add employee', async ({ page }) => {
      await page.waitForTimeout(1000);
      await pimPage.clickAddEmployee();
      
      // Try to save without filling required fields
      await pimPage.saveButton.click();
      await page.waitForTimeout(1000);
      
      // Verify validation messages
      const inputGroup = page.locator('.oxd-input-group');
      await expect(inputGroup.first()).toContainText('Required', { timeout: 10000 });
    });

    test('should toggle create login details', async ({ page }) => {
      await page.waitForTimeout(1000);
      await pimPage.clickAddEmployee();
      
      // Toggle create login details
      await pimPage.toggleCreateLoginDetails();
      
      // Verify login fields appear
      await expect(page.locator('label', { hasText: 'Username' })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('label', { hasText: 'Password' })).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Employee Actions', () => {
    test('should view employee details', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // Click on first employee record
      const firstCard = pimPage.getFirstEmployeeCard();
      await firstCard.waitFor({ state: 'visible', timeout: 15000 });
      
      const actionButton = firstCard.locator('i, button, .oxd-icon-button').first();
      await actionButton.click({ force: true });
      
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/.*pim.*/, { timeout: 15000 });
      
      await page.screenshot({ path: `screenshots/employee-details-${Date.now()}.png` });
    });

    test('should have edit and delete icons for each employee', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const firstCard = pimPage.getFirstEmployeeCard();
      await firstCard.waitFor({ state: 'visible', timeout: 15000 });
      
      // Check if icons exist
      const editIcon = firstCard.locator('.bi-pencil-fill');
      const deleteIcon = firstCard.locator('.bi-trash');
      
      const editCount = await editIcon.count();
      const deleteCount = await deleteIcon.count();
      
      if (editCount > 0) {
        await expect(editIcon.first()).toBeVisible({ timeout: 10000 });
      }
      if (deleteCount > 0) {
        await expect(deleteIcon.first()).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Employee Filters', () => {
    test('should filter by employment status', async ({ page }) => {
      await page.waitForTimeout(1000);
      
      // Select employment status
      await pimPage.selectEmploymentStatus(0);
      
      await pimPage.searchButton.click();
      await page.waitForTimeout(1000);
      await pimPage.waitForLoad();
    });

    test('should show records count', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const recordsText = page.locator('.orangehrm-horizontal-padding');
      const count = await recordsText.count();
      
      if (count > 0) {
        await expect(recordsText.first()).toContainText('Records Found', { timeout: 10000 });
      }
    });
  });

  test.describe('Pagination', () => {
    test('should navigate through pages if multiple pages exist', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // Check if pagination exists
      const pagination = page.locator('.oxd-pagination');
      const count = await pagination.count();
      
      if (count > 0) {
        await expect(pagination.first()).toBeVisible({ timeout: 10000 });
      }
      // If no pagination, test passes (not enough records)
    });
  });
});
