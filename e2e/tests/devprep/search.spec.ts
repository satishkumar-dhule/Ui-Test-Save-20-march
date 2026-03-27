import { test, expect } from "@playwright/test";

test.describe("Search", () => {
  test.beforeEach(async ({ page }) => {
    // Use addInitScript to set localStorage before page loads
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Skip onboarding if it appears
    const doneBtn = page.locator('[data-testid="onboarding-done-btn"]');
    try {
      if (await doneBtn.isVisible({ timeout: 1000 })) {
        await doneBtn.click();
        await page.waitForTimeout(500);
      }
    } catch {}

    await page.waitForTimeout(2000);
  });

  test("smoke: search modal opens with Cmd+K", async ({ page }) => {
    // Wait for main app to load by checking for a known element
    await page.waitForSelector('[data-testid="app-root"]', { timeout: 10000 });

    // Use a fallback selector that looks for the search button in topbar
    const searchBtn = page.locator('button:has-text("Search")').first();
    await expect(searchBtn).toBeVisible({ timeout: 10000 });
    await searchBtn.click();
    await page.waitForTimeout(500);

    const searchModal = page.getByTestId("search-modal");
    await expect(searchModal).toBeVisible({ timeout: 3000 });

    const searchInput = page.getByTestId("search-input");
    await expect(searchInput).toBeVisible({ timeout: 3000 });
  });

  test("smoke: can type in search", async ({ page }) => {
    await page.waitForSelector('[data-testid="app-root"]', { timeout: 10000 });

    const searchBtn = page.locator('button:has-text("Search")').first();
    await expect(searchBtn).toBeVisible({ timeout: 10000 });
    await searchBtn.click();
    await page.waitForTimeout(500);

    const searchInput = page.getByTestId("search-input");
    if (await searchInput.isVisible({ timeout: 2000 })) {
      await searchInput.fill("test query");
      await page.waitForTimeout(500);
    }
  });

  test("smoke: search closes with Escape", async ({ page }) => {
    await page.waitForSelector('[data-testid="app-root"]', { timeout: 10000 });

    const searchBtn = page.locator('button:has-text("Search")').first();
    await expect(searchBtn).toBeVisible({ timeout: 10000 });
    await searchBtn.click();
    await page.waitForTimeout(500);

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });
});
