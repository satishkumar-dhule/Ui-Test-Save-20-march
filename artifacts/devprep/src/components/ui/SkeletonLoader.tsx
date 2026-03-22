import { cn } from '@/lib/utils'
import { useEffect, useState, type ReactNode, type ReactElement } from 'react'

export type ContentSkeletonType =
  | 'question'
  | 'flashcard'
  | 'exam'
  | 'channel-list'
  | 'sidebar'
  | 'dashboard'
  | 'generic'

interface SkeletonLoaderProps {
  type: ContentSkeletonType
  count?: number
  className?: string
  animate?: boolean
  progressiveReveal?: boolean
  revealDelay?: number
}

interface ContentSkeletonComponents {
  QuestionSkeleton: (props: { className?: string }) => ReactElement
  FlashcardSkeleton: (props: { className?: string }) => ReactElement
  ExamSkeleton: (props: { className?: string }) => ReactElement
  ChannelListSkeleton: (props: { className?: string }) => ReactElement
  SidebarSkeleton: (props: { className?: string }) => ReactElement
  DashboardSkeleton: (props: { className?: string }) => ReactElement
  GenericSkeleton: (props: { className?: string }) => ReactElement
}

const skeletonBaseClass = 'bg-muted rounded skeleton-shimmer-gpu'

function QuestionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 p-4 rounded-xl bg-card border border-border', className)}>
      <div className="flex items-start gap-3">
        <div className={cn(skeletonBaseClass, 'size-6 rounded shrink-0 mt-0.5')} />
        <div className="flex-1 space-y-2">
          <div className={cn(skeletonBaseClass, 'h-5 w-3/4 rounded')} />
          <div className={cn(skeletonBaseClass, 'h-4 w-full rounded')} />
          <div className={cn(skeletonBaseClass, 'h-4 w-5/6 rounded')} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pl-9">
        <div className={cn(skeletonBaseClass, 'h-6 w-16 rounded-full')} />
        <div className={cn(skeletonBaseClass, 'h-6 w-20 rounded-full')} />
        <div className={cn(skeletonBaseClass, 'h-6 w-14 rounded-full')} />
      </div>
      <div className="flex items-center gap-2 pl-9">
        <div className={cn(skeletonBaseClass, 'h-8 w-20 rounded-lg')} />
        <div className={cn(skeletonBaseClass, 'h-8 w-20 rounded-lg')} />
      </div>
    </div>
  )
}

function FlashcardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl bg-card border border-border p-6 min-h-[200px] flex flex-col',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn(skeletonBaseClass, 'h-5 w-20 rounded')} />
        <div className={cn(skeletonBaseClass, 'h-5 w-16 rounded-full')} />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3 w-full">
          <div className={cn(skeletonBaseClass, 'h-6 w-2/3 mx-auto rounded')} />
          <div className={cn(skeletonBaseClass, 'h-4 w-1/2 mx-auto rounded')} />
        </div>
      </div>
      <div className="flex justify-center gap-3 mt-4 pt-4 border-t border-border">
        <div className={cn(skeletonBaseClass, 'h-10 w-24 rounded-lg')} />
        <div className={cn(skeletonBaseClass, 'h-10 w-24 rounded-lg')} />
        <div className={cn(skeletonBaseClass, 'h-10 w-24 rounded-lg')} />
      </div>
    </div>
  )
}

function ExamSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl bg-card border border-border p-6 space-y-6', className)}>
      <div className="flex items-center justify-between">
        <div className={cn(skeletonBaseClass, 'h-7 w-48 rounded')} />
        <div className={cn(skeletonBaseClass, 'h-6 w-24 rounded')} />
      </div>
      <div className={cn(skeletonBaseClass, 'h-px w-full rounded')} />
      <div className="space-y-4">
        <div className={cn(skeletonBaseClass, 'h-5 w-full rounded')} />
        <div className={cn(skeletonBaseClass, 'h-4 w-full rounded')} />
        <div className={cn(skeletonBaseClass, 'h-4 w-5/6 rounded')} />
      </div>
      <div className="space-y-3">
        {['A', 'B', 'C', 'D'].map(opt => (
          <div key={opt} className="flex items-center gap-3 p-3 rounded-lg border border-border">
            <div className={cn(skeletonBaseClass, 'size-5 rounded shrink-0')} />
            <div className={cn(skeletonBaseClass, 'h-4 flex-1 rounded')} />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-4">
        <div className={cn(skeletonBaseClass, 'h-4 w-32 rounded')} />
        <div className="flex gap-2">
          <div className={cn(skeletonBaseClass, 'h-10 w-24 rounded-lg')} />
          <div className={cn(skeletonBaseClass, 'h-10 w-24 rounded-lg')} />
        </div>
      </div>
    </div>
  )
}

function ChannelListSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {['primary', 'secondary', 'accent', 'muted'].map((color, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
          <div className={cn(skeletonBaseClass, 'size-8 rounded-lg shrink-0')} />
          <div className="flex-1 space-y-1.5">
            <div className={cn(skeletonBaseClass, 'h-4 w-3/4 rounded')} />
            <div className={cn(skeletonBaseClass, 'h-3 w-1/2 rounded')} />
          </div>
          <div className={cn(skeletonBaseClass, 'h-5 w-12 rounded-full')} />
        </div>
      ))}
    </div>
  )
}

function SidebarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6 p-4', className)}>
      <div className="space-y-2">
        <div className={cn(skeletonBaseClass, 'h-8 w-32 rounded-lg')} />
        <div className={cn(skeletonBaseClass, 'h-10 w-full rounded-lg')} />
      </div>
      <div className="space-y-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
            <div className={cn(skeletonBaseClass, 'size-5 rounded shrink-0')} />
            <div className={cn(skeletonBaseClass, 'h-4 flex-1 rounded')} />
          </div>
        ))}
      </div>
      <div className={cn(skeletonBaseClass, 'h-px w-full rounded')} />
      <div className="space-y-1">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
            <div className={cn(skeletonBaseClass, 'size-5 rounded shrink-0')} />
            <div className={cn(skeletonBaseClass, 'h-4 flex-1 rounded')} />
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6 p-6', className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-card border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className={cn(skeletonBaseClass, 'h-4 w-24 rounded')} />
              <div className={cn(skeletonBaseClass, 'size-8 rounded-lg')} />
            </div>
            <div className={cn(skeletonBaseClass, 'h-8 w-16 rounded')} />
            <div className={cn(skeletonBaseClass, 'h-2 w-full rounded-full')} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-card border border-border p-4 space-y-4">
          <div className={cn(skeletonBaseClass, 'h-5 w-32 rounded')} />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn(skeletonBaseClass, 'h-3 flex-1 rounded')} />
                <div className={cn(skeletonBaseClass, 'h-3 w-12 rounded')} />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-card border border-border p-4 space-y-4">
          <div className={cn(skeletonBaseClass, 'h-5 w-40 rounded')} />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cn(skeletonBaseClass, 'h-20 rounded-lg')} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function GenericSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl bg-card border border-border p-6 space-y-4', className)}>
      <div className="flex items-center gap-4">
        <div className={cn(skeletonBaseClass, 'size-12 rounded-xl shrink-0')} />
        <div className="flex-1 space-y-2">
          <div className={cn(skeletonBaseClass, 'h-5 w-1/2 rounded')} />
          <div className={cn(skeletonBaseClass, 'h-4 w-3/4 rounded')} />
        </div>
      </div>
      <div className="space-y-2">
        <div className={cn(skeletonBaseClass, 'h-4 w-full rounded')} />
        <div className={cn(skeletonBaseClass, 'h-4 w-full rounded')} />
        <div className={cn(skeletonBaseClass, 'h-4 w-2/3 rounded')} />
      </div>
    </div>
  )
}

const skeletonComponents: ContentSkeletonComponents = {
  QuestionSkeleton,
  FlashcardSkeleton,
  ExamSkeleton,
  ChannelListSkeleton,
  SidebarSkeleton,
  DashboardSkeleton,
  GenericSkeleton,
}

function SkeletonRenderer({
  type,
  count = 1,
  className,
  progressiveReveal = false,
  revealDelay = 100,
}: SkeletonLoaderProps & { progressiveReveal?: boolean; revealDelay?: number }) {
  const [visibleCount, setVisibleCount] = useState(progressiveReveal ? 0 : count)

  useEffect(() => {
    if (!progressiveReveal) {
      setVisibleCount(count)
      return
    }

    let current = 0
    const interval = setInterval(() => {
      current++
      setVisibleCount(current)
      if (current >= count) {
        clearInterval(interval)
      }
    }, revealDelay)

    return () => clearInterval(interval)
  }, [count, progressiveReveal, revealDelay])

  const Component =
    skeletonComponents[
      `${type.charAt(0).toUpperCase() + type.slice(1)}Skeleton` as keyof ContentSkeletonComponents
    ] || GenericSkeleton

  return (
    <>
      {Array.from({ length: visibleCount }).map((_, i) => (
        <Component key={i} className={cn(progressiveReveal && 'animate-fade-in', className)} />
      ))}
    </>
  )
}

interface SkeletonLoaderWrapperProps {
  isLoading: boolean
  skeleton?: ContentSkeletonType
  skeletonCount?: number
  children: ReactNode
  fallback?: ReactNode
  progressiveReveal?: boolean
  className?: string
  minHeight?: string
  transitionDuration?: number
}

function SkeletonLoaderWrapper({
  isLoading,
  skeleton = 'generic',
  skeletonCount = 3,
  children,
  fallback,
  progressiveReveal = false,
  className,
  minHeight = '200px',
  transitionDuration = 300,
}: SkeletonLoaderWrapperProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowContent(true), 50)
      return () => clearTimeout(timer)
    }
    setShowContent(false)
    return undefined
  }, [isLoading])

  if (isLoading) {
    if (fallback) return <>{fallback}</>
    return (
      <div className={cn('skeleton-wrapper', className)} style={{ minHeight }}>
        <SkeletonRenderer
          type={skeleton}
          count={skeletonCount}
          progressiveReveal={progressiveReveal}
        />
      </div>
    )
  }

  return (
    <div
      className={cn('content-transition', showContent ? 'opacity-100' : 'opacity-0', className)}
      style={{ transition: `opacity ${transitionDuration}ms ease-out` }}
    >
      {children}
    </div>
  )
}

interface UseSkeletonLoaderOptions<T> {
  data: T | undefined
  isLoading: boolean
  skeletonType?: ContentSkeletonType
  skeletonCount?: number
  progressiveReveal?: boolean
}

function useSkeletonLoader<T>({
  data,
  isLoading,
  skeletonType = 'generic',
  skeletonCount = 3,
  progressiveReveal = false,
}: UseSkeletonLoaderOptions<T>) {
  const shouldShowSkeleton = isLoading || data === undefined

  const skeletonProps = {
    isLoading: shouldShowSkeleton,
    skeleton: skeletonType,
    skeletonCount,
    progressiveReveal,
  }

  return { shouldShowSkeleton, skeletonProps }
}

export {
  SkeletonRenderer,
  SkeletonLoaderWrapper,
  useSkeletonLoader,
  QuestionSkeleton,
  FlashcardSkeleton,
  ExamSkeleton,
  ChannelListSkeleton,
  SidebarSkeleton,
  DashboardSkeleton,
  GenericSkeleton,
}

export type {
  SkeletonLoaderProps,
  ContentSkeletonComponents,
  SkeletonLoaderWrapperProps,
  UseSkeletonLoaderOptions,
}
