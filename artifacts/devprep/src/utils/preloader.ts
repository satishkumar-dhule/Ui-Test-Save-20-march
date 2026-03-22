import { useEffect, useRef, useState, createContext, useContext, ComponentType, ReactNode } from 'react'

export interface RouteConfig {
  path: string
  component: () => Promise<unknown>
  prefetchOnHover?: boolean
  priority?: 'high' | 'medium' | 'low'
}

export interface PrefetchOptions {
  priority?: 'high' | 'low'
  crossOrigin?: boolean
  timeout?: number
}

export const ROUTE_CONFIGS: Record<string, RouteConfig> = {
  qa: {
    path: '/qa',
    component: () => import('@/pages/QAPage'),
    priority: 'high',
  },
  flashcards: {
    path: '/flashcards',
    component: () => import('@/pages/FlashcardsPage'),
    priority: 'high',
  },
  exam: {
    path: '/exam',
    component: () => import('@/pages/MockExamPage'),
    priority: 'medium',
  },
  voice: {
    path: '/voice',
    component: () => import('@/pages/VoicePracticePage'),
    priority: 'medium',
  },
  coding: {
    path: '/coding',
    component: () => import('@/pages/CodingPage'),
    priority: 'medium',
  },
  dashboard: {
    path: '/dashboard',
    component: () => import('@/pages/RealtimeDashboard'),
    priority: 'low',
  },
  onboarding: {
    path: '/onboarding',
    component: () => import('@/pages/OnboardingPage'),
    priority: 'high',
  },
}

const moduleCache = new Map<string, Promise<unknown>>()

export function prefetchModule(factory: () => Promise<unknown>, priority: 'high' | 'low' = 'low'): void {
  if (typeof document === 'undefined') return
  
  const key = factory.toString()
  if (moduleCache.has(key)) return
  
  const promise = factory().then(module => {
    return module
  })
  
  moduleCache.set(key, promise)
  
  if (priority === 'high') {
    const link = document.createElement('link')
    link.rel = 'modulepreload'
    link.href = key
    document.head.appendChild(link)
  }
}

export function prefetchRoute(routeKey: string, options: PrefetchOptions = {}): void {
  const config = ROUTE_CONFIGS[routeKey]
  if (!config) return
  
  const priorityMap: Record<string, 'high' | 'low'> = {
    high: 'high',
    medium: 'low',
    low: 'low',
  }
  
  prefetchModule(config.component, priorityMap[config.priority ?? 'low'] ?? 'low')
}

export function prefetchMultiple(routes: string[], options: PrefetchOptions = {}): void {
  routes.forEach(route => prefetchRoute(route, options))
}

export function usePrefetch(routeKey: string, threshold: number = 200): {
  onMouseEnter: () => void
  onHover: () => void
  prefetched: boolean
} {
  const [prefetched, setPrefetched] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  const prefetch = () => {
    if (prefetched) return
    prefetchRoute(routeKey, { priority: 'low' })
    setPrefetched(true)
  }
  
  const onHover = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(prefetch, threshold)
  }
  
  const onMouseEnter = () => {
    prefetch()
  }
  
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])
  
  return { onMouseEnter, onHover, prefetched }
}

export function createPrefetchLink(href: string, as: 'route' | 'asset' | 'api' = 'route'): HTMLLinkElement | null {
  if (typeof document === 'undefined') return null
  
  const link = document.createElement('link')
  
  if (as === 'route') {
    const matchedRoute = Object.entries(ROUTE_CONFIGS).find(([, config]) => config.path === href)
    if (matchedRoute) {
      link.rel = 'prefetch'
      link.href = href
      document.head.appendChild(link)
    }
  } else if (as === 'asset') {
    link.rel = 'prefetch'
    link.as = 'image'
    link.href = href
  } else if (as === 'api') {
    link.rel = 'dns-prefetch'
    link.href = href
  }
  
  document.head.appendChild(link)
  return link
}

export function preloadAPIEndpoint(endpoint: string, options: RequestInit = {}): void {
  if (typeof document === 'undefined') return
  
  const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3001' : ''
  
  const link = document.createElement('link')
  link.rel = 'dns-prefetch'
  link.href = baseUrl
  document.head.appendChild(link)
  
  setTimeout(() => {
    fetch(`${baseUrl}${endpoint}`, {
      ...options,
      method: options.method || 'GET',
      credentials: 'include',
    }).catch(() => {})
  }, 0)
}

export function preloadCriticalAssets(): void {
  if (typeof document === 'undefined') return
  
  const criticalChunks = [
    'assets/vendor-react',
    'assets/main',
  ]
  
  criticalChunks.forEach(chunk => {
    const link = document.createElement('link')
    link.rel = 'modulepreload'
    link.href = chunk
    document.head.appendChild(link)
  })
  
  const fonts = [
    'https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;600;700;800',
  ]
  
  fonts.forEach(font => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'style'
    link.href = font
    document.head.appendChild(link)
  })
}

export function useRouteTransition(onNavigate?: (from: string, to: string) => void) {
  useEffect(() => {
    const handler = () => {
      const from = (window.history.state as Record<string, string> | null)?.from ?? ''
      const to = window.location.pathname
      if (onNavigate && from !== to) {
        const matchedFrom = Object.entries(ROUTE_CONFIGS).find(([, config]) => config.path === from)
        const matchedTo = Object.entries(ROUTE_CONFIGS).find(([, config]) => config.path === to)
        
        if (matchedFrom && matchedTo) {
          onNavigate(matchedFrom[0], matchedTo[0])
          prefetchRoute(matchedTo[0], { priority: 'low' })
        }
      }
    }
    
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [onNavigate])
}

export function usePredictivePrefetch(currentSection: string, sectionHistory: string[] = []): void {
  useEffect(() => {
    if (sectionHistory.length < 2) return
    
    const lastTwo = sectionHistory.slice(-2)
    const nextRoutes = predictNextRoutes(lastTwo[0], lastTwo[1])
    
    nextRoutes.forEach(route => {
      prefetchRoute(route, { priority: 'low' })
    })
  }, [currentSection, sectionHistory])
}

function predictNextRoutes(current: string, previous: string): string[] {
  const transitionMap: Record<string, Record<string, string[]>> = {
    qa: { flashcards: ['flashcards', 'exam'], exam: ['voice'], voice: ['coding'] },
    flashcards: { qa: ['qa', 'exam'], exam: ['voice'], voice: ['coding'] },
    exam: { qa: ['qa'], flashcards: ['flashcards'], voice: ['voice'] },
    voice: { exam: ['exam'], qa: ['qa'], coding: ['coding'] },
    coding: { voice: ['voice'], qa: ['qa'], flashcards: ['flashcards'] },
  }
  
  const predictions = transitionMap[current]?.[previous] ?? []
  
  if (predictions.length === 0 && current !== 'qa') {
    return ['qa']
  }
  
  return predictions.slice(0, 2)
}

interface PreloaderContextValue {
  prefetch: (href: string, options?: PrefetchOptions) => void
  prefetchedUrls: Set<string>
  isPrefetching: boolean
}

const preloaderContext = createContext<PreloaderContextValue | null>(null)

export function usePreloader(): PreloaderContextValue {
  const context = useContext(preloaderContext)
  if (!context) {
    return {
      prefetch: (href: string) => {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = href
        document.head.appendChild(link)
      },
      prefetchedUrls: new Set<string>(),
      isPrefetching: false,
    }
  }
  return context
}

export function PreloaderProvider({ children }: { children: ReactNode }) {
  const prefetchedUrls = useRef(new Set<string>())
  const [isPrefetching, setIsPrefetching] = useState(false)
  
  const prefetch = (href: string, options: PrefetchOptions = {}) => {
    if (prefetchedUrls.current.has(href)) return
    
    const priority = options.priority ?? 'low'
    const timeout = options.timeout ?? 100
    
    setIsPrefetching(true)
    
    setTimeout(() => {
      const link = document.createElement('link')
      link.rel = priority === 'high' ? 'preload' : 'prefetch'
      link.href = href
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
      
      prefetchedUrls.current.add(href)
      setIsPrefetching(false)
    }, timeout)
  }
  
  const value: PreloaderContextValue = {
    prefetch,
    prefetchedUrls: prefetchedUrls.current,
    isPrefetching,
  }
  
  return preloaderContext.Provider({ value, children })
}
