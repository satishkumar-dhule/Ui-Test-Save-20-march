export interface WebVitalsMetrics {
  lcp: number | null
  lcpCandidate: string | null
  fid: number | null
  cls: number
  fcp: number | null
  ttfb: number | null
  inp: number | null
  totalBlockingTime: number
  navigationType: string
  timestamp: number
}

export interface VitalThresholds {
  lcp: number
  fid: number
  cls: number
  fcp: number
  ttfb: number
  inp: number
}

export const DEFAULT_THRESHOLDS: VitalThresholds = {
  lcp: 2500,
  fid: 100,
  cls: 0.1,
  fcp: 1800,
  ttfb: 800,
  inp: 200,
}

export const MOBILE_THRESHOLDS: VitalThresholds = {
  lcp: 4000,
  fid: 200,
  cls: 0.2,
  fcp: 3000,
  ttfb: 1200,
  inp: 300,
}

export type MetricCallback = (metric: Metric) => void
type ReportCallback = (metrics: WebVitalsMetrics) => void

export interface Metric {
  name: string
  value: number
  delta: number
  id: string
  entries: PerformanceEntry[]
  rating: 'good' | 'needs-improvement' | 'poor'
  navigationType?: string
}

class WebVitalsTracker {
  private metrics: WebVitalsMetrics = {
    lcp: null,
    lcpCandidate: null,
    fid: null,
    cls: 0,
    fcp: null,
    ttfb: null,
    inp: null,
    totalBlockingTime: 0,
    navigationType: 'navigate',
    timestamp: Date.now(),
  }

  private observers: PerformanceObserver[] = []
  private callbacks: MetricCallback[] = []
  private reportCallback: ReportCallback | null = null
  private isTracking = false
  private pendingTasks: (() => void)[] = []
  private longTasks: number[] = []

  private isMobile(): boolean {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent)
  }

  private getThresholds(): VitalThresholds {
    return this.isMobile() ? MOBILE_THRESHOLDS : DEFAULT_THRESHOLDS
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = this.getThresholds()
    const threshold = thresholds[name as keyof VitalThresholds]
    if (!threshold) return 'good'
    if (value <= threshold * 0.6) return 'good'
    if (value <= threshold) return 'needs-improvement'
    return 'poor'
  }

  private scheduleCallback(callback: () => void): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: 2000 })
    } else {
      setTimeout(callback, 1)
    }
  }

  private processLongTask(entry: PerformanceEntry): void {
    if (entry.duration > 50) {
      this.longTasks.push(entry.duration - 50)
    }
  }

  private calculateTBT(): number {
    return this.longTasks.reduce((sum, duration) => sum + duration, 0)
  }

  observeLCP(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        element?: string | Element
        size?: number
      }

      if (lastEntry) {
        this.metrics.lcp = lastEntry.startTime
        this.metrics.lcpCandidate = lastEntry.element?.toString() ?? null

        const metric: Metric = {
          name: 'LCP',
          value: lastEntry.startTime,
          delta: lastEntry.startTime,
          id: `lcp-${Date.now()}`,
          entries: [lastEntry],
          rating: this.getRating('lcp', lastEntry.startTime),
          navigationType: this.metrics.navigationType,
        }

        this.notifyCallbacks(metric)
      }
    })

    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
      this.observers.push(observer)
    } catch {
      console.warn('LCP observation failed')
    }
  }

  observeFID(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries() as PerformanceEventTiming[]
      const firstEntry = entries[0]

      if (firstEntry && firstEntry.processingStart > 0) {
        const fid = firstEntry.processingStart - firstEntry.startTime
        this.metrics.fid = fid

        const metric: Metric = {
          name: 'FID',
          value: fid,
          delta: fid,
          id: `fid-${Date.now()}`,
          entries: [firstEntry],
          rating: this.getRating('fid', fid),
          navigationType: this.metrics.navigationType,
        }

        this.notifyCallbacks(metric)
      }
    })

    try {
      observer.observe({ type: 'first-input', buffered: true })
      this.observers.push(observer)
    } catch {
      console.warn('FID observation failed')
    }
  }

  observeCLS(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    let cumulativeLayoutShift = 0
    let lastEntry: PerformanceEntry | null = null

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const layoutEntry = entry as LayoutShift

        if (!layoutEntry.hadRecentInput) {
          cumulativeLayoutShift += layoutEntry.value

          const metric: Metric = {
            name: 'CLS',
            value: cumulativeLayoutShift,
            delta: layoutEntry.value,
            id: `cls-${Date.now()}`,
            entries: [entry],
            rating: this.getRating('cls', cumulativeLayoutShift),
            navigationType: this.metrics.navigationType,
          }

          this.metrics.cls = cumulativeLayoutShift
          lastEntry = entry
          this.notifyCallbacks(metric)
        }
      }
    })

    try {
      observer.observe({ type: 'layout-shift', buffered: true })
      this.observers.push(observer)
    } catch {
      console.warn('CLS observation failed')
    }
  }

  observeFCP(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries()
      const fcpEntry = entries.find(e => e.name === 'first-contentful-paint')

      if (fcpEntry) {
        this.metrics.fcp = fcpEntry.startTime

        const metric: Metric = {
          name: 'FCP',
          value: fcpEntry.startTime,
          delta: fcpEntry.startTime,
          id: `fcp-${Date.now()}`,
          entries: [fcpEntry],
          rating: this.getRating('fcp', fcpEntry.startTime),
          navigationType: this.metrics.navigationType,
        }

        this.notifyCallbacks(metric)
        observer.disconnect()
      }
    })

    try {
      observer.observe({ type: 'paint', buffered: true })
      this.observers.push(observer)
    } catch {
      console.warn('FCP observation failed')
    }
  }

  observeTTFB(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries()
      const navigationEntry = entries.find(
        e => e.entryType === 'navigation'
      ) as PerformanceNavigationTiming

      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart
        this.metrics.ttfb = ttfb

        const metric: Metric = {
          name: 'TTFB',
          value: ttfb,
          delta: ttfb,
          id: `ttfb-${Date.now()}`,
          entries: [navigationEntry],
          rating: this.getRating('ttfb', ttfb),
          navigationType: navigationEntry.type,
        }

        this.metrics.navigationType = navigationEntry.type
        this.notifyCallbacks(metric)
      }
    })

    try {
      observer.observe({ type: 'navigation', buffered: true })
      this.observers.push(observer)
    } catch {
      console.warn('TTFB observation failed')
    }
  }

  observeLongTasks(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        this.processLongTask(entry)
      }
      this.metrics.totalBlockingTime = this.calculateTBT()
    })

    try {
      observer.observe({ type: 'longtask', buffered: true })
      this.observers.push(observer)
    } catch {
      console.warn('Long task observation not supported')
    }
  }

  observeINP(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    let maxINP = 0

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const eventEntry = entry as PerformanceEventTiming

        if (eventEntry.interactionId > 0) {
          const duration = eventEntry.duration
          if (duration > maxINP) {
            maxINP = duration
            this.metrics.inp = duration

            const metric: Metric = {
              name: 'INP',
              value: duration,
              delta: duration,
              id: `inp-${Date.now()}`,
              entries: [entry],
              rating: this.getRating('inp', duration),
              navigationType: this.metrics.navigationType,
            }

            this.notifyCallbacks(metric)
          }
        }
      }
    })

    try {
      observer.observe({ type: 'event', buffered: true })
      this.observers.push(observer)
    } catch {
      console.warn('INP observation failed')
    }
  }

  private notifyCallbacks(metric: Metric): void {
    for (const callback of this.callbacks) {
      this.scheduleCallback(() => callback(metric))
    }
  }

  onMetric(callback: MetricCallback): () => void {
    this.callbacks.push(callback)
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback)
    }
  }

  onReport(callback: ReportCallback): void {
    this.reportCallback = callback
  }

  start(): void {
    if (this.isTracking || typeof window === 'undefined') return
    this.isTracking = true

    this.observeTTFB()
    this.observeLCP()
    this.observeFCP()
    this.observeCLS()
    this.observeFID()
    this.observeLongTasks()
    this.observeINP()

    this.scheduleCallback(() => {
      this.metrics.totalBlockingTime = this.calculateTBT()
      if (this.reportCallback) {
        this.reportCallback(this.getMetrics())
      }
    })
  }

  stop(): void {
    for (const observer of this.observers) {
      observer.disconnect()
    }
    this.observers = []
    this.isTracking = false
  }

  getMetrics(): WebVitalsMetrics {
    return {
      ...this.metrics,
      totalBlockingTime: this.calculateTBT(),
      timestamp: Date.now(),
    }
  }

  getThresholdsReport(): { name: string; value: number; rating: string }[] {
    const metrics = this.getMetrics()
    const thresholds = this.getThresholds()

    return [
      { name: 'LCP', value: metrics.lcp ?? 0, rating: this.getRating('lcp', metrics.lcp ?? 0) },
      { name: 'FID', value: metrics.fid ?? 0, rating: this.getRating('fid', metrics.fid ?? 0) },
      { name: 'CLS', value: metrics.cls, rating: this.getRating('cls', metrics.cls) },
      { name: 'FCP', value: metrics.fcp ?? 0, rating: this.getRating('fcp', metrics.fcp ?? 0) },
      { name: 'TTFB', value: metrics.ttfb ?? 0, rating: this.getRating('ttfb', metrics.ttfb ?? 0) },
      { name: 'INP', value: metrics.inp ?? 0, rating: this.getRating('inp', metrics.inp ?? 0) },
      {
        name: 'TBT',
        value: metrics.totalBlockingTime,
        rating: metrics.totalBlockingTime < 200 ? 'good' : 'needs-improvement',
      },
    ]
  }
}

export const webVitalsTracker = new WebVitalsTracker()

export function reportWebVitals(): Promise<WebVitalsMetrics> {
  return new Promise(resolve => {
    const metrics = webVitalsTracker.getMetrics()
    if (metrics.lcp !== null) {
      resolve(metrics)
    } else {
      webVitalsTracker.onReport(m => {
        resolve(m)
      })
    }
  })
}

export function getNavigationTiming(): PerformanceNavigationTiming | null {
  if (typeof window === 'undefined') return null
  const entries = performance.getEntriesByType('navigation')
  return entries.length > 0 ? (entries[0] as PerformanceNavigationTiming) : null
}

export function getResourceTiming(): PerformanceResourceTiming[] {
  if (typeof window === 'undefined') return []
  return performance.getEntriesByType('resource') as PerformanceResourceTiming[]
}

export function measureAsyncOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
  const startMark = `${name}-start`
  const endMark = `${name}-end`

  return new Promise(async (resolve, reject) => {
    try {
      if (typeof performance !== 'undefined' && 'mark' in performance) {
        performance.mark(startMark)
      }

      const result = await operation()

      if (typeof performance !== 'undefined' && 'mark' in performance) {
        performance.mark(endMark)
        performance.measure(name, startMark, endMark)
      }

      resolve(result)
    } catch (error) {
      reject(error)
    }
  })
}

export function scheduleIdleCallback(callback: () => void, options?: { timeout?: number }): number {
  if (typeof window === 'undefined') {
    setTimeout(callback, 1)
    return 0
  }

  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options)
  }

  const timeoutId = setTimeout(callback, options?.timeout ?? 50)
  return -timeoutId
}

export function cancelIdleCallback(id: number): void {
  if (typeof window === 'undefined') return

  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id)
  } else if (id < 0) {
    clearTimeout(-id)
  }
}

export function breakLongTask(threshold = 50): Promise<void> {
  return new Promise(resolve => {
    scheduleIdleCallback(() => resolve(), { timeout: threshold })
  })
}
