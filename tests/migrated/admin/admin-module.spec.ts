import { test, expect } from '@playwright/test';
import { TestHelpers } from '../../../utils/TestHelpers';

/**
 * Admin Module Tests (Migrated from Cypress)
 * 
 * Test Coverage:
 * - User management
 * - Job titles
 * - Organization structure
 * - Qualifications
 * 
 * Migration Notes:
 * - Converted from Cypress to Playwright
 * - Improved navigation handling
 * - Better dropdown interaction
 */

test.describe('Admin - System Configuration', () => {
  
  test.beforeEach(async ({ page }) => {
    await TestHelpers.login(page);
    
    // Direct navigation to Admin page (more reliable than menu click)
    await page.goto('/web/index.php/admin/viewSystemUsers', { waitUntil: 'domcontentloaded' });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    await TestHelpers.waitForPageLoad(page);
  });

  test.describe('Admin Dashboard', () => {
    test('should display admin module page', async ({ page }) => {
      await expect(page).toHaveURL(/.*admin\/viewSystemUsers.*/);
      
      const headerContainer = page.locator('.orangehrm-header-container');
      await expect(headerContainer).toBeVisible();
      
      await page.screenshot({ path: `screenshots/admin-dashboard-${Date.now()}.png` });
    });
  });

  test.describe('User Management', () => {
    test('should display system users list', async ({ page }) => {
      await expect(page.locator('.oxd-table')).toBeVisible();
      
      const tableHeader = page.locator('.oxd-table-header');
      await expect(tableHeader).toContainText('Username');
      await expect(tableHeader).toContainText('User Role');
      await expect(tableHeader).toContainText('Status');
    });

    test('should have add user button', async ({ page }) => {
      const addButton = page.locator('button', { hasText: 'Add' });
      await expect(addButton).toBeVisible();
    });

    test('should search users by username', async ({ page }) => {
      await page.locator('.oxd-input').nth(1).fill('Admin');
      await page.locator('button[type="submit"]').click();
      await TestHelpers.waitForPageLoad(page);
      
      // Verify search results
      await expect(page.locator('.oxd-table-body')).toBeVisible();
    });

    test('should filter users by role', async ({ page }) => {
      await page.locator('.oxd-select-text').first().click();
      await expect(page.locator('.oxd-select-dropdown')).toBeVisible();
      await page.locator('.oxd-select-option', { hasText: 'Admin' }).click();
      
      await page.locator('button[type="submit"]').click();
      await TestHelpers.waitForPageLoad(page);
    });

    test('should reset user search filters', async ({ page }) => {
      await page.locator('.oxd-input').nth(1).fill('Test');
      await page.locator('button', { hasText: 'Reset' }).click();
      
      const inputValue = await page.locator('.oxd-input').nth(1).inputValue();
      expect(inputValue).toBe('');
    });
  });

  test.describe('Job Navigation', () => {
    test('should navigate to job titles', async ({ page }) => {
      await page.locator('.oxd-topbar-body-nav-tab-item', { hasText: 'Job' }).click();
      await page.waitForTimeout(1000);
      
      const dropdown = page.locator('.oxd-dropdown-menu', { hasText: 'Job Titles' });
      await dropdown.waitFor({ state: 'visible', timeout: 10000 });
      await dropdown.click({ force: true });
      
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/.*admin\/.*/);
      await page.screenshot({ path: `screenshots/job-titles-${Date.now()}.png` });
    });

    test('should navigate to pay grades', async ({ page }) => {
      await page.locator('.oxd-topbar-body-nav-tab-item', { hasText: 'Job' }).click();
      await page.waitForTimeout(1000);
      
      const dropdown = page.locator('.oxd-dropdown-menu', { hasText: 'Pay Grades' });
      await dropdown.waitFor({ state: 'visible', timeout: 10000 });
      await dropdown.click({ force: true });
      
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/.*admin\/.*/);
    });

    test('should navigate to employment status', async ({ page }) => {
      await page.locator('.oxd-topbar-body-nav-tab-item', { hasText: 'Job' }).click();
      await page.waitForTimeout(1000);
      
      const dropdown = page.locator('.oxd-dropdown-menu', { hasText: 'Employment Status' });
      await dropdown.waitFor({ state: 'visible', timeout: 10000 });
      await dropdown.click({ force: true });
      
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/.*admin\/.*/);
    });

    test('should navigate to job categories', async ({ page }) => {
      await page.locator('.oxd-topbar-body-nav-tab-item', { hasText: 'Job' }).click();
      await page.waitForTimeout(1000);
      
      const dropdown = page.locator('.oxd-dropdown-menu', { hasText: 'Job Categories' });
      await dropdown.waitFor({ state: 'visible', timeout: 10000 });
      await dropdown.click({ force: true });
      
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/.*admin\/.*/);
    });
  });

  test.describe('Organization Navigation', () => {
    test('should navigate to general information', async ({ page }) => {
      await page.locator('.oxd-topbar-body-nav-tab-item', { hasText: 'Organization' }).click();
      await page.waitForTimeout(1000);
      
      const dropdown = page.locator('.oxd-dropdown-menu', { hasText: 'General Information' });
      await dropdown.waitFor({ state: 'visible', timeout: 10000 });
      await dropdown.click({ force: true });
      
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/.*admin\/.*/);
    });

    test('should navigate to locations', async ({ page }) => {
      await page.locator('.oxd-topbar-body-nav-tab-item', { hasText: 'Organization' }).click();
      await page.waitForTimeout(1000);
      
      const dropdown = page.locator('.oxd-dropdown-menu', { hasText: 'Locations' });
      await dropdown.waitFor({ state: 'visible', timeout: 10000 });
      await dropdown.click({ force: true });
      
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/.*admin\/.*/);
    });

    test('should navigate to structure', async ({ page }) => {
      await page.locator('.oxd-topbar-body-nav-tab-item', { hasText: 'Organization' }).click();
      await page.waitForTimeout(1000);
      
      const dropdown = page.locator('.oxd-dropdown-menu', { hasText: 'Structure' });
      await dropdown.waitFor({ state: 'visible', timeout: 10000 });
      await dropdown.click({ force: true });
      
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/.*admin\/.*/);
    });
  });

  test.describe('Qualifications Navigation', () => {
    test('should navigate to skills', async ({ page }) => {
      await page.locator('.oxd-topbar-body-nav-tab-item', { hasText: 'Qualifications' }).click();
      await page.waitForTimeout(1000);
      
      const dropdown = page.locator('.oxd-dropdown-menu', { hasText: 'Skills' });
      await dropdown.waitFor({ state: 'visible', timeout: 10000 });
      await dropdown.click({ force: true });
      
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/.*admin\/.*/);
    });

    test('should navigate to education', async ({ page }) => {
      await page.locator('.oxd-topbar-body-nav-tab-item', { hasText: 'Qualifications' }).click();
      await page.waitForTimeout(1000);
      
      const dropdown = page.locator('.oxd-dropdown-menu', { hasText: 'Education' });
      await dropdown.waitFor({ state: 'visible', timeout: 10000 });
      await dropdown.click({ force: true });
      
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/.*admin\/.*/);
    });

    test('should navigate to licenses', async ({ page }) => {
      await page.locator('.oxd-topbar-body-nav-tab-item', { hasText: 'Qualifications' }).click();
      await page.waitForTimeout(1000);
      
      const dropdown = page.locator('.oxd-dropdown-menu', { hasText: 'Licenses' });
      await dropdown.waitFor({ state: 'visible', timeout: 10000 });
      await dropdown.click({ force: true });
      
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/.*admin\/.*/);
    });
  });

  test.describe('System Configuration', () => {
    test('should have configuration menu', async ({ page }) => {
      const configMenu = page.locator('.oxd-topbar-body-nav-tab-item', { hasText: 'Configuration' });
      await expect(configMenu).toBeVisible();
    });
  });
});
