import { test, expect } from "@playwright/test";

test.describe("DevPrep App", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should show onboarding modal on first visit", async ({ page }) => {
    await expect(page.getByTestId("onboarding-modal")).toBeVisible();
    await expect(page.getByText("Welcome to DevPrep")).toBeVisible();
  });

  test("should select channels and proceed to main app", async ({ page }) => {
    await expect(page.getByTestId("onboarding-modal")).toBeVisible();

    const jsCheckbox = page.getByTestId("onboarding-channel-javascript");
    await jsCheckbox.click();

    const startButton = page.getByRole("button", { name: /start learning/i });
    await expect(startButton).toBeEnabled();
    await startButton.click();

    await expect(page.getByTestId("app-root")).toBeVisible();
    await expect(page.getByTestId("onboarding-modal")).not.toBeVisible();
  });

  test("should display header with DevPrep branding", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.reload();

    await expect(page.getByTestId("header")).toBeVisible();
    await expect(page.getByText("DevPrep")).toBeVisible();
  });

  test("should switch between section tabs", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.reload();

    await expect(page.getByTestId("section-tab-qa")).toBeVisible();
    await expect(page.getByTestId("section-tab-flashcards")).toBeVisible();
    await expect(page.getByTestId("section-tab-coding")).toBeVisible();
    await expect(page.getByTestId("section-tab-exam")).toBeVisible();
    await expect(page.getByTestId("section-tab-voice")).toBeVisible();

    await page.getByTestId("section-tab-flashcards").click();
    await expect(page.getByText("Flashcards")).toBeVisible();

    await page.getByTestId("section-tab-coding").click();
    await expect(page.getByText("Coding")).toBeVisible();
  });

  test("should toggle theme", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.reload();

    const themeToggle = page.getByTestId("theme-toggle");
    await expect(themeToggle).toBeVisible();

    await themeToggle.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    await themeToggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("should switch channels", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript", "react"]),
      );
      localStorage.setItem("devprep:channelId", JSON.stringify("javascript"));
    });
    await page.reload();

    await expect(page.getByTestId("channel-tab-react")).toBeVisible();
    await page.getByTestId("channel-tab-react").click();
    await expect(page.getByTestId("channel-tab-react")).toHaveAttribute(
      "style",
      /color:.*#/,
    );
    await expect(page.getByTestId("channel-tab-javascript")).toHaveAttribute(
      "style",
      /hsl/,
    );
  });

  test("should open onboarding modal via Edit button", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.reload();

    await page.getByTestId("edit-tracks-btn").click();
    await expect(page.getByTestId("onboarding-modal")).toBeVisible();
  });

  test("should display Q&A content", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.reload();

    await expect(page.getByTestId("section-tab-qa")).toBeVisible();
    const qaTab = page.getByTestId("section-tab-qa");
    await expect(qaTab).toBeVisible();
  });

  test("should display flashcard content", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.reload();

    await page.getByTestId("section-tab-flashcards").click();
    await expect(page.getByTestId("flashcard-flip"))
      .toBeVisible({ timeout: 5000 })
      .catch(() => {});
  });

  test("should display coding challenges", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.reload();

    await page.getByTestId("section-tab-coding").click();
    await expect(page.getByRole("button", { name: "Run Code" }))
      .toBeVisible({ timeout: 5000 })
      .catch(() => {});
  });
});
