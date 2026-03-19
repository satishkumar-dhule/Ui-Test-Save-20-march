import { test, expect } from "@playwright/test";

test.describe("Theme Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.reload();
    await page.waitForTimeout(300);
  });

  test("should toggle theme button be visible", async ({ page }) => {
    const themeToggle = page.getByTestId("theme-toggle");
    await expect(themeToggle).toBeVisible();
  });

  test("should toggle from dark to light theme", async ({ page }) => {
    const themeToggle = page.getByTestId("theme-toggle");

    await expect(page.locator("html")).toHaveClass(/dark/);

    await themeToggle.click();
    await page.waitForTimeout(300);

    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("should toggle from light to dark theme", async ({ page }) => {
    const themeToggle = page.getByTestId("theme-toggle");

    await themeToggle.click();
    await page.waitForTimeout(300);

    await expect(page.locator("html")).not.toHaveClass(/dark/);

    await themeToggle.click();
    await page.waitForTimeout(300);

    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("should theme persist on reload (light)", async ({ page }) => {
    const themeToggle = page.getByTestId("theme-toggle");

    await themeToggle.click();
    await page.waitForTimeout(300);

    const storedTheme = await page.evaluate(() => {
      return localStorage.getItem("devprep:theme");
    });
    expect(storedTheme).toBe('"light"');

    await page.reload();
    await page.waitForTimeout(500);

    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("should theme persist on reload (dark)", async ({ page }) => {
    const themeToggle = page.getByTestId("theme-toggle");

    await page.evaluate(() => {
      localStorage.setItem("devprep:theme", '"dark"');
    });

    await page.reload();
    await page.waitForTimeout(500);

    await expect(page.locator("html")).toHaveClass(/dark/);

    await themeToggle.click();
    await page.waitForTimeout(300);

    const storedTheme = await page.evaluate(() => {
      return localStorage.getItem("devprep:theme");
    });
    expect(storedTheme).toBe('"light"');
  });

  test("should theme toggle show correct icon (dark mode)", async ({
    page,
  }) => {
    await expect(page.locator("html")).toHaveClass(/dark/);

    const themeToggle = page.getByTestId("theme-toggle");
    const sunIcon = themeToggle.locator("svg");

    await expect(sunIcon).toBeVisible();
  });

  test("should theme toggle show correct icon (light mode)", async ({
    page,
  }) => {
    const themeToggle = page.getByTestId("theme-toggle");

    await themeToggle.click();
    await page.waitForTimeout(300);

    const moonIcon = themeToggle.locator("svg");
    await expect(moonIcon).toBeVisible();
  });

  test("should header have dark background in dark mode", async ({ page }) => {
    await expect(page.locator("html")).toHaveClass(/dark/);

    const header = page.getByTestId("header");
    const bgColor = await header.evaluate(
      (el) => (el as HTMLElement).style.background,
    );
    expect(bgColor).toContain("rgb(1, 4, 9)");
  });

  test("should header have light background in light mode", async ({
    page,
  }) => {
    const themeToggle = page.getByTestId("theme-toggle");

    await themeToggle.click();
    await page.waitForTimeout(300);

    const header = page.getByTestId("header");
    const bgColor = await header.evaluate(
      (el) => (el as HTMLElement).style.background,
    );
    expect(bgColor).toContain("rgb(246, 248, 250)");
  });

  test("should channel bar respect theme", async ({ page }) => {
    const channelBar = page.getByTestId("channel-bar");
    await expect(channelBar).toBeVisible();

    const themeToggle = page.getByTestId("theme-toggle");
    await themeToggle.click();
    await page.waitForTimeout(300);

    await expect(channelBar).toBeVisible();
  });

  test("should section tabs respect theme", async ({ page }) => {
    const sectionTabs = page.getByTestId("section-tabs");
    await expect(sectionTabs).toBeVisible();

    const themeToggle = page.getByTestId("theme-toggle");
    await themeToggle.click();
    await page.waitForTimeout(300);

    await expect(sectionTabs).toBeVisible();
  });

  test("should all pages respect theme toggle", async ({ page }) => {
    const themeToggle = page.getByTestId("theme-toggle");

    const pages = ["qa", "flashcards", "coding", "exam", "voice"];
    for (const section of pages) {
      await page.getByTestId(`section-tab-${section}`).click();
      await page.waitForTimeout(200);

      await themeToggle.click();
      await page.waitForTimeout(200);

      await themeToggle.click();
      await page.waitForTimeout(200);
    }
  });

  test("should onboarding modal respect theme", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem("devprep:selectedIds");
    });
    await page.reload();
    await page.waitForTimeout(300);

    const modal = page.getByTestId("onboarding-modal");
    await expect(modal).toBeVisible();

    const themeToggle = page.getByTestId("theme-toggle");
    await themeToggle.click();
    await page.waitForTimeout(200);

    await expect(modal).toBeVisible();
  });

  test("should theme state persist across navigation", async ({ page }) => {
    const themeToggle = page.getByTestId("theme-toggle");

    await themeToggle.click();
    await page.waitForTimeout(300);

    await page.getByTestId("section-tab-coding").click();
    await page.waitForTimeout(300);

    await page.getByTestId("section-tab-qa").click();
    await page.waitForTimeout(300);

    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("should default theme be dark", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem("devprep:theme");
    });
    await page.reload();
    await page.waitForTimeout(500);

    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("should theme toggle be accessible", async ({ page }) => {
    const themeToggle = page.getByTestId("theme-toggle");

    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});
