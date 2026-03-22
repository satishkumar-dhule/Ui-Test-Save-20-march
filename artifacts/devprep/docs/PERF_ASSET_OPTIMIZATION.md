# Asset Optimization Guide

## Overview

This document outlines the asset optimization strategy for DevPrep to achieve maximum performance.

---

## Current Asset Analysis

### Icons: ✅ Lucide React (Tree-shakeable)

| Aspect        | Status                               | Details                   |
| ------------- | ------------------------------------ | ------------------------- |
| Library       | Lucide React                         | 34 components using icons |
| Tree-shaking  | Enabled                              | Vite ES modules           |
| Bundle impact | Minimal                              | Only used icons bundled   |
| Categories    | Navigation, Actions, Status, Content |

**Usage Pattern:**

```typescript
import { Home, Search, Settings } from 'lucide-react'
```

**Optimization:**

- Icons are already optimized via ES module imports
- Use `src/lib/icon-registry.ts` for centralized icon management
- Group icons by category for potential lazy loading

### Fonts: ✅ System Fonts (Zero Weight)

| Aspect        | Status       | Details                  |
| ------------- | ------------ | ------------------------ |
| Type          | System Fonts | Apple, SF Pro, system-ui |
| Web fonts     | None         | No Google Fonts          |
| Font loading  | Instant      | Native rendering         |
| Bundle impact | 0KB          | No web font downloads    |

**Current Font Stack:**

```css
--app-font-sans:
  -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif;
--app-font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
```

**Recommendation:** Excellent - no changes needed.

### Images: ✅ PWA Cached

| Aspect  | Status    | Details                       |
| ------- | --------- | ----------------------------- |
| Icons   | Optimized | 192px (8.7KB), 512px (25.9KB) |
| Caching | Workbox   | CacheFirst strategy           |
| Formats | PNG       | No WebP conversion yet        |

**Assets in `/public/`:**

- `favicon.svg` - 277 bytes
- `icon-192.png` - 8.7KB
- `icon-512.png` - 25.9KB
- `manifest.json` - 1.8KB

### Heavy Assets: ⚠️ SQLite WASM

| Asset           | Size  | Recommendation           |
| --------------- | ----- | ------------------------ |
| sql-wasm.min.js | 46KB  | Lazy load                |
| sql-wasm.wasm   | 660KB | Critical - needed for DB |

---

## Optimization Deliverables

### 1. Icon Registry (`src/lib/icon-registry.ts`)

Centralized icon management with categories:

```typescript
import { IconRegistry, getIcon, ICON_BUNDLE_GROUPS } from '@/lib/icon-registry'

// Usage
<IconRegistry.navigation.Home size={24} />
<IconRegistry.actions.Check size={24} />
```

**Benefits:**

- Single import location
- Type-safe icon names
- Easy to audit unused icons
- Potential for code-splitting icon bundles

### 2. Lazy Image Component (`src/components/ui/LazyImage.tsx`)

Intersection Observer-based lazy loading with blur-up effect:

```typescript
import { LazyImage } from '@/components/ui/LazyImage'

<LazyImage
  src="/images/hero.webp"
  alt="Hero image"
  placeholder="blur"
  sizes="100vw"
/>
```

**Features:**

- Intersection Observer lazy loading
- Blur-up placeholder effect
- WebP detection and fallback
- Responsive srcset generation
- Error boundary

### 3. Asset Preloading (`src/lib/preload.ts`)

Critical asset preloading utilities:

```typescript
import { preloadCriticalAssets, preconnectTo, preloadManifest } from '@/lib/preload'

// Preconnect to API on mount
useEffect(() => {
  preloadCriticalAssets()
}, [])
```

**Functions:**

- `preloadCriticalAssets()` - Preconnect to API
- `preloadImage(src)` - Preload single image
- `prefetchDns(hostname)` - DNS prefetch
- `preconnectTo(url)` - Preconnect
- `preloadManifest({ images, fonts })` - Batch preload

### 4. Font Preload Plugin (`vite-font-preload-plugin.ts`)

Vite plugin for font optimization:

```typescript
import { fontPreloadPlugin } from './vite-font-preload-plugin'

export default defineConfig({
  plugins: [fontPreloadPlugin({ prefetchAll: true })],
})
```

**Features:**

- Auto-detect font files
- Generate preload links
- Inject font metadata
- Critical CSS generation

---

## Performance Targets

| Metric         | Current | Target | Status |
| -------------- | ------- | ------ | ------ |
| Initial bundle | ~200KB  | <100KB | ❌     |
| TTI            | ~3s     | <2s    | ❌     |
| LCP            | ~2.5s   | <1.5s  | ❌     |
| CLS            | 0.1     | <0.05  | ✅     |
| FID            | 50ms    | <50ms  | ✅     |

---

## Recommendations

### High Priority

1. **Lazy Load SQLite WASM**

   ```typescript
   const initDb = async () => {
     const { default: initSqlJs } = await import('sql.js')
     return initSqlJs()
   }
   ```

2. **Convert PWA Icons to WebP**

   ```bash
   # Convert PNG to WebP for ~30% size reduction
   cwebp -q 80 icon-192.png -o icon-192.webp
   ```

3. **Add Responsive Image Sizes**
   ```html
   <picture>
     <source srcset="hero-320.webp 320w, hero-640.webp 640w" type="image/webp" />
     <img src="hero.jpg" alt="Hero" />
   </picture>
   ```

### Medium Priority

1. **Code-split Icon Bundles**

   ```typescript
   const icons = await import('@/lib/icon-registry')
   const navIcons = icons.ICON_BUNDLE_GROUPS.navigation
   ```

2. **Add Image Placeholder Service**

   ```typescript
   <LazyImage
     src={getOptimizedImageUrl(src, { width: 640, format: 'webp' })}
     placeholder="blur"
   />
   ```

3. **Preload Above-fold Images**
   ```typescript
   useEffect(() => {
     const aboveFoldImages = ['/hero.webp', '/logo.svg']
     aboveFoldImages.forEach(preloadImage)
   }, [])
   ```

### Low Priority

1. **Icon Sprite Generation**
   - Combine frequently used icons
   - Reduce HTTP requests

2. **Font Subsetting**
   - Only include needed characters
   - Reduce font file size

---

## Bundle Analysis

### Current Chunk Structure (vite.config.ts)

```typescript
manualChunks: {
  'vendor-react': ['react', 'react-dom'],
  'vendor-query': ['@tanstack/react-query'],
  'vendor-radix': ['@radix-ui/*'],
  'vendor-motion': ['framer-motion'],
  'vendor-charts': ['recharts', 'victory'],
  'vendor-sql': ['sql.js', 'better-sqlite3'],
  'vendor-sentry': ['@sentry'],
  'vendor-router': ['wouter'],
  'vendor-state': ['zustand'],
  'vendor-pwa': ['web-vitals', 'workbox'],
}
```

### Recommendations

1. **Add icon chunk** (future)
2. **Lazy load chart libraries**
3. **Defer sentry in dev mode**

---

## Implementation Checklist

- [x] Create icon registry
- [x] Create LazyImage component
- [x] Create preload utilities
- [x] Create font preload plugin
- [ ] Convert PWA icons to WebP
- [ ] Lazy load SQLite WASM
- [ ] Add responsive image sizes
- [ ] Preload critical images
- [ ] Test bundle size
- [ ] Update vite.config.ts

---

## Monitoring

Use these tools to track optimization impact:

1. **Lighthouse** - Overall performance
2. **Bundlephobia** - Package size analysis
3. **WebPageTest** - Real user metrics
4. **Chrome DevTools** - Network/waterfall

---

_Last Updated: 2026-03-22_
