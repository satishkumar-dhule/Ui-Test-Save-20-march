import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ToastProps {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  onClose: () => void
}

export interface ToastItemProps extends ToastProps {
  className?: string
}

export function ToastItem({
  id,
  title,
  description,
  variant = 'default',
  duration = 5000,
  action,
  onClose,
  className,
}: ToastItemProps) {
  const [isExiting, setIsExiting] = React.useState(false)
  const progressRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onClose, 150)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(onClose, 150)
  }

  const variantStyles = {
    default: {
      icon: 'text-[var(--text-primary)]',
      border: 'border-[var(--border-primary)]',
    },
    success: {
      icon: 'text-[var(--semantic-success)]',
      border: 'border-[var(--semantic-success)]',
    },
    warning: {
      icon: 'text-[var(--semantic-warning)]',
      border: 'border-[var(--semantic-warning)]',
    },
    error: {
      icon: 'text-[var(--semantic-error)]',
      border: 'border-[var(--semantic-error)]',
    },
    info: {
      icon: 'text-[var(--semantic-info)]',
      border: 'border-[var(--semantic-info)]',
    },
  }

  const getVariantIcon = () => {
    switch (variant) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
    }
  }

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-4 bg-[var(--surface-primary)]',
        'border rounded-xl shadow-lg',
        variantStyles[variant].border,
        'animate-toast-in',
        isExiting && 'animate-toast-out',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className={cn('flex-shrink-0 w-5 h-5', variantStyles[variant].icon)}>
        {getVariantIcon()}
      </div>

      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>}
        {description && <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>}
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'mt-2 px-3 py-1 text-sm font-medium rounded-md transition-colors',
              'border border-[var(--brand-primary)] text-[var(--brand-primary)]',
              'hover:bg-[var(--brand-primary-subtle)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]'
            )}
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        onClick={handleClose}
        className={cn(
          'flex-shrink-0 p-1 rounded-md transition-colors',
          'text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]'
        )}
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {duration > 0 && (
        <div
          ref={progressRef}
          className="absolute bottom-0 left-0 h-0.5 bg-[var(--brand-primary)] rounded-b-xl animate-toast-progress"
          style={{ animationDuration: `${duration}ms` }}
        />
      )}
    </div>
  )
}

export interface ToasterProps {
  toasts: ToastProps[]
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'
  className?: string
}

export function Toaster({ toasts, position = 'bottom-right', className }: ToasterProps) {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  }

  return (
    <div
      className={cn(
        'fixed z-[100] flex flex-col gap-3 pointer-events-none max-w-[420px] w-full',
        positionClasses[position],
        className
      )}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem {...toast} />
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const addToast = React.useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { ...toast, id, onClose: () => removeToast(id) }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = React.useMemo(
    () => ({
      success: (title: string, description?: string) =>
        addToast({ title, description, variant: 'success' }),
      error: (title: string, description?: string) =>
        addToast({ title, description, variant: 'error' }),
      warning: (title: string, description?: string) =>
        addToast({ title, description, variant: 'warning' }),
      info: (title: string, description?: string) =>
        addToast({ title, description, variant: 'info' }),
      default: (title: string, description?: string) =>
        addToast({ title, description, variant: 'default' }),
    }),
    [addToast]
  )

  return { toasts, toast, addToast, removeToast }
}

export default ToastItem
