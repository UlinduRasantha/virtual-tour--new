import { test, expect } from '@playwright/test';
import { glbFixture } from './glbFixture.js';
test('desktop navigation, doorway, wall collision, pause, reset and missing scan', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/?mode=demo');
  await expect(page.getByRole('button', { name: /Enter Demo Office/ })).toBeVisible();
  await expect(page.getByText('DEMO — not your real office')).toBeVisible();
  await page.screenshot({ path: `test-results/welcome-${test.info().project.name}.png` });
  await page.getByRole('button', { name: /Enter Demo Office/ }).click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement !== null)).toBe(true);
  await page.keyboard.down('w');
  await expect.poll(() => page.evaluate(() => window.__tour.snapshot().position[2]), { timeout: 15000 }).toBeLessThan(-6.4);
  await page.keyboard.up('w');
  expect(await page.evaluate(() => window.__tour.snapshot().position[2])).toBeGreaterThan(-6.7);
  const beforeLook = await page.evaluate(() => window.__tour.snapshot());
  await page.mouse.move(810, 520);
  await expect.poll(() => page.evaluate(() => window.__tour.snapshot().yaw)).not.toBeCloseTo(beforeLook.yaw);
  expect(await page.evaluate(() => window.__tour.snapshot().position[2])).toBeCloseTo(beforeLook.position[2]);
  await page.screenshot({ path: `test-results/explore-${test.info().project.name}.png` });
  await page.keyboard.press('Escape');
  // Headless OS Escape behavior differs; use the actual unlock API if it doesn't release.
  await page.evaluate(() => document.exitPointerLock());
  await expect(page.getByRole('button', { name: /Resume tour/ })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset to entrance' }).click();
  await expect.poll(() => page.evaluate(() => window.__tour.snapshot().position[2])).toBeCloseTo(4);
  await page.getByRole('button', { name: /Resume tour/ }).click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement !== null)).toBe(true);
  await page.evaluate(() => document.exitPointerLock());
  await page.getByRole('button', { name: 'Exit tour' }).click();
  await page.getByRole('button', { name: /Set up real office/ }).click();
  await page.getByRole('button', { name: /Inspect installed GLB/ }).click();
  await expect(page.getByRole('heading', { name: 'Real office is not ready' })).toBeVisible();
  await page.getByRole('button', { name: 'Use labeled demo instead' }).click();
  await expect(page.getByRole('button', { name: /Enter Demo Office/ })).toBeVisible();
  expect(errors).toEqual([]);
});
test('narrow viewport touch fallback and accessible locations', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/?mode=demo');
  await page.getByRole('button', { name: 'Use touch / drag controls' }).click();
  await page.getByRole('button', { name: /Enter Demo Office/ }).click();
  await expect(page.getByRole('group', { name: 'Drag to move' })).toBeVisible();
  const pad = await page.getByRole('group', { name: 'Drag to move' }).boundingBox();
  await page.mouse.move(pad.x + 55, pad.y + 65); await page.mouse.down(); await page.mouse.move(pad.x + 55, pad.y + 15);
  await expect.poll(() => page.evaluate(() => window.__tour.snapshot().position[2])).toBeLessThan(3.5);
  await page.mouse.up();
  await page.getByRole('button', { name: 'Locations' }).click();
  await page.getByRole('button', { name: /Demo reception counter/ }).click();
  await expect(page.getByText(/procedural test object/)).toBeVisible();
  await page.screenshot({ path: `test-results/mobile-${test.info().project.name}.png` });
});
test('real GLB loads measured bounds but uncalibrated walkthrough stays disabled', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/models/real-office.glb', route => route.fulfill({ contentType: 'model/gltf-binary', body: glbFixture() }));
  await page.goto('/?mode=real&debug=colliders');
  await expect(page.getByText('Size X/Y/Z: 2.00 / 3.00 / 4.00')).toBeVisible();
  await expect(page.getByText('REAL ASSET — inspection only / not calibrated')).toBeVisible();
  await expect(page.getByRole('button', { name: /Enter Office/ })).toHaveCount(0);
  expect(errors).toEqual([]);
});
test('reticle hotspot selection releases capture and pauses movement', async ({ page }) => {
  await page.goto('/?mode=demo');
  const entry = page.getByRole('button', { name: /Enter Demo Office/ });
  const entryBox = await entry.boundingBox();
  await entry.click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement !== null)).toBe(true);
  await page.keyboard.down('a');
  await expect.poll(() => page.evaluate(() => window.__tour.snapshot().position[0]), { intervals: [16], timeout: 7000 }).toBeLessThan(-3.27);
  await page.keyboard.up('a'); await page.keyboard.down('w');
  await expect.poll(() => page.evaluate(() => window.__tour.snapshot().position[2]), { intervals: [16] }).toBeLessThan(2);
  await page.keyboard.up('w');
  // Aim from the observed position; software rendering may advance multiple physics
  // steps between key-up and the last read. Do not assume an exact stopped X.
  const pose = await page.evaluate(() => window.__tour.snapshot());
  const dx = -3.3 - pose.position[0], dz = 0.4 - pose.position[2];
  const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(-0.1, Math.hypot(dx, dz));
  await page.mouse.move(entryBox.x + entryBox.width / 2 - (yaw - pose.yaw) / 0.002, entryBox.y + entryBox.height / 2 - (pitch - pose.pitch) / 0.002);
  await expect.poll(() => page.evaluate(() => window.__tour.snapshot().target)).toBe('demo-counter-info');
  await page.mouse.down(); await page.mouse.up();
  await expect(page.getByRole('heading', { name: 'Demo reception counter' })).toBeVisible();
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
  await expect(page.getByRole('button', { name: 'Resume tour' })).toBeFocused();
});

