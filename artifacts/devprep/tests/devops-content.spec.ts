/**
 * DevOps channel content tests.
 * Tests the DevOps channel content by navigating the UI (no API server required —
 * this is a frontend-only app that reads from an in-browser SQLite DB).
 */
import { test, expect } from '@playwright/test'
import { bypassOnboarding, waitForAppReady, goToSection } from './helpers'

test.describe('DevOps Channel — Content', () => {
  test.beforeEach(async ({ page }) => {
    await bypassOnboarding(page, ['devops', 'javascript'], {
      section: 'qa',
      channelId: 'devops',
    })
    await page.goto('/')
    await waitForAppReady(page)
  })

  test('DevOps channel tab is visible', async ({ page }) => {
    await expect(page.locator('[data-testid="channel-tab-devops"]')).toBeVisible()
  })

  test('switching to DevOps channel updates header', async ({ page }) => {
    const devopsTab = page.locator('[data-testid="channel-tab-devops"]')
    await devopsTab.click()
    await page.waitForTimeout(500)
    await expect(page.locator('[data-testid="header"]')).toContainText('DevOps')
  })

  test('DevOps Q&A section loads content', async ({ page }) => {
    const devopsTab = page.locator('[data-testid="channel-tab-devops"]')
    await devopsTab.click()
    await page.waitForTimeout(500)
    await goToSection(page, 'qa')

    await expect(
      page.locator('[data-testid="qa-search"]')
        .or(page.locator('text=No questions for this channel')),
    ).toBeVisible({ timeout: 8000 })
  })

  test('DevOps Flashcards section loads', async ({ page }) => {
    const devopsTab = page.locator('[data-testid="channel-tab-devops"]')
    await devopsTab.click()
    await page.waitForTimeout(500)
    await goToSection(page, 'flashcards')

    await expect(
      page.locator('[data-testid="flashcard-shuffle-btn"]')
        .or(page.locator('text=No flashcards')),
    ).toBeVisible({ timeout: 8000 })
  })

  test('DevOps Coding section loads', async ({ page }) => {
    const devopsTab = page.locator('[data-testid="channel-tab-devops"]')
    await devopsTab.click()
    await page.waitForTimeout(500)
    await goToSection(page, 'coding')

    await expect(
      page.locator('[data-testid="coding-editor"]')
        .or(page.locator('text=No coding challenges')),
    ).toBeVisible({ timeout: 8000 })
  })

  test('DevOps Exam section loads', async ({ page }) => {
    const devopsTab = page.locator('[data-testid="channel-tab-devops"]')
    await devopsTab.click()
    await page.waitForTimeout(500)
    await goToSection(page, 'exam')

    await expect(
      page.locator('[data-testid="exam-start-btn"]')
        .or(page.locator('text=No exam questions')),
    ).toBeVisible({ timeout: 8000 })
  })

  test('DevOps Voice section loads', async ({ page }) => {
    const devopsTab = page.locator('[data-testid="channel-tab-devops"]')
    await devopsTab.click()
    await page.waitForTimeout(500)
    await goToSection(page, 'voice')

    await expect(
      page.locator('text=Voice').or(page.locator('text=No voice prompts')),
    ).toBeVisible({ timeout: 8000 })
  })

  test('can cycle through all sections for DevOps without crash', async ({ page }) => {
    const devopsTab = page.locator('[data-testid="channel-tab-devops"]')
    await devopsTab.click()
    await page.waitForTimeout(500)

    const sections = ['qa', 'flashcards', 'coding', 'exam', 'voice'] as const
    for (const s of sections) {
      await goToSection(page, s)
      await expect(page.locator('[data-testid="header"]')).toBeVisible()
    }
  })
})
