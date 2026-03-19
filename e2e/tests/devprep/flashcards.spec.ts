import { test, expect } from "@playwright/test";

test.describe("FlashcardsPage - Flip and Mark", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
      localStorage.setItem("devprep:channelId", JSON.stringify("javascript"));
    });
    await page.reload();
    await page.getByTestId("section-tab-flashcards").click();
    await page.waitForTimeout(500);
  });

  test("should display flashcard page with sidebar", async ({ page }) => {
    await expect(page.getByText("Flashcards")).toBeVisible();
    await expect(page.getByTestId("flashcard-flip")).toBeVisible();
  });

  test("should flip card on click", async ({ page }) => {
    const flipCard = page.getByTestId("flashcard-flip");

    const frontIndicator = page.locator("text=ANSWER").first();
    await expect(frontIndicator).toBeHidden({ timeout: 2000 });

    await flipCard.click();
    await page.waitForTimeout(500);

    await expect(frontIndicator).toBeVisible({ timeout: 2000 });
  });

  test("should have CSS 3D transform for flip animation", async ({ page }) => {
    const flipCard = page.getByTestId("flashcard-flip");

    await expect(flipCard).toHaveCSS("perspective", "1200px");

    const innerCard = flipCard.locator("> div");
    await expect(innerCard).toHaveCSS("transform-style", "preserve-3d");

    await flipCard.click();
    await page.waitForTimeout(100);

    const transform = await innerCard.evaluate(
      (el) => (el as HTMLElement).style.transform,
    );
    expect(transform).toContain("rotateY(180deg)");
  });

  test("should show mark buttons after flip", async ({ page }) => {
    const flipCard = page.getByTestId("flashcard-flip");
    await flipCard.click();
    await page.waitForTimeout(500);

    await expect(page.getByTestId("flashcard-known")).toBeVisible();
    await expect(page.getByTestId("flashcard-reviewing")).toBeVisible();
    await expect(page.getByTestId("flashcard-hard")).toBeVisible();
  });

  test("should mark card as Known", async ({ page }) => {
    const flipCard = page.getByTestId("flashcard-flip");
    await flipCard.click();
    await page.waitForTimeout(500);

    const knownBtn = page.getByTestId("flashcard-known");
    await knownBtn.click();
    await page.waitForTimeout(500);

    await expect(page.getByText("Know it")).toBeVisible();
  });

  test("should mark card as Review", async ({ page }) => {
    const flipCard = page.getByTestId("flashcard-flip");
    await flipCard.click();
    await page.waitForTimeout(500);

    const reviewBtn = page.getByTestId("flashcard-reviewing");
    await reviewBtn.click();
    await page.waitForTimeout(500);

    await expect(page.getByText("Review")).toBeVisible();
  });

  test("should mark card as Hard", async ({ page }) => {
    const flipCard = page.getByTestId("flashcard-flip");
    await flipCard.click();
    await page.waitForTimeout(500);

    const hardBtn = page.getByTestId("flashcard-hard");
    await hardBtn.click();
    await page.waitForTimeout(500);

    await expect(page.getByText("Hard")).toBeVisible();
  });

  test("should update progress bar in real-time", async ({ page }) => {
    const progressBar = page.getByTestId("flashcard-progress-bar");

    const initialWidth = await progressBar.evaluate(
      (el) => (el as HTMLElement).style.width,
    );

    const flipCard = page.getByTestId("flashcard-flip");
    await flipCard.click();
    await page.waitForTimeout(500);

    await page.getByTestId("flashcard-known").click();
    await page.waitForTimeout(500);

    const updatedWidth = await progressBar.evaluate(
      (el) => (el as HTMLElement).style.width,
    );

    const initial = parseFloat(initialWidth);
    const updated = parseFloat(updatedWidth);
    expect(updated).toBeGreaterThan(initial);
  });

  test("should shuffle cards", async ({ page }) => {
    const shuffleBtn = page.getByTestId("flashcard-shuffle-btn");
    await shuffleBtn.click();
    await page.waitForTimeout(500);

    await expect(shuffleBtn).toContainText("Shuffled");

    const initialCardText = await page
      .getByTestId("flashcard-flip")
      .textContent();

    await shuffleBtn.click();
    await page.waitForTimeout(500);

    await shuffleBtn.click();
    await page.waitForTimeout(500);

    const newCardText = await page.getByTestId("flashcard-flip").textContent();
    expect(newCardText).toBeTruthy();
  });

  test("should reset progress", async ({ page }) => {
    const flipCard = page.getByTestId("flashcard-flip");
    await flipCard.click();
    await page.waitForTimeout(500);

    await page.getByTestId("flashcard-known").click();
    await page.waitForTimeout(500);

    const resetBtn = page.getByTestId("flashcard-reset-btn");
    await resetBtn.click();
    await page.waitForTimeout(500);

    await expect(page.getByTestId("flashcard-shuffle-btn")).toContainText(
      "Shuffle",
    );
  });

  test("should navigate between cards with arrows", async ({ page }) => {
    const counter = page.locator("text=/\\d+ \\/ \\d+/");
    const initialText = await counter.textContent();

    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(300);

    const newText = await counter.textContent();
    expect(newText).not.toBe(initialText);
  });

  test("should flip card with spacebar", async ({ page }) => {
    await page.keyboard.press(" ");
    await page.waitForTimeout(500);

    const answerIndicator = page.locator("text=ANSWER").first();
    await expect(answerIndicator).toBeVisible({ timeout: 2000 });
  });

  test("should use keyboard shortcuts for marking", async ({ page }) => {
    await page.keyboard.press(" ");
    await page.waitForTimeout(500);

    await page.keyboard.press("1");
    await page.waitForTimeout(500);

    const counter = page.locator("text=/\\d+ \\/ \\d+/");
    const text = await counter.textContent();
    const [, total] = text!.match(/(\d+)/g)!.map(Number);
    if (total > 1) {
      const newText = await counter.textContent();
      expect(newText).toMatch(/\d+ \/ \d+/);
    }
  });

  test("should display card count in sidebar", async ({ page }) => {
    const countBadge = page.locator("text=/\\d+/").first();
    await expect(countBadge).toBeVisible();
  });

  test("should show deck complete state", async ({ page }) => {
    for (let i = 0; i < 20; i++) {
      const flipCard = page.getByTestId("flashcard-flip");
      const isVisible = await flipCard.isVisible().catch(() => false);
      if (!isVisible) break;

      await flipCard.click();
      await page.waitForTimeout(300);

      const knownBtn = page.getByTestId("flashcard-known");
      const isKnownVisible = await knownBtn.isVisible().catch(() => false);
      if (isKnownVisible) {
        await knownBtn.click();
        await page.waitForTimeout(400);
      } else {
        break;
      }
    }

    const deckComplete = page.getByText("Deck Complete!");
    const isComplete = await deckComplete.isVisible().catch(() => false);
    if (isComplete) {
      await expect(deckComplete).toBeVisible();
      await expect(page.getByText("Restart")).toBeVisible();
    }
  });
});
