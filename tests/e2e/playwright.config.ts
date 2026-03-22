import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./devprep",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [{ name: "Chromium", use: { ...devices["Desktop Chrome"] } }],
});
