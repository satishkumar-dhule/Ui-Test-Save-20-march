import { cn } from '@/lib/utils/cn'

interface StatSkeletonProps {
  variant?: 'single' | 'card' | 'compact' | 'with-chart'
  className?: string
}

export function StatSkeleton({ variant = 'card', className }: StatSkeletonProps) {
  const baseClasses = 'animate-pulse'

  switch (variant) {
    case 'single':
      return (
        <div className={cn('flex items-center gap-3', className)}>
          <div
            className={cn('h-4 w-20 rounded', baseClasses)}
            style={{ backgroundColor: 'var(--theme-bg-muted)' }}
          />
          <div
            className={cn('h-6 w-12 rounded', baseClasses)}
            style={{ backgroundColor: 'var(--theme-bg-muted)' }}
          />
        </div>
      )

    case 'compact':
      return (
        <div className={cn('flex items-center gap-2', className)}>
          <div
            className={cn('size-6 rounded-md', baseClasses)}
            style={{ backgroundColor: 'var(--theme-bg-muted)' }}
          />
          <div
            className={cn('h-5 w-16 rounded', baseClasses)}
            style={{ backgroundColor: 'var(--theme-bg-muted)' }}
          />
        </div>
      )

    case 'with-chart':
      return (
        <div className={cn('flex items-center gap-4', className)}>
          <div className="flex-1 space-y-2">
            <div
              className={cn('h-3 w-16 rounded', baseClasses)}
              style={{ backgroundColor: 'var(--theme-bg-muted)' }}
            />
            <div
              className={cn('h-6 w-12 rounded', baseClasses)}
              style={{ backgroundColor: 'var(--theme-bg-muted)' }}
            />
          </div>
          <div
            className={cn('w-20 h-10 rounded', baseClasses)}
            style={{ backgroundColor: 'var(--theme-bg-muted)' }}
          />
        </div>
      )

    case 'card':
    default:
      return (
        <div
          className={cn(
            'rounded-xl border border-[var(--theme-border-base)] bg-[var(--theme-surface-base)] p-4',
            className
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className={cn('h-4 w-20 rounded', baseClasses)}
              style={{ backgroundColor: 'var(--theme-bg-muted)' }}
            />
            <div
              className={cn('size-8 rounded-lg', baseClasses)}
              style={{ backgroundColor: 'var(--theme-bg-muted)' }}
            />
          </div>
          <div
            className={cn('h-8 w-16 rounded mb-2', baseClasses)}
            style={{ backgroundColor: 'var(--theme-bg-muted)' }}
          />
          <div
            className={cn('h-2 w-20 rounded-full', baseClasses)}
            style={{ backgroundColor: 'var(--theme-bg-muted)' }}
          />
        </div>
      )
  }
}

export function StatsCardSkeleton({ className }: { className?: string }) {
  return <StatSkeleton variant="card" className={className} />
}

export function StatsRowSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <StatSkeleton key={i} variant="card" />
      ))}
    </div>
  )
}

export function ProgressBarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div
          className={cn('h-4 w-24 rounded animate-pulse')}
          style={{ backgroundColor: 'var(--theme-bg-muted)' }}
        />
        <div
          className={cn('h-4 w-12 rounded animate-pulse')}
          style={{ backgroundColor: 'var(--theme-bg-muted)' }}
        />
      </div>
      <div
        className={cn('h-3 w-full rounded-full overflow-hidden animate-pulse')}
        style={{ backgroundColor: 'var(--theme-bg-muted)' }}
      >
        <div
          className={cn('h-full w-1/2 rounded-full')}
          style={{ backgroundColor: 'var(--theme-bg-muted)' }}
        />
      </div>
    </div>
  )
}

export function MiniChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('h-[50px] w-full rounded animate-pulse', className)}
      style={{ backgroundColor: 'var(--theme-bg-muted)' }}
    />
  )
}

export default StatSkeleton
