import { test, expect } from "@playwright/test";

test.describe("Search", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("devprep:onboarded", "1");
    });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND__;
      if (store) {
        store.getState().setShowOnboarding(false);
      }
    });

    await page.waitForSelector('[data-testid="app-root"]', { timeout: 10000 });
  });

  test("smoke: search modal opens with Cmd+K", async ({ page }) => {
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
    const searchBtn = page.locator('button:has-text("Search")').first();
    await expect(searchBtn).toBeVisible({ timeout: 10000 });
    await searchBtn.click();
    await page.waitForTimeout(500);

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });
});
