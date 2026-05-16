import { test } from '@playwright/test';
import { TestHelpers } from '../utils/TestHelpers';

/**
 * Debug test to understand menu structure
 */

test('Debug: Inspect menu structure', async ({ page }) => {
  await TestHelpers.login(page);
  
  // Wait for dashboard
  await page.waitForTimeout(3000);
  
  // Take screenshot of dashboard
  await page.screenshot({ path: `screenshots/admin-dashboard-${Date.now()}.png`, fullPage: true });
  
  // Get all menu items
  const mainMenu = page.locator('.oxd-main-menu').first();
  await mainMenu.waitFor({ state: 'visible', timeout: 20000 });
  
  // Get all menu items
  const menuItems = await mainMenu.locator('.oxd-main-menu-item').all();
  
  console.log(`\n=== FOUND ${menuItems.length} MENU ITEMS ===`);
  
  for (let i = 0; i < menuItems.length; i++) {
    const item = menuItems[i];
    const text = await item.textContent();
    const isVisible = await item.isVisible();
    console.log(`Menu ${i}: "${text}" - Visible: ${isVisible}`);
  }
  
  // Try to find PIM specifically
  console.log('\n=== SEARCHING FOR PIM ===');
  
  // Method 1: Exact text
  const pimExact = mainMenu.getByText('PIM', { exact: true });
  const pimExactCount = await pimExact.count();
  console.log(`Method 1 (exact text): Found ${pimExactCount} matches`);
  
  // Method 2: Contains text
  const pimContains = mainMenu.locator('.oxd-main-menu-item', { hasText: 'PIM' });
  const pimContainsCount = await pimContains.count();
  console.log(`Method 2 (contains text): Found ${pimContainsCount} matches`);
  
  // Method 3: Any text
  const pimAny = page.locator('text=PIM');
  const pimAnyCount = await pimAny.count();
  console.log(`Method 3 (any text): Found ${pimAnyCount} matches`);
  
  // Method 4: By role
  const pimRole = page.getByRole('link', { name: 'PIM' });
  const pimRoleCount = await pimRole.count();
  console.log(`Method 4 (by role): Found ${pimRoleCount} matches`);
  
  console.log('\n=== END DEBUG ===\n');
});
