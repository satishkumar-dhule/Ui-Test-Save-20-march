import { test, expect } from "@playwright/test";

test.describe("QAPage Navigation", () => {
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
    await page.getByTestId("section-tab-qa").click();
  });

  test("should display QA page with sidebar and content", async ({ page }) => {
    await expect(page.getByTestId("qa-search")).toBeVisible();
    await expect(page.getByText("Questions")).toBeVisible();
    await page.waitForTimeout(500);
    const sidebarItems = page.locator('[data-testid^="qa-sidebar-item-"]');
    await expect(sidebarItems.first()).toBeVisible();
  });

  test("should filter questions by search", async ({ page }) => {
    await page.waitForTimeout(500);
    const initialItems = page.locator('[data-testid^="qa-sidebar-item-"]');
    const initialCount = await initialItems.count();
    expect(initialCount).toBeGreaterThan(0);

    await page.getByTestId("qa-search").fill("closure");
    await page.waitForTimeout(300);

    const filteredItems = page.locator('[data-testid^="qa-sidebar-item-"]');
    const filteredCount = await filteredItems.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    await page.getByTestId("qa-search").fill("");
    await page.waitForTimeout(300);

    const restoredItems = page.locator('[data-testid^="qa-sidebar-item-"]');
    const restoredCount = await restoredItems.count();
    expect(restoredCount).toBe(initialCount);
  });

  test("should highlight active sidebar item", async ({ page }) => {
    await page.waitForTimeout(500);
    const firstItem = page.locator('[data-testid^="qa-sidebar-item-"]').first();
    await firstItem.click();

    await expect(firstItem).toHaveCSS("border-left-color", /rgb|hsl/);
    const borderColor = await firstItem.evaluate(
      (el) => el.style.borderLeftColor || getComputedStyle(el).borderLeftColor,
    );
    expect(borderColor).toBeTruthy();
  });

  test("should navigate with keyboard arrow keys", async ({ page }) => {
    await page.waitForTimeout(500);
    const questionCounter = page.locator("text=/\\d+ \\/ \\d+/");
    await expect(questionCounter).toBeVisible();

    const initialText = await questionCounter.textContent();

    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(200);

    const newText = await questionCounter.textContent();
    expect(newText).not.toBe(initialText);

    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(200);

    const restoredText = await questionCounter.textContent();
    expect(restoredText).toBe(initialText);
  });

  test("should use Previous/Next buttons", async ({ page }) => {
    await page.waitForTimeout(500);
    const questionCounter = page.locator("text=/\\d+ \\/ \\d+/");
    const initialText = await questionCounter.textContent();

    await page.getByTestId("qa-next-btn").click();
    await page.waitForTimeout(200);

    const newText = await questionCounter.textContent();
    expect(newText).not.toBe(initialText);

    await page.getByTestId("qa-prev-btn").click();
    await page.waitForTimeout(200);

    const restoredText = await questionCounter.textContent();
    expect(restoredText).toBe(initialText);
  });

  test("should disable navigation at boundaries", async ({ page }) => {
    await page.waitForTimeout(500);
    const prevBtn = page.getByTestId("qa-prev-btn");
    const nextBtn = page.getByTestId("qa-next-btn");

    await expect(prevBtn).toBeDisabled();

    while (!(await nextBtn.isDisabled())) {
      await nextBtn.click();
      await page.waitForTimeout(100);
    }
    await expect(nextBtn).toBeDisabled();
  });

  test("should copy code block to clipboard", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.waitForTimeout(500);

    const copyBtn = page.getByTestId("code-copy-btn");
    await expect(copyBtn).toBeVisible();

    await copyBtn.click();
    await page.waitForTimeout(100);

    const copiedText = await copyBtn.textContent();
    expect(copiedText).toContain("Copied");
  });

  test("should open mobile menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);

    const mobileMenu = page.getByTestId("qa-mob-menu");
    await expect(mobileMenu).toBeVisible();

    await mobileMenu.click();
    await page.waitForTimeout(300);

    const sidebar = page.locator(".sidebar");
    await expect(sidebar).toBeVisible();
  });

  test("should display question metadata", async ({ page }) => {
    await page.waitForTimeout(500);

    await expect(page.locator("text=▲")).toBeVisible();
    await expect(page.locator("text=👁")).toBeVisible();
    await expect(page.locator("text=by")).toBeVisible();
  });

  test("should display difficulty badge", async ({ page }) => {
    await page.waitForTimeout(500);

    const difficultyBadges = page.locator(
      "text=/^(beginner|intermediate|advanced)$/i",
    );
    await expect(difficultyBadges.first()).toBeVisible();
  });

  test("should display tags", async ({ page }) => {
    await page.waitForTimeout(500);

    const tags = page.locator("code.font-mono").first();
    await expect(tags).toBeVisible();
  });
});
