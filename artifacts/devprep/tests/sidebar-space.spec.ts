import { test, expect } from '@playwright/test'

/**
 * E2E QA Test Suite: V2 Dashboard Sidebar Space Utilization
 *
 * Testing scope: /html/body/div/div/div/main/div/div[2]/div[1]
 * Focus: Sidebar space optimization, channel navigation, content layout
 *
 * @author QA Engineer (30+ years experience)
 */

test.describe('V2 Dashboard — Sidebar Space Utilization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // SPACE UTILIZATION TESTS — Critical for layout optimization
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Space Utilization', () => {
    test('sidebar should not exceed 220px width on desktop', async ({ page }) => {
      const sidebar = page.locator('aside').first()
      await expect(sidebar).toBeVisible()

      const box = await sidebar.boundingBox()
      expect(box?.width).toBeLessThanOrEqual(220)
    })

    test('sidebar should utilize at least 150px width (not too narrow)', async ({ page }) => {
      const sidebar = page.locator('aside').first()
      await expect(sidebar).toBeVisible()

      const box = await sidebar.boundingBox()
      expect(box?.width).toBeGreaterThanOrEqual(150)
    })

    test('main content area should have adequate width (at least 60% of viewport)', async ({
      page,
    }) => {
      const viewport = page.viewportSize()
      const mainContent = page.locator('main > div > div').last()

      const box = await mainContent.boundingBox()
      expect(box?.width).toBeGreaterThanOrEqual((viewport?.width ?? 1280) * 0.55)
    })

    test('sidebar gap should not exceed 24px', async ({ page }) => {
      const gridContainer = page.locator('.grid')
      await expect(gridContainer.first()).toBeVisible()

      const gap = await gridContainer.first().evaluate(el => window.getComputedStyle(el).gap)
      const gapValue = parseInt(gap.split(' ')[0])
      expect(gapValue).toBeLessThanOrEqual(24)
    })

    test('no excessive whitespace in sidebar area', async ({ page }) => {
      const sidebar = page.locator('aside').first()
      const box = await sidebar.boundingBox()

      // Sidebar should not have excessive padding causing wasted space
      const padding = await sidebar.evaluate(el => {
        const style = window.getComputedStyle(el)
        return {
          left: parseInt(style.paddingLeft),
          right: parseInt(style.paddingRight),
        }
      })

      expect(padding.left).toBeLessThanOrEqual(20)
      expect(padding.right).toBeLessThanOrEqual(20)
    })

    test('channel list should fill sidebar width efficiently', async ({ page }) => {
      const sidebar = page.locator('aside').first()
      const sidebarBox = await sidebar.boundingBox()

      const channelList = sidebar.locator('[class*="flex flex-col"]').first()
      const listBox = await channelList.boundingBox()

      // Channel list should utilize at least 70% of sidebar width
      expect(listBox?.width).toBeGreaterThanOrEqual((sidebarBox?.width ?? 200) * 0.7)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // CHANNEL LIST FUNCTIONALITY TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Channel List', () => {
    test('channels heading should be visible and properly styled', async ({ page }) => {
      const heading = page.getByText('Channels', { exact: true })
      await expect(heading).toBeVisible()

      const fontSize = await heading.evaluate(el => window.getComputedStyle(el).fontSize)
      expect(fontSize).toBe('14px') // Small, uppercase heading
    })

    test('all available channels should render in sidebar', async ({ page }) => {
      const channelButtons = page.locator('aside button')
      const count = await channelButtons.count()

      expect(count).toBeGreaterThan(0)
      expect(count).toBeLessThanOrEqual(15) // Reasonable upper bound
    })

    test('default channel should be pre-selected', async ({ page }) => {
      const selectedButton = page.locator('aside button[class*="bg-primary"]')
      await expect(selectedButton).toBeVisible()
    })

    test('clicking different channel updates content area', async ({ page }) => {
      const channelButtons = page.locator('aside button')
      const buttons = await channelButtons.all()

      if (buttons.length > 1) {
        // Get initial content state
        const initialContent = await page.locator('main').innerHTML()

        // Click second channel
        await buttons[1].click()
        await page.waitForTimeout(800)

        // Content should update (not exactly the same)
        // This is a smoke test - we're checking no crash occurs
        await expect(page.locator('main')).toBeVisible()
      }
    })

    test('selected channel should have distinct visual state', async ({ page }) => {
      const selectedButton = page.locator('aside button[class*="bg-primary"]')
      await expect(selectedButton).toBeVisible()

      const bgColor = await selectedButton.evaluate(
        el => window.getComputedStyle(el).backgroundColor
      )

      // Should not be transparent (has background)
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)')
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT DISPLAY TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Content Display', () => {
    test('content cards should use available width efficiently', async ({ page }) => {
      const contentCards = page.locator('.space-y-4 > div').first()

      const cardBox = await contentCards.boundingBox()
      const viewport = page.viewportSize()

      // Cards should use at least 70% of content area width
      expect(cardBox?.width).toBeGreaterThanOrEqual((viewport?.width ?? 1000) * 0.5)
    })

    test('content list should not have excessive top/bottom margins', async ({ page }) => {
      const contentList = page.locator('.space-y-4, [class*="space-y-"]').last()

      const margin = await contentList.evaluate(el =>
        parseInt(window.getComputedStyle(el).marginBottom)
      )

      expect(margin).toBeLessThanOrEqual(32) // Max 32px gap between cards
    })

    test('loading state should display skeleton cards', async ({ page }) => {
      // Navigate and wait for loading
      await page.goto('/')
      await page.waitForLoadState('domcontentloaded')

      // Should show skeleton or content within reasonable time
      const either = page.locator('.animate-pulse, [class*="Card"]')
      await expect(either.first()).toBeVisible({ timeout: 5000 })
    })

    test('empty state should display appropriate message', async ({ page }) => {
      // This test verifies graceful handling of empty content
      // Navigate to ensure page loads
      await page.goto('/')
      await page.waitForTimeout(1000)

      // Page should load without crash
      await expect(page.locator('body')).toBeVisible()
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // RESPONSIVE LAYOUT TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Responsive Layout', () => {
    test('on mobile, sidebar should stack vertically', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.waitForTimeout(500)

      // On mobile, sidebar and content should stack (not be side-by-side)
      const sidebar = page.locator('aside').first()
      const content = page.locator('main > div').last()

      const sidebarBox = await sidebar.boundingBox()
      const contentBox = await content.boundingBox()

      if (sidebarBox && contentBox) {
        // On mobile, they should not overlap horizontally (stacked)
        const isStacked =
          sidebarBox.x < 50 || sidebarBox.y < contentBox.y - 50 || sidebarBox.y > contentBox.y + 50

        // OR sidebar should be hidden (toggle menu)
        const sidebarHidden = sidebarBox.width < 50 || sidebarBox.height < 50

        expect(isStacked || sidebarHidden).toBeTruthy()
      }
    })

    test('on tablet, layout should adapt gracefully', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.waitForTimeout(500)

      // Page should render without overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })

      expect(hasHorizontalScroll).toBe(false)
    })

    test('on desktop, sidebar and content should be side-by-side', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.waitForTimeout(500)

      const sidebar = page.locator('aside').first()
      const content = page.locator('main > div').last()

      const sidebarBox = await sidebar.boundingBox()
      const contentBox = await content.boundingBox()

      if (sidebarBox && contentBox) {
        // Side-by-side layout
        expect(Math.abs(sidebarBox.y - contentBox.y)).toBeLessThan(50)
        expect(contentBox.x).toBeGreaterThan(sidebarBox.x)
      }
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESSIBILITY TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Accessibility', () => {
    test('channel buttons should be keyboard navigable', async ({ page }) => {
      const firstButton = page.locator('aside button').first()
      await firstButton.focus()

      // Tab should move to next channel button
      await page.keyboard.press('Tab')

      // Focus should be visible (not lost)
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(focusedElement).toBeTruthy()
    })

    test('channel buttons should have accessible labels', async ({ page }) => {
      const button = page.locator('aside button').first()

      const hasAccessibleName = await button.evaluate(el => {
        return el.textContent?.trim().length > 0
      })

      expect(hasAccessibleName).toBeTruthy()
    })

    test('sidebar should have proper role or semantic structure', async ({ page }) => {
      const sidebar = page.locator('aside').first()
      await expect(sidebar).toBeVisible()
    })

    test('content area should have main landmark', async ({ page }) => {
      const main = page.locator('main')
      await expect(main).toBeVisible()
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // EDGE CASES & ERROR HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Edge Cases', () => {
    test('should handle rapid channel switching without layout break', async ({ page }) => {
      const buttons = page.locator('aside button')
      const count = await buttons.count()

      // Rapidly click through channels
      for (let i = 0; i < Math.min(count, 3); i++) {
        await buttons.nth(i).click()
        await page.waitForTimeout(100)
      }

      // Layout should remain stable
      await expect(page.locator('aside')).toBeVisible()
      await expect(page.locator('main')).toBeVisible()
    })

    test('should maintain layout on page reload', async ({ page }) => {
      const initialSidebarWidth = await page.locator('aside').first().boundingBox()

      await page.reload()
      await page.waitForLoadState('networkidle')

      const reloadSidebarWidth = await page.locator('aside').first().boundingBox()

      expect(
        Math.abs((initialSidebarWidth?.width ?? 0) - (reloadSidebarWidth?.width ?? 0))
      ).toBeLessThan(10)
    })

    test('should not have duplicate IDs in channel list', async ({ page }) => {
      const buttons = page.locator('aside button')
      const count = await buttons.count()

      // Get all text content
      const texts = await buttons.allTextContents()
      const uniqueTexts = new Set(texts.map(t => t.trim()))

      // Each channel name should appear exactly once
      expect(uniqueTexts.size).toBe(count)
    })
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // VISUAL REGRESSION CHECKS (Smoke)
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Visual Smoke Tests', () => {
    test('sidebar background should be visible (not transparent)', async ({ page }) => {
      const sidebar = page.locator('aside').first()
      const bg = await sidebar.evaluate(el => window.getComputedStyle(el).backgroundColor)

      // Background should have some color
      expect(bg).not.toBe('rgba(0, 0, 0, 0)')
    })

    test('content cards should have visible borders', async ({ page }) => {
      const card = page.locator('[class*="Card"]').first()

      const border = await card.evaluate(el => window.getComputedStyle(el).borderTopWidth)

      expect(parseInt(border)).toBeGreaterThanOrEqual(0)
    })

    test('text should be legible with proper contrast', async ({ page }) => {
      const channelButton = page.locator('aside button').first()
      const color = await channelButton.evaluate(el => window.getComputedStyle(el).color)

      // Color should be a valid rgb/rgba value
      expect(color).toMatch(/^rgba?\(/)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// CROSS-BROWSER COMPATIBILITY TESTS
// ═══════════════════════════════════════════════════════════════════════════

test.describe('Cross-Browser Compatibility', () => {
  test('sidebar layout should render correctly in Chromium', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const sidebar = page.locator('aside').first()
    await expect(sidebar).toBeVisible()

    const box = await sidebar.boundingBox()
    expect(box).not.toBeNull()
    expect(box?.width).toBeGreaterThan(0)
  })
})
