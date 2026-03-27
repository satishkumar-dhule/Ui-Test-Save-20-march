import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'

interface ResponsiveCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'outlined' | 'elevated' | 'glass'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  containerQuery?: boolean
  touchFeedback?: boolean
  className?: string
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-3 sm:p-4 lg:p-5',
  md: 'p-4 sm:p-5 lg:p-6',
  lg: 'p-5 sm:p-6 lg:p-8',
  xl: 'p-6 sm:p-8 lg:p-10',
}

const variantClasses = {
  default: 'bg-card border border-border',
  outlined: 'bg-transparent border border-border',
  elevated: 'bg-card border border-border shadow-md hover:shadow-lg transition-shadow',
  glass: 'bg-background/80 backdrop-blur-md border border-border/50',
}

export const ResponsiveCard = forwardRef<HTMLDivElement, ResponsiveCardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      containerQuery = true,
      touchFeedback = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const containerClass = containerQuery ? 'container-query-card' : ''
    const touchClass = touchFeedback ? 'touch-feedback' : ''

    return (
      <div
        ref={ref}
        className={`
          ${containerClass}
          ${variantClasses[variant]} 
          ${paddingClasses[padding]} 
          ${touchClass}
          rounded-xl
          transition-all duration-200
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ResponsiveCard.displayName = 'ResponsiveCard'

// Container query responsive card with layout adaptation
interface AdaptiveCardProps {
  children: ReactNode
  title?: string
  icon?: ReactNode
  actions?: ReactNode
  className?: string
}

export function AdaptiveCard({
  children,
  title,
  icon,
  actions,
  className = '',
}: AdaptiveCardProps) {
  return (
    <div className={`container-query-card card-responsive ${className}`}>
      {(title || icon || actions) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex-shrink-0 flex items-center justify-center text-primary">
                {icon}
              </div>
            )}
            {title && <h3 className="text-responsive-lg font-semibold text-foreground">{title}</h3>}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      )}
      <div className="text-left">{children}</div>
    </div>
  )
}

// Responsive card grid with container queries
interface ResponsiveCardGridProps {
  children: ReactNode
  minItemWidth?: number
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const gapClasses = {
  none: 'gap-0',
  sm: 'gap-2 sm:gap-3 lg:gap-4',
  md: 'gap-3 sm:gap-4 lg:gap-6',
  lg: 'gap-4 sm:gap-6 lg:gap-8',
  xl: 'gap-6 sm:gap-8 lg:gap-10',
}

export function ResponsiveCardGrid({
  children,
  minItemWidth = 280,
  gap = 'md',
  className = '',
}: ResponsiveCardGridProps) {
  return (
    <div
      className={`grid-responsive-auto ${gapClasses[gap]} ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
      }}
    >
      {children}
    </div>
  )
}

// Mobile-first responsive card with touch optimization
interface MobileResponsiveCardProps {
  children: ReactNode
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
  className?: string
}

export function MobileResponsiveCard({
  children,
  onClick,
  selected = false,
  disabled = false,
  className = '',
}: MobileResponsiveCardProps) {
  const isInteractive = !!onClick && !disabled

  return (
    <div
      className={`
        card-responsive
        ${isInteractive ? 'cursor-pointer' : ''}
        ${selected ? 'ring-2 ring-primary' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isInteractive ? 'touch-feedback' : ''}
        ${className}
      `}
      style={{ touchAction: isInteractive ? 'manipulation' : undefined }}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-pressed={isInteractive ? selected : undefined}
      aria-disabled={disabled}
      onKeyDown={
        isInteractive
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  )
}

// Responsive card with image
interface ImageCardProps {
  imageSrc: string
  imageAlt: string
  title: string
  description?: string
  badge?: string
  className?: string
}

export function ImageCard({
  imageSrc,
  imageAlt,
  title,
  description,
  badge,
  className = '',
}: ImageCardProps) {
  return (
    <div className={`container-query-card overflow-hidden ${className}`}>
      <div className="relative">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-40 object-cover sm:h-48 lg:h-56"
          loading="lazy"
        />
        {badge && (
          <span className="absolute top-3 right-3 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-md">
            {badge}
          </span>
        )}
      </div>
      <div className="p-4 sm:p-5 lg:p-6">
        <h3 className="text-responsive-lg font-semibold mb-2">{title}</h3>
        {description && <p className="text-responsive-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}

// Responsive stats card
interface StatsCardProps {
  label: string
  value: string | number
  change?: number
  icon?: ReactNode
  className?: string
}

export function StatsCard({ label, value, change, icon, className = '' }: StatsCardProps) {
  return (
    <div className={`container-query-card card-responsive ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-responsive-sm text-muted-foreground">{label}</p>
          <p className="text-responsive-2xl font-bold">{value}</p>
          {change !== undefined && (
            <p
              className={`text-responsive-xs ${change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
            >
              {change >= 0 ? '+' : ''}
              {change}%
            </p>
          )}
        </div>
        {icon && <div className="flex-shrink-0 text-muted-foreground">{icon}</div>}
      </div>
    </div>
  )
}
