import { test, expect } from '@playwright/test';

test('renders DS page', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.getByText('DroneDeploy Scaffold Design System')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
});
