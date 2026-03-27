import { test, expect } from "@playwright/test";

test.describe("OnboardingModal Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("devprep:selectedIds");
      localStorage.removeItem("devprep:onboarding-draft");
    });
    await page.reload();
  });

  test("should appear on first load", async ({ page }) => {
    await expect(page.getByTestId("onboarding-modal")).toBeVisible();
    await expect(page.getByText("Welcome to DevPrep")).toBeVisible();
  });

  test("should show tech topics section", async ({ page }) => {
    await expect(page.getByText("Tech Topics")).toBeVisible();
  });

  test("should show certifications section", async ({ page }) => {
    await expect(page.getByText("Certifications")).toBeVisible();
  });

  test("should select JavaScript channel", async ({ page }) => {
    const jsChannel = page.getByTestId("onboarding-channel-javascript");
    await expect(jsChannel).toBeVisible();

    await jsChannel.click();
    await page.waitForTimeout(200);

    const startBtn = page.getByTestId("onboarding-done-btn");
    await expect(startBtn).toBeEnabled();
  });

  test("should select multiple channels", async ({ page }) => {
    const jsChannel = page.getByTestId("onboarding-channel-javascript");
    const reactChannel = page.getByTestId("onboarding-channel-react");

    await jsChannel.click();
    await page.waitForTimeout(100);

    await reactChannel.click();
    await page.waitForTimeout(100);

    const startBtn = page.getByTestId("onboarding-done-btn");
    await expect(startBtn).toBeEnabled();
  });

  test("should toggle channel selection off", async ({ page }) => {
    const jsChannel = page.getByTestId("onboarding-channel-javascript");
    await jsChannel.click();
    await jsChannel.click();
    await page.waitForTimeout(200);

    const startBtn = page.getByTestId("onboarding-done-btn");
    await expect(startBtn).toBeDisabled();
  });

  test("should show selected count", async ({ page }) => {
    const jsChannel = page.getByTestId("onboarding-channel-javascript");
    await jsChannel.click();
    await page.waitForTimeout(200);

    const selectedCount = page.getByText("1 selected");
    await expect(selectedCount).toBeVisible();
  });

  test("should show tracks selected message", async ({ page }) => {
    const jsChannel = page.getByTestId("onboarding-channel-javascript");
    await jsChannel.click();
    await page.waitForTimeout(200);

    const tracksSelected = page.getByText("1 track selected");
    await expect(tracksSelected).toBeVisible();
  });

  test("should disable done button when nothing selected", async ({ page }) => {
    const startBtn = page.getByTestId("onboarding-done-btn");
    await expect(startBtn).toBeDisabled();
  });

  test("should disable done button after deselecting all", async ({ page }) => {
    const jsChannel = page.getByTestId("onboarding-channel-javascript");
    await jsChannel.click();
    await jsChannel.click();
    await page.waitForTimeout(200);

    const startBtn = page.getByTestId("onboarding-done-btn");
    await expect(startBtn).toBeDisabled();
  });

  test("should close modal and show app on done", async ({ page }) => {
    const jsChannel = page.getByTestId("onboarding-channel-javascript");
    await jsChannel.click();
    await page.waitForTimeout(200);

    const startBtn = page.getByTestId("onboarding-done-btn");
    await startBtn.click();
    await page.waitForTimeout(500);

    await expect(page.getByTestId("onboarding-modal")).not.toBeVisible();
    await expect(page.getByTestId("app-root")).toBeVisible();
  });

  test("should persist selection in localStorage", async ({ page }) => {
    const jsChannel = page.getByTestId("onboarding-channel-javascript");
    await jsChannel.click();
    await page.waitForTimeout(200);

    const startBtn = page.getByTestId("onboarding-done-btn");
    await startBtn.click();
    await page.waitForTimeout(500);

    const stored = await page.evaluate(() => {
      return localStorage.getItem("devprep:selectedIds");
    });

    expect(stored).toBeTruthy();
    expect(stored).toContain("javascript");
  });

  test("should display channel cards with icons", async ({ page }) => {
    const channelCard = page.getByTestId("onboarding-channel-javascript");
    await expect(channelCard).toBeVisible();
    await expect(channelCard.locator("text=JavaScript")).toBeVisible();
  });

  test("should show channel descriptions", async ({ page }) => {
    const channelCard = page.getByTestId("onboarding-channel-javascript");
    const description = channelCard.locator("p");
    await expect(description.first()).toBeVisible();
  });

  test("should reopen modal via edit button", async ({ page }) => {
    const jsChannel = page.getByTestId("onboarding-channel-javascript");
    await jsChannel.click();
    await page.waitForTimeout(200);

    const startBtn = page.getByTestId("onboarding-done-btn");
    await startBtn.click();
    await page.waitForTimeout(500);

    const editBtn = page.getByTestId("edit-tracks-btn");
    await editBtn.click();
    await page.waitForTimeout(300);

    await expect(page.getByTestId("onboarding-modal")).toBeVisible();
  });

  test("should pre-populate selected channels when reopening", async ({
    page,
  }) => {
    const jsChannel = page.getByTestId("onboarding-channel-javascript");
    await jsChannel.click();
    await page.waitForTimeout(200);

    const startBtn = page.getByTestId("onboarding-done-btn");
    await startBtn.click();
    await page.waitForTimeout(500);

    const editBtn = page.getByTestId("edit-tracks-btn");
    await editBtn.click();
    await page.waitForTimeout(300);

    const selectedText = page.getByText("1 selected");
    await expect(selectedText).toBeVisible();
  });

  test("should show at least 2 tech channels", async ({ page }) => {
    const techChannels = page
      .locator('[data-testid^="onboarding-channel-"]')
      .filter({ hasText: /./ });
    const count = await techChannels.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test("should show certification channels", async ({ page }) => {
    await expect(page.getByText("Certifications")).toBeVisible();
    const certSection = page.locator("text=Certifications").locator("..");
    await expect(certSection).toBeVisible();
  });

  test("should select certification channel", async ({ page }) => {
    const certChannels = page
      .locator('[data-testid^="onboarding-channel-"]')
      .filter({ hasText: /(AWS|CKA|GCP|CKA|Cert)/i });
    if ((await certChannels.count()) > 0) {
      await certChannels.first().click();
      await page.waitForTimeout(200);

      const startBtn = page.getByTestId("onboarding-done-btn");
      await expect(startBtn).toBeEnabled();
    }
  });

  test("should show progress indicator", async ({ page }) => {
    const jsChannel = page.getByTestId("onboarding-channel-javascript");
    await jsChannel.click();
    await page.waitForTimeout(200);

    await expect(page.locator('span:has-text("selected")')).toBeVisible();
  });

  test("should not show onboarding on subsequent loads", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
    });
    await page.reload();
    await page.waitForTimeout(500);

    await expect(page.getByTestId("onboarding-modal")).not.toBeVisible();
    await expect(page.getByTestId("app-root")).toBeVisible();
  });
});
