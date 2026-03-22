/**
 * Route Prefetcher
 *
 * Intelligent route prefetching based on:
 * - User hover intent
 * - Analytics predictions
 * - Idle time
 * - Navigation patterns
 */

import { useEffect, useCallback, useRef, type ComponentType, type ReactNode } from 'react'
import { LAZY_ROUTE_CONFIGS, LAZY_COMPONENTS, type LazyRouteKey } from './lazy-routes'

type PrefetchStrategy = 'hover' | 'idle' | 'prediction' | 'immediate'

interface PrefetchOptions {
  strategy?: PrefetchStrategy
  priority?: 'high' | 'medium' | 'low'
  timeout?: number
}

const PREFETCH_TIMEOUT = 5000

const CRITICAL_ROUTES: LazyRouteKey[] = ['QAPage', 'FlashcardsPage']

interface PrefetchState {
  loaded: Set<LazyRouteKey>
  loading: Set<LazyRouteKey>
  errors: Map<LazyRouteKey, Error>
}

const prefetchState: PrefetchState = {
  loaded: new Set(),
  loading: new Set(),
  errors: new Map(),
}

export function getPrefetchState(): Readonly<PrefetchState> {
  return prefetchState
}

export function isRouteLoaded(route: LazyRouteKey): boolean {
  return prefetchState.loaded.has(route)
}

export function isRouteLoading(route: LazyRouteKey): boolean {
  return prefetchState.loading.has(route)
}

export async function prefetchRoute(route: LazyRouteKey): Promise<void> {
  if (prefetchState.loaded.has(route) || prefetchState.loading.has(route)) {
    return
  }

  const config = LAZY_ROUTE_CONFIGS[route]
  if (!config) {
    console.warn(`[RoutePrefetcher] Unknown route: ${route}`)
    return
  }

  prefetchState.loading.add(route)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), PREFETCH_TIMEOUT)

    await config.importFn()

    clearTimeout(timeoutId)
    prefetchState.loaded.add(route)
    prefetchState.loading.delete(route)

    if (import.meta.env.DEV) {
      console.log(`[RoutePrefetcher] Prefetched: ${route}`)
    }
  } catch (error) {
    prefetchState.loading.delete(route)
    prefetchState.errors.set(route, error as Error)

    if (import.meta.env.DEV) {
      console.error(`[RoutePrefetcher] Failed to prefetch: ${route}`, error)
    }
  }
}

export function preloadRoute(route: LazyRouteKey): void {
  prefetchRoute(route).catch(() => {})
}

export function preloadCriticalRoutes(): void {
  CRITICAL_ROUTES.forEach(route => preloadRoute(route))
}

export function preloadAllRoutes(): void {
  Object.keys(LAZY_ROUTE_CONFIGS).forEach(route => {
    const config = LAZY_ROUTE_CONFIGS[route as LazyRouteKey]
    if (config.priority !== 'low') {
      preloadRoute(route as LazyRouteKey)
    }
  })
}

export function usePrefetch(route: LazyRouteKey, options: PrefetchOptions = {}) {
  const { strategy = 'hover' } = options
  const prefetchedRef = useRef(false)

  useEffect(() => {
    if (strategy === 'immediate' && !prefetchedRef.current) {
      prefetchedRef.current = true
      preloadRoute(route)
    }
  }, [route, strategy])

  const handleMouseEnter = useCallback(() => {
    if (strategy === 'hover' && !prefetchedRef.current) {
      prefetchedRef.current = true
      preloadRoute(route)
    }
  }, [route, strategy])

  return { handleMouseEnter, preload: () => preloadRoute(route) }
}

export function PrefetchOnHover({ route, children }: { route: LazyRouteKey; children: ReactNode }) {
  const { handleMouseEnter } = usePrefetch(route, { strategy: 'hover' })

  return (
    <div onMouseEnter={handleMouseEnter} data-prefetch-route={route}>
      {children}
    </div>
  )
}

export function PrefetchLink({
  route,
  onClick,
  children,
  className,
  ...props
}: {
  route: LazyRouteKey
  onClick?: () => void
  children: ReactNode
  className?: string
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { handleMouseEnter, preload } = usePrefetch(route, { strategy: 'hover' })

  const handleClick = useCallback(() => {
    preload()
    onClick?.()
  }, [preload, onClick])

  return (
    <a
      href={`#${route.toLowerCase()}`}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </a>
  )
}

let idleCallbackId: number | null = null

export function requestIdlePrefetch(): void {
  if (typeof requestIdleCallback !== 'undefined') {
    idleCallbackId = requestIdleCallback(
      () => {
        prefetchHighPriorityRoutes()
      },
      { timeout: 10000 }
    )
  } else {
    setTimeout(prefetchHighPriorityRoutes, 2000)
  }
}

function prefetchHighPriorityRoutes(): void {
  Object.entries(LAZY_ROUTE_CONFIGS)
    .filter(([, config]) => config.prefetchOnIdle && config.priority !== 'low')
    .forEach(([route]) => {
      preloadRoute(route as LazyRouteKey)
    })
}

export function cancelIdlePrefetch(): void {
  if (idleCallbackId !== null && typeof cancelIdleCallback !== 'undefined') {
    cancelIdleCallback(idleCallbackId)
    idleCallbackId = null
  }
}

interface PredictionRule {
  currentRoute: LazyRouteKey
  predictedRoutes: Array<{ route: LazyRouteKey; probability: number }>
}

const PREDICTION_RULES: PredictionRule[] = [
  { currentRoute: 'QAPage', predictedRoutes: [{ route: 'FlashcardsPage', probability: 0.4 }] },
  { currentRoute: 'FlashcardsPage', predictedRoutes: [{ route: 'QAPage', probability: 0.4 }] },
  { currentRoute: 'MockExamPage', predictedRoutes: [{ route: 'QAPage', probability: 0.3 }] },
  {
    currentRoute: 'VoicePracticePage',
    predictedRoutes: [{ route: 'CodingPage', probability: 0.25 }],
  },
  {
    currentRoute: 'CodingPage',
    predictedRoutes: [{ route: 'VoicePracticePage', probability: 0.25 }],
  },
]

export function getPredictedRoutes(currentRoute: LazyRouteKey): LazyRouteKey[] {
  const rule = PREDICTION_RULES.find(r => r.currentRoute === currentRoute)
  if (!rule) return []

  return rule.predictedRoutes.filter(p => p.probability > 0.2).map(p => p.route)
}

export function prefetchPredictedRoutes(currentRoute: LazyRouteKey): void {
  const predicted = getPredictedRoutes(currentRoute)
  predicted.forEach(route => preloadRoute(route))
}

export function useRoutePrefetch(options: PrefetchOptions = {}) {
  const { priority = 'medium' } = options

  useEffect(() => {
    if (priority === 'high') {
      requestIdlePrefetch()
    }

    return () => {
      cancelIdlePrefetch()
    }
  }, [priority])
}

interface PreloadScriptLinkProps {
  route: LazyRouteKey
}

export function PreloadScript({ route }: PreloadScriptLinkProps) {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'script'
    link.href = `/_assets/${route.toLowerCase()}.js`

    document.head.appendChild(link)

    return () => {
      document.head.removeChild(link)
    }
  }, [route])

  return null
}

export function RoutePrefetcher({ children }: { children?: ReactNode }) {
  useRoutePrefetch({ priority: 'high' })

  return <>{children}</>
}

export class AnalyticsRoutePredictor {
  private routeHistory: LazyRouteKey[] = []
  private transitionCounts: Map<string, number> = new Map()
  private maxHistory = 20

  recordTransition(from: LazyRouteKey, to: LazyRouteKey): void {
    this.routeHistory.push(to)

    if (this.routeHistory.length > this.maxHistory) {
      this.routeHistory.shift()
    }

    const key = `${from}->${to}`
    const count = this.transitionCounts.get(key) || 0
    this.transitionCounts.set(key, count + 1)
  }

  predictNextRoute(currentRoute: LazyRouteKey): LazyRouteKey | null {
    let bestRoute: LazyRouteKey | null = null
    let maxCount = 0

    this.transitionCounts.forEach((count, key) => {
      if (key.startsWith(`${currentRoute}->`)) {
        const nextRoute = key.split('->')[1] as LazyRouteKey
        if (count > maxCount) {
          maxCount = count
          bestRoute = nextRoute
        }
      }
    })

    return bestRoute
  }

  prefetchPrediction(currentRoute: LazyRouteKey): void {
    const predicted = this.predictNextRoute(currentRoute)
    if (predicted) {
      preloadRoute(predicted)
    }
  }
}

let globalPredictor: AnalyticsRoutePredictor | null = null

export function getRoutePredictor(): AnalyticsRoutePredictor {
  if (!globalPredictor) {
    globalPredictor = new AnalyticsRoutePredictor()
  }
  return globalPredictor
}
