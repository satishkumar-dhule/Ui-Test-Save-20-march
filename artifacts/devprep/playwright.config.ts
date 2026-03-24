import { defineConfig, devices } from '@playwright/test'

const chromiumBin =
  process.env.CHROMIUM_BIN ||
  '/home/runner/workspace/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome'

const launchOptions = {
  executablePath: chromiumBin,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions,
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        launchOptions,
      },
    },
    {
      name: 'mobile-iphone',
      use: {
        ...devices['iPhone 14'],
        launchOptions,
      },
    },
    {
      name: 'mobile-android',
      use: {
        ...devices['Pixel 7'],
        launchOptions,
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
