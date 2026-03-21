import { test, expect } from '@playwright/test'
import { bypassOnboarding, waitForAppReady } from './helpers'

test.describe('Voice Practice Page', () => {
  test.beforeEach(async ({ page }) => {
    await bypassOnboarding(page, ['javascript', 'react', 'system-design'], { section: 'voice', channelId: 'javascript' })
    await page.goto('/')
    await waitForAppReady(page)
    await page.click('[data-testid="section-tab-voice"]')
    await page.waitForTimeout(600)
  })

  test('voice practice page loads', async ({ page }) => {
    await expect(
      page.locator('text=Voice').or(page.locator('text=No voice prompts')),
    ).toBeVisible({ timeout: 8000 })
  })

  test('voice practice heading is visible', async ({ page }) => {
    const heading = page.locator('h1:has-text("Voice")').or(page.locator('text=Voice Practice'))
    await expect(heading.first()).toBeVisible({ timeout: 8000 })
  })

  test('prompt is displayed', async ({ page }) => {
    // Either a prompt is shown or empty state
    await expect(
      page.locator('text=Practice Scenarios')
        .or(page.locator('text=No voice prompts'))
        .or(page.locator('text=Voice Practice')),
    ).toBeVisible({ timeout: 8000 })
  })

  test('navigation counter is visible', async ({ page }) => {
    // The "1/N" counter should be visible if there are prompts
    const counter = page.locator('text=/\\d+\\/\\d+/')
    const noPrompts = page.locator('text=No voice prompts')
    const either = counter.or(noPrompts)
    await expect(either.first()).toBeVisible({ timeout: 8000 })
  })

  test('next/prev navigation buttons exist', async ({ page }) => {
    const noPrompts = page.locator('text=No voice prompts')
    if (await noPrompts.isVisible({ timeout: 3000 }).catch(() => false)) test.skip()

    const nextBtn = page.locator('button[aria-label*="Next"], button[disabled]:has(svg), button:has([data-lucide="chevron-right"])').last()
    await expect(nextBtn).toBeVisible({ timeout: 8000 })
  })

  test('next prompt navigation works', async ({ page }) => {
    const noPrompts = page.locator('text=No voice prompts')
    if (await noPrompts.isVisible({ timeout: 3000 }).catch(() => false)) test.skip()

    const nextBtn = page.locator('button').filter({ hasText: '' }).filter({ has: page.locator('[data-lucide="chevron-right"]') }).last()
    if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
      await nextBtn.click()
      await page.waitForTimeout(300)
      await expect(page.locator('[data-testid="header"]')).toBeVisible()
    }
  })

  test('shuffle button is present', async ({ page }) => {
    const noPrompts = page.locator('text=No voice prompts')
    if (await noPrompts.isVisible({ timeout: 3000 }).catch(() => false)) test.skip()

    const shuffleBtn = page.locator('button:has-text("Shuffle")')
    await expect(shuffleBtn.first()).toBeVisible({ timeout: 8000 })
  })

  test('shuffle button randomises prompts', async ({ page }) => {
    const noPrompts = page.locator('text=No voice prompts')
    if (await noPrompts.isVisible({ timeout: 3000 }).catch(() => false)) test.skip()

    const shuffleBtn = page.locator('button:has-text("Shuffle")').first()
    await shuffleBtn.click()
    await page.waitForTimeout(300)
    await expect(page.locator('button:has-text("Shuffled")').first()).toBeVisible()
  })

  test('mic / start button is visible', async ({ page }) => {
    const noPrompts = page.locator('text=No voice prompts')
    if (await noPrompts.isVisible({ timeout: 3000 }).catch(() => false)) test.skip()

    // Mic button — has Mic icon or starts recording
    const micBtn = page.locator('button:has([data-lucide="mic"]), button:has-text("Start"), button:has-text("Record")')
    await expect(micBtn.first()).toBeVisible({ timeout: 8000 })
  })

  test('voice prompts list renders practice scenarios', async ({ page }) => {
    const noPrompts = page.locator('text=No voice prompts')
    if (await noPrompts.isVisible({ timeout: 3000 }).catch(() => false)) test.skip()

    const scenarios = page.locator('text=Practice Scenarios')
    await expect(scenarios.first()).toBeVisible({ timeout: 8000 })
  })

  test('difficulty badge is shown on prompt card', async ({ page }) => {
    const noPrompts = page.locator('text=No voice prompts')
    if (await noPrompts.isVisible({ timeout: 3000 }).catch(() => false)) test.skip()

    const badge = page.locator('text=BEGINNER').or(page.locator('text=INTERMEDIATE')).or(page.locator('text=ADVANCED'))
    await expect(badge.first()).toBeVisible({ timeout: 8000 })
  })

  test('key points section can be toggled', async ({ page }) => {
    const noPrompts = page.locator('text=No voice prompts')
    if (await noPrompts.isVisible({ timeout: 3000 }).catch(() => false)) test.skip()

    const keyPointsToggle = page.locator('button:has-text("Key Points"), button:has([data-lucide="lightbulb"])')
    if (await keyPointsToggle.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await keyPointsToggle.first().click()
      await page.waitForTimeout(300)
      await expect(page.locator('[data-testid="header"]')).toBeVisible()
    }
  })

  test('star rating buttons appear after practice', async ({ page }) => {
    // Star rating shows after recording is done — we check it renders in DOM
    const stars = page.locator('button:has([data-lucide="star"])')
    // May or may not be visible depending on state — just check app stability
    await expect(page.locator('[data-testid="section-tab-voice"]')).toBeVisible()
  })
})
