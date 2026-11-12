// #region Imports
import { defineConfig, devices } from '@playwright/test';
// #endregion

// #region Configuration
export default defineConfig({
  testDir: './src/client/e2e',
  outputDir: '.dist/playwright',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://127.0.0.1:4242', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm exec ng serve client --host 127.0.0.1 --port 4242',
    url: 'http://127.0.0.1:4242',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
// #endregion
