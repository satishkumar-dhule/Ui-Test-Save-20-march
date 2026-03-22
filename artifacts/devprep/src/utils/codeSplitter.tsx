'use client'

import { lazy, Suspense, type ComponentType, type ReactNode, type ComponentProps } from 'react'

export const LazyQAPage = lazy(() => import('@/pages/QAPage').then(m => ({ default: m.QAPage })))
export const LazyFlashcardsPage = lazy(() =>
  import('@/pages/FlashcardsPage').then(m => ({ default: m.FlashcardsPage }))
)
export const LazyMockExamPage = lazy(() =>
  import('@/pages/MockExamPage').then(m => ({ default: m.MockExamPage }))
)
export const LazyVoicePracticePage = lazy(() =>
  import('@/pages/VoicePracticePage').then(m => ({ default: m.VoicePracticePage }))
)
export const LazyCodingPage = lazy(() =>
  import('@/pages/CodingPage').then(m => ({ default: m.CodingPage }))
)
export const LazyOnboardingPage = lazy(() =>
  import('@/pages/OnboardingPage').then(m => ({ default: m.OnboardingPage }))
)
export const LazyRealtimeDashboard = lazy(() =>
  import('@/pages/RealtimeDashboard').then(m => ({ default: m.RealtimeDashboard }))
)
export const LazyAIPage = lazy(() => import('@/pages/AIPage').then(m => ({ default: m.default })))

export const LazySearchModal = lazy(() =>
  import('@/components/SearchModal').then(m => ({ default: m.SearchModal }))
)
export const LazyChannelBrowser = lazy(() =>
  import('@/components/layout/ChannelBrowser').then(m => ({ default: m.ChannelBrowser }))
)
export const LazyContentList = lazy(() =>
  import('@/components/organisms/ContentList/ContentList').then(m => ({ default: m.ContentList }))
)
export const LazyPollinationsChat = lazy(() =>
  import('@/components/pollinations/PollinationsChat').then(m => ({ default: m.PollinationsChat }))
)
export const LazyChartContainer = lazy(() =>
  import('@/components/ui/chart').then(m => ({ default: m.ChartContainer }))
)
export const LazyDashboardLayout = lazy(() =>
  import('@/components/layouts/DashboardLayout').then(m => ({ default: m.DashboardLayout }))
)
export const LazyMarkdownText = lazy(() =>
  import('@/components/MarkdownText').then(m => ({ default: m.MarkdownText }))
)

export function preloadRoute(route: string) {
  const routeMap: Record<string, () => Promise<any>> = {
    '/qa': () => import('@/pages/QAPage'),
    '/flashcards': () => import('@/pages/FlashcardsPage'),
    '/exam': () => import('@/pages/MockExamPage'),
    '/voice': () => import('@/pages/VoicePracticePage'),
    '/coding': () => import('@/pages/CodingPage'),
    '/dashboard': () => import('@/pages/RealtimeDashboard'),
    '/ai': () => import('@/pages/AIPage'),
  }

  const loader = routeMap[route]
  if (loader) {
    loader()
  }
}

export function preloadOnInteraction(element: HTMLElement | null, route: string) {
  if (!element) return
  element.addEventListener('mouseenter', () => preloadRoute(route), { once: true, passive: true })
  element.addEventListener('touchstart', () => preloadRoute(route), { once: true, passive: true })
}
