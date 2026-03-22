/**
 * Lazy Loading Utilities v2 for DevPrep UI
 *
 * Optimized lazy loading system with:
 * - Component-level code splitting
 * - Preload hints for critical paths
 * - Intersection observer-based loading
 */

import React, { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Spinner } from '@/components/ui/spinner'

interface LazyOptions {
  fallback?: ReactNode
  errorBoundary?: boolean
  preload?: boolean
}

interface LazyComponent<P = object> {
  (props: P): ReactNode
  preload: () => Promise<void>
}

function createLazy<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyOptions = {}
): LazyComponent<P> {
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

  const Component: LazyComponent<P> = (props: P) => {
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

  Component.preload = () => importFn().then(() => {})

  if (preload) {
    Component.preload()
  }

  return Component
}

export const LazyComponents = {
  QAPage: createLazy(() => import('@/pages/QAPage').then(m => ({ default: m.QAPage })), {
    preload: true,
  }),
  FlashcardsPage: createLazy(
    () => import('@/pages/FlashcardsPage').then(m => ({ default: m.FlashcardsPage })),
    { preload: true }
  ),
  MockExamPage: createLazy(() =>
    import('@/pages/MockExamPage').then(m => ({ default: m.MockExamPage }))
  ),
  VoicePracticePage: createLazy(() =>
    import('@/pages/VoicePracticePage').then(m => ({ default: m.VoicePracticePage }))
  ),
  CodingPage: createLazy(() => import('@/pages/CodingPage').then(m => ({ default: m.CodingPage }))),
  RealtimeDashboard: createLazy(() =>
    import('@/pages/RealtimeDashboard').then(m => ({ default: m.RealtimeDashboard }))
  ),
  OnboardingPage: createLazy(() =>
    import('@/pages/OnboardingPage').then(m => ({ default: m.OnboardingPage }))
  ),
}

export const LazyData = {
  questions: () => import('@/data/questions').then(m => m.questions),
  flashcards: () => import('@/data/flashcards').then(m => m.flashcards),
  exam: () => import('@/data/exam').then(m => m.examQuestions),
  coding: () => import('@/data/coding').then(m => m.codingChallenges),
  voice: () => import('@/data/voicePractice').then(m => m.voicePrompts),
  channels: () => import('@/data/channels').then(m => m.channels),
}

export function preloadCritical(): void {
  LazyComponents.QAPage.preload()
  LazyComponents.FlashcardsPage.preload()
}

export function preloadOnIdle(callback?: () => void): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadCritical()
      callback?.()
    })
  } else {
    setTimeout(() => {
      preloadCritical()
      callback?.()
    }, 100)
  }
}

export function useIntersectionLazy(
  ref: React.RefObject<HTMLElement>,
  importFn: () => Promise<unknown>,
  options: IntersectionObserverInit = {}
): void {
  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          importFn()
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '200px', ...options }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, importFn, options])
}
