import { defineConfig, devices } from "@playwright/test";

// e2e against a production build of this app and the fake Institution_server
// (tests/e2e/lazni-server.mjs). Ports differ from dev (5173) so both can run.
const ci = Boolean(process.env.CI);
const LAZNI = 4199;
const APP = 5178;

export default defineConfig({
  testDir: "tests/e2e",
  retries: ci ? 1 : 0,
  use: { baseURL: `http://localhost:${APP}`, trace: "retain-on-failure" },
  webServer: [
    {
      command: "node tests/e2e/lazni-server.mjs",
      env: { LAZNI_PORT: String(LAZNI) },
      url: `http://127.0.0.1:${LAZNI}/__zdravlje`,
      reuseExistingServer: false,
    },
    {
      command: `pnpm build && pnpm exec next start -H 127.0.0.1 -p ${APP}`,
      env: { INSTITUTION_SERVER_URL: `http://127.0.0.1:${LAZNI}`, NEXT_TELEMETRY_DISABLED: "1" },
      port: APP,
      timeout: 240_000,
      reuseExistingServer: false,
    },
  ],
  projects: [
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "safari", use: { ...devices["Desktop Safari"] } },
    { name: "edge", use: { ...devices["Desktop Edge"], ...(ci ? { channel: "msedge" } : {}) } },
    // Opera nema Playwright kanal; dijeli Chromium jezgru, pa je ovdje pokriva Chromium.
    { name: "opera-chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
