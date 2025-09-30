import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:3000');
});

test('snapshot: page header', async ({ page }) => {
  const h1 = page.locator('h1');
  await expect(h1).toHaveScreenshot('header.png', { maxDiffPixelRatio: 0.02 });
});

test('snapshot: primary button', async ({ page }) => {
  const btn = page.getByRole('button', { name: 'Save' });
  // Fallback if label differs in demo
  const target = (await btn.count()) ? btn : page.locator('.btn.btn--primary').first();
  await expect(target).toHaveScreenshot('primary-button.png', { maxDiffPixelRatio: 0.02 });
});
