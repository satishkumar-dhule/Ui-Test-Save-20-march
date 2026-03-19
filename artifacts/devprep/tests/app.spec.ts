import { test, expect } from '@playwright/test'

test.describe('DevPrep App', () => {
  test('page loads without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (!text.includes('favicon') && !text.includes('vite')) {
          errors.push(text)
        }
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0)
  })

  test('has correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/DevPrep/)
  })

  test('root element exists', async ({ page }) => {
    await page.goto('/')
    const root = page.locator('#root')
    await expect(root).toBeAttached()
  })
})
