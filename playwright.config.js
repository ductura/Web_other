import { defineConfig, devices } from '@playwright/test';

const ci = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  retries: ci ? 1 : 0,
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'retain-on-failure' },
  webServer: { command: 'node dev-server.mjs', url: 'http://127.0.0.1:5173', reuseExistingServer: !ci },
  projects: [
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'safari', use: { ...devices['Desktop Safari'] } },
    { name: 'edge', use: { ...devices['Desktop Edge'], ...(ci ? { channel: 'msedge' } : {}) } },
    // Opera nema Playwright kanal; dijeli Chromium jezgru, pa je ovdje pokriva Chromium.
    { name: 'opera-chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
