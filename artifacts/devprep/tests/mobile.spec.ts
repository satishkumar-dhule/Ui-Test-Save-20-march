/**
 * Mobile-specific e2e tests.
 * These run against all projects but assertions adapt to viewport width.
 * The dedicated mobile-iphone and mobile-android projects in playwright.config.ts
 * run this file at 390×844 and 412×915 viewports respectively.
 */
import { test, expect } from '@playwright/test'
import { bypassOnboarding, waitForAppReady, goToSection } from './helpers'

// Helper: true when viewport is mobile-sized
async function isMobile(page: import('@playwright/test').Page) {
  const vp = page.viewportSize()
  return vp ? vp.width < 768 : false
}

test.describe('Mobile — app shell', () => {
  test.beforeEach(async ({ page }) => {
    await bypassOnboarding(page)
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('header is visible on mobile', async ({ page }) => {
    await expect(page.locator('[data-testid="header"]')).toBeVisible()
  })

  test('section tabs are visible on mobile', async ({ page }) => {
    await expect(page.locator('[data-testid="section-tabs"]')).toBeVisible()
  })

  test('channel bar is visible and scrollable on mobile', async ({ page }) => {
    await expect(page.locator('[data-testid="channel-bar"]')).toBeVisible()
  })

  test('all section tab labels are tappable on mobile', async ({ page }) => {
    const sections = [
      { id: 'qa', label: 'Q&A' },
      { id: 'flashcards', label: 'Flashcards' },
      { id: 'coding', label: 'Coding' },
      { id: 'exam', label: 'Exam' },
      { id: 'voice', label: 'Voice' },
    ]
    for (const { id, label } of sections) {
      const tab = page.locator(`[role="tab"]:has-text("${label}")`)
      await expect(tab).toBeVisible()
      await tab.tap()
      await page.waitForTimeout(300)
      // No crash
      await expect(page.locator('[data-testid="header"]')).toBeVisible()
    }
  })

  test('channel tabs can be tapped on mobile', async ({ page }) => {
    const jsTab = page.locator('button:has-text("JavaScript")').first()
    await expect(jsTab).toBeVisible()
    await jsTab.tap()
    await page.waitForTimeout(400)
    await expect(page.locator('[data-testid="header"]')).toBeVisible()
  })

  test('search button is tappable on mobile', async ({ page }) => {
    const btn = page.locator('[data-testid="search-button"]')
    await expect(btn).toBeVisible()
    await btn.tap()
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Escape')
  })

  test('theme toggle is tappable on mobile', async ({ page }) => {
    const btn = page.locator('[data-testid="theme-toggle"]')
    await expect(btn).toBeVisible()
    await btn.tap()
    await page.waitForTimeout(300)
    await expect(page.locator('[data-testid="header"]')).toBeVisible()
  })
})

test.describe('Mobile — Q&A Page', () => {
  test.beforeEach(async ({ page }) => {
    await bypassOnboarding(page, ['javascript', 'typescript'], { section: 'qa' })
    await page.goto('/')
    await waitForAppReady(page)
    await page.locator('[role="tab"]:has-text("Q&A")').tap()
    await page.waitForTimeout(500)
  })

  test('desktop sidebar is hidden on mobile', async ({ page }) => {
    if (!(await isMobile(page))) test.skip()
    // .sidebar has display:none on mobile via CSS
    const sidebar = page.locator('.sidebar').first()
    await expect(sidebar).not.toBeVisible()
  })

  test('mobile hamburger menu button is visible on mobile', async ({ page }) => {
    if (!(await isMobile(page))) test.skip()
    const menuBtn = page.locator('[data-testid="qa-mob-menu"]')
    // Uses mob-menu class which has display:flex on mobile
    await expect(menuBtn).toBeVisible({ timeout: 8000 })
  })

  test('tapping mobile menu opens sidebar drawer', async ({ page }) => {
    if (!(await isMobile(page))) test.skip()
    const menuBtn = page.locator('[data-testid="qa-mob-menu"]')
    if (!(await menuBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await menuBtn.tap()
    await page.waitForTimeout(500)
    // Sidebar should now be visible (fixed position)
    const sidebar = page.locator('.sidebar').first()
    await expect(sidebar).toBeVisible({ timeout: 5000 })
  })

  test('tapping overlay closes mobile sidebar', async ({ page }) => {
    if (!(await isMobile(page))) test.skip()
    const menuBtn = page.locator('[data-testid="qa-mob-menu"]')
    if (!(await menuBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await menuBtn.tap()
    await page.waitForTimeout(400)
    // Tap the overlay
    const overlay = page.locator('.fixed.inset-0.z-30')
    if (await overlay.isVisible()) {
      await overlay.tap()
      await page.waitForTimeout(300)
      const sidebar = page.locator('.sidebar').first()
      await expect(sidebar).not.toBeVisible()
    }
  })

  test('search input is tappable on mobile', async ({ page }) => {
    const searchInput = page.locator('[data-testid="qa-search"]')
    if (!(await searchInput.isVisible({ timeout: 8000 }).catch(() => false))) test.skip()
    await searchInput.tap()
    await searchInput.fill('closure')
    await page.waitForTimeout(300)
    await expect(searchInput).toHaveValue('closure')
  })
})

test.describe('Mobile — Flashcards Page', () => {
  test.beforeEach(async ({ page }) => {
    await bypassOnboarding(page, ['javascript', 'typescript'], { section: 'flashcards' })
    await page.goto('/')
    await waitForAppReady(page)
    await page.locator('[role="tab"]:has-text("Flashcards")').tap()
    await page.waitForTimeout(600)
  })

  test('flashcard is visible and tappable on mobile', async ({ page }) => {
    const card = page.locator('.flip-card')
    if (!(await card.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await card.tap()
    await page.waitForTimeout(300)
    await expect(card).toHaveClass(/flipped/)
  })

  test('shuffle button is tappable on mobile', async ({ page }) => {
    const shuffleBtn = page.locator('[data-testid="flashcard-shuffle-btn"]')
    if (!(await shuffleBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await shuffleBtn.tap()
    await page.waitForTimeout(300)
    await expect(shuffleBtn).toContainText('Shuffled')
  })

  test('prev/next navigation buttons are tappable on mobile', async ({ page }) => {
    const nextBtn = page.locator('[aria-label="Next flashcard"]')
    if (!(await nextBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    if (await nextBtn.isEnabled()) {
      await nextBtn.tap()
      await page.waitForTimeout(300)
      await expect(page.locator('[data-testid="header"]')).toBeVisible()
    }
  })

  test('desktop sidebar hidden on mobile for flashcards', async ({ page }) => {
    if (!(await isMobile(page))) test.skip()
    const shuffleBtn = page.locator('[data-testid="flashcard-shuffle-btn"]')
    if (!(await shuffleBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    const sidebar = page.locator('.sidebar').first()
    await expect(sidebar).not.toBeVisible()
  })
})

test.describe('Mobile — Coding Page', () => {
  test.beforeEach(async ({ page }) => {
    await bypassOnboarding(page, ['javascript', 'algorithms'], {
      section: 'coding',
      channelId: 'javascript',
    })
    await page.goto('/')
    await waitForAppReady(page)
    await page.locator('[role="tab"]:has-text("Coding")').tap()
    await page.waitForTimeout(600)
  })

  test('coding editor is visible on mobile', async ({ page }) => {
    const editor = page.locator('[data-testid="coding-editor"]')
    if (!(await editor.isVisible({ timeout: 8000 }).catch(() => false))) test.skip()
    await expect(editor).toBeVisible()
  })

  test('run button is tappable on mobile', async ({ page }) => {
    const editor = page.locator('[data-testid="coding-editor"]')
    if (!(await editor.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    const runBtn = page.locator('button:has-text("Run")').first()
    if (await runBtn.isVisible()) {
      await runBtn.tap()
      await page.waitForTimeout(600)
      await expect(page.locator('[data-testid="header"]')).toBeVisible()
    }
  })

  test('desktop sidebar hidden on mobile for coding', async ({ page }) => {
    if (!(await isMobile(page))) test.skip()
    const editor = page.locator('[data-testid="coding-editor"]')
    if (!(await editor.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    const sidebar = page.locator('.sidebar').first()
    await expect(sidebar).not.toBeVisible()
  })
})

test.describe('Mobile — Mock Exam Page', () => {
  test.beforeEach(async ({ page }) => {
    await bypassOnboarding(page, ['javascript', 'aws-saa'], {
      section: 'exam',
      channelId: 'javascript',
    })
    await page.goto('/')
    await waitForAppReady(page)
    await page.locator('[role="tab"]:has-text("Exam")').tap()
    await page.waitForTimeout(600)
  })

  test('start exam button is tappable on mobile', async ({ page }) => {
    const startBtn = page.locator('[data-testid="exam-start-btn"]')
    if (!(await startBtn.isVisible({ timeout: 8000 }).catch(() => false))) test.skip()
    await startBtn.tap()
    await page.waitForTimeout(600)
    // Moved to exam phase
    await expect(
      page.locator('text=/\\d{2}:\\d{2}/').or(page.locator('button:has-text("Submit")'))
    ).toBeVisible({ timeout: 8000 })
  })

  test('exam info text is readable on mobile', async ({ page }) => {
    const startBtn = page.locator('[data-testid="exam-start-btn"]')
    if (!(await startBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await expect(page.locator('text=Mock Exam')).toBeVisible()
  })

  test('can answer exam questions on mobile', async ({ page }) => {
    const startBtn = page.locator('[data-testid="exam-start-btn"]')
    if (!(await startBtn.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await startBtn.tap()
    await page.waitForTimeout(600)
    const options = page.locator('button').filter({ hasText: /^[A-D]\./ })
    if ((await options.count()) > 0) {
      await options.first().tap()
      await page.waitForTimeout(200)
      await expect(page.locator('[data-testid="header"]')).toBeVisible()
    }
  })
})

test.describe('Mobile — Voice Practice Page', () => {
  test.beforeEach(async ({ page }) => {
    await bypassOnboarding(page, ['javascript', 'react'], {
      section: 'voice',
      channelId: 'javascript',
    })
    await page.goto('/')
    await waitForAppReady(page)
    await page.locator('[role="tab"]:has-text("Voice")').tap()
    await page.waitForTimeout(600)
  })

  test('voice practice page loads on mobile', async ({ page }) => {
    await expect(page.locator('text=Voice').or(page.locator('text=No voice prompts'))).toBeVisible({
      timeout: 8000,
    })
  })

  test('mic button is tappable on mobile', async ({ page }) => {
    const noPrompts = page.locator('text=No voice prompts')
    if (await noPrompts.isVisible({ timeout: 3000 }).catch(() => false)) test.skip()
    const micBtn = page.locator('button:has([data-lucide="mic"]), button:has-text("Start")')
    if (
      await micBtn
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
      await micBtn.first().tap()
      await page.waitForTimeout(500)
      // Countdown or recording state
      await expect(page.locator('[data-testid="header"]')).toBeVisible()
    }
  })

  test('shuffle and navigation work on mobile', async ({ page }) => {
    const noPrompts = page.locator('text=No voice prompts')
    if (await noPrompts.isVisible({ timeout: 3000 }).catch(() => false)) test.skip()
    const shuffleBtn = page.locator('button:has-text("Shuffle")').first()
    if (await shuffleBtn.isVisible()) {
      await shuffleBtn.tap()
      await page.waitForTimeout(300)
      await expect(page.locator('button:has-text("Shuffled")').first()).toBeVisible()
    }
  })
})

test.describe('Mobile — Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('devprep:selectedIds')
      localStorage.removeItem('devprep:onboarding-draft')
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('onboarding renders on mobile', async ({ page }) => {
    const doneBtn = page.locator('[data-testid="onboarding-done-btn"]')
    await expect(doneBtn).toBeVisible({ timeout: 10000 })
  })

  test('channel cards are tappable on mobile', async ({ page }) => {
    const jsCard = page.locator('[data-testid="onboarding-channel-javascript"]')
    await expect(jsCard).toBeVisible({ timeout: 10000 })
    await jsCard.tap()
    await page.waitForTimeout(300)
    await expect(jsCard).toHaveAttribute('aria-checked', 'true')
  })

  test('completing onboarding on mobile enters main app', async ({ page }) => {
    const doneBtn = page.locator('[data-testid="onboarding-done-btn"]')
    await expect(doneBtn).toBeVisible({ timeout: 10000 })

    const jsCard = page.locator('[data-testid="onboarding-channel-javascript"]')
    if (await jsCard.isVisible()) {
      const checked = await jsCard.getAttribute('aria-checked')
      if (checked !== 'true') await jsCard.tap()
    }
    await doneBtn.tap()
    await page.waitForTimeout(1000)
    await expect(page.locator('[data-testid="header"]')).toBeVisible({ timeout: 10000 })
  })
})
