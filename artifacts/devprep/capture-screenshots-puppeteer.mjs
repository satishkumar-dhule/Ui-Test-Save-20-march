import puppeteer from 'puppeteer'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputDir = '/home/runner/workspace/artifacts/devprep/test-results'

const pages = [
  { name: 'homepage', url: 'http://localhost:5174' },
  { name: 'devops_questions', url: 'http://localhost:5174/channel/devops?section=questions' },
  { name: 'devops_flashcards', url: 'http://localhost:5174/channel/devops?section=flashcards' },
  { name: 'devops_exam', url: 'http://localhost:5174/channel/devops?section=exam' },
  { name: 'devops_voice', url: 'http://localhost:5174/channel/devops?section=voice' },
  { name: 'devops_coding', url: 'http://localhost:5174/channel/devops?section=coding' },
]

async function captureScreenshots() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 720 })

  const results = []

  for (const { name, url } of pages) {
    try {
      console.log(`Capturing: ${name}`)
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })
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
