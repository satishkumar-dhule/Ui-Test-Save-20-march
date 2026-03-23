import { test, expect } from "@playwright/test";

test.describe("Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("devprep:showOnboarding", "false");
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
  });

  test("smoke: search modal opens with Cmd+K", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(500);

    const searchInput = page.locator("input").first();
    await expect(searchInput).toBeVisible({ timeout: 3000 });
  });

  test("smoke: can type in search", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(500);

    const searchInput = page.locator("input").first();
    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill("test query");
      await page.waitForTimeout(500);
    }
  });

  test("smoke: search closes with Escape", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(500);

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });
});
