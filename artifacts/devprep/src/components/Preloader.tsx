import { useCallback, useRef, useState, useEffect, ReactNode, AnchorHTMLAttributes, MouseEvent, createContext } from 'react'
import { lazy, Suspense, ComponentType } from 'react'

interface PrefetchOptions {
  priority?: 'high' | 'low'
  timeout?: number
}

interface PreloaderContextValue {
  prefetch: (href: string, options?: PrefetchOptions) => void
  prefetchedUrls: Set<string>
  isPrefetching: boolean
}

interface Route {
  path: string
  label: string
  icon?: string
}

const ROUTES: Route[] = [
  { path: '/qa', label: 'Questions', icon: '?' },
  { path: '/flashcards', label: 'Flashcards', icon: '⚡' },
  { path: '/exam', label: 'Mock Exam', icon: '📝' },
  { path: '/voice', label: 'Voice Practice', icon: '🎤' },
  { path: '/coding', label: 'Coding', icon: '💻' },
]

export function PreloaderProvider({ children }: { children: ReactNode }) {
  const prefetchedUrls = useRef(new Set<string>())
  const [isPrefetching, setIsPrefetching] = useState(false)
  
  const prefetch = useCallback((href: string, options: PrefetchOptions = {}) => {
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
  }, [])
  
  const value: PreloaderContextValue = {
    prefetch,
    prefetchedUrls: prefetchedUrls.current,
    isPrefetching,
  }
  
  return (
    <PreloaderContext.Provider value={value}>
      {children}
    </PreloaderContext.Provider>
  )
}

const PreloaderContext = createContext<PreloaderContextValue | null>(null)

interface PrefetchLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string
  prefetch?: boolean
  priority?: 'high' | 'low'
  as?: 'route' | 'asset'
  onPrefetch?: () => void
  children: ReactNode
}

export function PrefetchLink({
  href,
  prefetch = true,
  priority = 'low',
  as = 'route',
  onPrefetch,
  children,
  onClick,
  ...props
}: PrefetchLinkProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prefetched = useRef(false)
  
  const handleMouseEnter = useCallback(() => {
    if (!prefetch || prefetched.current) return
    
    prefetched.current = true
    onPrefetch?.()
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    
    timeoutRef.current = setTimeout(() => {
      const link = document.createElement('link')
      link.rel = priority === 'high' ? 'preload' : 'prefetch'
      link.href = href
      link.crossOrigin = 'anonymous'
      
      if (as === 'route') {
        document.head.appendChild(link)
      } else if (as === 'asset') {
        link.as = 'image'
        document.head.appendChild(link)
      }
    }, 50)
  }, [href, prefetch, priority, as, onPrefetch])
  
  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])
  
  return (
    <a
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      {...props}
    >
      {children}
    </a>
  )
}

interface RouteTransitionProps {
  from: string
  to: string
  children: ReactNode
  onTransition?: (from: string, to: string) => void
}

export function RouteTransition({ from, to, children, onTransition }: RouteTransitionProps) {
  const prefetchRef = useRef(false)
  
  useEffect(() => {
    if (from === to || prefetchRef.current) return
    
    prefetchRef.current = true
    onTransition?.(from, to)
    
    const route = ROUTES.find(r => r.path === to)
    if (route) {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = route.path
      link.as = 'document'
      document.head.appendChild(link)
    }
  }, [from, to, onTransition])
  
  return <>{children}</>
}

export function usePrefetchOnHover(targetHref: string, options: PrefetchOptions = {}) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prefetched = useRef(false)
  
  const handleMouseEnter = useCallback(() => {
    if (prefetched.current) return
    
    prefetched.current = true
    const timeout = options.timeout ?? 50
    const priority = options.priority ?? 'low'
    
    timeoutRef.current = setTimeout(() => {
      const link = document.createElement('link')
      link.rel = priority === 'high' ? 'preload' : 'prefetch'
      link.href = targetHref
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    }, timeout)
  }, [targetHref, options.timeout, options.priority])
  
  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])
  
  return { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave }
}

export function prefetchBatch(urls: string[], priority: 'high' | 'low' = 'low'): void {
  urls.forEach((url, index) => {
    setTimeout(() => {
      const link = document.createElement('link')
      link.rel = priority === 'high' ? 'preload' : 'prefetch'
      link.href = url
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
    }, index * 20)
  })
}

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

interface PreloadProps {
  href: string
  as: 'script' | 'style' | 'image' | 'font' | 'document'
  type?: string
  crossOrigin?: boolean
  onLoad?: () => void
}

export function Preload({ href, as, crossOrigin, onLoad }: PreloadProps) {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    if (crossOrigin) link.crossOrigin = 'anonymous'
    
    if (onLoad) {
      link.onload = onLoad
    }
    
    document.head.appendChild(link)
    
    return () => {
      document.head.removeChild(link)
    }
  }, [href, as, crossOrigin, onLoad])
  
  return null
}

export function PrefetchScript({ src, onLoad }: { src: string; onLoad?: () => void }) {
  return <Preload href={src} as="script" onLoad={onLoad} />
}

export function PrefetchStyle({ href, onLoad }: { href: string; onLoad?: () => void }) {
  return <Preload href={href} as="style" onLoad={onLoad} />
}

interface LazyRouteProps {
  routeKey: string
  fallback?: ReactNode
  componentMap?: Record<string, () => Promise<unknown>>
}

export function LazyRoute({ routeKey, fallback, componentMap }: LazyRouteProps) {
  const defaultMap: Record<string, () => Promise<unknown>> = {
    qa: () => import('@/pages/QAPage'),
    flashcards: () => import('@/pages/FlashcardsPage'),
    exam: () => import('@/pages/MockExamPage'),
    voice: () => import('@/pages/VoicePracticePage'),
    coding: () => import('@/pages/CodingPage'),
    dashboard: () => import('@/pages/RealtimeDashboard'),
    onboarding: () => import('@/pages/OnboardingPage'),
  }
  
  const map = componentMap ?? defaultMap
  const getComponent = map[routeKey]
  
  if (!getComponent) {
    console.warn(`Route not found: ${routeKey}`)
    return null
  }
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LazyComponent = lazy(getComponent as any)
  
  return (
    <Suspense fallback={fallback ?? null}>
      <LazyComponent />
    </Suspense>
  )
}
