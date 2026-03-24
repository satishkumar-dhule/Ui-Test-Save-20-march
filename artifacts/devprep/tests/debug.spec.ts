import { test, expect } from '@playwright/test'

test('debug coding page', async ({ page }) => {
  // Set up localStorage before navigation
  await page.addInitScript(() => {
    const storeData = {
      state: {
        channelId: 'javascript',
        selectedChannelIds: ['javascript', 'algorithms'],
        section: 'qa',
        theme: 'dark',
        showOnboarding: false,
      },
      version: 0,
    }
    localStorage.setItem('devprep:content-store', JSON.stringify(storeData))
  })
  
  console.log('Navigating to page...')
  await page.goto('http://localhost:5174')
  
  console.log('Waiting for network idle...')
  await page.waitForLoadState('networkidle')
  
  console.log('Waiting 2 seconds...')
  await page.waitForTimeout(2000)
  
  console.log('Checking for app root...')
  const appRoot = await page.locator('[data-testid="app-root"]').count()
  console.log('App root count:', appRoot)
  
  console.log('Checking for section tabs...')
  const sectionTabs = await page.locator('[data-testid^="section-tab-"]').count()
  console.log('Section tabs count:', sectionTabs)
  
  if (sectionTabs > 0) {
    console.log('Clicking coding tab...')
    await page.click('[data-testid="section-tab-coding"]')
    await page.waitForTimeout(2000)
    
    console.log('Checking for coding editor...')
    const editor = await page.locator('[data-testid="coding-editor"]').count()
    console.log('Coding editor count:', editor)
    
    console.log('Checking for "No coding challenges"...')
    const noChallenges = await page.locator('text=No coding challenges').count()
    console.log('No challenges text count:', noChallenges)
  }
  
  // Final check
  await expect(
    page.locator('[data-testid="coding-editor"]').or(page.locator('text=No coding challenges')),
  ).toBeVisible({ timeout: 10000 })
})
