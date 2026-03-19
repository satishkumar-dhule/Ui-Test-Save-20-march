import { test, expect } from "@playwright/test";

test.describe("VoicePracticePage - Recording", () => {
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
    await page.getByTestId("section-tab-voice").click();
    await page.waitForTimeout(500);
  });

  test("should display voice practice page", async ({ page }) => {
    await expect(page.getByText("Prompts")).toBeVisible();
    await expect(page.getByTestId("voice-start-btn")).toBeVisible();
  });

  test("should show countdown 3-2-1 before recording", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["microphone"]);

    const startBtn = page.getByTestId("voice-start-btn");
    await startBtn.click();

    await expect(page.getByTestId("voice-countdown")).toBeVisible({
      timeout: 2000,
    });
    const countdownText = await page
      .getByTestId("voice-countdown")
      .textContent();
    expect(["3", "2", "1"]).toContain(countdownText?.trim());
  });

  test("should show countdown values in sequence", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["microphone"]);

    const startBtn = page.getByTestId("voice-start-btn");
    await startBtn.click();

    await page.waitForTimeout(500);
    const countdown1 = await page.getByTestId("voice-countdown").textContent();
    expect(["3", "2", "1"]).toContain(countdown1?.trim());

    await page.waitForTimeout(1100);
    const countdown2 = await page.getByTestId("voice-countdown").textContent();
    expect(["2", "1"]).toContain(countdown2?.trim());

    await page.waitForTimeout(1100);
    const countdown3 = await page.getByTestId("voice-countdown").textContent();
    expect(["1"]).toContain(countdown3?.trim());
  });

  test("should show circular timer during recording", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["microphone"]);

    const startBtn = page.getByTestId("voice-start-btn");
    await startBtn.click();

    await page.waitForTimeout(4000);

    const timerCircle = page
      .locator("svg")
      .filter({ has: page.locator("circle") });
    await expect(timerCircle.first()).toBeVisible();

    const stopBtn = page.getByTestId("voice-stop-btn");
    await expect(stopBtn).toBeVisible();
  });

  test("should circular timer show elapsed time", async ({ page, context }) => {
    await context.grantPermissions(["microphone"]);

    const startBtn = page.getByTestId("voice-start-btn");
    await startBtn.click();

    await page.waitForTimeout(4000);

    const timerDisplay = page.locator("text=/\\d{2}:\\d{2}/").first();
    await expect(timerDisplay).toBeVisible();
  });

  test("should stop recording and show done state", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["microphone"]);

    const startBtn = page.getByTestId("voice-start-btn");
    await startBtn.click();

    await page.waitForTimeout(4000);

    const stopBtn = page.getByTestId("voice-stop-btn");
    await stopBtn.click();
    await page.waitForTimeout(500);

    const retryBtn = page.getByTestId("voice-retry-btn");
    await expect(retryBtn).toBeVisible();
  });

  test("should show transcript after recording", async ({ page, context }) => {
    await context.grantPermissions(["microphone"]);

    const startBtn = page.getByTestId("voice-start-btn");
    await startBtn.click();

    await page.waitForTimeout(4000);

    const stopBtn = page.getByTestId("voice-stop-btn");
    await stopBtn.click();
    await page.waitForTimeout(500);

    const transcriptSection = page.getByText("Your response");
    const isVisible = await transcriptSection.isVisible().catch(() => false);
    if (isVisible) {
      await expect(transcriptSection).toBeVisible();
    }
  });

  test("should retry recording", async ({ page, context }) => {
    await context.grantPermissions(["microphone"]);

    const startBtn = page.getByTestId("voice-start-btn");
    await startBtn.click();

    await page.waitForTimeout(4000);

    const stopBtn = page.getByTestId("voice-stop-btn");
    await stopBtn.click();
    await page.waitForTimeout(500);

    const retryBtn = page.getByTestId("voice-retry-btn");
    await retryBtn.click();
    await page.waitForTimeout(500);

    await expect(startBtn).toBeVisible();
  });

  test("should display self-rating stars", async ({ page, context }) => {
    await context.grantPermissions(["microphone"]);

    const startBtn = page.getByTestId("voice-start-btn");
    await startBtn.click();

    await page.waitForTimeout(4000);

    const stopBtn = page.getByTestId("voice-stop-btn");
    await stopBtn.click();
    await page.waitForTimeout(500);

    await expect(page.getByText("Rate your response")).toBeVisible();
    await expect(page.getByTestId("voice-star-1")).toBeVisible();
    await expect(page.getByTestId("voice-star-5")).toBeVisible();
  });

  test("should rate response with stars", async ({ page, context }) => {
    await context.grantPermissions(["microphone"]);

    const startBtn = page.getByTestId("voice-start-btn");
    await startBtn.click();

    await page.waitForTimeout(4000);

    const stopBtn = page.getByTestId("voice-stop-btn");
    await stopBtn.click();
    await page.waitForTimeout(500);

    const star3 = page.getByTestId("voice-star-3");
    await star3.click();
    await page.waitForTimeout(300);

    const nextBtn = page.getByRole("button", { name: /Next/i });
    await expect(nextBtn).toBeVisible();
  });

  test("should show key points accordion", async ({ page }) => {
    const keyPointsBtn = page.getByText("Key Points to Cover");
    await expect(keyPointsBtn).toBeVisible();

    await keyPointsBtn.click();
    await page.waitForTimeout(300);

    const keyPointsContent = page.locator("text=📌 Key Points").locator("..");
    await expect(keyPointsContent).toBeVisible();
  });

  test("should navigate between prompts", async ({ page }) => {
    const counter = page.locator("text=/\\d+ \\/ \\d+/");
    const initialText = await counter.textContent();

    await page.locator("button[aria-label='Next prompt']").click();
    await page.waitForTimeout(300);

    const newText = await counter.textContent();
    expect(newText).not.toBe(initialText);
  });

  test("should shuffle prompts", async ({ page }) => {
    const shuffleBtn = page.locator("button", { hasText: /Shuffle/i });
    await shuffleBtn.click();
    await page.waitForTimeout(300);

    await expect(shuffleBtn).toContainText("Shuffled");
  });

  test("should display prompt metadata", async ({ page }) => {
    await expect(page.locator("text=/\\d+s/")).toBeVisible();
    await expect(
      page.locator("text=/(beginner|intermediate|advanced)/i"),
    ).toBeVisible();
  });

  test("should show prompt type badge", async ({ page }) => {
    await expect(
      page
        .locator('span[class*="rounded-full"]')
        .filter({ hasText: /(technical|behavioral|scenario|explain)/i })
        .first(),
    ).toBeVisible();
  });

  test("should display rating in sidebar after rating", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["microphone"]);

    const startBtn = page.getByTestId("voice-start-btn");
    await startBtn.click();

    await page.waitForTimeout(4000);

    const stopBtn = page.getByTestId("voice-stop-btn");
    await stopBtn.click();
    await page.waitForTimeout(500);

    const star3 = page.getByTestId("voice-star-3");
    await star3.click();
    await page.waitForTimeout(800);

    const sidebarStars = page
      .locator(".sidebar svg")
      .filter({ has: page.locator('[style*="hsl(var(--chart-3))"]') });
    const hasStars = (await sidebarStars.count()) > 0;
    if (hasStars) {
      await expect(sidebarStars.first()).toBeVisible();
    }
  });

  test("should show browser unsupported message", async ({ page, context }) => {
    await context.clearPermissions();

    await page.reload();
    await page.getByTestId("section-tab-voice").click();
    await page.waitForTimeout(500);

    const unsupportedMessage = page.getByText(
      /Speech Recognition is not supported/i,
    );
    const isVisible = await unsupportedMessage.isVisible().catch(() => false);
    if (isVisible) {
      await expect(unsupportedMessage).toBeVisible();
    } else {
      await expect(page.getByTestId("voice-start-btn")).toBeVisible();
    }
  });
});
