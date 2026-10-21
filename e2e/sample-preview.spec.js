import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

test('direct file preview explains how to start the server', async ({ page }) => {
  await page.goto(pathToFileURL(path.resolve('tools/sample-office-preview.html')).href);
  await expect(page.getByRole('heading', { name: 'Open this preview through the local server' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open local preview' })).toHaveAttribute('href', 'http://127.0.0.1:5173/tools/sample-office-preview.html');
});

test('server preview renders and clears its loading message', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tools/sample-office-preview.html');
  await page.waitForFunction(() => window.sampleReady === true);
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#preview-status')).toBeHidden();
  await page.setViewportSize({ width: 1000, height: 700 });
  await expect.poll(() => page.locator('canvas').evaluate(canvas => canvas.clientWidth)).toBe(1000);
  expect(errors).toEqual([]);
});
