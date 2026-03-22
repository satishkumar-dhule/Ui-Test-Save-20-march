import {
  forwardRef,
  type ReactNode,
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
} from 'react'

interface ResponsiveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  className?: string
}

const variantClasses = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  outline: 'border border-border hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
}

const sizeClasses = {
  sm: 'min-h-[var(--touch-target-sm)] min-w-[var(--touch-target-sm)] px-3 py-2 text-sm',
  md: 'min-h-[var(--touch-target)] min-w-[var(--touch-target)] px-4 py-2.5 text-base',
  lg: 'min-h-[var(--touch-target-lg)] min-w-[var(--touch-target-lg)] px-5 py-3 text-lg',
  xl: 'min-h-[var(--touch-target-xl)] min-w-[var(--touch-target-xl)] px-6 py-4 text-xl',
}

export const ResponsiveButton = forwardRef<HTMLButtonElement, ResponsiveButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      icon,
      iconPosition = 'left',
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      inline-flex items-center justify-center gap-2
      font-medium rounded-lg
      transition-all duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
      disabled:opacity-50 disabled:pointer-events-none
      touch-feedback
    `

    return (
      <button
        ref={ref}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${fullWidth ? 'w-full' : ''}
          ${loading ? 'cursor-wait' : ''}
          ${className}
        `}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && icon && iconPosition === 'left' && icon}
        <span>{children}</span>
        {!loading && icon && iconPosition === 'right' && icon}
      </button>
    )
  }
)

ResponsiveButton.displayName = 'ResponsiveButton'

// Responsive icon button
interface ResponsiveIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  className?: string
}

const iconSizeClasses = {
  sm: 'min-h-[var(--touch-target-sm)] min-w-[var(--touch-target-sm)] p-2',
  md: 'min-h-[var(--touch-target)] min-w-[var(--touch-target)] p-2.5',
  lg: 'min-h-[var(--touch-target-lg)] min-w-[var(--touch-target-lg)] p-3',
}

export const ResponsiveIconButton = forwardRef<HTMLButtonElement, ResponsiveIconButtonProps>(
  ({ icon, label, size = 'md', variant = 'ghost', className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center rounded-lg
          transition-all duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          touch-feedback
          ${iconSizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
        aria-label={label}
        {...props}
      >
        {icon}
      </button>
    )
  }
)

ResponsiveIconButton.displayName = 'ResponsiveIconButton'

// Responsive link
interface ResponsiveLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode
  variant?: 'default' | 'muted' | 'accent' | 'destructive'
  underline?: 'always' | 'hover' | 'none'
  className?: string
}

const linkVariantClasses = {
  default: 'text-foreground hover:text-primary',
  muted: 'text-muted-foreground hover:text-foreground',
  accent: 'text-accent-foreground hover:text-accent',
  destructive: 'text-destructive hover:text-destructive-foreground',
}

const underlineClasses = {
  always: 'underline underline-offset-4',
  hover: 'hover:underline hover:underline-offset-4',
  none: 'no-underline',
}

export const ResponsiveLink = forwardRef<HTMLAnchorElement, ResponsiveLinkProps>(
  ({ children, variant = 'default', underline = 'hover', className = '', ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={`
          inline-flex items-center gap-1
          font-medium transition-colors duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          ${linkVariantClasses[variant]}
          ${underlineClasses[underline]}
          ${className}
        `}
        {...props}
      >
        {children}
      </a>
    )
  }
)

ResponsiveLink.displayName = 'ResponsiveLink'
