import { cn } from '@/lib/utils/cn'
import { forwardRef } from 'react'

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'filled' | 'outlined'
  color?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  removable?: boolean
  onRemove?: () => void
  clickable?: boolean
  onClick?: () => void
  avatar?: React.ReactNode
  icon?: React.ReactNode
}

const colorClasses = {
  primary: {
    filled: 'bg-primary-500 text-white',
    outlined: 'border border-primary-500 text-primary-500 bg-transparent',
    default: 'bg-primary-100 text-primary-700',
  },
  secondary: {
    filled: 'bg-secondary-500 text-white',
    outlined: 'border border-secondary-500 text-secondary-500 bg-transparent',
    default: 'bg-secondary-100 text-secondary-700',
  },
  neutral: {
    filled: 'bg-neutral-600 text-white',
    outlined: 'border border-neutral-400 text-neutral-600 bg-transparent',
    default: 'bg-neutral-100 text-neutral-700',
  },
  success: {
    filled: 'bg-success-500 text-white',
    outlined: 'border border-success-500 text-success-500 bg-transparent',
    default: 'bg-success-100 text-success-700',
  },
  warning: {
    filled: 'bg-warning-500 text-white',
    outlined: 'border border-warning-500 text-warning-500 bg-transparent',
    default: 'bg-warning-100 text-warning-700',
  },
  error: {
    filled: 'bg-error-500 text-white',
    outlined: 'border border-error-500 text-error-500 bg-transparent',
    default: 'bg-error-100 text-error-700',
  },
}

const sizeClasses = {
  sm: 'text-xs px-2.5 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
}

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  (
    {
      className,
      variant = 'default',
      color = 'neutral',
      size = 'md',
      removable,
      onRemove,
      clickable,
      onClick,
      avatar,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    const isInteractive = clickable || onClick

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium transition-all',
          colorClasses[color][variant],
          sizeClasses[size],
          isInteractive && 'cursor-pointer hover:opacity-90 active:opacity-80',
          className
        )}
        {...(isInteractive && { role: 'button', tabIndex: 0, onClick })}
        {...props}
      >
        {avatar && <span className="w-5 h-5 rounded-full">{avatar}</span>}
        {icon && <span className="w-4 h-4">{icon}</span>}
        {children}
        {removable && onRemove && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onRemove()
            }}
            aria-label={`Remove ${children}`}
            className="ml-1 w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </span>
    )
  }
)
Tag.displayName = 'Tag'
