import { chromium } from '@playwright/test';
import { writeFile, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.SAMPLE_PREVIEW_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}/tools/sample-office-preview.html`);
  await page.waitForFunction(() => window.sampleReady, { timeout: 60000 });
  const encoded = await page.evaluate(() => window.sampleOffice.export());
  const output = path.resolve('public/models/office.glb');
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, Buffer.from(encoded, 'base64'));
  const metadata = await page.evaluate(() => window.sampleOffice.loadExport());
  const colliders = await page.evaluate(() => window.sampleOffice.colliders);
  await mkdir('docs/sample-office', { recursive: true });
  await page.screenshot({ path: 'docs/sample-office/office-preview.png' });
  await page.evaluate(() => window.sampleOffice.view('wide'));
  await page.screenshot({ path: 'docs/sample-office/office-wide.png' });
  const manifest = { title: 'Image-inspired sample office', status: 'SAMPLE ONLY — not a scan or measured real office', modelUrl: '/models/office.glb', units: 'meters', upAxis: 'Y', floorY: 0, assumedRoom: { width: 12, depth: 15, height: 3.65 }, suggestedSamplePlayer: { spawn: [4.2, 0.85, 5.8], initialYaw: 0, eyeOffsetY: 0.75, radius: 0.3, capsuleHalfHeight: 0.5, speed: 2.7 }, bytes: (await stat(output)).size, ...metadata, colliders };
  await writeFile('docs/sample-office/office.config.json', JSON.stringify(manifest, null, 2) + '\n');
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(JSON.stringify({ output, bytes: manifest.bytes, meshes: metadata.meshes, triangles: metadata.triangles, colliders: colliders.length, errors }));
} finally { await browser.close(); }
