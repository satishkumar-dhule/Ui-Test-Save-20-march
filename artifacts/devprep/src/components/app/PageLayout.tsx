import { type ReactNode, type HTMLAttributes } from 'react'

interface PageLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'centered' | 'sidebar' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-2 sm:p-3 md:p-4',
  md: 'p-3 sm:p-4 md:p-6 lg:p-8',
  lg: 'p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16',
}

const variantClasses = {
  default: 'w-full min-h-full',
  centered: 'w-full min-h-full flex items-center justify-center',
  sidebar: 'w-full min-h-full flex flex-col md:flex-row',
  full: 'w-full min-h-full',
}

export function PageLayout({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  ...props
}: PageLayoutProps) {
  return (
    <div
      className={`${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// Mobile-first page section
interface PageSectionProps {
  children: ReactNode
  title?: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function PageSection({
  children,
  title,
  subtitle,
  actions,
  className = '',
}: PageSectionProps) {
  return (
    <section className={`space-mobile-y ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            {title && <h2 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h2>}
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

// Mobile-first page header
interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  breadcrumbs?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`space-y-4 mb-6 ${className}`}>
      {breadcrumbs && <div className="text-sm text-muted-foreground">{breadcrumbs}</div>}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

// Mobile-first content container
interface ContentContainerProps {
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
}

export function ContentContainer({
  children,
  maxWidth = 'full',
  className = '',
}: ContentContainerProps) {
  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto w-full ${className}`}>{children}</div>
  )
}

// Mobile-first responsive card grid
interface CardGridProps {
  children: ReactNode
  minCardWidth?: number
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

const gapClasses = {
  sm: 'gap-2 sm:gap-3 md:gap-4',
  md: 'gap-3 sm:gap-4 md:gap-6 lg:gap-8',
  lg: 'gap-4 sm:gap-6 md:gap-8 lg:gap-10',
}

export function CardGrid({
  children,
  minCardWidth = 280,
  gap = 'md',
  className = '',
}: CardGridProps) {
  return (
    <div
      className={`grid gap-4 ${gapClasses[gap]} ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
      }}
    >
      {children}
    </div>
  )
}
