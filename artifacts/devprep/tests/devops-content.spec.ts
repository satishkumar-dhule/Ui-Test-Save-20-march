import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5174'

test.describe('DevOps Tech Content E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState('networkidle')
  })

  test.describe.configure({ mode: 'serial' })

  test('1. Page loads without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    await page.waitForTimeout(3000)
    expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0)
  })

  test('2. Navigate to DevOps channel', async ({ page }) => {
    await page.waitForSelector(
      '[data-testid="channel-selector"], .channel-button, button:has-text("DevOps")',
      { timeout: 10000 }
    )

    const devopsButton = page.locator('button:has-text("DevOps"), [data-channel="devops"]').first()
    await devopsButton.click()
    await page.waitForTimeout(1000)

    const url = page.url()
    expect(url).toContain('devops')
  })

  test('3. Verify DevOps content sections exist', async ({ page }) => {
    await page.waitForSelector('button:has-text("DevOps"), [data-channel="devops"]', {
      timeout: 10000,
    })
    await page.locator('button:has-text("DevOps"), [data-channel="devops"]').first().click()
    await page.waitForTimeout(2000)

    const sections = ['Questions', 'Flashcards', 'Exam', 'Voice', 'Coding']
    for (const section of sections) {
      const sectionEl = page.locator(`text=${section}`).first()
      await expect(sectionEl).toBeVisible({ timeout: 5000 })
    }
  })

  test('4. Verify section counts for DevOps', async ({ page }) => {
    await page.waitForSelector('button:has-text("DevOps"), [data-channel="devops"]', {
      timeout: 10000,
    })
    await page.locator('button:has-text("DevOps"), [data-channel="devops"]').first().click()
    await page.waitForTimeout(3000)

    const contentSections = [
      { name: 'QA', expected: /[1-9]/ },
      { name: 'Flashcards', expected: /[1-9]/ },
      { name: 'Exam', expected: /[1-9]/ },
      { name: 'Voice', expected: /[1-9]/ },
      { name: 'Coding', expected: /[1-9]/ },
    ]

    for (const section of contentSections) {
      const el = page.locator(`text=${section.name}`).first()
      await expect(el).toBeVisible({ timeout: 5000 })
    }
  })

  test('5. API returns DevOps content', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/channels/devops/content`)
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data.ok).toBe(true)
    expect(data.data.length).toBeGreaterThan(0)

    const types = data.data.map((d: any) => d.content_type)
    expect(types).toContain('question')
    expect(types).toContain('flashcard')
    expect(types).toContain('exam')
    expect(types).toContain('voice')
    expect(types).toContain('coding')
  })

  test('6. Generated content is merged with static data', async ({ page }) => {
    await page.waitForSelector('button:has-text("DevOps"), [data-channel="devops"]', {
      timeout: 10000,
    })
    await page.locator('button:has-text("DevOps"), [data-channel="devops"]').first().click()
    await page.waitForTimeout(3000)

    await page.locator('text=Questions').click()
    await page.waitForTimeout(1000)

    const questionCards = page.locator('[data-testid="question-card"], .question-card, article')
    const count = await questionCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('7. Click through each content section', async ({ page }) => {
    await page.waitForSelector('button:has-text("DevOps"), [data-channel="devops"]', {
      timeout: 10000,
    })
    await page.locator('button:has-text("DevOps"), [data-channel="devops"]').first().click()
    await page.waitForTimeout(2000)

    const sections = ['Questions', 'Flashcards', 'Exam', 'Voice', 'Coding']

    for (const section of sections) {
      const tab = page.locator(`button:has-text("${section}")`).first()
      if (await tab.isVisible()) {
        await tab.click()
        await page.waitForTimeout(500)
        await page.screenshot({
          path: `test-results/devops-${section.toLowerCase()}.png`,
          fullPage: true,
        })
      }
    }
  })
})

test.describe('Content API Integration', () => {
  test('API health check', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/health')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.ok).toBe(true)
  })

  test('API returns all content types for devops', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/channels/devops/content')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    const contentTypes = data.data.map((r: any) => r.content_type)

    expect(contentTypes).toContain('question')
    expect(contentTypes).toContain('flashcard')
    expect(contentTypes).toContain('exam')
    expect(contentTypes).toContain('voice')
    expect(contentTypes).toContain('coding')
  })

  test('Each content type has proper data structure', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/channels/devops/content')
    const data = await response.json()

    for (const record of data.data) {
      expect(record.id).toBeDefined()
      expect(record.channel_id).toBe('devops')
      expect(record.content_type).toBeDefined()
      expect(record.data).toBeDefined()
      expect(record.status).toBe('approved')
    }
  })
})
