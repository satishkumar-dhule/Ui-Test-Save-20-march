# Performance Optimization v2

## Overview

This document outlines the performance optimization strategy for DevPrep, targeting Lighthouse 90+ scores with bundle size < 200KB initial and Time to Interactive < 3 seconds.

## Performance Goals

### Target Metrics
- **Lighthouse Score**: 90+
- **Initial Bundle Size**: < 200KB
- **Time to Interactive**: < 3s
- **First Contentful Paint**: < 1.8s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## Architecture

### 1. Performance Utilities (`src/utils/performance-v2.ts`)

Core performance monitoring and optimization tools:

```typescript
// Performance monitoring
export class PerformanceMonitor {
  getMetrics(): Partial<PerformanceMetrics>
  getTTFB(): number
  getTTI(): number
  getTBT(): number
}

// React hook
export function usePerformanceMonitor(): Partial<PerformanceMetrics>

// Utilities
export function initPerformanceOptimizations(): void
export function reportWebVitals(): void
export function checkPerformanceBudget(metrics): { passed, violations, score }
```

### 2. Lazy Loading System (`src/utils/lazy-v2.tsx`)

Advanced component and route lazy loading:

```typescript
// Create lazy component
export function createLazyComponent<T>(
  importFunc: () => Promise<{ default: T }>,
  options?: LazyLoadOptions
): LazyExoticComponent<T>

// Route-based lazy loading
export function createLazyRoutes(routes: RouteConfig[]): Map<string, LazyExoticComponent<any>>

// Component preloading
export function preloadComponent(importFunc: () => Promise<any>): Promise<void>

// Code splitting
export class CodeSplitter {
  loadModule(moduleId: string, importFunc: () => Promise<any>): Promise<any>
}
```

### 3. Image Optimization (`src/utils/images-v2.ts`)

Advanced image loading and optimization:

```typescript
// Image optimizer class
export class ImageOptimizer {
  optimizeUrl(src: string, options?: ImageOptimizationOptions): string
  createSrcSet(src: string, widths?: number[]): string
  lazyLoadImage(img: HTMLImageElement, options?): () => void
  preloadImage(src: string, options?): Promise<void>
  cacheImage(src: string, options?): Promise<void>
}

// React hook
export function useImageOptimizer(): ImageOptimizer
```

## Optimization Strategies

### 1. Code Splitting

The Vite configuration (`vite.config.ts`) implements granular code splitting:

```typescript
manualChunks: id => {
  // Vendor chunks
  if (id.includes('node_modules')) {
    if (id.includes('react') || id.includes('react-dom')) return 'vendor-react'
    if (id.includes('@tanstack/react-query')) return 'vendor-query'
    if (id.includes('@radix-ui')) return 'vendor-radix'
    if (id.includes('framer-motion')) return 'vendor-motion'
    if (id.includes('recharts')) return 'vendor-charts'
    // ... more vendor splits
  }
  
  // Page chunks
  if (id.includes('/pages/')) {
    if (id.includes('QAPage')) return 'page-qa'
    if (id.includes('FlashcardsPage')) return 'page-flashcards'
    // ... more page splits
  }
}
```

### 2. Image Optimization

- **Format Detection**: Automatic WebP/AVIF format detection
- **Responsive Images**: Dynamic srcset generation
- **Lazy Loading**: Intersection Observer-based lazy loading
- **Caching**: In-memory image cache with LRU eviction
- **Blur Placeholders**: Tiny blur placeholders for perceived performance

### 3. Resource Hints

- **Preconnect**: Early connection to API domain
- **DNS Prefetch**: Prefetch DNS for external domains
- **Prefetch**: Prefetch critical routes
- **Preload**: Preload critical assets

### 4. Performance Monitoring

- **Core Web Vitals**: FCP, LCP, FID, CLS monitoring
- **Custom Metrics**: TTFB, TTI, TBT, Speed Index
- **Performance Budget**: Automatic budget checking
- **Reporting**: Web Vitals reporting to analytics

## Bundle Analysis

### Current Bundle Structure

```
vendor-react.js       - React & ReactDOM
vendor-query.js       - TanStack Query
vendor-radix.js       - Radix UI components
vendor-motion.js      - Framer Motion
vendor-charts.js      - Recharts
vendor-sql.js         - SQL.js for database
vendor-pwa.js         - Workbox & Web Vitals
vendor.js             - Other dependencies
page-*.js             - Route-specific pages
components-*.js       - Component groups
hooks.js              - Custom hooks
utils.js              - Utility functions
```

### Optimization Techniques

1. **Tree Shaking**: Enabled via Vite's built-in tree shaking
2. **Dead Code Elimination**: Remove unused exports
3. **Minification**: Terser minification with aggressive settings
4. **Compression**: Gzip/Brotli compression
5. **Module Federation**: Shared dependencies

## Implementation Guide

### 1. Initialize Performance Monitoring

```typescript
import { initPerformanceOptimizations } from '@/utils/performance-v2'

// In your main entry point
initPerformanceOptimizations()
```

### 2. Lazy Load Components

```typescript
import { createLazyComponent } from '@/utils/lazy-v2'

const LazyDashboard = createLazyComponent(
  () => import('@/components/Dashboard'),
  { fallback: <DashboardSkeleton /> }
)
```

### 3. Optimize Images

```typescript
import { useImageOptimizer } from '@/utils/images-v2'

function OptimizedImage({ src, alt }) {
  const { optimizeUrl, createSrcSet } = useImageOptimizer()
  
  return (
    <img
      src={optimizeUrl(src, { width: 800, quality: 85 })}
      srcSet={createSrcSet(src, [320, 640, 960, 1280])}
      alt={alt}
      loading="lazy"
      decoding="async"
    />
  )
}
```

### 4. Monitor Performance

```typescript
import { usePerformanceMonitor, checkPerformanceBudget } from '@/utils/performance-v2'

function PerformanceDashboard() {
  const metrics = usePerformanceMonitor()
  const budget = checkPerformanceBudget(metrics)
  
  return (
    <div>
      <h2>Performance Score: {budget.score}</h2>
      {budget.violations.map(v => (
        <p key={v}>{v}</p>
      ))}
    </div>
  )
}
```

## Best Practices

### 1. Component Loading

- Use `React.lazy()` for route components
- Implement error boundaries for lazy components
- Show skeleton loaders during loading
- Preload critical components on hover/focus

### 2. Image Handling

- Use modern formats (WebP, AVIF)
- Implement responsive images
- Use blur placeholders for large images
- Lazy load below-the-fold images

### 3. JavaScript Optimization

- Avoid large inline scripts
- Use dynamic imports for heavy libraries
- Implement virtual scrolling for long lists
- Use web workers for heavy computations

### 4. CSS Optimization

- Use CSS-in-JS or CSS modules
- Avoid large CSS frameworks
- Implement critical CSS extraction
- Use CSS containment for complex layouts

## Monitoring & Analytics

### 1. Real User Monitoring (RUM)

```typescript
import { reportWebVitals } from '@/utils/performance-v2'

reportWebVitals()
```

### 2. Performance Budgets

```typescript
const budgets = {
  javascript: 200 * 1024, // 200KB
  css: 50 * 1024,         // 50KB
  images: 500 * 1024,     // 500KB
  fonts: 100 * 1024,      // 100KB
}
```

### 3. Lighthouse CI

Integrate Lighthouse CI in your CI/CD pipeline:

```yaml
# .github/workflows/lighthouse.yml
- name: Run Lighthouse
  uses: treosh/lighthouse-ci-action@v10
  with:
    configPath: './lighthouserc.js'
    uploadArtifacts: true
```

## Performance Checklist

### Before Deployment

- [ ] Bundle size < 200KB initial
- [ ] All images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading enabled
- [ ] Performance budget passed
- [ ] Lighthouse score > 90

### After Deployment

- [ ] Core Web Vitals monitored
- [ ] Real user metrics collected
- [ ] Performance alerts configured
- [ ] Regular performance audits

## Tools & Libraries

### Built-in Tools

1. **PerformanceMonitor**: Custom performance monitoring
2. **ImageOptimizer**: Image optimization and caching
3. **CodeSplitter**: Dynamic code splitting
4. **LazyLoad**: Component lazy loading

### External Tools

1. **Vite**: Build tool with built-in optimizations
2. **Rollup**: Module bundler with tree shaking
3. **Terser**: JavaScript minifier
4. **Workbox**: Service worker toolkit

## Future Optimizations

### Planned Improvements

1. **Edge Computing**: Move API calls to edge locations
2. **Service Workers**: Advanced caching strategies
3. **HTTP/3**: Protocol optimization
4. **WebAssembly**: Heavy computation in WASM
5. **GPU Acceleration**: CSS animations on GPU

### Experimental Features

1. **Speculative Loading**: ML-based route prefetching
2. **Adaptive Loading**: Network-aware optimizations
3. **Predictive Prefetching**: User behavior analysis

## Resources

### Documentation

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Performance Budget](https://web.dev/performance-budgets-101/)
- [Code Splitting](https://web.dev/reduce-javascript-payloads-with-code-splitting/)

### Tools

- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Bundlephobia](https://bundlephobia.com/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

**Performance Guru**: James Wilson
**Date**: 2026-03-22
**Version**: 2.0.0