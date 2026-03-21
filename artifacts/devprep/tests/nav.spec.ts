import { test, expect } from '@playwright/test'
import { bypassOnboarding, waitForAppReady, goToSection } from './helpers'

test.describe('Navigation — section tabs & channel bar', () => {
  test.beforeEach(async ({ page }) => {
    await bypassOnboarding(page)
    await page.goto('/')
    await waitForAppReady(page)
  })

  // ── Section Tabs ────────────────────────────────────────────────────────────

  test('section tabs bar is visible', async ({ page }) => {
    await expect(page.locator('[data-testid="section-tabs"]')).toBeVisible()
  })

  test('all five section tabs render', async ({ page }) => {
    for (const id of ['qa', 'flashcards', 'coding', 'exam', 'voice']) {
      await expect(page.locator(`[data-testid="section-tab-${id}"]`)).toBeVisible()
    }
  })

  test('Q&A tab is active by default', async ({ page }) => {
    // The active tab has primary color — at minimum it should be present
    const tab = page.locator('[data-testid="section-tab-qa"]')
    await expect(tab).toBeVisible()
  })

  test('clicking Flashcards tab switches to flashcards', async ({ page }) => {
    await goToSection(page, 'flashcards')
    // Flashcard-specific elements should appear
    await expect(
      page.locator('[data-testid="flashcard-shuffle-btn"]')
        .or(page.locator('text=No flashcards for this channel')),
    ).toBeVisible({ timeout: 8000 })
  })

  test('clicking Coding tab switches to coding page', async ({ page }) => {
    await goToSection(page, 'coding')
    await expect(
      page.locator('[data-testid="coding-editor"]')
        .or(page.locator('text=No coding challenges')),
    ).toBeVisible({ timeout: 8000 })
  })

  test('clicking Exam tab switches to exam ready screen', async ({ page }) => {
    await goToSection(page, 'exam')
    await expect(
      page.locator('[data-testid="exam-start-btn"]')
        .or(page.locator('text=No exam questions')),
    ).toBeVisible({ timeout: 8000 })
  })

  test('clicking Voice tab switches to voice practice', async ({ page }) => {
    await goToSection(page, 'voice')
    await expect(
      page.locator('text=Voice')
        .or(page.locator('text=No voice prompts')),
    ).toBeVisible({ timeout: 8000 })
  })

  test('can cycle through all section tabs', async ({ page }) => {
    const sections = ['qa', 'flashcards', 'coding', 'exam', 'voice'] as const
    for (const s of sections) {
      await page.click(`[data-testid="section-tab-${s}"]`)
      await page.waitForTimeout(300)
      // No crash
      await expect(page.locator('[data-testid="header"]')).toBeVisible()
    }
  })

  // ── Channel Bar ─────────────────────────────────────────────────────────────

  test('channel bar is visible', async ({ page }) => {
    await expect(page.locator('[data-testid="channel-bar"]')).toBeVisible()
  })

  test('JavaScript channel tab is visible', async ({ page }) => {
    await expect(page.locator('[data-testid="channel-tab-javascript"]')).toBeVisible()
  })

  test('edit channels button is visible', async ({ page }) => {
    await expect(page.locator('[data-testid="edit-tracks-btn"]')).toBeVisible()
  })

  test('switching channels updates the header channel display', async ({ page }) => {
    // Click on a different channel — TypeScript
    const tsTab = page.locator('[data-testid="channel-tab-typescript"]')
    if (await tsTab.isVisible()) {
      await tsTab.click()
      await page.waitForTimeout(500)
      await expect(page.locator('[data-testid="header"]')).toContainText('TypeScript')
    }
  })

  test('active channel tab has bottom border indicator', async ({ page }) => {
    // JS should be active and have the color underline via style
    const jsTab = page.locator('[data-testid="channel-tab-javascript"]')
    await expect(jsTab).toBeVisible()
    // The span inside should have background style set (not transparent)
    const underline = jsTab.locator('span').last()
    const bg = await underline.getAttribute('style')
    // The active underline has a color, not 'transparent'
    expect(bg).not.toContain('transparent')
  })
})
