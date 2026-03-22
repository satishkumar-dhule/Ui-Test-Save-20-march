# DevPrep Bundle Optimization Guide

## Overview

This document outlines the bundle optimization strategy for the DevPrep React application to achieve:

- **Initial bundle < 150KB gzipped**
- **Vendor chunks < 50KB each**
- **No duplicate dependencies**
- **Optimal code splitting**

---

## Current Bundle Analysis

### Heavy Dependencies

| Dependency              | Size (approx) | Type          | Recommendation             |
| ----------------------- | ------------- | ------------- | -------------------------- |
| `react` + `react-dom`   | ~45KB gzipped | Core          | Keep in vendor-react       |
| `@tanstack/react-query` | ~15KB gzipped | Core          | Keep in vendor-query       |
| `framer-motion`         | ~40KB gzipped | Animation     | Lazy load with components  |
| `recharts`              | ~35KB gzipped | Charts        | Lazy load chart components |
| `sql.js`                | ~500KB (WASM) | Database      | Keep in vendor-sql (async) |
| `zustand`               | ~5KB gzipped  | State         | Keep in vendor-state       |
| `wouter`                | ~5KB gzipped  | Router        | Keep in vendor-router      |
| `react-icons`           | ~30KB gzipped | Icons         | Use named imports only     |
| `lucide-react`          | ~20KB gzipped | Icons         | Use named imports only     |
| `@radix-ui/*`           | ~50KB total   | UI Primitives | Keep in vendor-radix       |

### Static Data Files

| File                   | Size | Recommendation                   |
| ---------------------- | ---- | -------------------------------- |
| `questions.ts`         | 24KB | Lazy load on demand              |
| `flashcards.ts`        | 12KB | Keep eagerly (small)             |
| `coding.ts`            | 40KB | Lazy load with CodingPage        |
| `exam.ts`              | 28KB | Lazy load with MockExamPage      |
| `voicePractice.ts`     | 12KB | Lazy load with VoicePracticePage |
| `generated-content.ts` | 48KB | Lazy load (DB content)           |
| `channels.ts`          | 12KB | Keep eagerly (required early)    |

---

## Optimizations Applied

### 1. Vite Configuration (vite.config.v2.ts)

```typescript
build: {
  // Aggressive minification
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,        // Remove console logs
      drop_debugger: true,        // Remove debugger statements
      pure_funcs: ['console.log', 'console.info', 'console.debug'],
      passes: 2,                  // Run twice for better compression
    },
  },

  // Chunk size warnings
  chunkSizeWarningLimit: 500,     // 500KB limit (was 1000KB)
  reportCompressedSize: true,     // Report gzip sizes

  // Manual chunk splitting
  rollupOptions: {
    output: {
      // Separate vendor chunks for better caching
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-query': ['@tanstack/react-query'],
        'vendor-radix': ['@radix-ui/*'],
        'vendor-motion': ['framer-motion'],
        'vendor-charts': ['recharts'],
        'vendor-sql': ['sql.js', 'better-sqlite3'],
        'vendor-icons': ['react-icons'],
        'vendor-icons-lucide': ['lucide-react'],
        'vendor-toast': ['sonner'],
      },
    },
  },
}
```

### 2. Tree-Shaking Improvements

#### React Icons (CRITICAL)

```tsx
// BAD - imports entire icon library
import { FaUser, FaCheck } from 'react-icons/fa'

// GOOD - use named imports (tree-shakeable)
import { IoCheckmark, IoPerson } from 'react-icons/io5'
```

#### Framer Motion

```tsx
// BAD - imports entire library
import { motion, AnimatePresence } from 'framer-motion'

// GOOD - import specific exports
import { motion } from 'framer-motion'
```

### 3. Dynamic Import Strategy

#### Pages (Already Implemented)

```tsx
// src/utils/lazy.tsx
export const LazyRoutes = {
  QAPage: createLazyComponent(() => import('@/pages/QAPage')),
  FlashcardsPage: createLazyComponent(() => import('@/pages/FlashcardsPage')),
  // ... other pages
}
```

#### Heavy Components

```tsx
// Lazy load chart component
const Chart = lazy(() => import('@/components/ui/chart'))

// Lazy load motion-heavy components
const ContentCard = lazy(() => import('@/components/ContentCard'))
const LiveFeed = lazy(() => import('@/components/LiveFeed'))
```

#### Static Data

```tsx
// Lazy load question data when needed
const questions = await import('@/data/questions')

// Or use React.lazy with data loader
const QuestionsData = lazy(() =>
  import('@/data/questions').then(m => ({ default: () => m.questions }))
)
```

### 4. Lazy Loading v2 (src/utils/lazy-v2.tsx)

New optimized lazy loading utilities:

```tsx
import { LazyComponents, LazyData, preloadCritical } from '@/utils/lazy-v2'

// Use in routes
const App = () => (
  <Suspense fallback={<Loading />}>
    <LazyComponents.QAPage />
  </Suspense>
)

// Preload on idle
useEffect(() => {
  preloadOnIdle()
}, [])
```

---

## Recommended Dependency Alternatives

### Heavy Libraries to Consider Replacing

| Current                | Alternative                        | Savings             |
| ---------------------- | ---------------------------------- | ------------------- |
| `recharts` (35KB)      | Lightweight alternatives or SVG    | ~30KB               |
| `framer-motion` (40KB) | CSS animations or motion (lighter) | ~25KB               |
| `react-icons` (30KB)   | Individual icon imports            | ~25KB               |
| Full `sql.js`          | Worker-based loading               | Faster initial load |

### Specific Recommendations

1. **Charts**: If only using simple charts, replace `recharts` with:
   - Custom SVG components
   - `chart.js` with `react-chartjs-2`
   - `@nivo/bar` for specific chart types

2. **Icons**: Ensure all icon imports are named:

   ```tsx
   import { FaSearch } from 'react-icons/fa'
   import { IoSearch } from 'react-icons/io5'
   ```

3. **Animations**: Use CSS animations where possible:
   ```css
   .fade-in {
     animation: fadeIn 0.2s ease-out;
   }
   @keyframes fadeIn {
     from {
       opacity: 0;
     }
     to {
       opacity: 1;
     }
   }
   ```

---

## Bundle Analysis Commands

### Run Bundle Analyzer

```bash
npm run analyze:bundle
```

This generates a visual HTML report at `dist/stats.html`.

### Check Gzip Sizes

```bash
# Install gzip-size-cli
npx gzip-size dist/assets/**/*.js

# Or use vite-bundle-analyzer
npx vite-bundle-analyzer dist/stats.json
```

### Measure Performance

```bash
# Lighthouse CI
npx lhci autorun

# Or manual
npx lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-report.json
```

---

## Target Metrics

| Metric               | Current | Target | Status             |
| -------------------- | ------- | ------ | ------------------ |
| Initial JS (gzipped) | ~180KB  | <150KB | In Progress        |
| vendor-react         | ~45KB   | <50KB  | ✓                  |
| vendor-query         | ~15KB   | <15KB  | ✓                  |
| vendor-motion        | ~40KB   | <30KB  | Needs Optimization |
| vendor-charts        | ~35KB   | <20KB  | Needs Lazy Load    |
| vendor-icons         | ~30KB   | <10KB  | Needs Tree-Shaking |
| LCP                  | ~2.5s   | <2.5s  | ✓                  |
| TTI                  | ~3.5s   | <3s    | In Progress        |

---

## Action Items

### High Priority

- [ ] Verify react-icons are using named imports only
- [ ] Add dynamic import for chart components
- [ ] Split static data into lazy-loaded chunks
- [ ] Verify framer-motion is only used where needed

### Medium Priority

- [ ] Consider replacing recharts with lighter alternative
- [ ] Implement requestIdleCallback preloading
- [ ] Add preload hints for critical routes

### Low Priority

- [ ] Add Webpack Bundle Analyzer to CI
- [ ] Set up bundle size budgets in CI
- [ ] Monitor Core Web Vitals in production

---

## Files Modified

- `vite.config.v2.ts` - Enhanced chunk splitting
- `src/utils/lazy-v2.tsx` - New optimized lazy loading utilities
- `docs/PERF_BUNDLE_OPTIMIZATION.md` - This documentation

---

_Last Updated: 2026-03-22_
