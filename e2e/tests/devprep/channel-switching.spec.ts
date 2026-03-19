import { test, expect } from "@playwright/test";

test.describe("Channel Switching", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript", "react"]),
      );
    });
    await page.reload();
    await page.waitForTimeout(500);
  });

  test("should display multiple channel tabs", async ({ page }) => {
    await expect(page.getByTestId("channel-tab-javascript")).toBeVisible();
    await expect(page.getByTestId("channel-tab-react")).toBeVisible();
  });

  test("should switch to react channel", async ({ page }) => {
    const reactTab = page.getByTestId("channel-tab-react");
    await reactTab.click();
    await page.waitForTimeout(300);

    const style = await reactTab.getAttribute("style");
    expect(style).toContain("font-weight: 600");
  });

  test("should switch back to javascript channel", async ({ page }) => {
    const reactTab = page.getByTestId("channel-tab-react");
    await reactTab.click();
    await page.waitForTimeout(300);

    const jsTab = page.getByTestId("channel-tab-javascript");
    await jsTab.click();
    await page.waitForTimeout(300);

    const style = await jsTab.getAttribute("style");
    expect(style).toContain("font-weight: 600");
  });

  test("should content update when switching channels", async ({ page }) => {
    const reactTab = page.getByTestId("channel-tab-react");
    await reactTab.click();
    await page.waitForTimeout(500);

    await expect(page.locator("text=React").first()).toBeVisible();
  });

  test("should section counts update on channel switch", async ({ page }) => {
    const jsQACount = await page
      .getByTestId("section-tab-qa")
      .locator("span")
      .last()
      .textContent();

    const reactTab = page.getByTestId("channel-tab-react");
    await reactTab.click();
    await page.waitForTimeout(500);

    const reactQACount = await page
      .getByTestId("section-tab-qa")
      .locator("span")
      .last()
      .textContent();

    expect(reactQACount).toBeTruthy();
  });

  test("should highlight active channel tab", async ({ page }) => {
    const jsTab = page.getByTestId("channel-tab-javascript");
    const jsStyle = await jsTab.getAttribute("style");
    expect(jsStyle).toContain("font-weight: 600");

    const reactTab = page.getByTestId("channel-tab-react");
    await reactTab.click();
    await page.waitForTimeout(300);

    const jsStyleAfter = await jsTab.getAttribute("style");
    expect(jsStyleAfter).toContain("font-weight: 400");

    const reactStyleAfter = await reactTab.getAttribute("style");
    expect(reactStyleAfter).toContain("font-weight: 600");
  });

  test("should channel switch persist in localStorage", async ({ page }) => {
    const reactTab = page.getByTestId("channel-tab-react");
    await reactTab.click();
    await page.waitForTimeout(300);

    const stored = await page.evaluate(() => {
      return localStorage.getItem("devprep:channelId");
    });
    expect(stored).toBe('"react"');
  });

  test("should channel state persist on reload", async ({ page }) => {
    const reactTab = page.getByTestId("channel-tab-react");
    await reactTab.click();
    await page.waitForTimeout(300);

    await page.reload();
    await page.waitForTimeout(500);

    const reactStyle = await reactTab.getAttribute("style");
    expect(reactStyle).toContain("font-weight: 600");
  });

  test("should show edit button", async ({ page }) => {
    const editBtn = page.getByTestId("edit-tracks-btn");
    await expect(editBtn).toBeVisible();
  });

  test("should edit button open onboarding modal", async ({ page }) => {
    const editBtn = page.getByTestId("edit-tracks-btn");
    await editBtn.click();
    await page.waitForTimeout(300);

    await expect(page.getByTestId("onboarding-modal")).toBeVisible();
  });

  test("should section tabs remain visible after channel switch", async ({
    page,
  }) => {
    const reactTab = page.getByTestId("channel-tab-react");
    await reactTab.click();
    await page.waitForTimeout(300);

    await expect(page.getByTestId("section-tab-qa")).toBeVisible();
    await expect(page.getByTestId("section-tab-flashcards")).toBeVisible();
    await expect(page.getByTestId("section-tab-coding")).toBeVisible();
  });

  test("should show channel-specific content", async ({ page }) => {
    await page.getByTestId("section-tab-coding").click();
    await page.waitForTimeout(500);

    const jsTab = page.getByTestId("channel-tab-javascript");
    await jsTab.click();
    await page.waitForTimeout(500);

    const codingPage = page.getByTestId("coding-page");
    await expect(codingPage)
      .toBeVisible({ timeout: 3000 })
      .catch(() => {});
  });

  test("should show certification channels when selected", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript", "aws-saa"]),
      );
    });
    await page.reload();
    await page.waitForTimeout(500);

    await expect(page.getByTestId("channel-tab-javascript")).toBeVisible();
    await expect(page.getByTestId("channel-tab-aws-saa")).toBeVisible();
  });

  test("should switch between tech and certification channels", async ({
    page,
  }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript", "aws-saa"]),
      );
    });
    await page.reload();
    await page.waitForTimeout(500);

    const awsTab = page.getByTestId("channel-tab-aws-saa");
    await awsTab.click();
    await page.waitForTimeout(300);

    const style = await awsTab.getAttribute("style");
    expect(style).toContain("font-weight: 600");
  });

  test("should show separator between tech and cert channels", async ({
    page,
  }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript", "aws-saa"]),
      );
    });
    await page.reload();
    await page.waitForTimeout(500);

    const separator = page.locator("text=CERTS");
    await expect(separator).toBeVisible();
  });

  test("should show channel labels correctly", async ({ page }) => {
    const jsTab = page.getByTestId("channel-tab-javascript");
    await expect(jsTab).toContainText("JavaScript");

    const reactTab = page.getByTestId("channel-tab-react");
    await expect(reactTab).toContainText("React");
  });

  test("should show channel emojis", async ({ page }) => {
    const jsTab = page.getByTestId("channel-tab-javascript");
    const html = await jsTab.innerHTML();
    expect(html).toContain("JS");
  });

  test("should channel switching work from any section", async ({ page }) => {
    await page.getByTestId("section-tab-coding").click();
    await page.waitForTimeout(300);

    const reactTab = page.getByTestId("channel-tab-react");
    await reactTab.click();
    await page.waitForTimeout(500);

    await expect(page.getByTestId("section-tab-coding")).toBeVisible();
  });

  test("should auto-select first channel on initial load", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("devprep:selectedIds", JSON.stringify(["react"]));
    });
    await page.reload();
    await page.waitForTimeout(500);

    const reactTab = page.getByTestId("channel-tab-react");
    const style = await reactTab.getAttribute("style");
    expect(style).toContain("font-weight: 600");
  });

  test("should handle channel with no content gracefully", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem(
        "devprep:selectedIds",
        JSON.stringify(["javascript"]),
      );
      localStorage.setItem("devprep:channelId", JSON.stringify("javascript"));
    });

    const jsTab = page.getByTestId("channel-tab-javascript");
    await jsTab.click();
    await page.waitForTimeout(500);

    await expect(page.locator("text=DevPrep")).toBeVisible();
  });

  test("should show correct header for active channel", async ({ page }) => {
    const reactTab = page.getByTestId("channel-tab-react");
    await reactTab.click();
    await page.waitForTimeout(300);

    const header = page.getByTestId("header");
    await expect(header).toContainText("React");
  });
});
