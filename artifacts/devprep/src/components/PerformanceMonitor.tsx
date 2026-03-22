import React, { useEffect, useRef, useCallback } from 'react'
import {
  webVitalsTracker,
  WebVitalsMetrics,
  DEFAULT_THRESHOLDS,
  MOBILE_THRESHOLDS,
  scheduleIdleCallback,
  type Metric,
} from '@/utils/webVitals'

interface PerformanceMonitorProps {
  enabled?: boolean
  reportToConsole?: boolean
  reportToAnalytics?: boolean
  sampleRate?: number
  thresholds?: typeof DEFAULT_THRESHOLDS
}

interface PerformanceMetrics extends WebVitalsMetrics {
  userAgent: string
  viewport: { width: number; height: number }
  deviceMemory: number | null
  hardwareConcurrency: number
  connectionType: string | null
  serviceWorkerStatus: 'controlled' | 'supported' | 'unsupported'
}

const ANALYTICS_ENDPOINT = '/api/analytics/web-vitals'

export function PerformanceMonitor({
  enabled = true,
  reportToConsole = true,
  reportToAnalytics = false,
  sampleRate = 1,
  thresholds = DEFAULT_THRESHOLDS,
}: PerformanceMonitorProps) {
  const isInitialized = useRef(false)
  const isSubscribed = useRef(false)
  const analyticsTimeoutRef = useRef<number | null>(null)

  const getDeviceInfo = useCallback((): Partial<PerformanceMetrics> => {
    if (typeof window === 'undefined') {
      return {}
    }

    const nav = navigator as Navigator & {
      connection?: { effectiveType?: string; saveData?: boolean }
      deviceMemory?: number
    }

    const connection = nav.connection
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    return {
      userAgent: nav.userAgent,
      viewport,
      deviceMemory: nav.deviceMemory ?? null,
      hardwareConcurrency: nav.hardwareConcurrency,
      connectionType: connection?.effectiveType ?? null,
      serviceWorkerStatus: 'serviceWorker' in navigator ? 'controlled' : 'supported',
    }
  }, [])

  const shouldReport = useCallback((): boolean => {
    if (sampleRate >= 1) return true
    return Math.random() < sampleRate
  }, [sampleRate])

  const consoleReport = useCallback(
    (metric: Metric) => {
      const isMobile = window.innerWidth < 768
      const relevantThresholds = isMobile ? MOBILE_THRESHOLDS : thresholds
      const threshold =
        relevantThresholds[metric.name.toLowerCase() as keyof typeof relevantThresholds]

      const icon =
        metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌'

      console.group(`%c${icon} ${metric.name}`, getConsoleStyle(metric.rating))
      console.log('Value:', `${metric.value.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'}`)
      console.log('Rating:', metric.rating)
      console.log('Threshold:', threshold ?? 'N/A')
      console.log('Entries:', metric.entries)
      console.groupEnd()
    },
    [thresholds]
  )

  const getConsoleStyle = (rating: string): string => {
    switch (rating) {
      case 'good':
        return 'color: #10b981; font-weight: bold;'
      case 'needs-improvement':
        return 'color: #f59e0b; font-weight: bold;'
      case 'poor':
        return 'color: #ef4444; font-weight: bold;'
      default:
        return 'color: #6b7280; font-weight: bold;'
    }
  }

  const sendToAnalytics = useCallback(
    (metrics: PerformanceMetrics) => {
      if (!shouldReport()) return

      const payload = {
        ...metrics,
        environment: import.meta.env.PROD ? 'production' : 'development',
        timestamp: Date.now(),
      }

      if (import.meta.env.DEV) {
        console.log('[Analytics] Web Vitals Report:', payload)
        return
      }

      if (analyticsTimeoutRef.current) {
        clearTimeout(analyticsTimeoutRef.current)
      }

      analyticsTimeoutRef.current = window.setTimeout(async () => {
        try {
          const response = await fetch(ANALYTICS_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            keepalive: true,
          })

          if (!response.ok) {
            console.warn('[Analytics] Failed to send web vitals:', response.status)
          }
        } catch (error) {
          console.warn('[Analytics] Error sending web vitals:', error)
        }
      }, 1000)
    },
    [shouldReport]
  )

  const handleMetric = useCallback(
    (metric: Metric) => {
      if (reportToConsole) {
        consoleReport(metric)
      }

      if (reportToAnalytics) {
        const fullMetrics = webVitalsTracker.getMetrics()
        const deviceInfo = getDeviceInfo()
        sendToAnalytics({
          ...fullMetrics,
          ...deviceInfo,
        } as PerformanceMetrics)
      }
    },
    [reportToConsole, reportToAnalytics, consoleReport, sendToAnalytics, getDeviceInfo]
  )

  const handleFinalReport = useCallback(
    (metrics: WebVitalsMetrics) => {
      if (reportToAnalytics) {
        const deviceInfo = getDeviceInfo()
        sendToAnalytics({
          ...metrics,
          ...deviceInfo,
        } as PerformanceMetrics)
      }

      const report = webVitalsTracker.getThresholdsReport()
      if (reportToConsole) {
        console.log(
          '%c📊 Core Web Vitals Summary',
          'color: #8b5cf6; font-weight: bold; font-size: 14px;'
        )
        console.table(report)
      }
    },
    [reportToAnalytics, reportToConsole, getDeviceInfo, sendToAnalytics]
  )

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || isInitialized.current) {
      return
    }

    isInitialized.current = true

    const unsubscribe = webVitalsTracker.onMetric(handleMetric)

    if (!isSubscribed.current) {
      webVitalsTracker.onReport(handleFinalReport)
      isSubscribed.current = true
    }

    webVitalsTracker.start()

    const finalReportTimeout = setTimeout(() => {
      handleFinalReport(webVitalsTracker.getMetrics())
    }, 5000)

    return () => {
      unsubscribe()
      clearTimeout(finalReportTimeout)
      if (analyticsTimeoutRef.current) {
        clearTimeout(analyticsTimeoutRef.current)
      }
    }
  }, [enabled, handleMetric, handleFinalReport])

  return null
}

export function useLCP(): number | null {
  const lcpRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      lcpRef.current = lastEntry.startTime
    })

    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch {
      console.warn('LCP observer not supported')
    }

    return () => observer.disconnect()
  }, [])

  return lcpRef.current
}

export function useCLS(): number {
  const clsRef = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let cumulativeLayoutShift = 0

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const layoutEntry = entry as LayoutShift
        if (!layoutEntry.hadRecentInput) {
          cumulativeLayoutShift += layoutEntry.value
        }
      }
      clsRef.current = cumulativeLayoutShift
    })

    try {
      observer.observe({ type: 'layout-shift', buffered: true })
    } catch {
      console.warn('CLS observer not supported')
    }

    return () => observer.disconnect()
  }, [])

  return clsRef.current
}

export function useINP(): { value: number | null; isPending: boolean } {
  const inpRef = useRef<number | null>(null)
  const isPendingRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    let maxDuration = 0

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const eventEntry = entry as PerformanceEventTiming
        if (eventEntry.interactionId > 0) {
          const duration = eventEntry.duration
          if (duration > maxDuration) {
            maxDuration = duration
            inpRef.current = duration
          }
        }
      }
    })

    try {
      observer.observe({ type: 'event', buffered: true })
    } catch {
      console.warn('INP observer not supported')
    }

    return () => observer.disconnect()
  }, [])

  return { value: inpRef.current, isPending: isPendingRef.current }
}

export function useFirstInputDelay(): number | null {
  const fidRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries() as PerformanceEventTiming[]
      const firstEntry = entries[0]

      if (firstEntry && firstEntry.processingStart > 0) {
        fidRef.current = firstEntry.processingStart - firstEntry.startTime
      }
    })

    try {
      observer.observe({ type: 'first-input', buffered: true })
    } catch {
      console.warn('FID observer not supported')
    }

    return () => observer.disconnect()
  }, [])

  return fidRef.current
}

export function useTotalBlockingTime(): number {
  const tbtRef = useRef(0)
  const longTasksRef = useRef<number[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          longTasksRef.current.push(entry.duration - 50)
          tbtRef.current = longTasksRef.current.reduce((sum, duration) => sum + duration, 0)
        }
      }
    })

    try {
      observer.observe({ type: 'longtask', buffered: true })
    } catch {
      console.warn('Long task observer not supported')
    }

    return () => observer.disconnect()
  }, [])

  return tbtRef.current
}

export function useNetworkInformation() {
  const infoRef = useRef({
    effectiveType: 'unknown' as string | null,
    downlink: 0,
    rtt: 0,
    saveData: false,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const nav = navigator as Navigator & {
      connection?: {
        effectiveType?: string
        downlink?: number
        rtt?: number
        saveData?: boolean
        addEventListener: (type: string, listener: () => void) => void
        removeEventListener: (type: string, listener: () => void) => void
      }
    }

    const connection = nav.connection

    const updateConnectionInfo = () => {
      if (connection) {
        infoRef.current = {
          effectiveType: connection.effectiveType ?? null,
          downlink: connection.downlink ?? 0,
          rtt: connection.rtt ?? 0,
          saveData: connection.saveData ?? false,
        }
      }
    }

    if (connection) {
      updateConnectionInfo()
      connection.addEventListener('change', updateConnectionInfo)
    }

    return () => {
      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo)
      }
    }
  }, [])

  return infoRef.current
}

export function LazyPerformanceMonitor() {
  const [shouldMount, setShouldMount] = React.useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShouldMount(true)
    }, 100)

    return () => clearTimeout(timeout)
  }, [])

  if (!shouldMount) return null

  return (
    <PerformanceMonitor
      reportToConsole={import.meta.env.DEV}
      reportToAnalytics={import.meta.env.PROD}
    />
  )
}

export default PerformanceMonitor
