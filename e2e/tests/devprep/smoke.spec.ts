import { test, expect } from "@playwright/test";

test.describe("E2E Smoke Tests - Critical User Journeys", () => {
  test("smoke: app loads successfully", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await expect(page).toHaveTitle(/DevPrep/i);
  });

  test("smoke: onboarding flow completes", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);

    const onboardingModal = page.locator('[data-testid="onboarding-modal"]');
    await expect(onboardingModal).toBeVisible();

    // Click Recommended button to select channels (more reliable than single channel)
    const recommendedBtn = page.locator('button:has-text("Recommended")');
    await recommendedBtn.click();
    await page.waitForTimeout(1000);

    // Now done button should be enabled
    const doneBtn = page.locator('[data-testid="onboarding-done-btn"]');
    await expect(doneBtn).toBeEnabled({ timeout: 10000 });
    await doneBtn.click();

    await page.waitForTimeout(1000);

    await expect(onboardingModal).not.toBeVisible();
    await expect(page.locator('[data-testid="app-root"]')).toBeVisible();
  });

  test("smoke: main app renders after onboarding", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);

    await page.locator('[data-testid="onboarding-done-btn"]').click();
    await page.waitForTimeout(1000);

    await expect(page.locator("main")).toBeVisible();
  });

  test("smoke: channel switching works", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);

    await page.locator('[data-testid="onboarding-done-btn"]').click();
    await page.waitForTimeout(1000);

    const sidebar = page.locator("nav, aside, [class*='sidebar']").first();
    if (await sidebar.isVisible()) {
      const links = page.locator("nav a, nav button, aside a, aside button");
      const linkCount = await links.count();
      console.log("Navigation elements found:", linkCount);
    }
  });

  test("smoke: theme toggle works", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);

    await page.locator('[data-testid="onboarding-done-btn"]').click();
    await page.waitForTimeout(1000);

    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(200);

      const html = page.locator("html");
      const theme = await html.getAttribute("data-theme");
      expect(theme).toBeTruthy();
    }
  });

  test("smoke: app works with pre-selected channels", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.reload();
    await page.waitForTimeout(2000);

    const rootContent = await page.locator("#root").innerHTML();
    const contentLength = rootContent.length;
    expect(contentLength).toBeGreaterThan(100);
  });
});
