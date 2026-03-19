import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOTS_DIR = path.resolve(import.meta.dirname, "../screenshots");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function saveScreenshot(
  page: import("@playwright/test").Page,
  name: string,
) {
  ensureDir(SCREENSHOTS_DIR);
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
}

test.describe("Search Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("search input is visible and functional", async ({ page }) => {
    const searchInput = page.getByTestId("search-input");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("test query");
    await expect(searchInput).toHaveValue("test query");
  });

  test("search results appear after query", async ({ page }) => {
    const searchInput = page.getByTestId("search-input");
    await searchInput.fill("javascript");

    const searchResults = page.getByTestId("search-results");
    await expect(searchResults).toBeVisible();
    await saveScreenshot(page, "search-results");
  });

  test("search can be cleared", async ({ page }) => {
    const searchInput = page.getByTestId("search-input");
    await searchInput.fill("test");

    const clearButton = page.getByTestId("search-clear");
    await clearButton.click();
    await expect(searchInput).toHaveValue("");
  });

  test("search modal opens with keyboard shortcut", async ({ page }) => {
    await page.keyboard.press("Control+k");
    const searchModal = page.getByTestId("search-modal");
    await expect(searchModal).toBeVisible();
    await saveScreenshot(page, "search-modal");
  });

  test("search filters results by type", async ({ page }) => {
    const searchInput = page.getByTestId("search-input");
    await searchInput.fill("react");

    const filterButton = page.getByTestId("search-filter-questions");
    await filterButton.click();

    const results = page.getByTestId("search-results");
    await expect(results).toBeVisible();
  });

  test("search displays no results message", async ({ page }) => {
    const searchInput = page.getByTestId("search-input");
    await searchInput.fill("xyznonexistent123");
    await page.waitForTimeout(500);

    const noResults = page.getByTestId("search-no-results");
    await expect(noResults).toBeVisible();
  });

  test("search history is accessible", async ({ page }) => {
    const historyButton = page.getByTestId("search-history-button");
    await expect(historyButton).toBeVisible();
    await historyButton.click();

    const history = page.getByTestId("search-history");
    await expect(history).toBeVisible();
  });

  test("search result selection navigates", async ({ page }) => {
    const searchInput = page.getByTestId("search-input");
    await searchInput.fill("test");

    const firstResult = page.getByTestId("search-result-0");
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    await expect(page.getByTestId("page-title")).toBeVisible();
  });

  test("search loading state displays", async ({ page }) => {
    const searchInput = page.getByTestId("search-input");
    await searchInput.fill("loading test");

    const loading = page.getByTestId("search-loading");
    await expect(loading).toBeVisible();
  });
});
