import { test, expect } from "@playwright/test";

test.describe("Theme Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("devprep:showOnboarding", "false");
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.reload();
    await page.waitForTimeout(2000);
  });

  test("smoke: theme toggle is visible", async ({ page }) => {
    const themeToggle = page.getByTestId("theme-toggle");
    await expect(themeToggle).toBeVisible();
  });

  test("smoke: theme toggle works", async ({ page }) => {
    const themeToggle = page.getByTestId("theme-toggle");

    // Initial should be dark
    const html = page.locator("html");
    const initialTheme = await html.getAttribute("data-theme");

    await themeToggle.click();
    await page.waitForTimeout(300);

    const newTheme = await html.getAttribute("data-theme");
    expect(newTheme).not.toBe(initialTheme);
  });

  test("smoke: theme persists after toggle", async ({ page }) => {
    const themeToggle = page.getByTestId("theme-toggle");

    await themeToggle.click();
    await page.waitForTimeout(300);

    const html = page.locator("html");
    const theme = await html.getAttribute("data-theme");

    await page.reload();
    await page.waitForTimeout(2000);

    const persistedTheme = await html.getAttribute("data-theme");
    expect(persistedTheme).toBe(theme);
  });
});
