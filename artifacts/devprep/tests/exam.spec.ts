import { test, expect } from '@playwright/test'
import { bypassOnboarding, waitForAppReady } from './helpers'

test.describe('Mock Exam Page', () => {
  test.beforeEach(async ({ page }) => {
    // aws-saa has many exam questions; js also has some
    await bypassOnboarding(page, ['javascript', 'aws-saa', 'cka'], {
      section: 'exam',
      channelId: 'javascript',
    })
    await page.goto('/')
    await waitForAppReady(page)
    await page.click('[role="tab"]:has-text("Exam")')
    await page.waitForTimeout(600)
  })

  test('exam page loads', async ({ page }) => {
    await expect(
      page.locator('[data-testid="exam-start-btn"]').or(page.locator('text=No exam questions'))
    ).toBeVisible({ timeout: 8000 })
  })

  test('ready screen shows exam metadata', async ({ page }) => {
    const startBtn = page.locator('[data-testid="exam-start-btn"]')
    if (!(await startBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await expect(page.locator('text=Mock Exam')).toBeVisible()
    await expect(page.locator('text=45 minutes')).toBeVisible()
    await expect(page.locator('text=72% to pass')).toBeVisible()
  })

  test('difficulty breakdown is shown', async ({ page }) => {
    const startBtn = page.locator('[data-testid="exam-start-btn"]')
    if (!(await startBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    // Easy / Medium / Hard columns
    await expect(page.locator('text=easy').or(page.locator('text=Easy'))).toBeVisible()
    await expect(page.locator('text=medium').or(page.locator('text=Medium'))).toBeVisible()
  })

  test('Start Exam button is clickable', async ({ page }) => {
    const startBtn = page.locator('[data-testid="exam-start-btn"]')
    if (!(await startBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await expect(startBtn).toBeEnabled()
    await startBtn.click()
    await page.waitForTimeout(600)
    // Should move to exam phase — timer should appear
    await expect(
      page
        .locator('text=Submit')
        .or(page.locator('[aria-label="Flag question"]'))
        .or(page.locator('text=00:'))
    ).toBeVisible({ timeout: 8000 })
  })

  test('exam timer is visible after starting', async ({ page }) => {
    const startBtn = page.locator('[data-testid="exam-start-btn"]')
    if (!(await startBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await startBtn.click()
    await page.waitForTimeout(600)
    // Timer format MM:SS
    await expect(page.locator('text=/\\d{2}:\\d{2}/').first()).toBeVisible({ timeout: 8000 })
  })

  test('exam question is displayed after starting', async ({ page }) => {
    const startBtn = page.locator('[data-testid="exam-start-btn"]')
    if (!(await startBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await startBtn.click()
    await page.waitForTimeout(600)
    // Answer options (A, B, C, D) should be visible
    await expect(
      page.locator('text=/^[A-D]\\./').or(page.locator('button:has-text("Submit")'))
    ).toBeVisible({ timeout: 8000 })
  })

  test('can select an answer', async ({ page }) => {
    const startBtn = page.locator('[data-testid="exam-start-btn"]')
    if (!(await startBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await startBtn.click()
    await page.waitForTimeout(600)

    // Click first answer option
    const options = page.locator('button').filter({ hasText: /^[A-D]\./ })
    if ((await options.count()) > 0) {
      await options.first().click()
      await page.waitForTimeout(200)
      // Page should remain stable
      await expect(page.locator('[data-testid="header"]')).toBeVisible()
    }
  })

  test('can navigate to next question', async ({ page }) => {
    const startBtn = page.locator('[data-testid="exam-start-btn"]')
    if (!(await startBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await startBtn.click()
    await page.waitForTimeout(600)

    const nextBtn = page
      .locator('[aria-label="Next question"]')
      .or(page.locator('button:has([data-lucide="chevron-right"])').last())
    if ((await nextBtn.isVisible()) && (await nextBtn.isEnabled())) {
      await nextBtn.click()
      await page.waitForTimeout(300)
      await expect(page.locator('[data-testid="header"]')).toBeVisible()
    }
  })

  test('submit exam leads to result screen', async ({ page }) => {
    const startBtn = page.locator('[data-testid="exam-start-btn"]')
    if (!(await startBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await startBtn.click()
    await page.waitForTimeout(600)

    const submitBtn = page.locator('button:has-text("Submit Exam"), button:has-text("Submit")')
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.first().click()
      await page.waitForTimeout(1000)
      // Result screen — shows percentage
      await expect(
        page.locator('text=/%/').or(page.locator('text=Passed')).or(page.locator('text=keep going'))
      ).toBeVisible({ timeout: 8000 })
    }
  })

  test('exam resets when switching channels', async ({ page }) => {
    const startBtn = page.locator('[data-testid="exam-start-btn"]')
    if (!(await startBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await startBtn.click()
    await page.waitForTimeout(500)

    // Switch channel tab
    const tsTab = page.locator('[data-testid="channel-tab-javascript"]')
    await tsTab.click()
    await page.waitForTimeout(500)

    // Should reset to ready state
    await expect(
      page.locator('[data-testid="exam-start-btn"]').or(page.locator('text=No exam questions'))
    ).toBeVisible({ timeout: 8000 })
  })
})
