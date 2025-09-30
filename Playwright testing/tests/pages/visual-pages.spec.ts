import { test, expect } from '@playwright/test';

const ITERATIONS = process.env.ITERATIONS ? parseInt(process.env.ITERATIONS, 10) : 8;
const STABLE_PASSES = process.env.STABLE_PASSES ? parseInt(process.env.STABLE_PASSES, 10) : 3;
const MAX_DIFF = process.env.MAX_DIFF ? parseFloat(process.env.MAX_DIFF) : 0.02;

test.describe('pages', () => {
  test('landing page layout', async ({ page }) => {
    await page.goto('http://localhost:3000');
    const layout = page.locator('body');
    let ok = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      await expect(layout).toHaveScreenshot('page-landing.png', { maxDiffPixelRatio: MAX_DIFF });
      ok++;
      if (ok >= STABLE_PASSES) break;
    }
  });
});




