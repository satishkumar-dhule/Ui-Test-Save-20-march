const fs = require('fs')
const path = require('path')

const BUDGETS = {
  totalSize: 200 * 1024 * 1024, // 200MB max
  jsChunk: 100 * 1024, // 100KB max per JS chunk
  cssChunk: 30 * 1024, // 30KB max per CSS chunk
  imageSize: 100 * 1024, // 100KB max per image
}

function checkFileSize(filePath, maxSize, type) {
  const stats = fs.statSync(filePath)
  const sizeKB = stats.size / 1024
  const maxKB = maxSize / 1024

  if (stats.size > maxSize) {
    console.error(
      `ERROR: ${type} file ${filePath} (${sizeKB.toFixed(1)}KB) exceeds budget (${maxKB}KB)`
    )
    return false
  }

  if (sizeKB > maxKB * 0.8) {
    console.warn(
      `WARN: ${type} file ${filePath} (${sizeKB.toFixed(1)}KB) is close to budget (${maxKB}KB)`
    )
  } else {
    console.log(`OK: ${type} file ${path.basename(filePath)} (${sizeKB.toFixed(1)}KB)`)
  }
  return true
}

function checkDirectory(dir, maxSize, type, extension) {
  const files = fs.readdirSync(dir, { withFileTypes: true })
  let allPassed = true

  for (const file of files) {
    const filePath = path.join(dir, file.name)

    if (file.isDirectory()) {
      if (!checkDirectory(filePath, maxSize, type, extension)) {
        allPassed = false
      }
    } else if (file.name.endsWith(extension)) {
      if (!checkFileSize(filePath, maxSize, type)) {
        allPassed = false
      }
    }
  }

  return allPassed
}

function main() {
  const distPath = path.join(__dirname, '..', 'dist', 'public')

  if (!fs.existsSync(distPath)) {
    console.error('ERROR: dist/public directory not found. Run build first.')
    process.exit(1)
  }

  console.log('Checking bundle sizes...\n')
  console.log('=== Total Build Size ===')
  const totalSize = fs.statSync(distPath)
  console.log(`Total: ${(totalSize.size / (1024 * 1024)).toFixed(2)}MB`)

  if (totalSize.size > BUDGETS.totalSize) {
    console.error(`ERROR: Total build size exceeds budget`)
    process.exit(1)
  }

  console.log('\n=== JS Chunks ===')
  const jsDir = path.join(distPath, 'assets')
  let jsPassed = true

  if (fs.existsSync(jsDir)) {
    if (!checkDirectory(jsDir, BUDGETS.jsChunk, 'JS', '.js')) {
      jsPassed = false
    }
  }

  console.log('\n=== CSS Chunks ===')
  let cssPassed = true

  if (fs.existsSync(jsDir)) {
    if (!checkDirectory(jsDir, BUDGETS.cssChunk, 'CSS', '.css')) {
      cssPassed = false
    }
  }

  console.log('\n=== Images ===')
  let imgPassed = true
  const imgExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.avif']

  function checkImages(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true })
    for (const file of files) {
      const filePath = path.join(dir, file.name)
      if (file.isDirectory()) {
        checkImages(filePath)
      } else {
        const ext = path.extname(file.name).toLowerCase()
        if (imgExtensions.includes(ext)) {
          if (!checkFileSize(filePath, BUDGETS.imageSize, 'Image')) {
            imgPassed = false
          }
        }
      }
    }
  }

  if (fs.existsSync(jsDir)) {
    checkImages(jsDir)
  }

  console.log('\n=== Summary ===')
  const allPassed = jsPassed && cssPassed && imgPassed

  if (allPassed) {
    console.log('All bundle size budgets passed!')
    process.exit(0)
  } else {
    console.error('Some bundle size budgets failed!')
    process.exit(1)
  }
}

main()
