import { test, expect } from "@playwright/test";

const SELECTED_IDS_KEY = "devprep:selectedIds";
const DRAFT_KEY = "devprep:onboarding-draft";

/** Set savedIds and reload — skips onboarding and lands on the main app. */
async function loginWithChannels(page: import("@playwright/test").Page, ids: string[]) {
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [SELECTED_IDS_KEY, JSON.stringify(ids)]
  );
  await page.reload();
  await expect(page.getByTestId("app-root")).toBeVisible();
}

/** Clear all devprep keys and reload so the initial onboarding modal is shown. */
async function freshOnboarding(page: import("@playwright/test").Page) {
  await page.evaluate((keys: string[]) => keys.forEach((k) => localStorage.removeItem(k)), [
    SELECTED_IDS_KEY,
    DRAFT_KEY,
    "devprep:channelId",
    "devprep:section",
    "devprep:channelTypeFilter",
  ]);
  await page.reload();
  await expect(page.getByTestId("onboarding-modal")).toBeVisible();
}

test.describe("Channel selection persistence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // -----------------------------------------------------------------------
  // 1. Basic: saved selection is pre-checked when reopening via Edit Channels
  // -----------------------------------------------------------------------
  test("re-opening Edit Channels shows the previously saved JavaScript selection", async ({
    page,
  }) => {
    await loginWithChannels(page, ["javascript"]);

    await page.getByTestId("edit-tracks-btn").click();
    await expect(page.getByTestId("onboarding-modal")).toBeVisible();

    await expect(page.getByTestId("onboarding-channel-javascript")).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  // -----------------------------------------------------------------------
  // 2. Multiple saved channels are all pre-populated on Edit re-open
  // -----------------------------------------------------------------------
  test("multiple saved channels are all pre-checked when Edit Channels opens", async ({
    page,
  }) => {
    await loginWithChannels(page, ["javascript", "react"]);

    await page.getByTestId("edit-tracks-btn").click();
    await expect(page.getByTestId("onboarding-modal")).toBeVisible();

    await expect(page.getByTestId("onboarding-channel-javascript")).toHaveAttribute(
      "aria-checked",
      "true"
    );
    await expect(page.getByTestId("onboarding-channel-react")).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  // -----------------------------------------------------------------------
  // 3. Channels NOT in saved selections appear unchecked on Edit re-open
  // -----------------------------------------------------------------------
  test("unsaved channels appear unchecked when Edit Channels opens", async ({
    page,
  }) => {
    await loginWithChannels(page, ["javascript"]);

    await page.getByTestId("edit-tracks-btn").click();
    await expect(page.getByTestId("onboarding-modal")).toBeVisible();

    // React was not saved — must be unchecked
    await expect(page.getByTestId("onboarding-channel-react")).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  // -----------------------------------------------------------------------
  // 4. Stale draft does NOT override saved selections when editing
  //    Scenario: saved = [javascript]; stale draft = [javascript, react]
  //    Edit should show only javascript checked, not react.
  // -----------------------------------------------------------------------
  test("stale draft does not override saved selections when editing", async ({
    page,
  }) => {
    await loginWithChannels(page, ["javascript"]);

    // Inject a stale draft that includes React (never committed via Done)
    await page.evaluate(
      ([key, value]) => localStorage.setItem(key, value),
      [DRAFT_KEY, JSON.stringify(["javascript", "react"])]
    );

    await page.getByTestId("edit-tracks-btn").click();
    await expect(page.getByTestId("onboarding-modal")).toBeVisible();

    // JavaScript is saved — must be checked
    await expect(page.getByTestId("onboarding-channel-javascript")).toHaveAttribute(
      "aria-checked",
      "true"
    );
    // React was only in the stale draft — must NOT be checked
    await expect(page.getByTestId("onboarding-channel-react")).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });

  // -----------------------------------------------------------------------
  // 5. In-progress draft survives a page reload during initial onboarding
  // -----------------------------------------------------------------------
  test("in-progress draft survives a page reload during initial onboarding", async ({
    page,
  }) => {
    await freshOnboarding(page);

    // The modal starts with JavaScript pre-selected by default.
    // Click React to add it to the in-progress selection (draft is saved automatically).
    await page.getByTestId("onboarding-channel-react").click();

    // Reload before clicking Done — simulates a browser refresh mid-onboarding
    await page.reload();
    await expect(page.getByTestId("onboarding-modal")).toBeVisible();

    // React must still be selected from the auto-saved draft
    await expect(page.getByTestId("onboarding-channel-react")).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  // -----------------------------------------------------------------------
  // 6. App skips onboarding entirely on page reload after completing it
  // -----------------------------------------------------------------------
  test("app skips onboarding on page reload after selections are saved", async ({
    page,
  }) => {
    await loginWithChannels(page, ["javascript"]);

    await page.reload();

    await expect(page.getByTestId("onboarding-modal")).not.toBeVisible();
    await expect(page.getByTestId("app-root")).toBeVisible();
  });

  // -----------------------------------------------------------------------
  // 7. Footer badge reflects the correct saved selection count on Edit re-open
  // -----------------------------------------------------------------------
  test("selection count badge matches saved selections when Edit Channels opens", async ({
    page,
  }) => {
    await loginWithChannels(page, ["javascript", "react"]);

    await page.getByTestId("edit-tracks-btn").click();
    await expect(page.getByTestId("onboarding-modal")).toBeVisible();

    await expect(page.getByText("2 tracks selected")).toBeVisible();
  });
});
