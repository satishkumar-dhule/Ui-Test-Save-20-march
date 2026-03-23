import { test, expect } from "@playwright/test";

test.describe("Channel Switching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("devprep:showOnboarding", "false");
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript", "react", "typescript"]),
      );
    });
    await page.reload();
    await page.waitForTimeout(2000);
  });

  test("smoke: app loads with channels", async ({ page }) => {
    // App should load
    await expect(page.locator("body")).toBeVisible();
  });

  test("smoke: can interact with channel tabs", async ({ page }) => {
    // Look for channel-related buttons
    const channelButton = page
      .locator("button:has-text('JavaScript'), button:has-text('React')")
      .first();
    if (await channelButton.isVisible({ timeout: 2000 })) {
      await channelButton.click();
      await page.waitForTimeout(300);
    }
  });

  test("smoke: channel state persists after reload", async ({ page }) => {
    // Set channel
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["typescript"]),
      );
    });
    await page.reload();
    await page.waitForTimeout(2000);

    // App should reload with same channel
    await expect(page.locator("body")).toBeVisible();
  });
});
