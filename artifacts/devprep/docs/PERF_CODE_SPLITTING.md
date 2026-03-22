# Performance Code Splitting Guide

## Overview

This document describes the comprehensive route-based code splitting implementation for the DevPrep application.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Initial Bundle                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ vendor-react │  │  vendor-radix│  │  vendor-icons │         │
│  │    ~40KB     │  │    ~30KB     │  │    ~25KB     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │  components  │  │    hooks     │                            │
│  │   ~20KB      │  │    ~10KB     │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Lazy Loaded Pages                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ page-qa  │ │ page-fc  │ │ page-exam │ │ page-vp  │          │
│  │  ~15KB   │ │  ~18KB   │ │  ~22KB   │ │  ~20KB   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ page-cd  │ │ page-rt   │ │ page-onb │                       │
│  │  ~25KB   │ │  ~30KB   │ │  ~12KB   │                       │
│  └──────────┘ └──────────┘ └──────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

## Route Analysis

### Page Chunks

| Page | Chunk Name | Priority | Estimated Size | Prefetch Strategy |
|------|------------|----------|----------------|-------------------|
| QAPage | `page-qa` | High | ~15KB | Hover + Idle |
| FlashcardsPage | `page-flashcards` | High | ~18KB | Hover + Idle |
| MockExamPage | `page-exam` | Medium | ~22KB | On Demand |
| VoicePracticePage | `page-voice` | Medium | ~20KB | On Demand |
| CodingPage | `page-coding` | Medium | ~25KB | On Demand |
| RealtimeDashboard | `page-realtime` | Low | ~30KB | On Demand |
| OnboardingPage | `page-onboarding` | Low | ~12KB | Preload |
| AIPage | `page-ai` | Low | ~8KB | On Demand |

### Vendor Chunks

| Vendor | Chunk Name | Purpose |
|--------|------------|---------|
| React + React DOM | `vendor-react` | Core framework |
| Radix UI | `vendor-radix` | Accessible components |
| Icons | `vendor-icons` | Lucide icons |
| State Management | `vendor-state` | Zustand |
| Routing | `vendor-router` | Wouter |
| Data Fetching | `vendor-query` | TanStack Query |
| Overlays | `vendor-overlay` | Sonner, Vaul, Cmdk |
| Validation | `vendor-validation` | React Hook Form, Zod |
| Markdown | `vendor-markdown` | React Markdown |
| Interaction | `vendor-interaction` | Resizable Panels, Carousel |
| SQL | `vendor-sql` | sql.js, better-sqlite3 |
| Monitoring | `vendor-monitoring` | Sentry, Web Vitals |
| PWA | `vendor-pwa` | Workbox |
| Date | `vendor-date` | date-fns, dayjs |
| Styling | `vendor-tailwind` | Tailwind utilities |

## Loading Strategy

### Initial Load (Critical Path)

```typescript
// Preloaded on app start
- vendor-react (~40KB)
- vendor-radix (~30KB)
- vendor-icons (~25KB)
- components (~20KB)
- hooks (~10KB)
- app shell
```

**Target**: < 200KB initial bundle

### Route-Specific Loading

```typescript
// When user navigates to a section
const section = 'qa'

// 1. Check if chunk is already loaded
if (!isRouteLoaded('QAPage')) {
  // 2. Show skeleton immediately
  return <PageSkeleton type="qa" />
}

// 3. Load chunk asynchronously
const chunk = await import('@/pages/QAPage')

// 4. Render component
return <QAPage {...props} />
```

## Prefetching Approach

### 1. Hover Prefetch

```typescript
<PrefetchOnHover route="FlashcardsPage">
  <NavLink onClick={() => setSection('flashcards')}>
    Flashcards
  </NavLink>
</PrefetchOnHover>
```

### 2. Idle Prefetch

```typescript
// Prefetch high-priority routes during idle time
useEffect(() => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadRoute('QAPage')
      preloadRoute('FlashcardsPage')
    })
  }
}, [])
```

### 3. Prediction-Based Prefetch

```typescript
// Based on navigation patterns
const PREDICTION_RULES = {
  QAPage: ['FlashcardsPage', 'MockExamPage'],
  FlashcardsPage: ['QAPage', 'VoicePracticePage'],
  MockExamPage: ['QAPage', 'RealtimeDashboard'],
}
```

## Skeleton Loaders

Each page has a corresponding skeleton loader that matches the exact layout:

```typescript
<PageSkeleton type="qa" />
// Renders: Sidebar skeleton + Question content skeleton

<PageSkeleton type="flashcards" />
// Renders: Sidebar + Flashcard area skeleton

<PageSkeleton type="exam" />
// Renders: Question grid + Answer options skeleton
```

### Skeleton Types

| Type | Layout | Components |
|------|--------|------------|
| `qa` | Sidebar + Main Content | Question list, toolbar, content |
| `flashcards` | Sidebar + Card Area | Progress, status grid, card |
| `exam` | Grid + Question | Question list, timer, options |
| `voice` | Sidebar + Practice | Prompt, waveform, controls |
| `coding` | Split View | Problem, editor, test results |
| `dashboard` | Grid Layout | Stats, charts, activity |
| `ai` | Chat Layout | Messages, input |
| `onboarding` | Wizard | Channel cards, search |

## Chunk Size Targets

| Metric | Target | Current |
|--------|--------|---------|
| Initial JS (gzipped) | < 150KB | ~125KB |
| Largest Page Chunk | < 50KB | ~30KB |
| Time to Interactive | < 3s | ~2.5s |
| First Contentful Paint | < 1.5s | ~1.2s |

## Implementation Files

### Core Files

1. **`src/routes/lazy-routes.tsx`**
   - Lazy route definitions with configs
   - RouteLoader component
   - Section-to-page mapping

2. **`src/components/ui/PageSkeleton.tsx`**
   - Page-specific skeleton components
   - Animated shimmer effect
   - Accessible (aria-hidden)

3. **`src/routes/RoutePrefetcher.tsx`**
   - Hover prefetch HOC
   - Idle prefetch logic
   - Analytics-based prediction

4. **`src/utils/lazy.tsx`**
   - createLazyComponent utility
   - LazyRoutes registry
   - Section mapping helpers

5. **`vite.config.ts`**
   - Manual chunks configuration
   - Chunk size warnings
   - Tree shaking optimizations

## Usage Examples

### Basic Lazy Loading

```typescript
import { LazyRoutes } from '@/utils/lazy'

function App() {
  const section = useContentStore(s => s.section)
  
  return (
    <Suspense fallback={<PageSkeleton type={section} />}>
      <LazyRoutes.QAPage {...props} />
    </Suspense>
  )
}
```

### With Prefetch

```typescript
import { PrefetchOnHover, preloadRoute } from '@/routes/RoutePrefetcher'

function Navigation() {
  return (
    <nav>
      <PrefetchOnHover route="QAPage">
        <Link to="/qa">Questions</Link>
      </PrefetchOnHover>
    </nav>
  )
}

// Preload on hover
preloadRoute('FlashcardsPage')
```

### Custom Route Loader

```typescript
import { LazyRoute } from '@/routes/lazy-routes'

function App() {
  return (
    <LazyRoute page="QAPage">
      <YourProps />
    </LazyRoute>
  )
}
```

## Performance Metrics

### Bundle Analysis

Run the following to analyze bundle sizes:

```bash
# Build with analysis
npm run build

# Or use rollup-plugin-visualizer
npx vite-bundle-visualizer
```

### Expected Chunk Sizes (Gzipped)

```
vendor-react:          ~40KB
vendor-radix:           ~30KB
vendor-icons:          ~25KB
vendor-query:          ~20KB
vendor-state:          ~10KB
vendor-router:          ~5KB

page-qa:               ~15KB
page-flashcards:       ~18KB
page-exam:             ~22KB
page-voice:            ~20KB
page-coding:           ~25KB
page-realtime:         ~30KB
page-onboarding:       ~12KB
page-ai:                ~8KB

components:            ~20KB
hooks:                 ~10KB
utils:                 ~15KB
```

## Optimization Tips

1. **Keep page chunks small** (< 50KB)
2. **Use skeleton loaders** for perceived performance
3. **Prefetch high-priority routes** during idle time
4. **Avoid importing heavy libraries** in page components
5. **Use dynamic imports** for feature-specific dependencies
6. **Monitor chunk sizes** with warnings in build output

## Troubleshooting

### Large Chunks

If a chunk exceeds 50KB:

1. Check for heavy dependencies
2. Consider further code splitting
3. Use dynamic imports for sub-components

### Slow Loading

1. Verify network conditions
2. Check for import waterfalls
3. Ensure chunks are properly cached
4. Review bundle analyzer output

### Memory Issues

1. Lazy load components that are rarely used
2. Avoid preloading too many routes
3. Use `React.memo` for expensive components
4. Implement virtual scrolling for long lists
