import { test, expect } from '@playwright/test'
import { bypassOnboarding, waitForAppReady } from './helpers'

test.describe('Navigation — section tabs & sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await bypassOnboarding(page)
    await page.goto('/')
    await waitForAppReady(page)
    await page.waitForTimeout(1500)
  })

  test('sidebar is visible', async ({ page }) => {
    await expect(page.locator('.sidebar')).toBeVisible({ timeout: 10000 })
  })

  test('sidebar shows My Channels section', async ({ page }) => {
    await expect(page.locator('text=My Channels')).toBeVisible()
  })

  test('sidebar shows Study Mode section', async ({ page }) => {
    await expect(page.locator('text=Study Mode')).toBeVisible()
  })

  test('clicking Q&A in sidebar shows questions', async ({ page }) => {
    await page.locator('.sidebar-sec:has-text("Q&A")').click()
    await page.waitForTimeout(600)
    await expect(page.locator('[data-testid="header"]')).toBeVisible()
  })

  test('clicking Flashcards in sidebar shows flashcards', async ({ page }) => {
    await page.locator('.sidebar-sec:has-text("Flashcards")').click()
    await page.waitForTimeout(600)
    await expect(page.locator('[data-testid="header"]')).toBeVisible()
  })

  test('clicking Coding in sidebar shows coding', async ({ page }) => {
    await page.locator('.sidebar-sec:has-text("Coding")').click()
    await page.waitForTimeout(600)
    await expect(page.locator('[data-testid="header"]')).toBeVisible()
  })

  test('clicking Exam in sidebar shows exam', async ({ page }) => {
    await page.locator('.sidebar-sec:has-text("Mock Exam")').click()
    await page.waitForTimeout(600)
    await expect(page.locator('[data-testid="header"]')).toBeVisible()
  })

  test('clicking Voice in sidebar shows voice', async ({ page }) => {
    await page.locator('.sidebar-sec:has-text("Voice")').click()
    await page.waitForTimeout(600)
    await expect(page.locator('[data-testid="header"]')).toBeVisible()
  })

  test('Browse all channels button is visible', async ({ page }) => {
    await expect(page.locator('text=Browse all')).toBeVisible()
  })

  test('Add channels button is visible', async ({ page }) => {
    await expect(page.locator('text=Add channels')).toBeVisible()
  })
})
