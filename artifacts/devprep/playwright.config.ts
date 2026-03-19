import { defineConfig, devices } from "@playwright/test";

const chromiumBin =
  process.env.CHROMIUM_BIN ||
  "/home/runner/workspace/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    launchOptions: {
      executablePath: chromiumBin,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  webServer: {
    command: "PORT=5173 BASE_PATH=/ pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      PORT: "5173",
      BASE_PATH: "/",
    },
  },
});
