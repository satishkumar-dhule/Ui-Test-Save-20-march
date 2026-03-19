import puppeteer, { Browser, BrowserContext, Page } from "puppeteer";

const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

async function setupBrowser(): Promise<Browser> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/home/runner/.nix-profile/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  return browser;
}

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  error?: string;
}

async function runTests() {
  console.log("Starting search e2e tests...\n");
  const browser = await setupBrowser();
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: (page: Page) => Promise<void>) {
    const context: BrowserContext =
      await browser.createIncognitoBrowserContext();
    const page: Page = await context.newPage();
    try {
      await fn(page);
      console.log(`✓ ${name}`);
      passed++;
      results.push({ name, status: "PASS" });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log(`✗ ${name}`);
      console.log(`  Error: ${errorMessage}`);
      failed++;
      results.push({ name, status: "FAIL", error: errorMessage });
    } finally {
      await context.close();
    }
  }

  // Setup - navigate to app and bypass onboarding
  async function setupPage(page: Page) {
    await page.goto(BASE_URL, { waitUntil: "networkidle0" });
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.reload({ waitUntil: "networkidle0" });
    await page.waitForTimeout(1000);
  }

  // Test 1: Open search modal via button click
  await test("should open search modal when clicking search button", async (page: Page) => {
    await setupPage(page);
    await page.waitForSelector('[data-testid="search-button"]');
    await page.click('[data-testid="search-button"]');
    await page.waitForTimeout(500);
    const input = await page.locator("[cmdk-input-wrapper] input").isVisible();
    if (!input)
      throw new Error("Search input not visible after clicking button");
  });

  // Test 2: Open search modal via Cmd+K
  await test("should open search modal with Cmd+K keyboard shortcut", async (page: Page) => {
    await setupPage(page);
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(500);
    const input = await page.locator("[cmdk-input-wrapper] input").isVisible();
    if (!input) throw new Error("Search input not visible after Cmd+K");
  });

  // Test 3: Close modal with Escape
  await test("should close search modal with Escape key", async (page: Page) => {
    await setupPage(page);
    await page.click('[data-testid="search-button"]');
    await page.waitForTimeout(500);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    const dialog = await page.locator('[role="dialog"]').isVisible();
    if (dialog) throw new Error("Dialog still visible after Escape");
  });

  // Test 4: Display loading state
  await test("should display loading state when searching", async (page: Page) => {
    await setupPage(page);
    await page.click('[data-testid="search-button"]');
    await page.waitForTimeout(500);
    const input = page.locator("[cmdk-input-wrapper] input");
    await input.type("javascript");
    await page.waitForTimeout(200);
    const loading = await page.locator('[role="status"]').isVisible();
    if (!loading) throw new Error("Loading state not visible");
  });

  // Test 5: Display search results
  await test("should display search results with correct data", async (page: Page) => {
    await setupPage(page);
    await page.click('[data-testid="search-button"]');
    await page.waitForTimeout(500);
    const input = page.locator("[cmdk-input-wrapper] input");
    await input.type("javascript");
    await page.waitForTimeout(2000);
    const count = await page.locator("[cmdk-item]").count();
    if (count === 0) throw new Error("No search results found");
  });

  // Test 6: No results message
  await test("should display 'no results' message for empty search", async (page: Page) => {
    await setupPage(page);
    await page.click('[data-testid="search-button"]');
    await page.waitForTimeout(500);
    const input = page.locator("[cmdk-input-wrapper] input");
    await input.type("xyznonexistent999");
    await page.waitForTimeout(2000);
    const noResults = await page.getByText(/no results found/i).isVisible();
    if (!noResults) throw new Error("No results message not visible");
  });

  // Test 7: Click result closes modal
  await test("should navigate when clicking a search result", async (page: Page) => {
    await setupPage(page);
    await page.click('[data-testid="search-button"]');
    await page.waitForTimeout(500);
    const input = page.locator("[cmdk-input-wrapper] input");
    await input.type("javascript");
    await page.waitForTimeout(2000);
    const items = page.locator("[cmdk-item]");
    const count = await items.count();
    if (count > 0) {
      await items.first().click();
      await page.waitForTimeout(1000);
      const dialog = await page.locator('[role="dialog"]').isVisible();
      if (dialog) throw new Error("Dialog still visible after clicking result");
    }
  });

  // Test 8: Type badges in results
  await test("should show type badges in search results", async (page: Page) => {
    await setupPage(page);
    await page.click('[data-testid="search-button"]');
    await page.waitForTimeout(500);
    const input = page.locator("[cmdk-input-wrapper] input");
    await input.type("function");
    await page.waitForTimeout(2000);
    const items = page.locator("[cmdk-item]");
    const count = await items.count();
    if (count === 0) throw new Error("No results found");
    const firstBadge = await items.first().locator('[class*="badge"]').count();
    if (firstBadge === 0) throw new Error("No badge found in result");
  });

  await browser.close();

  console.log("\n" + "=".repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(50));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test runner error:", e);
  process.exit(1);
});
