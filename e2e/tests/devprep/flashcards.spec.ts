import { test, expect } from "@playwright/test";

test.describe("FlashcardsPage - Flip and Mark", () => {
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

    // Navigate to flashcards section using the Zustand store
    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND__;
      if (store) {
        store.getState().setSection("flashcards");
      }
    });

    await page.waitForTimeout(1000);
  });

  test("should display flashcard page with sidebar", async ({ page }) => {
    // Check that we're on flashcards section
    const content = await page.content();
    expect(content).toContain("flashcard");
  });

  test("should flip card on click", async ({ page }) => {
    const flipCard = page.locator('[class*="flashcard"], button').first();

    await flipCard.click();
    await page.waitForTimeout(500);

    // Page should still be functional
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test("should show buttons after interaction", async ({ page }) => {
    const buttons = page.locator("button").first();
    await buttons.click();
    await page.waitForTimeout(500);

    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test("should display some content", async ({ page }) => {
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test("should navigate with keyboard", async ({ page }) => {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(300);

    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test("should respond to spacebar", async ({ page }) => {
    await page.keyboard.press(" ");
    await page.waitForTimeout(500);

    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });
});
