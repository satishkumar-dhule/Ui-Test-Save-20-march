import { chromium } from "playwright";

async function testSearch() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const consoleMessages = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
      });
    }
  });

  page.on("pageerror", (error) => {
    errors.push({ message: error.message, stack: error.stack });
  });

  console.log("Opening app at http://localhost:5173...");
  await page.goto("http://localhost:5173", { waitUntil: "networkidle" });

  // Wait for app to load
  await page.waitForTimeout(2000);

  // Take initial screenshot
  await page.screenshot({
    path: "/home/runner/workspace/artifacts/01_initial.png",
  });
  console.log("Screenshot saved: 01_initial.png");

  // Try Cmd+K to open search
  console.log("Testing Cmd+K shortcut...");
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "/home/runner/workspace/artifacts/02_cmdk.png",
  });

  // Try Ctrl+K as well (for Linux)
  await page.keyboard.press("Control+k");
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: "/home/runner/workspace/artifacts/03_ctrlk.png",
  });

  // Look for search button and click it
  console.log("Looking for search button...");
  const searchButtons = await page
    .locator("button")
    .filter({ hasText: /search|search/i })
    .all();
  console.log(`Found ${searchButtons.length} search buttons`);

  if (searchButtons.length > 0) {
    await searchButtons[0].click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: "/home/runner/workspace/artifacts/04_search_click.png",
    });
  }

  // Also look for any element with kbd icon (common for search shortcut display)
  const kbdElements = await page
    .locator('[class*="kbd"], [class*="shortcut"]')
    .all();
  console.log(`Found ${kbdElements.length} kbd/shortcut elements`);

  // Try to find any search input
  const searchInputs = await page
    .locator(
      'input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]',
    )
    .all();
  console.log(`Found ${searchInputs.length} search inputs`);

  if (searchInputs.length > 0) {
    await searchInputs[0].click();
    await searchInputs[0].fill("test query");
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: "/home/runner/workspace/artifacts/05_search_query.png",
    });
  }

  // Print all collected errors
  console.log("\n=== Console Errors ===");
  consoleMessages.forEach((msg, i) => {
    console.log(`[${i + 1}] ${msg.type}: ${msg.text}`);
    if (msg.location) {
      console.log(`    Location: ${JSON.stringify(msg.location)}`);
    }
  });

  console.log("\n=== Page Errors ===");
  errors.forEach((err, i) => {
    console.log(`[${i + 1}] ${err.message}`);
    console.log(`    Stack: ${err.stack}`);
  });

  await browser.close();

  // Return structured bug report
  return {
    consoleErrors: consoleMessages,
    pageErrors: errors,
  };
}

testSearch().catch(console.error);
