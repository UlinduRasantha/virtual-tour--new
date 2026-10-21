import { chromium, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

// Inspection-only: the private scan is intercepted in this browser session.
// Nothing is copied to public/ or made available through the Vite server.
const input = path.resolve('source-scans/house/10_14_2026-original.glb');
const binary = await readFile(input);
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/models/real-office.glb', route => route.fulfill({ contentType: 'model/gltf-binary', body: binary }));
  await page.goto('http://127.0.0.1:5173/?mode=real');
  await page.getByText('GLB inspector · meters / Y-up').waitFor({ timeout: 60000 });
  await page.screenshot({ path: 'source-scans/house/inspection.png' });
  const text = await page.locator('.inspector').innerText();
  await page.goto('http://127.0.0.1:5173/tools/private-scan-inspector.html');
  await page.locator('#file').setInputFiles(input);
  await page.getByText('Scan loaded · original textures · unverified model units').waitFor({ timeout: 60000 });
  await page.screenshot({ path: 'source-scans/house/textured-inspection.png' });
  await page.getByRole('button', { name: 'Top view', exact: true }).click();
  await page.screenshot({ path: 'source-scans/house/top-inspection.png' });
  assert.equal(await page.getByRole('button', { name: 'Main entrance', exact: true }).isEnabled(), true);
  await page.getByRole('button', { name: 'Main entrance', exact: true }).click();
  await page.screenshot({ path: 'source-scans/house/main-entrance.png' });
  await page.locator('#file').setInputFiles('public/models/office.glb');
  await page.getByText('Scan loaded · original textures · unverified model units').waitFor({ timeout: 60000 });
  await expect(page.getByRole('button', { name: 'Main entrance', exact: true })).toBeDisabled();
  await expect(page.locator('#calibration')).toBeEmpty();
  const result = { originalFilename: '10_14_2026.glb', type: 'User-provided iPhone LiDAR house scan', bytes: binary.length, sha256: createHash('sha256').update(binary).digest('hex'), loadedInBrowser: true, errors, inspector: text, publishApproved: false, scaleVerified: false, spawnVerified: false };
  await writeFile('source-scans/house/inspection.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
  if (errors.length) process.exitCode = 1;
} finally { await browser.close(); }
