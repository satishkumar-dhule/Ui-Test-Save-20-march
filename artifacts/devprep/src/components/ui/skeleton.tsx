import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export type SkeletonVariant =
  | 'default'
  | 'text'
  | 'heading'
  | 'avatar'
  | 'card'
  | 'button'
  | 'badge'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant
  shimmer?: boolean
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'default', shimmer = true, style, ...props }, ref) => {
    const baseClasses = {
      default: 'h-4 rounded-md',
      text: 'h-4 rounded-sm',
      heading: 'h-6 rounded-md',
      avatar: 'size-10 rounded-full shrink-0',
      card: 'rounded-xl min-h-[120px]',
      button: 'h-10 w-24 rounded-lg',
      badge: 'h-5 w-16 rounded-full',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'bg-muted skeleton-base',
          shimmer && 'skeleton-shimmer-gpu',
          baseClasses[variant],
          className
        )}
        aria-hidden="true"
        role="presentation"
        style={style}
        {...props}
      />
    )
  }
)
Skeleton.displayName = 'Skeleton'

function SkeletonGroup({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('space-y-3 skeleton-group', className)} {...props}>
      {children}
    </div>
  )
}

function SkeletonLine({
  width,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { width?: string | number }) {
  return (
    <Skeleton
      className={cn('h-4', className)}
      style={{ width: width ?? '100%', ...props.style }}
      {...props}
    />
  )
}

function SkeletonBlock({
  width,
  height,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { width?: string | number; height?: string | number }) {
  return (
    <Skeleton
      className={cn('w-full', className)}
      style={{ height: height ?? '1rem', width: width ?? '100%', ...props.style }}
      {...props}
    />
  )
}

export { Skeleton, SkeletonGroup, SkeletonLine, SkeletonBlock }
export type { SkeletonProps }
