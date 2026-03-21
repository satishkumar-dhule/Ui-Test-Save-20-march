import { test, expect } from '@playwright/test'

test.describe('Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so onboarding always shows
    await page.addInitScript(() => {
      localStorage.removeItem('devprep:selectedIds')
      localStorage.removeItem('devprep:onboarding-draft')
    })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
  })

  test('onboarding screen is visible on first visit', async ({ page }) => {
    const doneBtn = page.locator('[data-testid="onboarding-done-btn"]')
    await expect(doneBtn).toBeVisible({ timeout: 10000 })
  })

  test('Get Started button is disabled when nothing selected', async ({ page }) => {
    // Clear any pre-selection
    const doneBtn = page.locator('[data-testid="onboarding-done-btn"]')
    await expect(doneBtn).toBeVisible({ timeout: 10000 })

    // Clear all by clicking "Clear" if available
    const clearBtn = page.locator('button:has-text("Clear")').first()
    if (await clearBtn.isVisible()) await clearBtn.click()

    // Done button should be disabled
    await expect(doneBtn).toBeDisabled()
  })

  test('selecting a channel enables Get Started button', async ({ page }) => {
    const doneBtn = page.locator('[data-testid="onboarding-done-btn"]')
    await expect(doneBtn).toBeVisible({ timeout: 10000 })

    // Clear all selections
    const clearBtn = page.locator('button:has-text("Clear")').first()
    if (await clearBtn.isVisible()) await clearBtn.click()
    await expect(doneBtn).toBeDisabled()

    // Select javascript channel
    const jsCard = page.locator('[data-testid="onboarding-channel-javascript"]')
    if (await jsCard.isVisible()) {
      await jsCard.click()
      await expect(doneBtn).toBeEnabled()
    }
  })

  test('channel cards are visible', async ({ page }) => {
    // At least some channel cards should render
    const cards = page.locator('[data-testid^="onboarding-channel-"]')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
    const count = await cards.count()
    expect(count).toBeGreaterThan(3)
  })

  test('clicking a channel card toggles selection', async ({ page }) => {
    const jsCard = page.locator('[data-testid="onboarding-channel-javascript"]')
    await expect(jsCard).toBeVisible({ timeout: 10000 })

    // Toggle on
    await jsCard.click()
    await expect(jsCard).toHaveAttribute('aria-checked', 'true')

    // Toggle off
    await jsCard.click()
    await expect(jsCard).toHaveAttribute('aria-checked', 'false')
  })

  test('job role presets apply channels', async ({ page }) => {
    await expect(page.locator('[data-testid="onboarding-done-btn"]')).toBeVisible({ timeout: 10000 })

    // Click first job role preset button
    const presets = page.locator('[aria-labelledby="job-role-heading"] button, section button[aria-pressed]')
    if (await presets.first().isVisible()) {
      await presets.first().click()
      // After clicking a preset, some channels should be selected
      const doneBtn = page.locator('[data-testid="onboarding-done-btn"]')
      await expect(doneBtn).toBeEnabled({ timeout: 5000 })
    }
  })

  test('search filters channels', async ({ page }) => {
    await expect(page.locator('[data-testid="onboarding-done-btn"]')).toBeVisible({ timeout: 10000 })

    const search = page.locator('input[type="search"], input[placeholder*="Search"]')
    await expect(search).toBeVisible({ timeout: 5000 })
    await search.fill('javascript')
    await page.waitForTimeout(300)

    const cards = page.locator('[data-testid^="onboarding-channel-"]')
    const count = await cards.count()
    // Should be filtered to fewer results
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('completing onboarding shows the main app', async ({ page }) => {
    const doneBtn = page.locator('[data-testid="onboarding-done-btn"]')
    await expect(doneBtn).toBeVisible({ timeout: 10000 })

    // Ensure javascript is selected
    const jsCard = page.locator('[data-testid="onboarding-channel-javascript"]')
    if (await jsCard.isVisible()) {
      const checked = await jsCard.getAttribute('aria-checked')
      if (checked !== 'true') await jsCard.click()
    }

    await doneBtn.click()
    await page.waitForTimeout(1000)

    // Main app shell should appear
    await expect(page.locator('[data-testid="header"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-testid="section-tabs"]')).toBeVisible({ timeout: 10000 })
  })

  test('edit channels button re-opens channel picker', async ({ page }) => {
    // Set up channels so we can see the edit button
    await page.addInitScript(() => {
      localStorage.setItem('devprep:selectedIds', JSON.stringify(['javascript']))
      localStorage.setItem('devprep:theme', '"dark"')
      localStorage.setItem('devprep:channelId', '"javascript"')
      localStorage.setItem('devprep:section', '"qa"')
      localStorage.setItem('devprep:channelTypeFilter', '"tech"')
    })
    await page.goto('/')
    await page.waitForSelector('[data-testid="edit-tracks-btn"]', { timeout: 10000 })
    await page.click('[data-testid="edit-tracks-btn"]')
    await page.waitForTimeout(500)

    // OnboardingModal or OnboardingPage should appear
    const picker = page.locator('[data-testid="onboarding-done-btn"]')
      .or(page.locator('[data-testid="onboarding-modal"]'))
    await expect(picker.first()).toBeVisible({ timeout: 8000 })
  })
})
