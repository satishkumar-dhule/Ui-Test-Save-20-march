import * as React from 'react'
import { cn } from '@/lib/utils'
import { useNewTheme } from '@/hooks/useNewTheme'

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  hideCloseButton?: boolean
  onClose?: () => void
}

export interface AlertModalProps extends ModalProps {
  title: string
  description?: string
  cancelText?: string
  confirmText?: string
  onCancel?: () => void
  onConfirm?: () => void
  variant?: 'default' | 'danger'
}

export function Modal({ open, onOpenChange, children }: ModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-[var(--bg-overlay)] animate-overlay-show"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      {children}
    </div>
  )
}

export function ModalContent({
  size = 'md',
  hideCloseButton = false,
  onClose,
  children,
  className,
  ...props
}: ModalContentProps) {
  const { isDark } = useNewTheme()

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
  }

  return (
    <div
      className={cn(
        'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
        'bg-[var(--surface-primary)] rounded-2xl shadow-[var(--shadow-xl)]',
        'w-[calc(100%-2rem)] animate-content-show',
        sizeClasses[size],
        className
      )}
      role="document"
      {...props}
    >
      {!hideCloseButton && (
        <button
          className={cn(
            'absolute right-4 top-4 p-2 rounded-lg transition-colors',
            'text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]'
          )}
          onClick={onClose}
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
      {children}
    </div>
  )
}

export function ModalHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-6 py-4 border-b border-[var(--border-secondary)]', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function ModalTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('text-lg font-semibold text-[var(--text-primary)]', className)} {...props}>
      {children}
    </h2>
  )
}

export function ModalDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-[var(--text-secondary)] mt-1', className)} {...props}>
      {children}
    </p>
  )
}

export function ModalBody({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-6 py-4 overflow-y-auto max-h-[calc(100vh-16rem)]', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function ModalFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex justify-end gap-3 px-6 py-4 border-t border-[var(--border-secondary)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function AlertModal({
  open,
  onOpenChange,
  title,
  description,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  onCancel,
  onConfirm,
  variant = 'default',
}: AlertModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          {description && <ModalDescription>{description}</ModalDescription>}
        </ModalHeader>
        <ModalFooter>
          <button
            onClick={() => {
              onCancel?.()
              onOpenChange(false)
            }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'border border-[var(--border-primary)] text-[var(--text-primary)]',
              'hover:bg-[var(--surface-hover)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]'
            )}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm?.()
              onOpenChange(false)
            }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              variant === 'danger'
                ? 'bg-[var(--semantic-error)] text-white hover:opacity-90'
                : 'bg-[var(--brand-primary)] text-[var(--brand-primary-text)] hover:opacity-90',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]'
            )}
          >
            {confirmText}
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default Modal
