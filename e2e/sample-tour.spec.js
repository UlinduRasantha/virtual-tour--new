import { test, expect } from '@playwright/test';

const snapshot = page => page.evaluate(() => window.__tour.snapshot());
async function moveUntil(page, key, condition, timeout = 18000) {
  await expect.poll(async () => (await snapshot(page)).state).toBe('exploring');
  await page.keyboard.down(key);
  try { await expect.poll(async () => condition(await snapshot(page)), { intervals: [16], timeout }).toBe(true); }
  finally { await page.keyboard.up(key); }
}

test('sample GLB walkthrough has collisions, an open doorway, pause/resume and reset', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?mode=sample');
  const entry = page.getByRole('button', { name: /Enter Sample Office/ });
  await expect(entry).toBeVisible();
  await expect(page.getByText('SAMPLE OFFICE — image-inspired demo, not a real scan')).toBeVisible();
  await page.screenshot({ path: `test-results/sample-welcome-${test.info().project.name}.png` });
  await entry.click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement?.tagName)).toBe('CANVAS');
  await page.screenshot({ path: `test-results/sample-walkthrough-${test.info().project.name}.png` });

  // Right wall blocks strafe; then reset to the aisle before testing the doorway route.
  await moveUntil(page, 'd', s => s.position[0] > 5.55);
  expect((await snapshot(page)).position[0]).toBeLessThan(5.63);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /Resume tour/ })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset to entrance' }).click();
  await expect.poll(async () => (await snapshot(page)).position[0]).toBeCloseTo(4.2);
  await page.getByRole('button', { name: /Resume tour/ }).click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement !== null)).toBe(true);

  await moveUntil(page, 'w', s => s.position[2] < -5.05);
  expect((await snapshot(page)).position[2]).toBeGreaterThan(-5.3);
  await moveUntil(page, 'a', s => s.position[0] < -3.8);
  if ((await snapshot(page)).position[0] < -4.16) await moveUntil(page, 'd', s => s.position[0] > -4);
  await moveUntil(page, 'w', s => s.position[2] < -8.25);
  expect((await snapshot(page)).position[2]).toBeGreaterThan(-8.5);
  await moveUntil(page, 's', s => s.position[2] > -6.4);

  // Mouse look changes orientation without translating the body.
  const before = await snapshot(page);
  await page.mouse.move(850, 450);
  await expect.poll(async () => (await snapshot(page)).yaw).not.toBeCloseTo(before.yaw);
  expect((await snapshot(page)).position[2]).toBeCloseTo(before.position[2]);
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').getByRole('button', { name: 'Reset to entrance' }).click();
  await expect.poll(async () => (await snapshot(page)).position[2]).toBeCloseTo(5.8);
  await expect.poll(async () => (await snapshot(page)).yaw).toBeCloseTo(0);
  expect(errors).toEqual([]);
});

test('sample hotspot reticle opens the matching info dialog and stops movement', async ({ page }) => {
  await page.goto('/?mode=sample');
  const entry = page.getByRole('button', { name: /Enter Sample Office/ });
  await expect(entry).toBeVisible(); const rect = await entry.boundingBox();
  await entry.click();
  await expect.poll(() => page.evaluate(() => document.pointerLockElement !== null)).toBe(true);
  await moveUntil(page, 'w', s => s.position[2] < 1.7);
  const pose = await snapshot(page), dx = 3.05 - pose.position[0], dz = 0.6 - pose.position[2];
  const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(-0.3, Math.hypot(dx, dz));
  await page.mouse.move(rect.x + rect.width / 2 - (yaw - pose.yaw) / 0.002, rect.y + rect.height / 2 - (pitch - pose.pitch) / 0.002);
  await expect.poll(async () => (await snapshot(page)).target).toBe('sample-workbenches');
  await page.mouse.down(); await page.mouse.up();
  await expect(page.getByRole('heading', { name: 'Shared workbenches' })).toBeVisible();
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
  await expect(page.getByRole('button', { name: 'Resume tour' })).toBeFocused();
  const stopped = await snapshot(page);
  await page.keyboard.press('w');
  expect((await snapshot(page)).position).toEqual(stopped.position);
});

test('sample touch controls move and look, then pause and show all four locations', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?mode=sample');
  await page.getByRole('button', { name: 'Use touch / drag controls' }).click();
  await page.getByRole('button', { name: /Enter Sample Office/ }).click();
  expect(await page.evaluate(() => document.pointerLockElement)).toBeNull();
  const pad = await page.getByRole('group', { name: 'Drag to move' }).boundingBox();
  await page.mouse.move(pad.x + 55, pad.y + 70); await page.mouse.down(); await page.mouse.move(pad.x + 55, pad.y + 15);
  await expect.poll(async () => (await snapshot(page)).position[2]).toBeLessThan(5.1);
  await page.mouse.up();
  const before = await snapshot(page), look = await page.getByRole('group', { name: 'Drag to look' }).boundingBox();
  await page.mouse.move(look.x + 30, look.y + 40); await page.mouse.down(); await page.mouse.move(look.x + 90, look.y + 60, { steps: 5 }); await page.mouse.up();
  await expect.poll(async () => (await snapshot(page)).yaw).not.toBeCloseTo(before.yaw);
  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: /Resume tour/ }).click();
  await page.getByRole('button', { name: 'Locations' }).click();
  await expect(page.getByRole('button', { name: /Read more/ })).toHaveCount(4);
  await page.getByRole('button', { name: /Open doorway/ }).click();
  await expect(page.getByText(/short vestibule/)).toBeVisible();
  await page.screenshot({ path: `test-results/sample-mobile-${test.info().project.name}.png` });
});
