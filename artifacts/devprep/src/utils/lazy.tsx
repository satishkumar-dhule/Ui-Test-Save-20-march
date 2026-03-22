/**
 * Lazy loading utilities for DevPrep UI
 *
 * Provides:
 * - React.lazy wrapper with error boundary
 * - Preloading capabilities
 * - Loading state management
 */

import React, { lazy, Suspense } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Spinner } from '@/components/ui/spinner'

interface LazyComponentOptions {
  fallback?: React.ReactNode
  errorBoundary?: boolean
  preload?: boolean
}

/**
 * Enhanced lazy loading with error boundary and loading state
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
export function createLazyComponent<P extends Record<string, any> = {}>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  options: LazyComponentOptions = {}
): React.ComponentType<P> & { preload: () => Promise<void> } {
  const {
    fallback = (
      <div className="flex items-center justify-center p-8">
        <Spinner className="size-8" />
      </div>
    ),
    errorBoundary = true,
    preload = false,
  } = options

  const LazyComponent = lazy(importFn)

  const Component: React.FC<P> = props => {
    const content = (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    )

    if (errorBoundary) {
      return <ErrorBoundary>{content}</ErrorBoundary>
    }

    return content
  }

  // Add preload method
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(Component as any).preload = () => importFn().then(() => {})

  // Optionally preload immediately
  if (preload) {
    importFn().catch(() => {
      // Silently fail preload
    })
  }

  return Component as React.ComponentType<P> & { preload: () => Promise<void> }
}

/**
 * Lazy load route components
 */
export const LazyRoutes = {
  QAPage: createLazyComponent(
    () => import('@/pages/QAPage').then(module => ({ default: module.QAPage })),
    {
      fallback: <div className="p-8">Loading Q&A...</div>,
    }
  ),
  FlashcardsPage: createLazyComponent(
    () => import('@/pages/FlashcardsPage').then(module => ({ default: module.FlashcardsPage })),
    {
      fallback: <div className="p-8">Loading flashcards...</div>,
    }
  ),
  MockExamPage: createLazyComponent(
    () => import('@/pages/MockExamPage').then(module => ({ default: module.MockExamPage })),
    {
      fallback: <div className="p-8">Loading exam...</div>,
    }
  ),
  VoicePracticePage: createLazyComponent(
    () =>
      import('@/pages/VoicePracticePage').then(module => ({ default: module.VoicePracticePage })),
    {
      fallback: <div className="p-8">Loading voice practice...</div>,
    }
  ),
  CodingPage: createLazyComponent(
    () => import('@/pages/CodingPage').then(module => ({ default: module.CodingPage })),
    {
      fallback: <div className="p-8">Loading coding challenges...</div>,
    }
  ),
  RealtimeDashboard: createLazyComponent(
    () =>
      import('@/pages/RealtimeDashboard').then(module => ({ default: module.RealtimeDashboard })),
    {
      fallback: <div className="p-8">Loading realtime dashboard...</div>,
    }
  ),
  OnboardingPage: createLazyComponent(
    () => import('@/pages/OnboardingPage').then(module => ({ default: module.OnboardingPage })),
    {
      fallback: <div className="p-8">Loading onboarding...</div>,
    }
  ),
}

/**
 * Preload critical routes
 */
export function preloadCriticalRoutes(): void {
  // Preload routes that are likely to be visited first
  LazyRoutes.QAPage.preload()
  LazyRoutes.FlashcardsPage.preload()
}

/**
 * Intersection observer for lazy loading images and components
 */
export function useLazyLoad(
  ref: React.RefObject<HTMLElement>,
  callback: () => void,
  options: IntersectionObserverInit = {}
): void {
  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback()
          observer.unobserve(element)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [ref, callback, options])
}

/**
 * Lazy load images with intersection observer
 */
export function useLazyImage(
  src: string,
  placeholder?: string
): {
  ref: React.RefObject<HTMLImageElement | null>
  loaded: boolean
  error: boolean
} {
  const [loaded, setLoaded] = React.useState(false)
  const [error, setError] = React.useState(false)
  const ref = React.useRef<HTMLImageElement | null>(null)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = element
          img.src = src

          img.onload = () => {
            setLoaded(true)
            observer.unobserve(img)
          }

          img.onerror = () => {
            setError(true)
            observer.unobserve(img)
          }
        }
      },
      {
        threshold: 0.01,
        rootMargin: '50px',
      }
    )

    if (placeholder) {
      element.src = placeholder
    }

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [src, placeholder])

  return { ref, loaded, error }
}

/**
 * Prefetch route data
 */
export function prefetchRouteData(route: string): void {
  // Implement data prefetching logic based on route
  // This could be used with React Query's prefetchQuery
  console.log(`[Prefetch] Data for route: ${route}`)
}
