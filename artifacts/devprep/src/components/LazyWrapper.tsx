'use client'

import React, { Suspense, useState, useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

interface LazyWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  errorFallback?: ReactNode
  skeleton?: SkeletonConfig
  className?: string
  minHeight?: string
  onError?: (error: Error) => void
  retryable?: boolean
}

interface SkeletonConfig {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'list'
  lines?: number
  className?: string
}

function DefaultSkeleton({ variant = 'card', lines = 3, className }: SkeletonConfig) {
  if (variant === 'card') {
    return (
      <div className={cn('space-y-3 p-4', className)}>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

interface ErrorFallbackProps {
  error: Error | null
  onRetry?: () => void
  retryable?: boolean
}

function ErrorFallback({ error, onRetry, retryable }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <div className="space-y-1">
        <p className="font-medium text-foreground">Failed to load content</p>
        <p className="text-sm text-muted-foreground">{error?.message || 'Something went wrong'}</p>
      </div>
      {retryable && onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  )
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends React.Component<
  { children: ReactNode; onError?: (error: Error) => void; retryKey?: number },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; onError?: (error: Error) => void; retryKey?: number }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error)
  }

  componentDidUpdate(prevProps: {
    children: ReactNode
    onError?: (error: Error) => void
    retryKey?: number
  }) {
    if (prevProps.retryKey !== this.props.retryKey) {
      this.setState({ hasError: false, error: null })
    }
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

export function LazyWrapper({
  children,
  fallback,
  errorFallback,
  skeleton,
  className,
  minHeight = '200px',
  onError,
  retryable = false,
}: LazyWrapperProps) {
  const [error, setError] = useState<Error | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    setError(null)
  }, [retryKey])

  const handleError = (err: Error) => {
    setError(err)
    onError?.(err)
  }

  const handleRetry = () => {
    setError(null)
    setRetryKey(k => k + 1)
  }

  const defaultFallback = fallback ?? (
    <div className={cn('flex items-center justify-center p-4', className)} style={{ minHeight }}>
      <DefaultSkeleton {...skeleton} />
    </div>
  )

  if (error) {
    return (
      <div className={cn('w-full', className)} style={{ minHeight }}>
        {errorFallback ?? (
          <ErrorFallback error={error} onRetry={handleRetry} retryable={retryable} />
        )}
      </div>
    )
  }

  return (
    <Suspense fallback={defaultFallback}>
      <ErrorBoundary onError={handleError} retryKey={retryKey}>
        {children}
      </ErrorBoundary>
    </Suspense>
  )
}

interface ProgressiveWrapperProps {
  shell: ReactNode
  content: ReactNode
  className?: string
  threshold?: number
}

export function ProgressiveWrapper({
  shell,
  content,
  className,
  threshold = 0.1,
}: ProgressiveWrapperProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowContent(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    const sentinel = document.createElement('div')
    sentinel.style.height = '1px'
    sentinel.style.width = '100%'
    document.body.appendChild(sentinel)
    observer.observe(sentinel)

    return () => {
      observer.disconnect()
      document.body.removeChild(sentinel)
    }
  }, [threshold])

  return (
    <div className={className}>
      {shell}
      {showContent && content}
    </div>
  )
}

interface PreloadHintProps {
  route: string
  children: ReactNode
}

export function PreloadHint({ route, children }: PreloadHintProps) {
  useEffect(() => {
    const routes: Record<string, () => Promise<any>> = {
      '/qa': () => import('@/pages/QAPage'),
      '/flashcards': () => import('@/pages/FlashcardsPage'),
      '/exam': () => import('@/pages/MockExamPage'),
      '/voice': () => import('@/pages/VoicePracticePage'),
      '/coding': () => import('@/pages/CodingPage'),
      '/dashboard': () => import('@/pages/RealtimeDashboard'),
      '/ai': () => import('@/pages/AIPage'),
    }

    const loader = routes[route]
    if (loader) {
      loader()
    }
  }, [route])

  return <>{children}</>
}
