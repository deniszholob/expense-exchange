// #region Imports
import { expect, test } from '@playwright/test';
// #endregion

// #region Smoke Tests
test('loads the application shell', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('app-root')).toBeVisible();
});
// #endregion
