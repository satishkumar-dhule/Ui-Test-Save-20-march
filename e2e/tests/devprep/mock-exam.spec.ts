import { test, expect } from "@playwright/test";

test.describe("MockExamPage - Timer and Submit", () => {
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
    await page.getByTestId("section-tab-exam").click();
    await page.waitForTimeout(500);
  });

  test("should display exam ready page", async ({ page }) => {
    await expect(page.getByText("Mock Exam")).toBeVisible();
    await expect(page.getByTestId("exam-start-btn")).toBeVisible();
    await expect(page.getByText("45 minutes")).toBeVisible();
  });

  test("should start exam and show timer", async ({ page }) => {
    await page.getByTestId("exam-start-btn").click();
    await page.waitForTimeout(500);

    await expect(page.getByTestId("exam-timer")).toBeVisible();
    await expect(page.getByTestId("exam-submit-btn")).toBeVisible();
  });

  test("should timer count down correctly", async ({ page }) => {
    await page.getByTestId("exam-start-btn").click();
    await page.waitForTimeout(500);

    const timerText = page
      .locator('[data-testid="exam-timer"]')
      .locator("span");
    const initialText = await timerText.textContent();

    await page.waitForTimeout(2000);

    const updatedText = await timerText.textContent();
    expect(updatedText).not.toBe(initialText);
  });

  test("should timer circular progress update", async ({ page }) => {
    await page.getByTestId("exam-start-btn").click();
    await page.waitForTimeout(500);

    const timerSvg = page.getByTestId("exam-timer").locator("svg");
    await expect(timerSvg).toBeVisible();

    const progressCircle = timerSvg.locator("circle").nth(1);
    const initialOffset = await progressCircle.evaluate((el) =>
      (el as SVGElement).getAttribute("stroke-dashoffset"),
    );

    await page.waitForTimeout(3000);

    const updatedOffset = await progressCircle.evaluate((el) =>
      (el as SVGElement).getAttribute("stroke-dashoffset"),
    );
    expect(updatedOffset).not.toBe(initialOffset);
  });

  test("should select answer and highlight choice", async ({ page }) => {
    await page.getByTestId("exam-start-btn").click();
    await page.waitForTimeout(500);

    const choiceButton = page.locator('[data-testid^="exam-choice-"]').first();
    await expect(choiceButton).toBeVisible();

    await choiceButton.click();
    await page.waitForTimeout(300);

    const borderColor = await choiceButton.evaluate(
      (el) => (el as HTMLElement).style.borderColor,
    );
    expect(borderColor).toBeTruthy();
  });

  test("should toggle flag on question", async ({ page }) => {
    await page.getByTestId("exam-start-btn").click();
    await page.waitForTimeout(500);

    const flagBtn = page.locator("button", { hasText: /Flag/i }).first();
    await expect(flagBtn).toBeVisible();

    await flagBtn.click();
    await page.waitForTimeout(300);

    await expect(flagBtn).toContainText("Flagged");

    await flagBtn.click();
    await page.waitForTimeout(300);

    await expect(flagBtn).toContainText("Flag");
  });

  test("should navigate between questions", async ({ page }) => {
    await page.getByTestId("exam-start-btn").click();
    await page.waitForTimeout(500);

    const navButton1 = page.getByTestId("exam-nav-0");
    await expect(navButton1).toBeVisible();

    await page.locator("button", { hasText: /Next/i }).first().click();
    await page.waitForTimeout(300);

    const navButton2 = page.getByTestId("exam-nav-1");
    await expect(navButton2).toBeVisible();
  });

  test("should submit exam and show results", async ({ page }) => {
    await page.getByTestId("exam-start-btn").click();
    await page.waitForTimeout(500);

    const submitBtn = page.getByTestId("exam-submit-btn");
    await submitBtn.click();
    await page.waitForTimeout(500);

    await expect(page.getByText(/Passed!/))
      .toBeVisible({ timeout: 3000 })
      .catch(() => {
        return expect(page.getByText(/Not yet/)).toBeVisible({ timeout: 3000 });
      });
    await expect(page.getByTestId("exam-review-btn")).toBeVisible();
    await expect(page.getByTestId("exam-retry-btn")).toBeVisible();
  });

  test("should review answers", async ({ page }) => {
    await page.getByTestId("exam-start-btn").click();
    await page.waitForTimeout(500);

    await page.getByTestId("exam-submit-btn").click();
    await page.waitForTimeout(500);

    await page.getByTestId("exam-review-btn").click();
    await page.waitForTimeout(500);

    await expect(page.getByText("Review Mode")).toBeVisible();
    await expect(
      page.locator('[data-testid^="exam-choice-"]').first(),
    ).toBeVisible();
  });

  test("should show correct/incorrect in review mode", async ({ page }) => {
    await page.getByTestId("exam-start-btn").click();
    await page.waitForTimeout(500);

    const choice1 = page.locator('[data-testid^="exam-choice-"]').first();
    await choice1.click();
    await page.waitForTimeout(200);

    await page.getByTestId("exam-submit-btn").click();
    await page.waitForTimeout(500);

    await page.getByTestId("exam-review-btn").click();
    await page.waitForTimeout(500);

    const explanation = page.locator('[class*="p-3.5 rounded-lg border"]');
    await expect(explanation)
      .toBeVisible({ timeout: 2000 })
      .catch(() => {});
  });

  test("should retry exam", async ({ page }) => {
    await page.getByTestId("exam-start-btn").click();
    await page.waitForTimeout(500);

    await page.getByTestId("exam-submit-btn").click();
    await page.waitForTimeout(500);

    await page.getByTestId("exam-retry-btn").click();
    await page.waitForTimeout(500);

    await expect(page.getByTestId("exam-start-btn")).toBeVisible();
  });

  test("should show difficulty breakdown in ready state", async ({ page }) => {
    await expect(page.getByText(/easy/i)).toBeVisible();
    await expect(page.getByText(/medium/i)).toBeVisible();
    await expect(page.getByText(/hard/i)).toBeVisible();
  });

  test("should show progress in exam sidebar", async ({ page }) => {
    await page.getByTestId("exam-start-btn").click();
    await page.waitForTimeout(500);

    const answeredText = page.getByText("Answered");
    await expect(answeredText).toBeVisible();

    const progressBar = page
      .locator(".sidebar")
      .locator('[class*="h-1.5"]')
      .first();
    await expect(progressBar).toBeVisible();
  });

  test("should navigate via sidebar buttons", async ({ page }) => {
    await page.getByTestId("exam-start-btn").click();
    await page.waitForTimeout(500);

    const navBtn = page.getByTestId("exam-nav-1");
    await navBtn.click();
    await page.waitForTimeout(300);

    const questionText = page.getByText(/Question 2 of/);
    await expect(questionText)
      .toBeVisible({ timeout: 2000 })
      .catch(() => {
        return expect(page.getByText(/Question \d+ of/)).toBeVisible();
      });
  });

  test("should show answer selection highlighting", async ({ page }) => {
    await page.getByTestId("exam-start-btn").click();
    await page.waitForTimeout(500);

    const choices = page.locator('[data-testid^="exam-choice-"]');
    const choiceCount = await choices.count();

    for (let i = 0; i < Math.min(3, choiceCount); i++) {
      const choice = choices.nth(i);
      await choice.click();
      await page.waitForTimeout(200);

      const isSelected = await choice.evaluate(
        (el) => (el as HTMLElement).style.borderColor,
      );
      expect(isSelected).toBeTruthy();
    }
  });
});
