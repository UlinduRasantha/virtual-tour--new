import { test, expect } from '@playwright/test';
const snapshot = page => page.evaluate(() => window.__tour.snapshot());
async function move(page, key, condition) {
  await page.keyboard.down(key);
  try { await expect.poll(async () => condition(await snapshot(page)), { timeout: 15000, intervals: [40] }).toBe(true); }
  finally { await page.keyboard.up(key); }
}
test('house entrance, step, collision, mouse look, pause and reset', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByText('HOUSE DEMO — your scan · simplified entrance route')).toBeVisible();
  await page.getByRole('button', { name: /Enter House/ }).click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement?.tagName)).toBe('CANVAS');
  await page.screenshot({ path: `test-results/house-entrance-${test.info().project.name}.png` });
  await move(page, 'w', s => s.position[2] < -1.4);
  expect((await snapshot(page)).position[1]).toBeCloseTo(0.82, 1);
  await page.screenshot({ path: `test-results/house-inside-${test.info().project.name}.png` });
  await move(page, 's', s => s.position[2] > 0.9);
  expect((await snapshot(page)).position[1]).toBeCloseTo(0.62, 1);
  await move(page, 'd', s => s.position[0] > 1);
  await move(page, 'w', s => s.position[2] < 0.49);
  await page.keyboard.down('w');
  await page.waitForTimeout(400);
  await page.keyboard.up('w');
  expect((await snapshot(page)).position[2]).toBeGreaterThan(0.4);
  const beforeLook = await snapshot(page);
  await page.mouse.move(900, 400);
  await expect.poll(async () => (await snapshot(page)).yaw).not.toBeCloseTo(beforeLook.yaw);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /Resume tour/ })).toBeVisible();
  const stopped = await snapshot(page);
  await page.keyboard.press('w');
  expect((await snapshot(page)).position).toEqual(stopped.position);
  await page.getByRole('dialog').getByRole('button', { name: 'Reset to entrance' }).click();
  await expect.poll(async () => (await snapshot(page)).position[2]).toBeCloseTo(1.05);
  await expect.poll(async () => (await snapshot(page)).yaw).toBeCloseTo(0);
  await page.getByRole('button', { name: /Resume tour/ }).click();
  await expect.poll(() => page.evaluate(() => !!document.pointerLockElement)).toBe(true);
  expect(errors).toEqual([]);
});

test('house touch movement, look and location dialogs', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?mode=house');
  await page.getByRole('button', { name: 'Use touch / drag controls' }).click();
  await page.getByRole('button', { name: /Enter House/ }).click();
  const pad = await page.getByRole('group', { name: 'Drag to move' }).boundingBox();
  await page.mouse.move(pad.x + 55, pad.y + 70); await page.mouse.down(); await page.mouse.move(pad.x + 55, pad.y + 15);
  await expect.poll(async () => (await snapshot(page)).position[2], { timeout: 15000 }).toBeLessThan(-1.4);
  await page.mouse.up();
  const before = await snapshot(page), look = await page.getByRole('group', { name: 'Drag to look' }).boundingBox();
  await page.mouse.move(look.x + 30, look.y + 40); await page.mouse.down(); await page.mouse.move(look.x + 90, look.y + 60, { steps: 5 }); await page.mouse.up();
  await expect.poll(async () => (await snapshot(page)).yaw).not.toBeCloseTo(before.yaw);
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: /Resume tour/ }).click();
  await page.getByRole('button', { name: 'Locations' }).click();
  await expect(page.getByRole('button', { name: /Read more/ })).toHaveCount(2);
  await page.getByRole('button', { name: /Main entrance/ }).click();
  await expect(page.getByText(/supplied width is 1 meter/)).toBeVisible();
  await page.screenshot({ path: `test-results/house-touch-${test.info().project.name}.png` });
  await page.getByRole('button', { name: 'Resume tour' }).click();
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
});

test('house entrance hotspot responds to a nearby reticle click', async ({ page }) => {
  await page.goto('/?mode=house');
  const button = page.getByRole('button', { name: /Enter House/ });
  const rect = await button.boundingBox();
  await button.click();
  await expect.poll(() => page.evaluate(() => !!document.pointerLockElement)).toBe(true);
  const pose = await snapshot(page);
  const hotspot = [0, 1.611149319174405, -0.6202373862318538];
  const dx = hotspot[0] - pose.position[0], dz = hotspot[2] - pose.position[2];
  const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(hotspot[1] - (pose.position[1] + 0.75), Math.hypot(dx, dz));
  await page.mouse.move(rect.x + rect.width / 2 - (yaw - pose.yaw) / 0.002, rect.y + rect.height / 2 - (pitch - pose.pitch) / 0.002);
  await expect.poll(async () => (await snapshot(page)).target).toBe('house-entrance');
  await page.mouse.down(); await page.mouse.up();
  await expect(page.getByRole('heading', { name: 'Main entrance' })).toBeVisible();
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
  await expect(page.getByRole('button', { name: 'Resume tour' })).toBeFocused();
});
