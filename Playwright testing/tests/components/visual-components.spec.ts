import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

type ComponentEntry = {
  name: string;
  selector: string;
  iterations: number;
  stablePasses: number;
  maxDiffPixelRatio: number;
};

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, 'components-visual.json');
const STABLE_PATH = path.join(ROOT, 'components-stable.json');

function readJsonSafe<T>(p: string, fallback: T): T {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}

const components = readJsonSafe<ComponentEntry[]>(CONFIG_PATH, []);
const stableMap: Record<string, { stable: boolean; consecutive: number }> = readJsonSafe(STABLE_PATH, {});

const ITERATIONS_OVERRIDE = process.env.ITERATIONS ? parseInt(process.env.ITERATIONS, 10) : undefined;
const MAX_DIFF_OVERRIDE = process.env.MAX_DIFF ? parseFloat(process.env.MAX_DIFF) : undefined;
const SKIP_STABLE = process.env.SKIP_STABLE !== 'false';

for (const c of components) {
  const iterations = ITERATIONS_OVERRIDE ?? c.iterations;
  const maxDiff = MAX_DIFF_OVERRIDE ?? c.maxDiffPixelRatio;
  const prev = stableMap[c.name] ?? { stable: false, consecutive: 0 };

  test.describe('components', () => {
    test(c.name + ' @component', async ({ page }) => {
      if (SKIP_STABLE && prev.stable) test.skip();
      await page.goto('http://localhost:3000');
      const el = page.locator(c.selector);

      let consecutivePasses = 0;
      for (let i = 0; i < iterations; i++) {
        await expect(el).toHaveScreenshot(`${c.name}.png`, { maxDiffPixelRatio: maxDiff });
        consecutivePasses++;
        if (consecutivePasses >= c.stablePasses) break;
      }

      // Mark stable on success path
      stableMap[c.name] = { stable: true, consecutive: consecutivePasses };
      fs.writeFileSync(STABLE_PATH, JSON.stringify(stableMap, null, 2));
    });
  });
}




