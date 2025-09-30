import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8000';

test('List view chips render for selected building type and stage', async ({ page }) => {
  await page.goto(BASE_URL);

  // Select building type: Data Centers
  await page.getByText('Data Centers').click();

  // Select stage: 1 - Site Preparation (value is 'site-prep')
  await page.selectOption('#constructionStage', 'site-prep');

  // Switch to List view
  await page.getByRole('button', { name: 'List' }).click();

  // Expect chip grid with chips
  const chips = page.locator('.chip');
  await expect(page.locator('#tradeListView')).toBeVisible();
  await expect(chips.first()).toBeVisible();
  const count = await chips.count();
  expect(count).toBeGreaterThan(0);

  // Screenshot
  await page.screenshot({ path: 'screenshots/list-view.png', fullPage: false });
});
