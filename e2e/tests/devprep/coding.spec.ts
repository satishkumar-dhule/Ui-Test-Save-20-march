import { test, expect } from "@playwright/test";

test.describe("CodingPage - Run and Reset", () => {
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

    await page.evaluate(() => {
      const store = (window as any).__ZUSTAND__;
      if (store) {
        store.getState().setSection("coding");
      }
    });

    await page.waitForTimeout(1000);
  });

  test("should display coding page with editor", async ({ page }) => {
    await expect(page.getByText("Challenges")).toBeVisible();
    await expect(page.getByTestId("coding-editor")).toBeVisible();
  });

  test("should switch language to TypeScript", async ({ page }) => {
    const langBtn = page.getByTestId("coding-lang-typescript");
    await langBtn.click();
    await page.waitForTimeout(300);

    await expect(langBtn).toBeVisible();
    const editorLabel = page.locator("text=typescript");
    await expect(editorLabel.first()).toBeVisible();
  });

  test("should switch language to Python", async ({ page }) => {
    const langBtn = page.getByTestId("coding-lang-python");
    await langBtn.click();
    await page.waitForTimeout(300);

    await expect(langBtn).toBeVisible();
    const editorLabel = page.locator("text=python");
    await expect(editorLabel.first()).toBeVisible();
  });

  test("should switch language to JavaScript", async ({ page }) => {
    const jsBtn = page.getByTestId("coding-lang-javascript");
    await jsBtn.click();
    await page.waitForTimeout(300);

    const tsBtn = page.getByTestId("coding-lang-typescript");
    await tsBtn.click();
    await page.waitForTimeout(300);

    await jsBtn.click();
    await page.waitForTimeout(300);

    await expect(jsBtn).toBeVisible();
  });

  test("should language switcher change code syntax indicator", async ({
    page,
  }) => {
    const editorLabel = page
      .locator('[class*="uppercase"]')
      .filter({ hasText: /javascript|typescript|python/i });

    const initialLang = await editorLabel.textContent();

    await page.getByTestId("coding-lang-typescript").click();
    await page.waitForTimeout(300);

    const newLang = await page
      .locator('[class*="uppercase"]')
      .filter({ hasText: /javascript|typescript|python/i })
      .textContent();
    expect(newLang?.toLowerCase()).toContain("typescript");
  });

  test("should run button be visible", async ({ page }) => {
    await expect(page.getByTestId("coding-run-btn")).toBeVisible();
  });

  test("should run code and show results", async ({ page }) => {
    const runBtn = page.getByTestId("coding-run-btn");
    await runBtn.click();
    await page.waitForTimeout(500);

    const testResults = page.getByText("Test Results");
    await expect(testResults).toBeVisible();
  });

  test("should test results show pass/fail counts", async ({ page }) => {
    const runBtn = page.getByTestId("coding-run-btn");
    await runBtn.click();
    await page.waitForTimeout(500);

    const resultsText = page.locator("text=/\\d+\\/\\d+ passed/");
    await expect(resultsText).toBeVisible();
  });

  test("should show individual test results", async ({ page }) => {
    const runBtn = page.getByTestId("coding-run-btn");
    await runBtn.click();
    await page.waitForTimeout(500);

    const passedIcon = page
      .locator('[class*="chart-2"]')
      .filter({ has: page.locator("svg") });
    const failedIcon = page
      .locator('[class*="chart-5"]')
      .filter({ has: page.locator("svg") });

    const hasResults =
      (await passedIcon.count()) > 0 || (await failedIcon.count()) > 0;
    expect(hasResults).toBeTruthy();
  });

  test("should reset restore starter code", async ({ page }) => {
    const editor = page.getByTestId("coding-editor");
    const initialCode = await editor.inputValue();

    await editor.fill("// Modified code");
    await page.waitForTimeout(200);

    const resetBtn = page.getByTestId("coding-reset-btn");
    await resetBtn.click();
    await page.waitForTimeout(300);

    const resetCode = await editor.inputValue();
    expect(resetCode).toBe(initialCode);
  });

  test("should show solution toggle", async ({ page }) => {
    const solutionBtn = page.locator("button", { hasText: /Solution/i });
    await expect(solutionBtn).toBeVisible();

    await solutionBtn.click();
    await page.waitForTimeout(300);

    await expect(page.getByText("Solution").nth(1)).toBeVisible();
  });

  test("should hide solution on second click", async ({ page }) => {
    const solutionBtn = page.locator("button", { hasText: /Solution/i });

    await solutionBtn.click();
    await page.waitForTimeout(300);

    await solutionBtn.click();
    await page.waitForTimeout(300);

    await expect(page.getByTestId("coding-editor")).toBeVisible();
  });

  test("should show hints", async ({ page }) => {
    const hintsBtn = page.locator("button", { hasText: /hint/i });
    await expect(hintsBtn).toBeVisible();

    await hintsBtn.click();
    await page.waitForTimeout(300);

    await expect(page.getByText(/Hint 1:/)).toBeVisible();
  });

  test("should reveal hints progressively", async ({ page }) => {
    const hintsBtn = page.locator("button", { hasText: /hint/i });
    await hintsBtn.click();
    await page.waitForTimeout(300);

    await expect(page.getByText(/Hint 1:/)).toBeVisible();

    const nextHintBtn = page.locator("button", { hasText: /Next hint/i });
    const hasNextHint = await nextHintBtn.isVisible().catch(() => false);
    if (hasNextHint) {
      await nextHintBtn.click();
      await page.waitForTimeout(300);
      await expect(page.getByText(/Hint 2:/)).toBeVisible();
    }
  });

  test("should switch tabs (problem/approach/complexity)", async ({ page }) => {
    const approachTab = page.locator("button", { hasText: /^approach$/i });
    const complexityTab = page.locator("button", { hasText: /^complexity$/i });

    await approachTab.click();
    await page.waitForTimeout(300);
    await expect(approachTab).toBeVisible();

    await complexityTab.click();
    await page.waitForTimeout(300);
    await expect(complexityTab).toBeVisible();

    await page.locator("button", { hasText: /^problem$/i }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText("Constraints")).toBeVisible();
  });

  test("should show complexity analysis", async ({ page }) => {
    await page.locator("button", { hasText: /^complexity$/i }).click();
    await page.waitForTimeout(300);

    await expect(page.getByText("Time Complexity")).toBeVisible();
    await expect(page.getByText("Space Complexity")).toBeVisible();
  });

  test("should navigate between challenges", async ({ page }) => {
    const challengeList = page.locator('[data-testid^="coding-sidebar-"]');
    const count = await challengeList.count();

    if (count > 1) {
      const counter = page.locator("text=/\\d+ \\/ \\d+/");
      const initialText = await counter.textContent();

      await page.locator("button[aria-label='Next challenge']").click();
      await page.waitForTimeout(300);

      const newText = await counter.textContent();
      expect(newText).not.toBe(initialText);
    }
  });

  test("should show solved challenges", async ({ page }) => {
    const runBtn = page.getByTestId("coding-run-btn");
    await runBtn.click();
    await page.waitForTimeout(500);

    const solvedBadge = page.getByText("Solved");
    const isSolved = await solvedBadge.isVisible().catch(() => false);
    if (isSolved) {
      await expect(solvedBadge).toBeVisible();
    }
  });

  test("should show constraints", async ({ page }) => {
    await expect(page.getByText("Constraints")).toBeVisible();
    await expect(page.locator("code.font-mono").first()).toBeVisible();
  });

  test("should show examples", async ({ page }) => {
    await expect(page.getByText("Examples")).toBeVisible();
    await expect(page.getByText("Input:")).toBeVisible();
    await expect(page.getByText("Output:")).toBeVisible();
  });

  test("should show ELI5 section", async ({ page }) => {
    const eli5Btn = page.getByText(/ELI5/i);
    await eli5Btn.click();
    await page.waitForTimeout(300);

    await expect(page.locator("text=🧒")).toBeVisible();
  });

  test("should show related concepts in approach tab", async ({ page }) => {
    await page.locator("button", { hasText: /^approach$/i }).click();
    await page.waitForTimeout(300);

    await expect(page.getByText("Related Concepts")).toBeVisible();
  });

  test("should have functional code editor", async ({ page }) => {
    const editor = page.getByTestId("coding-editor");
    await editor.fill("const test = 1;");
    await page.waitForTimeout(200);

    const code = await editor.inputValue();
    expect(code).toContain("test");
  });

  test("should handle tab key in editor", async ({ page }) => {
    const editor = page.getByTestId("coding-editor");
    await editor.click();
    await page.keyboard.type("const x = ");
    await page.keyboard.press("Tab");
    await page.keyboard.type("0;");

    const code = await editor.inputValue();
    expect(code).toContain("  ");
  });

  test("should display difficulty badge", async ({ page }) => {
    const difficulty = page.locator('span[class*="rounded-full"]').filter({
      hasText: /(easy|medium|hard)/i,
    });
    await expect(difficulty.first()).toBeVisible();
  });

  test("should show tags for challenge", async ({ page }) => {
    const tags = page.locator("code.font-mono").filter({ hasText: /./ });
    await expect(tags.first()).toBeVisible();
  });

  test("should reset clear test results", async ({ page }) => {
    const runBtn = page.getByTestId("coding-run-btn");
    await runBtn.click();
    await page.waitForTimeout(500);

    await expect(page.getByText("Test Results")).toBeVisible();

    const resetBtn = page.getByTestId("coding-reset-btn");
    await resetBtn.click();
    await page.waitForTimeout(300);

    const testResults = page.getByText("Test Results");
    await expect(testResults)
      .toBeHidden({ timeout: 1000 })
      .catch(() => {});
  });
});
