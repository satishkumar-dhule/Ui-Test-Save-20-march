/**
 * Lazy loading utilities for DevPrep UI
 *
 * Provides:
 * - React.lazy wrapper with error boundary
 * - Preloading capabilities
 * - Loading state management
 * - Route-based code splitting
 */

import React, { lazy, Suspense, type ReactNode, type ComponentType } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Spinner } from '@/components/ui/spinner'
import { PageSkeleton, type PageSkeletonType } from '@/components/ui/PageSkeleton'

interface LazyComponentOptions {
  fallback?: ReactNode
  errorBoundary?: boolean
  preload?: boolean
  skeleton?: PageSkeletonType
}

/**
 * Enhanced lazy loading with error boundary and loading state
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createLazyComponent<P extends Record<string, any> = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyComponentOptions = {}
): ComponentType<P> & { preload: () => Promise<void> } {
  const { fallback, errorBoundary = true, preload = false, skeleton } = options

  const LazyComponent = lazy(importFn)

  const defaultFallback = skeleton ? (
    <PageSkeleton type={skeleton} />
  ) : (
    <div className="flex items-center justify-center p-8">
      <Spinner className="size-8" />
    </div>
  )

  const Component: ComponentType<P> = props => {
    const content = (
      <Suspense fallback={fallback ?? defaultFallback}>
        <LazyComponent {...props} />
      </Suspense>
    )

    if (errorBoundary) {
      return <ErrorBoundary>{content}</ErrorBoundary>
    }

    return content
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(Component as any).preload = () => importFn().then(() => {})

  if (preload) {
    importFn().catch(() => {})
  }

  return Component as ComponentType<P> & { preload: () => Promise<void> }
}

export const LAZY_PAGE_CONFIGS = {
  QAPage: {
    skeleton: 'qa' as PageSkeletonType,
    priority: 'high' as const,
  },
  FlashcardsPage: {
    skeleton: 'flashcards' as PageSkeletonType,
    priority: 'high' as const,
  },
  MockExamPage: {
    skeleton: 'exam' as PageSkeletonType,
    priority: 'medium' as const,
  },
  VoicePracticePage: {
    skeleton: 'voice' as PageSkeletonType,
    priority: 'medium' as const,
  },
  CodingPage: {
    skeleton: 'coding' as PageSkeletonType,
    priority: 'medium' as const,
  },
  RealtimeDashboard: {
    skeleton: 'dashboard' as PageSkeletonType,
    priority: 'low' as const,
  },
  OnboardingPage: {
    skeleton: 'onboarding' as PageSkeletonType,
    priority: 'low' as const,
  },
  AIPage: {
    skeleton: 'ai' as PageSkeletonType,
    priority: 'low' as const,
  },
}

type LazyPageKey = keyof typeof LAZY_PAGE_CONFIGS

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyComponent = ComponentType<any> & { preload: () => Promise<void> }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getLazyPageImport(key: LazyPageKey): () => Promise<{ default: ComponentType<any> }> {
  const pageMap: Record<LazyPageKey, () => Promise<{ default: ComponentType<any> }>> = {
    QAPage: () => import('@/pages/QAPage').then(m => ({ default: m.QAPage })) as Promise<{ default: ComponentType<any> }>,
    FlashcardsPage: () => import('@/pages/FlashcardsPage').then(m => ({ default: m.FlashcardsPage })) as Promise<{ default: ComponentType<any> }>,
    MockExamPage: () => import('@/pages/MockExamPage').then(m => ({ default: m.MockExamPage })) as Promise<{ default: ComponentType<any> }>,
    VoicePracticePage: () => import('@/pages/VoicePracticePage').then(m => ({ default: m.VoicePracticePage })) as Promise<{ default: ComponentType<any> }>,
    CodingPage: () => import('@/pages/CodingPage').then(m => ({ default: m.CodingPage })) as Promise<{ default: ComponentType<any> }>,
    RealtimeDashboard: () => import('@/pages/RealtimeDashboard').then(m => ({ default: m.RealtimeDashboard })) as Promise<{ default: ComponentType<any> }>,
    OnboardingPage: () => import('@/pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })) as Promise<{ default: ComponentType<any> }>,
    AIPage: () => import('@/pages/AIPage').then(m => ({ default: m.default })) as Promise<{ default: ComponentType<any> }>,
  }
  return pageMap[key]
}

/**
 * Lazy load route components with page-specific skeletons
 */
export const LazyRoutes: Record<LazyPageKey, LazyComponent> = {
  QAPage: createLazyComponent(getLazyPageImport('QAPage'), {
    skeleton: 'qa',
    preload: true,
  }) as LazyComponent,
  FlashcardsPage: createLazyComponent(getLazyPageImport('FlashcardsPage'), {
    skeleton: 'flashcards',
    preload: true,
  }) as LazyComponent,
  MockExamPage: createLazyComponent(getLazyPageImport('MockExamPage'), {
    skeleton: 'exam',
  }) as LazyComponent,
  VoicePracticePage: createLazyComponent(getLazyPageImport('VoicePracticePage'), {
    skeleton: 'voice',
  }) as LazyComponent,
  CodingPage: createLazyComponent(getLazyPageImport('CodingPage'), {
    skeleton: 'coding',
  }) as LazyComponent,
  RealtimeDashboard: createLazyComponent(getLazyPageImport('RealtimeDashboard'), {
    skeleton: 'dashboard',
  }) as LazyComponent,
  OnboardingPage: createLazyComponent(getLazyPageImport('OnboardingPage'), {
    skeleton: 'onboarding',
  }) as LazyComponent,
  AIPage: createLazyComponent(getLazyPageImport('AIPage'), {
    skeleton: 'ai',
  }) as LazyComponent,
}

const CRITICAL_PAGES: LazyPageKey[] = ['QAPage', 'FlashcardsPage']

/**
 * Preload critical routes
 */
export function preloadCriticalRoutes(): void {
  CRITICAL_PAGES.forEach(key => {
    const route = LazyRoutes[key]
    if (route?.preload) {
      route.preload()
    }
  })
}

/**
 * Preload all high priority routes
 */
export function preloadHighPriorityRoutes(): void {
  Object.entries(LAZY_PAGE_CONFIGS)
    .filter(([, config]) => config.priority === 'high')
    .forEach(([key]) => {
      const route = LazyRoutes[key as LazyPageKey]
      if (route?.preload) {
        route.preload()
      }
    })
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
 * Section to page mapping
 */
export const SECTION_TO_PAGE: Record<string, LazyPageKey> = {
  qa: 'QAPage',
  flashcards: 'FlashcardsPage',
  exam: 'MockExamPage',
  voice: 'VoicePracticePage',
  coding: 'CodingPage',
}

export function getLazyPageForSection(section: string): LazyPageKey | null {
  return SECTION_TO_PAGE[section] ?? null
}

/**
 * Get lazy component for section
 */
export function useLazyPage(section: string): LazyComponent | null {
  const pageKey = getLazyPageForSection(section)
  if (!pageKey) return null
  return LazyRoutes[pageKey]
}
