import { defineConfig } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);

/*
 * End-to-end tests (`npm run test:e2e`). They need a migrated and seeded database (see README) and a
 * production build (`npm run build`); the config starts `next start` itself. Set `PW_CHROMIUM_PATH`
 * to use an already installed Chromium instead of the one `npx playwright install` downloads.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  webServer: {
    command: `npx next start -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { AUTH_TRUST_HOST: "true" },
  },
});
