import { test, expect } from "@playwright/test";

test.describe("Visual Regression Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.reload();
  });

  test("onboarding modal visual snapshot", async ({ page }) => {
    await expect(page.getByTestId("onboarding-modal")).toBeVisible();
    await page.waitForTimeout(500);

    const modal = page.getByTestId("onboarding-modal");
    await expect(modal).toHaveScreenshot("onboarding-modal.png", {
      maxDiffPixelRatio: 0.1,
    });
  });

  test("app root after onboarding", async ({ page }) => {
    const jsChannel = page.getByTestId("onboarding-channel-javascript");
    await jsChannel.click();

    const doneBtn = page.getByTestId("onboarding-done-btn");
    await doneBtn.click();

    await page.waitForTimeout(1000);

    await expect(page.getByTestId("app-root")).toBeVisible();

    const appRoot = page.getByTestId("app-root");
    await expect(appRoot).toHaveScreenshot("app-root.png", {
      maxDiffPixelRatio: 0.1,
    });
  });

  test("channel selection visual states", async ({ page }) => {
    const reactChannel = page.getByTestId("onboarding-channel-react");
    await reactChannel.click();
    await page.waitForTimeout(300);

    await expect(reactChannel).toHaveScreenshot("channel-selected.png", {
      maxDiffPixelRatio: 0.1,
    });
  });

  test("QA page navigation", async ({ page }) => {
    await page.goto("/qa");
    await page.waitForTimeout(500);

    const qaContent = page.locator("main");
    await expect(qaContent).toHaveScreenshot("qa-page.png", {
      maxDiffPixelRatio: 0.1,
    });
  });

  test("flashcards page", async ({ page }) => {
    await page.goto("/flashcards");
    await page.waitForTimeout(500);

    const flashcardContent = page.locator("main");
    await expect(flashcardContent).toHaveScreenshot("flashcards-page.png", {
      maxDiffPixelRatio: 0.1,
    });
  });

  test("dark mode theme toggle", async ({ page }) => {
    await page.goto("/qa");

    const themeToggle = page.getByTestId("theme-toggle");
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(300);

      await expect(page.locator("body")).toHaveScreenshot("dark-mode.png", {
        maxDiffPixelRatio: 0.1,
      });
    }
  });
});
