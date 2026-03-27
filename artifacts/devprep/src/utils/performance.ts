/**
 * Performance monitoring utilities for DevPrep UI
 *
 * Provides:
 * - Web Vitals tracking
 * - Component render performance
 * - Image loading optimization
 * - Bundle loading metrics
 * - Resource timing analysis
 * - Intersection observer helpers
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

// Performance metric types
export interface PerformanceMetrics {
  cls: number
  fcp: number
  inp: number
  lcp: number
  ttfb: number
}

// Performance observer configuration
export interface PerformanceObserverConfig {
  buffered: boolean
  type: 'resource' | 'mark' | 'measure' | 'paint' | 'longtask' | 'layout-shift'
}

/**
 * Core performance monitoring class
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Partial<PerformanceMetrics> = {}
  private observers: PerformanceObserver[] = []
  private callbacks: Map<string, ((metric: Metric) => void)[]> = new Map()

  private constructor() {
    this.initWebVitals()
    this.initPerformanceObserver()
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Initialize Web Vitals monitoring
   */
  private initWebVitals(): void {
    const handleMetric = (metric: Metric) => {
      this.metrics[metric.name as keyof PerformanceMetrics] = metric.value

      // Call registered callbacks
      const metricCallbacks = this.callbacks.get(metric.name)
      if (metricCallbacks) {
        metricCallbacks.forEach(callback => callback(metric))
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${metric.name}:`, metric.value)
      }
    }

    onCLS(handleMetric)
    onFCP(handleMetric)
    onINP(handleMetric)
    onLCP(handleMetric)
    onTTFB(handleMetric)
  }

  /**
   * Initialize Performance Observer for resource timing
   */
  private initPerformanceObserver(): void {
    try {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          this.handlePerformanceEntry(entry)
        })
      })

      observer.observe({ entryTypes: ['resource', 'paint', 'longtask'] })
      this.observers.push(observer)
    } catch (error) {
      console.warn('[Performance] PerformanceObserver not supported:', error)
    }
  }

  /**
   * Handle performance entries
   */
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    if (entry.entryType === 'resource') {
      this.analyzeResourceTiming(entry as PerformanceResourceTiming)
    } else if (entry.entryType === 'longtask') {
      console.warn('[Performance] Long task detected:', entry)
    }
  }

  /**
   * Analyze resource loading performance
   */
  private analyzeResourceTiming(entry: PerformanceResourceTiming): void {
    const loadTime = entry.responseEnd - entry.requestStart

    if (loadTime > 1000) {
      console.warn(`[Performance] Slow resource loaded in ${loadTime.toFixed(2)}ms:`, entry.name)
    }
  }

  /**
   * Register callback for specific metric
   */
  onMetric(metricName: string, callback: (metric: Metric) => void): () => void {
    if (!this.callbacks.has(metricName)) {
      this.callbacks.set(metricName, [])
    }
    this.callbacks.get(metricName)!.push(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.callbacks.get(metricName)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics }
  }

  /**
   * Measure component render time
   */
  measureRender(componentName: string, renderFn: () => void): void {
    const startMark = `${componentName}-start`
    const endMark = `${componentName}-end`
    const measureName = `${componentName}-render`

    performance.mark(startMark)
    renderFn()
    performance.mark(endMark)
    performance.measure(measureName, startMark, endMark)

    const measures = performance.getEntriesByName(measureName)
    if (measures.length > 0) {
      const duration = measures[0].duration
      if (duration > 16) {
        // 60fps threshold
        console.warn(`[Performance] Slow render: ${componentName} took ${duration.toFixed(2)}ms`)
      }
    }

    // Clean up
    performance.clearMarks(startMark)
    performance.clearMarks(endMark)
    performance.clearMeasures(measureName)
  }

  /**
   * Create a performance mark
   */
  mark(name: string): void {
    performance.mark(name)
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark: string): void {
    performance.measure(name, startMark, endMark)
  }

  /**
   * Get all performance entries
   */
  getEntries(): PerformanceEntry[] {
    return performance.getEntries()
  }

  /**
   * Clean up observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

/**
 * React hook for monitoring component performance
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0)
  const lastRenderTime = useRef(0)

  useEffect(() => {
    renderCount.current += 1
    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      lastRenderTime.current = renderTime

      if (renderTime > 16) {
        console.warn(
          `[Performance] ${componentName} render #${renderCount.current} took ${renderTime.toFixed(2)}ms`
        )
      }
    }
  })
}

/**
 * Intersection observer hook for lazy loading
 */
export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = React.useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [ref, options])

  return isIntersecting
}

/**
 * Image loading optimization utilities
 */
export class ImageOptimizer {
  private static observer: IntersectionObserver | null = null
  private static images: Set<HTMLImageElement> = new Set()

  /**
   * Lazy load images with intersection observer
   */
  static lazyLoad(img: HTMLImageElement, src: string, placeholder?: string): void {
    if (!this.observer) {
      this.observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const image = entry.target as HTMLImageElement
              if (image.dataset.src) {
                image.src = image.dataset.src
                image.removeAttribute('data-src')
                this.observer?.unobserve(image)
                this.images.delete(image)
              }
            }
          })
        },
        {
          rootMargin: '100px',
          threshold: 0.01,
        }
      )
    }

    if (placeholder) {
      img.src = placeholder
    }
    img.dataset.src = src
    this.observer.observe(img)
    this.images.add(img)
  }

  /**
   * Preload critical images
   */
  static preload(urls: string[]): void {
    urls.forEach(url => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      document.head.appendChild(link)
    })
  }

  /**
   * Get image loading statistics
   */
  static getStats(): { total: number; loaded: number } {
    const total = this.images.size
    let loaded = 0

    this.images.forEach(img => {
      if (img.complete && img.naturalWidth > 0) {
        loaded++
      }
    })

    return { total, loaded }
  }
}

/**
 * Bundle loading utilities
 */
export class BundleOptimizer {
  private static loadTimes: Map<string, number> = new Map()

  /**
   * Track bundle loading time
   */
  static trackLoad(bundleName: string): () => void {
    const startTime = performance.now()
    return () => {
      const loadTime = performance.now() - startTime
      this.loadTimes.set(bundleName, loadTime)

      if (loadTime > 1000) {
        console.warn(`[Performance] Slow bundle load: ${bundleName} took ${loadTime.toFixed(2)}ms`)
      }
    }
  }

  /**
   * Get bundle loading statistics
   */
  static getStats(): { bundle: string; time: number }[] {
    return Array.from(this.loadTimes.entries()).map(([bundle, time]) => ({
      bundle,
      time,
    }))
  }

  /**
   * Preload critical bundles
   */
  static preloadBundles(bundles: string[]): void {
    bundles.forEach(bundle => {
      const link = document.createElement('link')
      link.rel = 'modulepreload'
      link.href = bundle
      document.head.appendChild(link)
    })
  }
}

/**
 * Resource timing analysis
 */
export function analyzeResourceTiming(): {
  slowResources: PerformanceResourceTiming[]
  totalLoadTime: number
  resourceCount: number
} {
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  const slowResources = resources.filter(resource => {
    const loadTime = resource.responseEnd - resource.requestStart
    return loadTime > 1000
  })

  const totalLoadTime = resources.reduce((total, resource) => {
    return total + (resource.responseEnd - resource.requestStart)
  }, 0)

  return {
    slowResources,
    totalLoadTime,
    resourceCount: resources.length,
  }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout
  return ((...args: unknown[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: unknown[]) => void>(func: T, limit: number): T {
  let inThrottle = false
  return ((...args: unknown[]) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }) as T
}

/**
 * Request animation frame wrapper
 */
export function raf(callback: () => void): number {
  return requestAnimationFrame(callback)
}

/**
 * Cancel animation frame wrapper
 */
export function cancelRaf(id: number): void {
  cancelAnimationFrame(id)
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
} | null {
  // @ts-expect-error - performance.memory is not in standard types
  if (performance.memory) {
    // @ts-expect-error - performance.memory is non-standard
    const memory = performance.memory
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    }
  }
  return null
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// ============================================================================
// React Hooks for Performance Optimization (consolidated from perf-utils)
// ============================================================================

export interface DebouncedValue<T> {
  value: T
  isPending: boolean
}

export function useDebounce<T>(value: T, delay: number): DebouncedValue<T> {
  const [debouncedValue, setDebouncedValue] = useState(value)
  const [isPending, setIsPending] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef(false)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (!pendingRef.current && value !== debouncedValue) {
      setIsPending(true)
      pendingRef.current = true
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
      setIsPending(false)
      pendingRef.current = false
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay, debouncedValue])

  return { value: debouncedValue, isPending }
}

type AnyFunction = (...args: never[]) => unknown

export function useDebouncedCallback<T extends AnyFunction>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState(value)
  const lastExecuted = useRef<number>(Date.now())

  useEffect(() => {
    const now = Date.now()
    const timeSinceLastExecution = now - lastExecuted.current

    if (timeSinceLastExecution >= interval) {
      lastExecuted.current = now
      setThrottledValue(value)
      return
    }
    const timerId = setTimeout(() => {
      lastExecuted.current = Date.now()
      setThrottledValue(value)
    }, interval - timeSinceLastExecution)

    return () => clearTimeout(timerId)
  }, [value, interval])

  return throttledValue
}

export function useThrottledCallback<T extends AnyFunction>(
  callback: T,
  interval: number
): (...args: Parameters<T>) => void {
  const lastExecuted = useRef<number>(0)
  const pendingArgs = useRef<Parameters<T> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastExecution = now - lastExecuted.current

      if (timeSinceLastExecution >= interval) {
        lastExecuted.current = now
        callback(...args)
      } else {
        pendingArgs.current = args
        if (!timeoutRef.current) {
          timeoutRef.current = setTimeout(() => {
            if (pendingArgs.current) {
              lastExecuted.current = Date.now()
              callback(...pendingArgs.current)
              pendingArgs.current = null
            }
            timeoutRef.current = null
          }, interval - timeSinceLastExecution)
        }
      }
    },
    [callback, interval]
  )
}

export function useMemoCompare<T>(value: T, compare: (prev: T | undefined, next: T) => boolean): T {
  const prevRef = useRef<T | undefined>(undefined)
  const prev = prevRef.current

  const isEqual = useMemo(() => compare(prev, value), [prev, value, compare])

  const memoizedValue = useMemo(() => {
    if (!isEqual) {
      prevRef.current = value
    }
    return isEqual && prev !== undefined ? prev : value
  }, [value, isEqual, prev])

  return memoizedValue
}

export function useStableMemo<T>(factory: () => T, deps: unknown[]): T {
  const depsRef = useRef(deps)
  const valueRef = useRef<T | null>(null)

  const depsChanged = deps.some((dep, i) => !Object.is(dep, depsRef.current[i]))

  if (depsChanged || valueRef.current === null) {
    depsRef.current = deps
    valueRef.current = factory()
  }

  return valueRef.current
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined as unknown as T)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

export function useCreation<T>(factory: () => T, deps: unknown[]): T {
  const { current } = useRef<{ deps: unknown[]; value: T }>({
    deps: [],
    value: factory(),
  })

  if (deps.some((dep, i) => !Object.is(dep, current.deps[i]))) {
    current.deps = deps
    current.value = factory()
  }

  return current.value
}
