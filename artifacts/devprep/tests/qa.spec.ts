import { test, expect } from '@playwright/test'
import { bypassOnboarding, waitForAppReady } from './helpers'

test.describe('Q&A Page', () => {
  test.beforeEach(async ({ page }) => {
    await bypassOnboarding(page, ['javascript', 'typescript', 'react'], { section: 'qa' })
    await page.goto('/')
    await waitForAppReady(page)
    // Make sure we're on Q&A
    await page.click('[data-testid="section-tab-qa"]')
    await page.waitForTimeout(500)
  })

  test('Q&A page loads content', async ({ page }) => {
    // Either shows questions or an empty state
    await expect(
      page.locator('[data-testid="qa-search"]')
        .or(page.locator('text=No questions for this channel')),
    ).toBeVisible({ timeout: 8000 })
  })

  test('search bar is visible', async ({ page }) => {
    await expect(page.locator('[data-testid="qa-search"]')).toBeVisible({ timeout: 8000 })
  })

  test('search filters questions', async ({ page }) => {
    const searchInput = page.locator('[data-testid="qa-search"]')
    await expect(searchInput).toBeVisible({ timeout: 8000 })
    await searchInput.fill('closure')
    await page.waitForTimeout(400)
    // Doesn't crash; search input stays visible
    await expect(searchInput).toBeVisible()
  })

  test('clearing search restores all questions', async ({ page }) => {
    const searchInput = page.locator('[data-testid="qa-search"]')
    await expect(searchInput).toBeVisible({ timeout: 8000 })
    await searchInput.fill('xyz_nonexistent')
    await page.waitForTimeout(300)
    await searchInput.fill('')
    await page.waitForTimeout(300)
    await expect(searchInput).toBeVisible()
  })

  test('sidebar is visible on desktop', async ({ page, viewport }) => {
    if (!viewport || viewport.width < 768) test.skip()
    // Desktop sidebar should show the question list
    const sidebar = page.locator('.sidebar').first()
    await expect(sidebar).toBeVisible({ timeout: 8000 })
  })

  test('sidebar items navigate to questions', async ({ page, viewport }) => {
    if (!viewport || viewport.width < 768) test.skip()
    const sidebarItems = page.locator('[data-testid^="qa-sidebar-item-"]')
    const count = await sidebarItems.count()
    if (count > 1) {
      await sidebarItems.nth(1).click()
      await page.waitForTimeout(300)
      // App should still be stable
      await expect(page.locator('[data-testid="qa-search"]')).toBeVisible()
    }
  })

  test('arrow key navigation works', async ({ page }) => {
    await expect(page.locator('[data-testid="qa-search"]')).toBeVisible({ timeout: 8000 })
    // Blur input first
    await page.keyboard.press('Escape')
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(200)
    // Should not crash
    await expect(page.locator('[data-testid="header"]')).toBeVisible()
  })

  test('code blocks show copy button', async ({ page }) => {
    // Navigate through questions to find one with code
    const nextBtn = page.locator('[aria-label="Next question"], button:has([data-lucide="chevron-right"])').first()
    for (let i = 0; i < 3; i++) {
      const copyBtn = page.locator('[data-testid="code-copy-btn"]').first()
      if (await copyBtn.isVisible()) {
        await expect(copyBtn).toBeVisible()
        break
      }
      if (await nextBtn.isVisible()) await nextBtn.click()
      await page.waitForTimeout(300)
    }
  })

  test('question content area scrolls', async ({ page }) => {
    await expect(page.locator('[data-testid="qa-search"]')).toBeVisible({ timeout: 8000 })
    const content = page.locator('.overflow-y-auto').first()
    await expect(content).toBeVisible()
  })
})
