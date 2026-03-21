// Compute contrast ratio between two colors (rgba or hsl)
const parseColor = color => {
  // Simple parser for HSL and RGBA
  if (color.startsWith('hsl')) {
    const match = color.match(/hsl\((\d+\.?\d*),\s*(\d+\.?\d*)%,\s*(\d+\.?\d*)%\)/)
    if (match) {
      const h = parseFloat(match[1]) / 360
      const s = parseFloat(match[2]) / 100
      const l = parseFloat(match[3]) / 100
      // convert to RGB
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      const r = hue2rgb(p, q, h + 1 / 3)
      const g = hue2rgb(p, q, h)
      const b = hue2rgb(p, q, h - 1 / 3)
      return [r, g, b, 1]
    }
  }
  // assume rgba
  const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)
  if (match) {
    return [
      parseInt(match[1]) / 255,
      parseInt(match[2]) / 255,
      parseInt(match[3]) / 255,
      parseFloat(match[4]),
    ]
  }
  // hex not needed
  return [0, 0, 0, 1]
}

const luminance = (r, g, b) => {
  const a = [r, g, b].map(v => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

const contrastRatio = (fg, bg) => {
  const l1 = luminance(fg[0], fg[1], fg[2]) + 0.05
  const l2 = luminance(bg[0], bg[1], bg[2]) + 0.05
  return l1 > l2 ? l1 / l2 : l2 / l1
}

// Test light mode foreground vs card
const lightFg = parseColor('hsl(240, 33%, 14%)') // #1a1a2e approx
const lightCard = parseColor('hsl(0, 0%, 100%)')
console.log('Light mode fg vs card:', contrastRatio(lightFg, lightCard).toFixed(2))

// Dark mode foreground vs card
const darkFg = parseColor('hsl(20, 6%, 89%)') // #e5e2e1
const darkCard = parseColor('hsl(0, 0%, 9.4%)') // #181818
console.log('Dark mode fg vs card:', contrastRatio(darkFg, darkCard).toFixed(2))

// Glass text primary (rgba(255,255,255,0.95)) vs glass bg rgba(28,28,30,0.72)
const glassText = parseColor('rgba(255,255,255,0.95)')
const glassBg = parseColor('rgba(28,28,30,0.72)')
console.log(
  'Glass text primary vs glass bg (light mode):',
  contrastRatio(glassText, glassBg).toFixed(2)
)

// Glass text secondary (rgba(255,255,255,0.6))
const glassTextSecondary = parseColor('rgba(255,255,255,0.6)')
console.log(
  'Glass text secondary vs glass bg:',
  contrastRatio(glassTextSecondary, glassBg).toFixed(2)
)

// Glass border (rgba(255,255,255,0.1)) low contrast, fine.

// Check if contrast meets WCAG AA 4.5:1 for normal text
const required = 4.5
console.log('Required:', required)
