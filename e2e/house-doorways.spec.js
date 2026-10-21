import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const config = await readFile('src/config/house.config.js', 'utf8');
for (const [name, start, yaw, direction] of [
  ['blue-room', [1, 0.85, -2.5], 0, -1],
  ['bedroom', [2.4, 0.85, -2.6], Math.PI, 1],
  ['right-office', [6.4, 0.85, -2.3], Math.PI, 1],
  ['garage', [-4.4, 0.85, 1.3], Math.PI, 1],
]) test(`${name} doorway passes forward and backward`, async ({ page }) => {
  // Test fixture sets a verified approach pose; production has no teleport API.
  await page.route('**/src/config/house.config.js*', route => route.fulfill({ contentType: 'text/javascript', body: config.replace(/spawn: \[[^\]]+\], initialYaw: [^,]+/, `spawn: ${JSON.stringify(start)}, initialYaw: ${yaw}`).replace('../../docs/house/house2-colliders.json','/docs/house/house2-colliders.json?import') }));
  const pose = () => page.evaluate(() => window.__tour.snapshot());
  await page.goto('/?mode=house');
  await page.getByRole('button', { name: /Enter House/ }).click();
  await expect.poll(async () => (await pose()).state).toBe('exploring');
  await expect.poll(async () => (await pose()).position[2]).toBeCloseTo(start[2]);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.keyboard.down('w');
  try { await expect.poll(async () => ((await pose()).position[2] - start[2]) * direction, { timeout: 10000, intervals: [30] }).toBeGreaterThan(1.4); }
  finally { await page.keyboard.up('w'); }
  await page.screenshot({ path: `test-results/door-${name}-${test.info().project.name}.png` });
  await page.keyboard.down('s');
  try { await expect.poll(async () => ((await pose()).position[2] - start[2]) * direction, { timeout: 10000, intervals: [30] }).toBeLessThan(0.18); }
  finally { await page.keyboard.up('s'); }
});
