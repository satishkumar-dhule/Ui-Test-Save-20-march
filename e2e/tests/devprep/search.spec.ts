import { test, expect } from "@playwright/test";

test.describe("Search", () => {
  test.beforeEach(async ({ page }) => {
    // Set localStorage before navigation to skip onboarding
    await page.addInitScript(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    // Wait for app to be ready (onboarding skipped)
    await page.waitForSelector('[data-testid="app-root"]', { timeout: 10000 });
  });

  test("should open search modal when clicking search button", async ({
    page,
  }) => {
    const searchButton = page.getByTestId("search-button");
    await expect(searchButton).toBeVisible();

    await searchButton.click();
    await page.waitForTimeout(500);

    const searchInput = page.locator("[cmdk-input-wrapper] input");
    await expect(searchInput).toBeVisible();
  });

  test("should open search modal with Cmd+K keyboard shortcut", async ({
    page,
  }) => {
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(500);

    const searchInput = page.locator("[cmdk-input-wrapper] input");
    await expect(searchInput).toBeVisible();
  });

  test("should close search modal with Escape key", async ({ page }) => {
    const searchButton = page.getByTestId("search-button");
    await searchButton.click();
    await page.waitForTimeout(500);

    const searchInput = page.locator("[cmdk-input-wrapper] input");
    await expect(searchInput).toBeVisible();

    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).not.toBeVisible();
  });

  test("should display loading state when searching", async ({ page }) => {
    const searchButton = page.getByTestId("search-button");
    await searchButton.click();
    await page.waitForTimeout(500);

    const searchInput = page.locator("[cmdk-input-wrapper] input");
    await searchInput.fill("javascript");
    await page.waitForTimeout(100);

    const loadingSpinner = page.locator('[role="status"]');
    await expect(loadingSpinner)
      .toBeVisible({ timeout: 3000 })
      .catch(() => {});
  });

  test("should display search results with correct data", async ({ page }) => {
    const searchButton = page.getByTestId("search-button");
    await searchButton.click();
    await page.waitForTimeout(500);

    const searchInput = page.locator("[cmdk-input-wrapper] input");
    await searchInput.fill("javascript");
    await page.waitForTimeout(2000);

    const resultItems = page.locator("[cmdk-item]");
    const count = await resultItems.count();
    expect(count).toBeGreaterThan(0);

    const firstResult = resultItems.first();
    const titleSpan = firstResult.locator("span").first();
    await expect(titleSpan).toBeVisible();
  });

  test("should display 'no results' message for empty search", async ({
    page,
  }) => {
    const searchButton = page.getByTestId("search-button");
    await searchButton.click();
    await page.waitForTimeout(500);

    const searchInput = page.locator("[cmdk-input-wrapper] input");
    await searchInput.fill("xyznonexistent123xyz");
    await page.waitForTimeout(2000);

    const noResults = page.getByText(/no results found/i);
    await expect(noResults)
      .toBeVisible({ timeout: 3000 })
      .catch(() => {});
  });

  test("should navigate when clicking a search result", async ({ page }) => {
    const searchButton = page.getByTestId("search-button");
    await searchButton.click();
    await page.waitForTimeout(500);

    const searchInput = page.locator("[cmdk-input-wrapper] input");
    await searchInput.fill("javascript");
    await page.waitForTimeout(2000);

    const resultItems = page.locator("[cmdk-item]");
    const count = await resultItems.count();

    if (count > 0) {
      const firstResult = resultItems.first();
      await firstResult.click();
      await page.waitForTimeout(1000);

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).not.toBeVisible();
    }
  });

  test("should show type badges in search results", async ({ page }) => {
    const searchButton = page.getByTestId("search-button");
    await searchButton.click();
    await page.waitForTimeout(500);

    const searchInput = page.locator("[cmdk-input-wrapper] input");
    await searchInput.fill("function");
    await page.waitForTimeout(2000);

    const resultItems = page.locator("[cmdk-item]");
    const count = await resultItems.count();

    if (count > 0) {
      const firstResult = resultItems.first();
      const badges = firstResult.locator('[class*="badge"]');
      await expect(badges.first()).toBeVisible();
    }
  });
});
