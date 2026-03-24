import { cn } from '@/lib/utils/cn'
import { forwardRef } from 'react'

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  variant?: 'default' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  indeterminate?: boolean
  showValue?: boolean
  label?: string
}

const variantClasses = {
  default: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value,
      max = 100,
      variant = 'default',
      size = 'md',
      indeterminate = false,
      showValue = false,
      label,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    const reducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    return (
      <div ref={ref} className={cn('w-full flex flex-col gap-1', className)} {...props}>
        {(label || showValue) && (
          <div className="flex justify-between items-center">
            {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
            {showValue && (
              <span className="text-sm text-text-secondary">{Math.round(percentage)}%</span>
            )}
          </div>
        )}
        <div
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
          className={cn('w-full bg-neutral-200 rounded-full overflow-hidden', sizeClasses[size])}
        >
          {!indeterminate ? (
            <div
              className={cn(
                'h-full rounded-full transition-all duration-350',
                variantClasses[variant]
              )}
              style={{ width: `${percentage}%` }}
            />
          ) : (
            <div
              className={cn(
                'h-full rounded-full',
                variantClasses[variant],
                !reducedMotion && 'animate-pulse'
              )}
              style={{
                width: '30%',
                animation: !reducedMotion
                  ? 'progress-indeterminate 1.5s ease-in-out infinite'
                  : 'none',
              }}
            />
          )}
        </div>
        <style>{`
          @keyframes progress-indeterminate {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(400%); }
          }
        `}</style>
      </div>
    )
  }
)
ProgressBar.displayName = 'ProgressBar'
