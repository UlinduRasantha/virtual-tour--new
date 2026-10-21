import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', timeout: 60000, workers: 1,
  use: { baseURL: 'http://127.0.0.1:5173', viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure', launchOptions: { args: ['--enable-unsafe-swiftshader'] } },
  projects: [{ name: 'edge', use: { channel: 'msedge' } }, { name: 'chrome', use: { channel: 'chrome' } }],
  webServer: { command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
});
