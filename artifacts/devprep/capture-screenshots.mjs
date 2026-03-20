import { chromium } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputDir = '/home/runner/workspace/artifacts/devprep/test-results'

const urls = {
  homepage: 'http://localhost:5174',
  devops_questions: 'http://localhost:5174/channel/devops?section=questions',
  devops_flashcards: 'http://localhost:5174/channel/devops?section=flashcards',
  devops_exam: 'http://localhost:5174/channel/devops?section=exam',
  devops_voice: 'http://localhost:5174/channel/devops?section=voice',
  devops_coding: 'http://localhost:5174/channel/devops?section=coding',
}

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()

  const results = []

  for (const [name, url] of Object.entries(urls)) {
    try {
      console.log(`Capturing: ${name}`)
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(2000)

      const filename = path.join(outputDir, `${name}.png`)
      await page.screenshot({ path: filename, fullPage: true })
      results.push({ name, status: 'success', file: filename })
      console.log(`  ✓ Saved to ${filename}`)
    } catch (err) {
      results.push({ name, status: 'error', error: err.message })
      console.log(`  ✗ Error: ${err.message}`)
    }
  }

  await browser.close()

  console.log('\n=== Screenshot Results ===')
  results.forEach(r => {
    const status = r.status === 'success' ? '✓' : '✗'
    console.log(`${status} ${r.name}: ${r.status === 'success' ? r.file : r.error}`)
  })

  return results
}

captureScreenshots().catch(console.error)
