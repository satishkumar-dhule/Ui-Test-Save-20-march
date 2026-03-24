/**
 * Lazy Route Components with Suspense Boundaries
 *
 * Comprehensive route-based code splitting for DevPrep app.
 * Each page is lazily loaded with React.lazy() and wrapped in
 * optimized Suspense boundaries with page-specific skeleton loaders.
 */

import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { PageSkeleton, type PageSkeletonType } from '@/components/ui/PageSkeleton'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Spinner } from '@/components/ui/spinner'

export type LazyRouteKey =
  | 'QAPage'
  | 'FlashcardsPage'
  | 'MockExamPage'
  | 'VoicePracticePage'
  | 'CodingPage'
  | 'StatsPage'
  | 'RealtimeDashboard'
  | 'AIPage'
  | 'OnboardingPage'
  | 'NotFound'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LazyComponentType = ComponentType<any>

export interface LazyRouteConfig {
  importFn: () => Promise<{ default: LazyComponentType }>
  skeleton: PageSkeletonType
  chunkName: string
  priority: 'high' | 'medium' | 'low'
  prefetchOnIdle: boolean
}

export const LAZY_ROUTE_CONFIGS: Record<LazyRouteKey, LazyRouteConfig> = {
  QAPage: {
    importFn: () => import('@/pages/QAPage').then(m => ({ default: m.QAPage })),
    skeleton: 'qa',
    chunkName: 'page-qa',
    priority: 'high',
    prefetchOnIdle: true,
  },
  FlashcardsPage: {
    importFn: () => import('@/pages/FlashcardsPage').then(m => ({ default: m.FlashcardsPage })),
    skeleton: 'flashcards',
    chunkName: 'page-flashcards',
    priority: 'high',
    prefetchOnIdle: true,
  },
  MockExamPage: {
    importFn: () => import('@/pages/MockExamPage').then(m => ({ default: m.MockExamPage })),
    skeleton: 'exam',
    chunkName: 'page-exam',
    priority: 'medium',
    prefetchOnIdle: false,
  },
  VoicePracticePage: {
    importFn: () =>
      import('@/pages/VoicePracticePage').then(m => ({ default: m.VoicePracticePage })),
    skeleton: 'voice',
    chunkName: 'page-voice',
    priority: 'medium',
    prefetchOnIdle: false,
  },
  CodingPage: {
    importFn: () => import('@/pages/CodingPage').then(m => ({ default: m.CodingPage })),
    skeleton: 'coding',
    chunkName: 'page-coding',
    priority: 'medium',
    prefetchOnIdle: false,
  },
  RealtimeDashboard: {
    importFn: () =>
      import('@/pages/RealtimeDashboard').then(m => ({ default: m.RealtimeDashboard })),
    skeleton: 'dashboard',
    chunkName: 'page-realtime',
    priority: 'low',
    prefetchOnIdle: false,
  },
  AIPage: {
    importFn: () => import('@/pages/AIPage').then(m => ({ default: m.default })),
    skeleton: 'ai',
    chunkName: 'page-ai',
    priority: 'low',
    prefetchOnIdle: false,
  },
  OnboardingPage: {
    importFn: () => import('@/pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })),
    skeleton: 'onboarding',
    chunkName: 'page-onboarding',
    priority: 'low',
    prefetchOnIdle: false,
  },
  StatsPage: {
    importFn: () => import('@/pages-v2/StatsPage').then(m => ({ default: m.StatsPage })),
    skeleton: 'dashboard',
    chunkName: 'page-stats',
    priority: 'low',
    prefetchOnIdle: false,
  },
  NotFound: {
    importFn: () => import('@/pages/not-found').then(m => ({ default: m.default })),
    skeleton: 'notFound',
    chunkName: 'page-common',
    priority: 'low',
    prefetchOnIdle: false,
  },
}

export const LazyQAPage = lazy(() => LAZY_ROUTE_CONFIGS.QAPage.importFn())
export const LazyFlashcardsPage = lazy(() => LAZY_ROUTE_CONFIGS.FlashcardsPage.importFn())
export const LazyMockExamPage = lazy(() => LAZY_ROUTE_CONFIGS.MockExamPage.importFn())
export const LazyVoicePracticePage = lazy(() => LAZY_ROUTE_CONFIGS.VoicePracticePage.importFn())
export const LazyCodingPage = lazy(() => LAZY_ROUTE_CONFIGS.CodingPage.importFn())
export const LazyRealtimeDashboard = lazy(() => LAZY_ROUTE_CONFIGS.RealtimeDashboard.importFn())
export const LazyAIPage = lazy(() => LAZY_ROUTE_CONFIGS.AIPage.importFn())
export const LazyOnboardingPage = lazy(() => LAZY_ROUTE_CONFIGS.OnboardingPage.importFn())
export const LazyNotFound = lazy(() => LAZY_ROUTE_CONFIGS.NotFound.importFn())
export const LazyStatsPage = lazy(() => LAZY_ROUTE_CONFIGS.StatsPage.importFn())

export const LAZY_COMPONENTS: Record<LazyRouteKey, ReturnType<typeof lazy>> = {
  QAPage: LazyQAPage,
  FlashcardsPage: LazyFlashcardsPage,
  MockExamPage: LazyMockExamPage,
  VoicePracticePage: LazyVoicePracticePage,
  CodingPage: LazyCodingPage,
  RealtimeDashboard: LazyRealtimeDashboard,
  AIPage: LazyAIPage,
  OnboardingPage: LazyOnboardingPage,
  NotFound: LazyNotFound,
  StatsPage: LazyStatsPage,
}

const PAGE_TITLES: Record<LazyRouteKey, string> = {
  QAPage: 'Loading questions...',
  FlashcardsPage: 'Loading flashcards...',
  MockExamPage: 'Loading exam...',
  VoicePracticePage: 'Loading voice practice...',
  CodingPage: 'Loading coding challenges...',
  StatsPage: 'Loading statistics...',
  RealtimeDashboard: 'Loading dashboard...',
  AIPage: 'Loading AI assistant...',
  OnboardingPage: 'Loading...',
  NotFound: 'Page not found',
}

interface LazyRouteProps {
  page: LazyRouteKey
  children?: ReactNode
}

export function LazyRoute({ page, children }: LazyRouteProps) {
  const config = LAZY_ROUTE_CONFIGS[page]
  const Component = LAZY_COMPONENTS[page]

  return (
    <ErrorBoundary
      componentName={`LazyRoute:${page}`}
      title={`Failed to load ${page}`}
      description="An error occurred while loading this content. Please try refreshing the page."
    >
      <Suspense fallback={<PageSkeleton type={config.skeleton} title={PAGE_TITLES[page]} />}>
        <Component {...(children as object)} />
      </Suspense>
    </ErrorBoundary>
  )
}

interface RouteLoaderProps {
  page: LazyRouteKey
  fallback?: ReactNode
}

export function RouteLoader({ page, fallback }: RouteLoaderProps) {
  const config = LAZY_ROUTE_CONFIGS[page]
  const Component = LAZY_COMPONENTS[page]

  return (
    <ErrorBoundary componentName={`RouteLoader:${page}`}>
      <Suspense fallback={fallback || <PageSkeleton type={config.skeleton} />}>
        <Component />
      </Suspense>
    </ErrorBoundary>
  )
}

export function createLazyRoute(key: LazyRouteKey) {
  const config = LAZY_ROUTE_CONFIGS[key]
  const Component = LAZY_COMPONENTS[key]

  const LazyComponent: React.FC<Record<string, unknown>> = props => (
    <ErrorBoundary componentName={`LazyRoute:${key}`}>
      <Suspense fallback={<PageSkeleton type={config.skeleton} />}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  )

  LazyComponent.displayName = `Lazy(${key})`

  return LazyComponent
}

export const SectionToPageMap: Record<string, LazyRouteKey> = {
  qa: 'QAPage',
  flashcards: 'FlashcardsPage',
  exam: 'MockExamPage',
  voice: 'VoicePracticePage',
  coding: 'CodingPage',
  stats: 'StatsPage',
}

export function getPageForSection(section: string): LazyRouteKey {
  return SectionToPageMap[section] || 'NotFound'
}

const LoadingSpinner: React.FC<{ title?: string }> = ({ title }) => (
  <div className="flex flex-1 items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Spinner className="size-8" />
      <span className="text-sm text-muted-foreground">{title || 'Loading...'}</span>
    </div>
  </div>
)

export { LoadingSpinner }
