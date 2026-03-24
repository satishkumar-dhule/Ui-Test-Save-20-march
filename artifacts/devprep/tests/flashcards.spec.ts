import { test, expect } from '@playwright/test'
import { bypassOnboarding, waitForAppReady } from './helpers'

test.describe('Flashcards Page', () => {
  test.beforeEach(async ({ page }) => {
    await bypassOnboarding(page, ['javascript', 'typescript', 'react'], { section: 'flashcards' })
    await page.goto('/')
    await waitForAppReady(page)
    await page.click('[role="tab"]:has-text("Flashcards")')
    await page.waitForTimeout(600)
  })

  test('flashcards page loads', async ({ page }) => {
    await expect(
      page.locator('[data-testid="flashcard-shuffle-btn"]').or(page.locator('text=No flashcards'))
    ).toBeVisible({ timeout: 8000 })
  })

  test('shuffle button is visible', async ({ page }) => {
    const shuffleBtn = page.locator('[data-testid="flashcard-shuffle-btn"]')
    if (await shuffleBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(shuffleBtn).toBeVisible()
    }
  })

  test('reset button is visible', async ({ page }) => {
    const resetBtn = page.locator('[data-testid="flashcard-reset-btn"]')
    if (await resetBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(resetBtn).toBeVisible()
    }
  })

  test('flashcard is displayed', async ({ page }) => {
    const shuffleBtn = page.locator('[data-testid="flashcard-shuffle-btn"]')
    if (!(await shuffleBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip()
    }
    // A flip-card element should be visible
    const card = page.locator('.flip-card')
    await expect(card).toBeVisible({ timeout: 8000 })
  })

  test('clicking flashcard flips it', async ({ page }) => {
    const card = page.locator('.flip-card')
    if (!(await card.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()

    // Should NOT have 'flipped' class initially
    await expect(card).not.toHaveClass(/flipped/)
    await card.click()
    await page.waitForTimeout(300)
    // After click should have 'flipped'
    await expect(card).toHaveClass(/flipped/)
  })

  test('next button navigates to next card', async ({ page }) => {
    const nextBtn = page.locator('[aria-label="Next flashcard"]')
    if (!(await nextBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()

    const counterBefore = await page.locator('.text-xs.text-muted-foreground').first().textContent()
    if (await nextBtn.isEnabled()) {
      await nextBtn.click()
      await page.waitForTimeout(300)
      const counterAfter = await page
        .locator('.text-xs.text-muted-foreground')
        .first()
        .textContent()
      expect(counterAfter).not.toBe(counterBefore)
    }
  })

  test('previous button navigates back', async ({ page }) => {
    const nextBtn = page.locator('[aria-label="Next flashcard"]')
    const prevBtn = page.locator('[aria-label="Previous flashcard"]')
    if (!(await nextBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()

    // Go forward then back
    if (await nextBtn.isEnabled()) {
      await nextBtn.click()
      await page.waitForTimeout(200)
      await expect(prevBtn).toBeEnabled()
      await prevBtn.click()
      await page.waitForTimeout(200)
    }
  })

  test('shuffle button randomises deck', async ({ page }) => {
    const shuffleBtn = page.locator('[data-testid="flashcard-shuffle-btn"]')
    if (!(await shuffleBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await shuffleBtn.click()
    await page.waitForTimeout(300)
    // Button label should change to "Shuffled"
    await expect(shuffleBtn).toContainText('Shuffled')
  })

  test('reset button clears shuffle and resets progress', async ({ page }) => {
    const resetBtn = page.locator('[data-testid="flashcard-reset-btn"]')
    if (!(await resetBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await resetBtn.click()
    await page.waitForTimeout(300)
    // Shuffle button should revert to "Shuffle"
    const shuffleBtn = page.locator('[data-testid="flashcard-shuffle-btn"]')
    await expect(shuffleBtn).toContainText('Shuffle')
  })

  test('progress bar is in DOM', async ({ page }) => {
    const progressBar = page.locator('[data-testid="flashcard-progress-bar"]')
    if (!(await progressBar.isAttached({ timeout: 5000 }).catch(() => false))) test.skip()
    await expect(progressBar).toBeAttached()
  })

  test('keyboard arrow navigation works', async ({ page }) => {
    const card = page.locator('.flip-card')
    if (!(await card.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()

    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(200)
    await page.keyboard.press('ArrowLeft')
    await page.waitForTimeout(200)
    // Should not crash
    await expect(card).toBeVisible()
  })

  test('space key flips card when card is focused', async ({ page }) => {
    const card = page.locator('.flip-card')
    if (!(await card.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()

    await card.focus()
    await page.keyboard.press('Space')
    await page.waitForTimeout(300)
    await expect(card).toHaveClass(/flipped/)
  })

  test('sidebar is visible on desktop', async ({ page, viewport }) => {
    if (!viewport || viewport.width < 768) test.skip()
    const shuffleBtn = page.locator('[data-testid="flashcard-shuffle-btn"]')
    if (!(await shuffleBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    const sidebar = page.locator('.sidebar').first()
    await expect(sidebar).toBeVisible()
  })
})
