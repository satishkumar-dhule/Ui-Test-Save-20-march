/**
 * Performance Utilities v2
 * Optimized performance monitoring and optimization tools
 */

import { useEffect, useRef, useState } from 'react'

// Performance metrics interface
export interface PerformanceMetrics {
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte
  tti: number // Time to Interactive
  tbt: number // Total Blocking Time
  si: number // Speed Index
}

// Performance thresholds for Lighthouse 90+
export const PERFORMANCE_THRESHOLDS = {
  fcp: 1800, // ms
  lcp: 2500, // ms
  fid: 100, // ms
  cls: 0.1, // unitless
  ttfb: 800, // ms
  tti: 3800, // ms
  tbt: 200, // ms
  si: 3400, // ms
} as const

// Performance monitoring class
export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {}
  private observers: PerformanceObserver[] = []
  private startTime: number = performance.now()

  constructor() {
    this.initializeObservers()
  }

  private initializeObservers(): void {
    // Only run in browser environment
    if (typeof window === 'undefined') return

    // Observe paint metrics
    if ('PerformanceObserver' in window) {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime
          }
        }
      })
      paintObserver.observe({ entryTypes: ['paint'] })
      this.observers.push(paintObserver)

      // Observe LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.lcp = lastEntry.startTime
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(lcpObserver)

      // Observe FID
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any
          this.metrics.fid = fidEntry.processingStart - fidEntry.startTime
        }
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.push(fidObserver)

      // Observe CLS
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const clsEntry = entry as any
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value
          }
        }
        this.metrics.cls = clsValue
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(clsObserver)
    }
  }

  // Get current metrics
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics }
  }

  // Calculate Time to First Byte
  getTTFB(): number {
    if (typeof window === 'undefined') return 0
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return navTiming ? navTiming.responseStart - navTiming.requestStart : 0
  }

  // Calculate Time to Interactive (simplified)
  getTTI(): number {
    return performance.now() - this.startTime
  }

  // Calculate Total Blocking Time
  getTBT(): number {
    const longTasks = performance.getEntriesByType('longtask')
    let tbt = 0
    for (const task of longTasks) {
      if (task.duration > 50) {
        tbt += task.duration - 50
      }
    }
    return tbt
  }

  // Cleanup observers
  disconnect(): void {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers = []
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({})
  const monitorRef = useRef<PerformanceMonitor | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    monitorRef.current = new PerformanceMonitor()
    
    const interval = setInterval(() => {
      if (monitorRef.current) {
        const currentMetrics = monitorRef.current.getMetrics()
        setMetrics({
          ...currentMetrics,
          ttfb: monitorRef.current.getTTFB(),
          tti: monitorRef.current.getTTI(),
          tbt: monitorRef.current.getTBT(),
        })
      }
    }, 1000)

    return () => {
      clearInterval(interval)
      if (monitorRef.current) {
        monitorRef.current.disconnect()
      }
    }
  }, [])

  return metrics
}

// Bundle analysis utilities
export function analyzeBundleSize(): {
  total: number
  gzipped: number
  chunks: Array<{ name: string; size: number }>
} {
  // This would typically use webpack-bundle-analyzer or similar
  // For now, return placeholder data
  return {
    total: 0,
    gzipped: 0,
    chunks: [],
  }
}

// Tree shaking checker
export function checkTreeShaking(moduleName: string): boolean {
  // Check if module is properly tree-shakeable
  const module = (window as any).__webpack_modules__?.[moduleName]
  return module ? module.exports && typeof module.exports === 'object' : false
}

// Image optimization utilities
export function optimizeImage(
  src: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'jpeg' | 'png'
  } = {}
): string {
  const { width, height, quality = 80, format = 'webp' } = options
  
  // Return optimized image URL
  const params = new URLSearchParams()
  if (width) params.set('w', width.toString())
  if (height) params.set('h', height.toString())
  params.set('q', quality.toString())
  params.set('f', format)
  
  return `${src}?${params.toString()}`
}

// Resource hints
export function addResourceHints(): void {
  if (typeof document === 'undefined') return
  
  // Preconnect to API domain
  const preconnect = document.createElement('link')
  preconnect.rel = 'preconnect'
  preconnect.href = window.location.origin
  document.head.appendChild(preconnect)
  
  // DNS prefetch for external domains
  const domains = ['fonts.googleapis.com', 'fonts.gstatic.com']
  domains.forEach(domain => {
    const dnsPrefetch = document.createElement('link')
    dnsPrefetch.rel = 'dns-prefetch'
    dnsPrefetch.href = `https://${domain}`
    document.head.appendChild(dnsPrefetch)
  })
}

// Critical CSS extraction
export function extractCriticalCSS(): string {
  if (typeof document === 'undefined') return ''
  
  const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
  let criticalCSS = ''
  
  styles.forEach(style => {
    if (style.textContent) {
      // Extract above-the-fold CSS
      const css = style.textContent
      // Simple heuristic: first 5KB of CSS is likely critical
      criticalCSS += css.substring(0, 5000)
    }
  })
  
  return criticalCSS
}

// Performance budget checker
export function checkPerformanceBudget(metrics: Partial<PerformanceMetrics>): {
  passed: boolean
  violations: string[]
  score: number
} {
  const violations: string[] = []
  let score = 100
  
  Object.entries(PERFORMANCE_THRESHOLDS).forEach(([metric, threshold]) => {
    const value = metrics[metric as keyof PerformanceMetrics]
    if (value !== undefined && value > threshold) {
      violations.push(`${metric}: ${value}ms (threshold: ${threshold}ms)`)
      score -= 10
    }
  })
  
  return {
    passed: violations.length === 0,
    violations,
    score: Math.max(0, score),
  }
}

// Lazy load images
export function lazyLoadImages(): void {
  if (typeof IntersectionObserver === 'undefined') return
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        if (img.dataset.src) {
          img.src = img.dataset.src
          img.removeAttribute('data-src')
          imageObserver.unobserve(img)
        }
      }
    })
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01,
  })
  
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img)
  })
}

// Prefetch routes
export function prefetchRoute(route: string): void {
  if (typeof document === 'undefined') return
  
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = route
  document.head.appendChild(link)
}

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function (this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Memory usage monitoring
export function getMemoryUsage(): {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
} {
  if (typeof performance === 'undefined' || !(performance as any).memory) {
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    }
  }
  
  const memory = (performance as any).memory
  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
  }
}

// Core Web Vitals reporting
export function reportWebVitals(): void {
  if (typeof window === 'undefined') return
  
  // Report to analytics
  const monitor = new PerformanceMonitor()
  
  // Send metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      const metrics = monitor.getMetrics()
      const ttfb = monitor.getTTFB()
      const tti = monitor.getTTI()
      const tbt = monitor.getTBT()
      
      const fullMetrics = {
        ...metrics,
        ttfb,
        tti,
        tbt,
      }
      
      // Log to console for development
      console.log('Performance Metrics:', fullMetrics)
      
      // In production, send to analytics service
      if (process.env.NODE_ENV === 'production') {
        // Example: send to analytics
        // navigator.sendBeacon('/api/analytics', JSON.stringify(fullMetrics))
      }
      
      monitor.disconnect()
    }, 1000)
  })
}

// Initialize performance optimizations
export function initPerformanceOptimizations(): void {
  if (typeof window === 'undefined') return
  
  // Add resource hints
  addResourceHints()
  
  // Lazy load images
  lazyLoadImages()
  
  // Report web vitals
  reportWebVitals()
  
  // Prefetch critical routes
  const criticalRoutes = ['/dashboard', '/settings', '/profile']
  criticalRoutes.forEach(prefetchRoute)
}