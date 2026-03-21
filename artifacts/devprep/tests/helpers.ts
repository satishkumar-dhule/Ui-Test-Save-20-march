import type { Page } from '@playwright/test'

/**
 * Channels to pre-select so onboarding is bypassed.
 * Includes channels that have all content types (qa, flashcards, coding, exam, voice).
 */
export const DEFAULT_CHANNELS = ['javascript', 'typescript', 'react', 'algorithms', 'devops']

/**
 * Injects localStorage values before page load so React starts with channels
 * already selected and onboarding is skipped.
 * Must be called BEFORE page.goto().
 */
export async function bypassOnboarding(
  page: Page,
  channels = DEFAULT_CHANNELS,
  options: { section?: string; channelId?: string } = {},
) {
  const { section = 'qa', channelId = 'javascript' } = options
  await page.addInitScript(
    ({ channels, section, channelId }) => {
      localStorage.setItem('devprep:selectedIds', JSON.stringify(channels))
      localStorage.setItem('devprep:theme', '"dark"')
      localStorage.setItem('devprep:channelId', JSON.stringify(channelId))
      localStorage.setItem('devprep:section', JSON.stringify(section))
      localStorage.setItem('devprep:channelTypeFilter', '"tech"')
    },
    { channels, section, channelId },
  )
}

/**
 * Wait for the main app shell to be visible (after onboarding is skipped).
 */
export async function waitForAppReady(page: Page) {
  await page.waitForSelector('[data-testid="header"]', { timeout: 15000 })
  await page.waitForSelector('[data-testid="section-tabs"]', { timeout: 10000 })
  await page.waitForSelector('[data-testid="channel-bar"]', { timeout: 10000 })
}

/**
 * Navigate to a given section tab by testid.
 */
export async function goToSection(page: Page, section: 'qa' | 'flashcards' | 'coding' | 'exam' | 'voice') {
  await page.click(`[data-testid="section-tab-${section}"]`)
  await page.waitForTimeout(400)
}
