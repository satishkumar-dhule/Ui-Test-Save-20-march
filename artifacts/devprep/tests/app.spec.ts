import { test, expect } from '@playwright/test'
import { bypassOnboarding, waitForAppReady } from './helpers'

test.describe('App — baseline', () => {
  test('loads without JS errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (!text.includes('favicon') && !text.includes('[vite]')) errors.push(text)
      }
    })
    await bypassOnboarding(page)
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    expect(errors).toHaveLength(0)
  })

  test('has correct page title', async ({ page }) => {
    await bypassOnboarding(page)
    await page.goto('/')
    await expect(page).toHaveTitle(/DevPrep/)
  })

  test('root element mounts', async ({ page }) => {
    await bypassOnboarding(page)
    await page.goto('/')
    await expect(page.locator('#root')).toBeAttached()
  })

  test('dark mode class is applied to <html>', async ({ page }) => {
    await bypassOnboarding(page)
    await page.goto('/')
    const htmlClass = await page.locator('html').getAttribute('class')
    expect(htmlClass).toContain('dark')
  })

  test('app header is visible', async ({ page }) => {
    await bypassOnboarding(page)
    await page.goto('/')
    await waitForAppReady(page)
    await expect(page.locator('[data-testid="header"]')).toBeVisible()
  })

  test('header shows DevPrep branding', async ({ page }) => {
    await bypassOnboarding(page)
    await page.goto('/')
    await waitForAppReady(page)
    await expect(page.locator('[data-testid="header"]')).toContainText('DevPrep')
  })

  test('theme toggle button is present', async ({ page }) => {
    await bypassOnboarding(page)
    await page.goto('/')
    await waitForAppReady(page)
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible()
  })

  test('theme toggle switches between dark and light', async ({ page }) => {
    await bypassOnboarding(page)
    await page.goto('/')
    await waitForAppReady(page)
    // Start dark
    await expect(page.locator('html')).toHaveClass(/dark/)
    // Click toggle → light
    await page.click('[data-testid="theme-toggle"]')
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    // Click again → dark
    await page.click('[data-testid="theme-toggle"]')
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('search button is present', async ({ page }) => {
    await bypassOnboarding(page)
    await page.goto('/')
    await waitForAppReady(page)
    await expect(page.locator('[data-testid="search-button"]')).toBeVisible()
  })

  test('search modal opens on button click', async ({ page }) => {
    await bypassOnboarding(page)
    await page.goto('/')
    await waitForAppReady(page)
    await page.click('[data-testid="search-button"]')
    // Command dialog should appear
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })
  })

  test('search modal opens on Cmd+K', async ({ page }) => {
    await bypassOnboarding(page)
    await page.goto('/')
    await waitForAppReady(page)
    await page.keyboard.press('Meta+k')
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })
  })

  test('search modal closes on Escape', async ({ page }) => {
    await bypassOnboarding(page)
    await page.goto('/')
    await waitForAppReady(page)
    await page.click('[data-testid="search-button"]')
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 })
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })

  test('shows onboarding when no channels selected', async ({ page }) => {
    // Do NOT bypass onboarding
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    // Either the onboarding modal or the OnboardingPage should be visible
    const onboarding =
      page.locator('[data-testid="onboarding-modal"]').or(
        page.locator('[data-testid="onboarding-done-btn"]'),
      )
    await expect(onboarding.first()).toBeVisible({ timeout: 10000 })
  })
})
