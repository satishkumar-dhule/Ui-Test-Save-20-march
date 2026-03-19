const { chromium } = require("playwright-core");

async function testSearch() {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      "/home/runner/workspace/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
    ],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const consoleMessages = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    }
  });

  page.on("pageerror", (error) => {
    errors.push({ message: error.message, stack: error.stack });
  });

  console.log("Opening app at http://localhost:5173...");
  await page.goto("http://localhost:5173", { waitUntil: "networkidle" });

  await new Promise((r) => setTimeout(r, 2000));

  await page.screenshot({
    path: "/home/runner/workspace/artifacts/01_initial.png",
    fullPage: true,
  });
  console.log("Screenshot saved: 01_initial.png");

  // Try Cmd+K
  console.log("Testing Cmd+K...");
  await page.keyboard.press("Meta+k");
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({
    path: "/home/runner/workspace/artifacts/02_cmdk.png",
    fullPage: true,
  });

  // Try Ctrl+K
  await page.keyboard.press("Control+k");
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({
    path: "/home/runner/workspace/artifacts/03_ctrlk.png",
    fullPage: true,
  });

  // Look for search button
  console.log("Looking for search button...");
  const buttons = await page.$$("button");
  console.log(`Found ${buttons.length} buttons`);

  for (const btn of buttons) {
    const text = await btn.evaluate((el) => el.textContent);
    console.log(`Button: "${text}"`);
  }

  // Click the first button that looks like search
  const searchBtns = await page.$$("button");
  for (const btn of searchBtns) {
    const text = await btn.evaluate((el) => el.textContent.toLowerCase());
    if (text.includes("search")) {
      await btn.click();
      await new Promise((r) => setTimeout(r, 1000));
      await page.screenshot({
        path: "/home/runner/workspace/artifacts/04_search_click.png",
        fullPage: true,
      });
      break;
    }
  }

  // Look for search input
  const searchInputs = await page.$$("input");
  for (const input of searchInputs) {
    const type = await input.evaluate((el) => el.type);
    const placeholder = await input.evaluate((el) => el.placeholder);
    console.log(`Input: type="${type}", placeholder="${placeholder}"`);
  }

  // Try typing in any search input
  const input = await page.$(
    'input[placeholder*="search" i], input[type="search"]',
  );
  if (input) {
    await input.click({ clickCount: 3 });
    await input.type("test query");
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({
      path: "/home/runner/workspace/artifacts/05_search_query.png",
      fullPage: true,
    });
  }

  console.log("\n=== Console Errors ===");
  consoleMessages.forEach((msg, i) => {
    console.log(`[${i + 1}] ${msg.type}: ${msg.text}`);
  });

  console.log("\n=== Page Errors ===");
  errors.forEach((err, i) => {
    console.log(`[${i + 1}] ${err.message}`);
    if (err.stack) console.log(`    Stack: ${err.stack}`);
  });

  await browser.close();
  return { consoleErrors: consoleMessages, pageErrors: errors };
}

testSearch().catch(console.error);
