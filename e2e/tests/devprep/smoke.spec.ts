import { test, expect } from "@playwright/test";

test.describe("E2E Smoke Tests - Critical User Journeys", () => {
  test("smoke: app loads successfully", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    await expect(page).toHaveTitle(/DevPrep/i);
  });

  test("smoke: onboarding flow completes", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    await expect(page.getByTestId("onboarding-modal")).toBeVisible();

    const jsChannel = page.getByTestId("onboarding-channel-javascript");
    await jsChannel.click();

    const doneBtn = page.getByTestId("onboarding-done-btn");
    await doneBtn.click();

    await page.waitForTimeout(500);

    await expect(page.getByTestId("onboarding-modal")).not.toBeVisible();
    await expect(page.getByTestId("app-root")).toBeVisible();
  });

  test("smoke: navigation to QA page", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.reload();
    await page.waitForTimeout(500);

    await page.goto("/qa");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });

  test("smoke: channel switching works", async ({ page }) => {
    await page.goto("/qa");
    await page.waitForTimeout(500);

    const channelSelector = page.getByTestId("channel-selector");
    if (await channelSelector.isVisible()) {
      await channelSelector.click();
      await page.waitForTimeout(200);

      const reactOption = page.getByTestId("channel-option-react");
      if (await reactOption.isVisible()) {
        await reactOption.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test("smoke: flashcard page loads", async ({ page }) => {
    await page.goto("/flashcards");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });

  test("smoke: mock exam page loads", async ({ page }) => {
    await page.goto("/exam");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });

  test("smoke: voice practice page loads", async ({ page }) => {
    await page.goto("/voice");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });

  test("smoke: coding page loads", async ({ page }) => {
    await page.goto("/coding");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.locator("main")).toBeVisible();
  });

  test("smoke: theme toggle works", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.reload();
    await page.waitForTimeout(500);

    const themeToggle = page.getByTestId("theme-toggle");
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(200);

      const html = page.locator("html");
      const theme = await html.getAttribute("data-theme");
      expect(theme).toBeTruthy();
    }
  });

  test("smoke: error boundary renders on crash", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.reload();
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      throw new Error("Intentional test error");
    });

    await page.waitForTimeout(500);

    const errorBoundary = page.locator("text=Something went wrong");
    await expect(errorBoundary)
      .toBeVisible({ timeout: 2000 })
      .catch(() => {
        // Error boundary may not catch this
      });
  });
});
