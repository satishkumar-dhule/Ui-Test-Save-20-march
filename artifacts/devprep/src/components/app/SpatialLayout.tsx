import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'

/**
 * Spatial Computing Layout Components
 * Depth, layering, and spatial layout utilities for Apple Glass Theme
 */

interface SpatialContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'glass' | 'elevated' | 'flat'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  depth?: 1 | 2 | 3 | 4 | 5
  className?: string
}

const sizeClasses = {
  sm: 'spatial-container-sm',
  md: 'spatial-container-md',
  lg: 'spatial-container-lg',
  xl: 'spatial-container-xl',
}

const variantClasses = {
  default: 'spatial-container',
  glass: 'spatial-container-glass glass',
  elevated: 'spatial-container depth-3',
  flat: 'spatial-container depth-1',
}

const depthClasses = {
  1: 'depth-1',
  2: 'depth-2',
  3: 'depth-3',
  4: 'depth-4',
  5: 'depth-5',
}

export const SpatialContainer = forwardRef<HTMLDivElement, SpatialContainerProps>(
  ({ children, variant = 'default', size = 'md', depth, className = '', ...props }, ref) => {
    const classes = [
      variantClasses[variant],
      sizeClasses[size],
      depth ? depthClasses[depth] : '',
      'spatial-transition',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)

SpatialContainer.displayName = 'SpatialContainer'

// ============================================================================
// Spatial Card Components
// ============================================================================

interface SpatialCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'glass' | 'glass-primary' | 'glass-secondary'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  hover?: boolean
  className?: string
}

const cardVariantClasses = {
  default: 'card-spatial',
  glass: 'card-spatial-glass glass',
  'glass-primary': 'card-spatial-glass glass-primary',
  'glass-secondary': 'card-spatial-glass glass-secondary',
}

const cardSizeClasses = {
  sm: 'card-spatial-sm',
  md: 'card-spatial-md',
  lg: 'card-spatial-lg',
  xl: 'card-spatial-xl',
}

export const SpatialCard = forwardRef<HTMLDivElement, SpatialCardProps>(
  ({ children, variant = 'default', size = 'md', hover = true, className = '', ...props }, ref) => {
    const classes = [
      cardVariantClasses[variant],
      cardSizeClasses[size],
      hover ? 'spatial-hover' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    )
  }
)

SpatialCard.displayName = 'SpatialCard'

// ============================================================================
// Spatial Grid System
// ============================================================================

interface SpatialGridProps {
  children: ReactNode
  columns?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const gridGapClasses = {
  none: 'gap-none',
  xs: 'gap-xs',
  sm: 'gap-sm',
  md: 'gap-md',
  lg: 'gap-lg',
  xl: 'gap-xl',
}

export function SpatialGrid({
  children,
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className = '',
}: SpatialGridProps) {
  const gridCols = `grid-cols-${columns.default || 1}`
  const smCols = columns.sm ? `sm:grid-cols-${columns.sm}` : ''
  const mdCols = columns.md ? `md:grid-cols-${columns.md}` : ''
  const lgCols = columns.lg ? `lg:grid-cols-${columns.lg}` : ''
  const xlCols = columns.xl ? `xl:grid-cols-${columns.xl}` : ''

  return (
    <div
      className={`grid ${gridGapClasses[gap]} ${gridCols} ${smCols} ${mdCols} ${lgCols} ${xlCols} ${className}`}
    >
      {children}
    </div>
  )
}

// ============================================================================
// Spatial Layout Components
// ============================================================================

interface SpatialStackProps {
  children: ReactNode
  direction?: 'vertical' | 'horizontal'
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  wrap?: boolean
  align?: 'start' | 'center' | 'end' | 'stretch' | 'between'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  className?: string
}

const stackGapClasses = {
  none: 'gap-none',
  xs: 'gap-xs',
  sm: 'gap-sm',
  md: 'gap-md',
  lg: 'gap-lg',
  xl: 'gap-xl',
}

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  between: 'items-between',
}

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
}

export function SpatialStack({
  children,
  direction = 'vertical',
  gap = 'md',
  wrap = false,
  align = 'stretch',
  justify = 'start',
  className = '',
}: SpatialStackProps) {
  const isVertical = direction === 'vertical'
  const baseClass = isVertical ? 'flex flex-col' : 'flex flex-row'

  return (
    <div
      className={`${baseClass} ${stackGapClasses[gap]} ${alignClasses[align]} ${justifyClasses[justify]} ${
        wrap ? 'flex-wrap' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

// ============================================================================
// Spatial Page Layout
// ============================================================================

interface SpatialPageLayoutProps {
  children: ReactNode
  variant?: 'default' | 'centered' | 'sidebar' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const pagePaddingClasses = {
  none: 'p-0',
  sm: 'p-responsive',
  md: 'p-responsive',
  lg: 'p-responsive',
  xl: 'p-responsive',
}

const pageVariantClasses = {
  default: 'w-full min-h-full page-container',
  centered: 'w-full min-h-full flex items-center justify-center page-container',
  sidebar: 'w-full min-h-full flex flex-col md:flex-row page-container',
  full: 'w-full min-h-full page-container',
}

export function SpatialPageLayout({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
}: SpatialPageLayoutProps) {
  return (
    <div className={`${pageVariantClasses[variant]} ${pagePaddingClasses[padding]} ${className}`}>
      {children}
    </div>
  )
}

// ============================================================================
// Spatial Card Grid
// ============================================================================

interface SpatialCardGridProps {
  children: ReactNode
  minCardWidth?: number
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const cardGridGapClasses = {
  none: 'gap-none',
  xs: 'gap-xs',
  sm: 'gap-sm',
  md: 'gap-md',
  lg: 'gap-lg',
  xl: 'gap-xl',
}

export function SpatialCardGrid({
  children,
  minCardWidth = 320,
  gap = 'md',
  className = '',
}: SpatialCardGridProps) {
  return (
    <div
      className={`grid-spatial ${cardGridGapClasses[gap]} ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
      }}
    >
      {children}
    </div>
  )
}

// ============================================================================
// Spatial Depth Utilities
// ============================================================================

interface SpatialDepthProps {
  children: ReactNode
  depth?: 1 | 2 | 3 | 4 | 5
  glass?: boolean
  className?: string
}

export function SpatialDepth({
  children,
  depth = 2,
  glass = false,
  className = '',
}: SpatialDepthProps) {
  const depthClass = glass ? `depth-glass-${depth}` : `depth-${depth}`

  return <div className={`${depthClass} ${className}`}>{children}</div>
}

// ============================================================================
// Spatial Layer Utilities
// ============================================================================

interface SpatialLayerProps {
  children: ReactNode
  layer?: 1 | 2 | 3
  className?: string
}

const layerClasses = {
  1: 'layer-1',
  2: 'layer-2',
  3: 'layer-3',
}

export function SpatialLayer({ children, layer = 1, className = '' }: SpatialLayerProps) {
  return <div className={`${layerClasses[layer]} ${className}`}>{children}</div>
}
