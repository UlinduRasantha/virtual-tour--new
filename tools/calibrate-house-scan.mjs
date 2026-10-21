import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  await page.goto('http://127.0.0.1:5173/tools/private-scan-inspector.html');
  await page.locator('#file').setInputFiles(process.env.SCAN_INPUT || 'source-scans/house/10_14_2026-original.glb');
  await page.getByText('Scan loaded · original textures · unverified model units').waitFor({ timeout: 60000 });
  const position = JSON.parse(process.env.SCAN_CAMERA || '[0.6,0.1,24]');
  const target = JSON.parse(process.env.SCAN_TARGET || '[0.6,0.1,4]');
  await page.evaluate(({position, target}) => window.__scan.view(position, target), {position, target});
  if (process.env.SCAN_SLICE) await page.evaluate(level=>window.__scan.slice(level), Number(process.env.SCAN_SLICE));
  await page.locator('aside').evaluate(el => { el.style.display = 'none'; });
  await page.screenshot({ path: 'source-scans/house/calibration-view.png' });
  const picks = JSON.parse(process.env.SCAN_PICKS || '[]');
  const rays = JSON.parse(process.env.SCAN_RAYS || '[]');
  const result = await page.evaluate(({picks, rays}) => ({picks:picks.map(p => ({pixel:p, hits:window.__scan.pick(...p)})),rays:rays.map(r => ({ray:r,hits:window.__scan.ray(...r)}))}), {picks, rays});
  await writeFile('source-scans/house/calibration-probes.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally { await browser.close(); }
