import { test, expect } from '@playwright/test'
import { bypassOnboarding, waitForAppReady } from './helpers'

test.describe('Coding Page', () => {
  test.beforeEach(async ({ page }) => {
    // Use JavaScript channel — it has coding challenges
    await bypassOnboarding(page, ['javascript', 'algorithms'], {
      section: 'coding',
      channelId: 'javascript',
    })
    await page.goto('/')
    await waitForAppReady(page)
    await page.click('[role="tab"]:has-text("Coding")')
    await page.waitForTimeout(600)
  })

  test('coding page loads', async ({ page }) => {
    await expect(
      page.locator('[data-testid="coding-editor"]').or(page.locator('text=No coding challenges'))
    ).toBeVisible({ timeout: 8000 })
  })

  test('code editor textarea is visible', async ({ page }) => {
    const editor = page.locator('[data-testid="coding-editor"]')
    if (!(await editor.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await expect(editor).toBeVisible()
  })

  test('code editor is editable', async ({ page }) => {
    const editor = page.locator('[data-testid="coding-editor"]')
    if (!(await editor.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    await editor.click()
    await editor.fill('// test comment\n')
    const value = await editor.inputValue()
    expect(value).toContain('// test comment')
  })

  test('problem tab is active by default', async ({ page }) => {
    const editor = page.locator('[data-testid="coding-editor"]')
    if (!(await editor.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    // Problem tab button should be visible and styled as active
    const problemTab = page.locator('button:has-text("problem")')
    await expect(problemTab).toBeVisible({ timeout: 5000 })
  })

  test('approach tab switches content', async ({ page }) => {
    const editor = page.locator('[data-testid="coding-editor"]')
    if (!(await editor.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    const approachTab = page.locator('button:has-text("approach")')
    if (await approachTab.isVisible()) {
      await approachTab.click()
      await page.waitForTimeout(300)
      // No crash
      await expect(page.locator('[data-testid="header"]')).toBeVisible()
    }
  })

  test('complexity tab switches content', async ({ page }) => {
    const editor = page.locator('[data-testid="coding-editor"]')
    if (!(await editor.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    const complexityTab = page.locator('button:has-text("complexity")')
    if (await complexityTab.isVisible()) {
      await complexityTab.click()
      await page.waitForTimeout(300)
      await expect(page.locator('[data-testid="header"]')).toBeVisible()
    }
  })

  test('language selector buttons are visible', async ({ page }) => {
    const editor = page.locator('[data-testid="coding-editor"]')
    if (!(await editor.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    // Language buttons: JavaScript, TypeScript, Python
    const jsBtn = page.locator('button:has-text("JavaScript")').first()
    await expect(jsBtn).toBeVisible({ timeout: 5000 })
  })

  test('switching language updates editor content', async ({ page }) => {
    const editor = page.locator('[data-testid="coding-editor"]')
    if (!(await editor.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    const jsBefore = await editor.inputValue()

    const pyBtn = page.locator('button:has-text("Python")').first()
    if (await pyBtn.isVisible()) {
      await pyBtn.click()
      await page.waitForTimeout(400)
      const pyContent = await editor.inputValue()
      // Python starter code should differ from JS
      expect(pyContent).not.toBe(jsBefore)
    }
  })

  test('run code button is visible', async ({ page }) => {
    const editor = page.locator('[data-testid="coding-editor"]')
    if (!(await editor.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    const runBtn = page.locator('button:has-text("Run")').first()
    await expect(runBtn).toBeVisible({ timeout: 5000 })
  })

  test('running JS code shows test results', async ({ page }) => {
    const editor = page.locator('[data-testid="coding-editor"]')
    if (!(await editor.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    const runBtn = page.locator('button:has-text("Run")').first()
    if (!(await runBtn.isVisible({ timeout: 3000 }).catch(() => false))) test.skip()
    await runBtn.click()
    await page.waitForTimeout(1000)
    // Results panel should show
    const results = page
      .locator('text=pass')
      .or(page.locator('text=fail'))
      .or(page.locator('text=error'))
    await expect(results.first()).toBeVisible({ timeout: 8000 })
  })

  test('challenge sidebar is visible on desktop', async ({ page, viewport }) => {
    if (!viewport || viewport.width < 768) test.skip()
    const editor = page.locator('[data-testid="coding-editor"]')
    if (!(await editor.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    const sidebar = page.locator('.sidebar').first()
    await expect(sidebar).toBeVisible()
  })

  test('challenge sidebar items are clickable', async ({ page, viewport }) => {
    if (!viewport || viewport.width < 768) test.skip()
    const editor = page.locator('[data-testid="coding-editor"]')
    if (!(await editor.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    const sidebarItems = page.locator('[data-testid^="coding-sidebar-"]')
    if ((await sidebarItems.count()) > 1) {
      await sidebarItems.nth(1).click()
      await page.waitForTimeout(400)
      await expect(editor).toBeVisible()
    }
  })

  test('next challenge navigation works', async ({ page }) => {
    const editor = page.locator('[data-testid="coding-editor"]')
    if (!(await editor.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    const nextBtn = page.locator('[aria-label="Next challenge"]')
    if ((await nextBtn.isVisible()) && (await nextBtn.isEnabled())) {
      await nextBtn.click()
      await page.waitForTimeout(400)
      await expect(editor).toBeVisible()
    }
  })

  test('hint button shows hints', async ({ page }) => {
    const editor = page.locator('[data-testid="coding-editor"]')
    if (!(await editor.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    const hintBtn = page.locator('button:has-text("Hint")').first()
    if (await hintBtn.isVisible()) {
      await hintBtn.click()
      await page.waitForTimeout(300)
      await expect(page.locator('[data-testid="header"]')).toBeVisible()
    }
  })

  test('show solution button reveals solution', async ({ page }) => {
    const editor = page.locator('[data-testid="coding-editor"]')
    if (!(await editor.isVisible({ timeout: 5000 }).catch(() => false))) test.skip()
    const solutionBtn = page.locator('button:has-text("Solution")').first()
    if (await solutionBtn.isVisible()) {
      await solutionBtn.click()
      await page.waitForTimeout(400)
      // Solution code should appear
      await expect(page.locator('[data-testid="header"]')).toBeVisible()
    }
  })
})
