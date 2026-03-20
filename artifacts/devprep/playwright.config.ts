import { defineConfig, devices } from '@playwright/test'

const chromiumBin =
  process.env.CHROMIUM_BIN ||
  '/home/runner/workspace/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: 'test-results/html-report',
        open: 'never',
      },
    ],
    [
      'allure-playwright',
      {
        outputFolder: 'test-results/allure',
      },
    ],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      executablePath: chromiumBin,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: {
    command: 'cd /home/runner/workspace/artifacts/devprep && PORT=5174 pnpm dev',
    url: 'http://localhost:5174',
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      PORT: '5174',
    },
  },
})
