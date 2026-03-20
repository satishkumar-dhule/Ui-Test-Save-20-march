import { test, expect, Page } from '@playwright/test'
import path from 'path'

const SCREENSHOTS_DIR = path.join(process.cwd(), 'test-results', 'screenshots')

async function setupApp(page: Page, channels = ['javascript']) {
  await page.goto('/')
  await page.evaluate((ids: string[]) => {
    localStorage.setItem('devprep:selectedIds', JSON.stringify(ids))
    localStorage.setItem('devprep:channelId', ids[0])
    localStorage.setItem('devprep:section', 'qa')
  }, channels)
  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)
}

async function captureScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `${name}.png`),
    fullPage: false,
  })
}

test.describe('UI Screenshots — DevPrep', () => {
  test('01 — onboarding modal', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await expect(page.getByTestId('onboarding-modal')).toBeVisible({ timeout: 8000 })
    await captureScreenshot(page, '01-onboarding-modal')
  })

  test('02 — onboarding channel selection', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)

    const modal = page.getByTestId('onboarding-modal')
    await expect(modal).toBeVisible({ timeout: 8000 })

    const jsChannel = page.getByTestId('onboarding-channel-javascript')
    if (await jsChannel.isVisible()) {
      await jsChannel.click()
      await page.waitForTimeout(300)
    }

    await captureScreenshot(page, '02-onboarding-channel-selected')
  })

  test('03 — main app after onboarding', async ({ page }) => {
    await setupApp(page)

    await expect(page.getByTestId('app-root')).toBeVisible({ timeout: 8000 })
    await captureScreenshot(page, '03-main-app')
  })

  test('04 — QA section', async ({ page }) => {
    await setupApp(page)

    const qaTab = page.getByTestId('section-tab-qa').or(
      page.getByRole('tab', { name: /q&a|qa|questions/i })
    )
    if (await qaTab.isVisible()) {
      await qaTab.click()
      await page.waitForTimeout(500)
    }

    await captureScreenshot(page, '04-qa-section')
  })

  test('05 — flashcards section', async ({ page }) => {
    await setupApp(page)

    const flashcardsTab = page.getByTestId('section-tab-flashcards').or(
      page.getByRole('tab', { name: /flashcard/i })
    )
    if (await flashcardsTab.isVisible()) {
      await flashcardsTab.click()
      await page.waitForTimeout(500)
    }

    await captureScreenshot(page, '05-flashcards-section')
  })

  test('06 — mock exam section', async ({ page }) => {
    await setupApp(page, ['kubernetes'])

    const examTab = page.getByTestId('section-tab-exam').or(
      page.getByRole('tab', { name: /exam/i })
    )
    if (await examTab.isVisible()) {
      await examTab.click()
      await page.waitForTimeout(500)
    }

    await captureScreenshot(page, '06-mock-exam-section')
  })

  test('07 — coding section', async ({ page }) => {
    await setupApp(page)

    const codingTab = page.getByTestId('section-tab-coding').or(
      page.getByRole('tab', { name: /coding/i })
    )
    if (await codingTab.isVisible()) {
      await codingTab.click()
      await page.waitForTimeout(500)
    }

    await captureScreenshot(page, '07-coding-section')
  })

  test('08 — voice practice section', async ({ page }) => {
    await setupApp(page, ['kubernetes'])

    const voiceTab = page.getByTestId('section-tab-voice').or(
      page.getByRole('tab', { name: /voice/i })
    )
    if (await voiceTab.isVisible()) {
      await voiceTab.click()
      await page.waitForTimeout(500)
    }

    await captureScreenshot(page, '08-voice-practice-section')
  })

  test('09 — search modal open', async ({ page }) => {
    await setupApp(page)

    const searchBtn = page.getByTestId('search-button').or(
      page.getByRole('button', { name: /search/i })
    )
    if (await searchBtn.isVisible()) {
      await searchBtn.click()
      await page.waitForTimeout(400)
    } else {
      await page.keyboard.press('Control+k')
      await page.waitForTimeout(400)
    }

    await captureScreenshot(page, '09-search-modal')
  })

  test('10 — search with results', async ({ page }) => {
    await setupApp(page)

    await page.keyboard.press('Control+k')
    await page.waitForTimeout(400)

    const searchInput = page.getByPlaceholder(/search/i).or(
      page.locator('[data-testid="search-input"]')
    )
    if (await searchInput.isVisible()) {
      await searchInput.fill('javascript')
      await page.waitForTimeout(600)
    }

    await captureScreenshot(page, '10-search-results')
  })

  test('11 — dark theme', async ({ page }) => {
    await setupApp(page)

    await page.evaluate(() => {
      localStorage.setItem('devprep:theme', 'dark')
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await captureScreenshot(page, '11-dark-theme')
  })

  test('12 — light theme', async ({ page }) => {
    await setupApp(page)

    await page.evaluate(() => {
      localStorage.setItem('devprep:theme', 'light')
    })
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    await captureScreenshot(page, '12-light-theme')
  })

  test('13 — channel switching', async ({ page }) => {
    await setupApp(page, ['javascript', 'react', 'algorithms'])

    const reactChannel = page.getByTestId('channel-tab-react').or(
      page.getByRole('button', { name: /react/i })
    ).first()
    if (await reactChannel.isVisible()) {
      await reactChannel.click()
      await page.waitForTimeout(500)
    }

    await captureScreenshot(page, '13-channel-switch-react')
  })

  test('14 — mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await setupApp(page)

    await captureScreenshot(page, '14-mobile-viewport')
  })

  test('15 — full page scroll', async ({ page }) => {
    await setupApp(page)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '15-full-page.png'),
      fullPage: true,
    })
  })
})
