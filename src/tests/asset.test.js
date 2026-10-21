import { afterEach, expect, test, vi } from 'vitest';
import { inspectAsset } from '../utils/inspectAsset.js';
afterEach(() => vi.unstubAllGlobals());
test('missing and HTML fallback assets fail clearly', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));
  await expect(inspectAsset('/models/real-office.glb')).rejects.toThrow('HTTP 404');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new TextEncoder().encode('<!doctype html>missing asset').buffer }));
  await expect(inspectAsset('/models/real-office.glb')).rejects.toThrow('Not a valid GLB');
});
