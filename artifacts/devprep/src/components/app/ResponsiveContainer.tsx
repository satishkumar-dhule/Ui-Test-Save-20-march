import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'

interface ResponsiveContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'narrow' | 'wide' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const paddingClasses = {
  none: 'px-0',
  sm: 'px-2 sm:px-3 md:px-4',
  md: 'px-3 sm:px-4 md:px-6 lg:px-8',
  lg: 'px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16',
  xl: 'px-6 sm:px-8 md:px-12 lg:px-16 xl:px-20',
}

const variantClasses = {
  default: 'max-w-4xl mx-auto w-full',
  narrow: 'max-w-2xl mx-auto w-full',
  wide: 'max-w-7xl mx-auto w-full',
  full: 'w-full',
}

export const ResponsiveContainer = forwardRef<HTMLDivElement, ResponsiveContainerProps>(
  ({ children, variant = 'default', padding = 'md', className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`container-mobile ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ResponsiveContainer.displayName = 'ResponsiveContainer'

// Mobile-first grid system
interface ResponsiveGridProps {
  children: ReactNode
  columns?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const gapClasses = {
  none: 'gap-0',
  sm: 'gap-2 sm:gap-3 md:gap-4',
  md: 'gap-3 sm:gap-4 md:gap-6 lg:gap-8',
  lg: 'gap-4 sm:gap-6 md:gap-8 lg:gap-10',
  xl: 'gap-6 sm:gap-8 md:gap-10 lg:gap-12',
}

export function ResponsiveGrid({
  children,
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className = '',
}: ResponsiveGridProps) {
  const gridCols = `grid-cols-${columns.default || 1}`
  const smCols = columns.sm ? `sm:grid-cols-${columns.sm}` : ''
  const mdCols = columns.md ? `md:grid-cols-${columns.md}` : ''
  const lgCols = columns.lg ? `lg:grid-cols-${columns.lg}` : ''
  const xlCols = columns.xl ? `xl:grid-cols-${columns.xl}` : ''

  return (
    <div
      className={`grid ${gridCols} ${smCols} ${mdCols} ${lgCols} ${xlCols} ${gapClasses[gap]} ${className}`}
    >
      {children}
    </div>
  )
}

// Mobile-first card component
interface MobileCardProps {
  children: ReactNode
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

const cardPaddingClasses = {
  none: 'p-0',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-4 sm:p-6 md:p-8',
}

const cardVariantClasses = {
  default: 'bg-card border border-border',
  outlined: 'bg-transparent border border-border',
  elevated: 'bg-card border border-border shadow-md hover:shadow-lg',
}

export function MobileCard({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
}: MobileCardProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={`${cardVariantClasses[variant]} ${cardPaddingClasses[padding]} rounded-xl transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:bg-card/95 active:scale-[0.98]' : ''
      } ${className}`}
    >
      {children}
    </Component>
  )
}

// Mobile-first stack layout
interface StackProps {
  children: ReactNode
  direction?: 'vertical' | 'horizontal'
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  wrap?: boolean
  align?: 'start' | 'center' | 'end' | 'stretch' | 'between'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  className?: string
}

const stackGapClasses = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
}

const stackAlignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  between: 'items-between',
}

const stackJustifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
}

export function Stack({
  children,
  direction = 'vertical',
  gap = 'md',
  wrap = false,
  align = 'stretch',
  justify = 'start',
  className = '',
}: StackProps) {
  const isVertical = direction === 'vertical'
  const baseClass = isVertical ? 'flex flex-col' : 'flex flex-row'

  return (
    <div
      className={`${baseClass} ${stackGapClasses[gap]} ${stackAlignClasses[align]} ${stackJustifyClasses[justify]} ${
        wrap ? 'flex-wrap' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

// Mobile-first spacer
interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  axis?: 'vertical' | 'horizontal'
}

const spacerSizes = {
  xs: '1',
  sm: '2',
  md: '4',
  lg: '6',
  xl: '8',
  '2xl': '12',
}

export function Spacer({ size = 'md', axis = 'vertical' }: SpacerProps) {
  const sizeClass = spacerSizes[size]
  const axisClass = axis === 'vertical' ? `h-${sizeClass}` : `w-${sizeClass}`

  return <div className={`${axisClass} shrink-0`} aria-hidden="true" />
}

// Mobile-first safe area wrapper
interface SafeAreaProps {
  children: ReactNode
  insets?: ('top' | 'bottom' | 'left' | 'right')[]
  className?: string
}

export function SafeArea({ children, insets = ['bottom'], className = '' }: SafeAreaProps) {
  const insetClasses = insets.map(inset => `safe-area-inset-${inset}`).join(' ')

  return <div className={`${insetClasses} ${className}`}>{children}</div>
}
