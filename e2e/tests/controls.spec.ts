import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

const SCREENSHOTS_DIR = path.resolve(import.meta.dirname, "../screenshots");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function saveScreenshot(page: import("@playwright/test").Page, name: string) {
  ensureDir(SCREENSHOTS_DIR);
  const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
}

test.describe("UI Controls Demo", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("page loads and title is visible", async ({ page }) => {
    const title = page.getByTestId("page-title");
    await expect(title).toBeVisible();
    await expect(title).toHaveText("UI Controls Demo");
    await saveScreenshot(page, "01-page-load");
  });

  test("badges render with correct variants", async ({ page }) => {
    const section = page.getByTestId("badges-section");
    await expect(section).toBeVisible();

    await expect(page.getByTestId("badge-default")).toBeVisible();
    await expect(page.getByTestId("badge-default")).toHaveText("Default");

    await expect(page.getByTestId("badge-secondary")).toBeVisible();
    await expect(page.getByTestId("badge-secondary")).toHaveText("Secondary");

    await expect(page.getByTestId("badge-outline")).toBeVisible();
    await expect(page.getByTestId("badge-outline")).toHaveText("Outline");

    await expect(page.getByTestId("badge-destructive")).toBeVisible();
    await expect(page.getByTestId("badge-destructive")).toHaveText("Destructive");

    await saveScreenshot(page, "02-badges");
  });

  test("alerts render correctly", async ({ page }) => {
    const section = page.getByTestId("alerts-section");
    await expect(section).toBeVisible();

    const infoAlert = page.getByTestId("alert-info");
    await expect(infoAlert).toBeVisible();
    await expect(infoAlert).toContainText("Information");

    const errorAlert = page.getByTestId("alert-error");
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText("Error");

    await saveScreenshot(page, "03-alerts");
  });

  test("text input accepts and displays typed text", async ({ page }) => {
    const input = page.getByTestId("text-input");
    await expect(input).toBeVisible();
    await input.fill("John Doe");
    await expect(input).toHaveValue("John Doe");
    await saveScreenshot(page, "04-text-input");
  });

  test("email input accepts email addresses", async ({ page }) => {
    const input = page.getByTestId("email-input");
    await input.fill("john@example.com");
    await expect(input).toHaveValue("john@example.com");
  });

  test("password input accepts and masks password", async ({ page }) => {
    const input = page.getByTestId("password-input");
    await expect(input).toHaveAttribute("type", "password");
    await input.fill("mysecretpass");
    await expect(input).toHaveValue("mysecretpass");
  });

  test("textarea accepts multi-line text", async ({ page }) => {
    const textarea = page.getByTestId("textarea-input");
    await expect(textarea).toBeVisible();
    await textarea.fill("Hello\nThis is a multi-line\nmessage");
    await expect(textarea).toHaveValue("Hello\nThis is a multi-line\nmessage");
    await saveScreenshot(page, "05-textarea");
  });

  test("select dropdown works", async ({ page }) => {
    const trigger = page.getByTestId("select-trigger");
    await expect(trigger).toBeVisible();
    await trigger.click();
    await page.waitForTimeout(300);

    const usOption = page.getByTestId("select-option-us");
    await expect(usOption).toBeVisible();
    await usOption.click();

    await expect(trigger).toContainText("United States");
    await saveScreenshot(page, "06-select");
  });

  test("checkboxes can be checked and unchecked", async ({ page }) => {
    const checkbox1 = page.getByTestId("checkbox-1");
    await expect(checkbox1).toBeVisible();
    await expect(checkbox1).not.toBeChecked();

    await checkbox1.click();
    await expect(checkbox1).toBeChecked();

    await checkbox1.click();
    await expect(checkbox1).not.toBeChecked();

    const checkbox2 = page.getByTestId("checkbox-2");
    await expect(checkbox2).toBeChecked();

    await saveScreenshot(page, "07-checkboxes");
  });

  test("radio group selects only one option", async ({ page }) => {
    const radio1 = page.getByTestId("radio-1");
    const radio2 = page.getByTestId("radio-2");
    const radio3 = page.getByTestId("radio-3");

    await expect(radio1).toBeChecked();
    await expect(radio2).not.toBeChecked();
    await expect(radio3).not.toBeChecked();

    await radio2.click();
    await expect(radio1).not.toBeChecked();
    await expect(radio2).toBeChecked();
    await expect(radio3).not.toBeChecked();

    await radio3.click();
    await expect(radio2).not.toBeChecked();
    await expect(radio3).toBeChecked();

    await saveScreenshot(page, "08-radio-group");
  });

  test("switches toggle on and off", async ({ page }) => {
    const switch1 = page.getByTestId("switch-1");
    await expect(switch1).toBeVisible();
    await expect(switch1).toHaveAttribute("data-state", "unchecked");

    await switch1.click();
    await expect(switch1).toHaveAttribute("data-state", "checked");

    await switch1.click();
    await expect(switch1).toHaveAttribute("data-state", "unchecked");

    const switch2 = page.getByTestId("switch-2");
    await expect(switch2).toHaveAttribute("data-state", "checked");

    await saveScreenshot(page, "09-switches");
  });

  test("slider can be interacted with", async ({ page }) => {
    const slider = page.getByTestId("slider");
    await expect(slider).toBeVisible();
    const thumb = slider.locator('[role="slider"]');
    await expect(thumb).toBeVisible();
    await expect(thumb).toHaveAttribute("aria-valuenow", "50");
    await saveScreenshot(page, "10-slider");
  });

  test("form submit shows result", async ({ page }) => {
    await page.getByTestId("text-input").fill("Jane Smith");
    await page.getByTestId("email-input").fill("jane@example.com");

    const selectTrigger = page.getByTestId("select-trigger");
    await selectTrigger.click();
    await page.waitForTimeout(300);
    await page.getByTestId("select-option-ca").click();

    await page.getByTestId("radio-2").click();

    await page.getByTestId("submit-button").click();

    const result = page.getByTestId("submit-result");
    await expect(result).toBeVisible();
    await expect(result).toContainText("Jane Smith");
    await expect(result).toContainText("jane@example.com");

    await saveScreenshot(page, "11-form-submit");
  });

  test("reset button clears the form", async ({ page }) => {
    await page.getByTestId("text-input").fill("Test User");
    await page.getByTestId("reset-button").click();

    const input = page.getByTestId("text-input");
    await expect(input).toHaveValue("");
    await saveScreenshot(page, "12-reset");
  });

  test("button variants all render", async ({ page }) => {
    const section = page.getByTestId("buttons-section");
    await expect(section).toBeVisible();

    await expect(page.getByTestId("btn-default")).toBeVisible();
    await expect(page.getByTestId("btn-secondary")).toBeVisible();
    await expect(page.getByTestId("btn-outline")).toBeVisible();
    await expect(page.getByTestId("btn-ghost")).toBeVisible();
    await expect(page.getByTestId("btn-destructive")).toBeVisible();
    await expect(page.getByTestId("btn-link")).toBeVisible();

    const disabled = page.getByTestId("btn-disabled");
    await expect(disabled).toBeDisabled();

    await saveScreenshot(page, "13-buttons");
  });

  test("toggle buttons toggle on and off", async ({ page }) => {
    const section = page.getByTestId("toggles-section");
    await expect(section).toBeVisible();

    const boldToggle = page.getByTestId("toggle-bold");
    await expect(boldToggle).toBeVisible();
    await expect(boldToggle).toHaveAttribute("data-state", "off");

    await boldToggle.click();
    await expect(boldToggle).toHaveAttribute("data-state", "on");

    const italicToggle = page.getByTestId("toggle-italic");
    await italicToggle.click();
    await expect(italicToggle).toHaveAttribute("data-state", "on");

    const status = page.getByTestId("toggle-status");
    await expect(status).toContainText("Bold");
    await expect(status).toContainText("Italic");

    await saveScreenshot(page, "14-toggles");
  });

  test("progress bars render with correct values", async ({ page }) => {
    const section = page.getByTestId("progress-section");
    await expect(section).toBeVisible();

    const progressBar = page.getByTestId("progress-bar");
    await expect(progressBar).toBeVisible();

    const progressComplete = page.getByTestId("progress-complete");
    await expect(progressComplete).toBeVisible();

    await saveScreenshot(page, "15-progress");
  });

  test("tabs switch content correctly", async ({ page }) => {
    const section = page.getByTestId("tabs-section");
    await expect(section).toBeVisible();

    await expect(page.getByTestId("tab-content-1")).toBeVisible();

    await page.getByTestId("tab-2").click();
    await expect(page.getByTestId("tab-content-2")).toBeVisible();
    await expect(page.getByTestId("tab-content-1")).not.toBeVisible();

    await page.getByTestId("tab-3").click();
    await expect(page.getByTestId("tab-content-3")).toBeVisible();
    await expect(page.getByTestId("tab-content-2")).not.toBeVisible();

    await page.getByTestId("tab-1").click();
    await expect(page.getByTestId("tab-content-1")).toBeVisible();

    await saveScreenshot(page, "16-tabs");
  });

  test("dialog opens and closes", async ({ page }) => {
    const openButton = page.getByTestId("open-dialog-button");
    await expect(openButton).toBeVisible();
    await openButton.click();

    const dialog = page.getByTestId("dialog-content");
    await expect(dialog).toBeVisible();

    await expect(page.getByTestId("dialog-title")).toBeVisible();
    await expect(page.getByTestId("dialog-title")).toHaveText("Confirm Action");
    await expect(page.getByTestId("dialog-description")).toBeVisible();

    await saveScreenshot(page, "17-dialog-open");

    await page.getByTestId("dialog-cancel-button").click();
    await expect(dialog).not.toBeVisible();

    await saveScreenshot(page, "18-dialog-closed");
  });

  test("dialog confirm button closes dialog", async ({ page }) => {
    await page.getByTestId("open-dialog-button").click();
    const dialog = page.getByTestId("dialog-content");
    await expect(dialog).toBeVisible();

    await page.getByTestId("dialog-confirm-button").click();
    await expect(dialog).not.toBeVisible();
  });

  test("full page screenshot at end", async ({ page }) => {
    await saveScreenshot(page, "19-full-page-final");
  });
});
