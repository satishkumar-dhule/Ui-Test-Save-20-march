import { type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

interface ResponsiveGridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  columns?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  alignItems?: 'start' | 'center' | 'end' | 'stretch'
  justifyItems?: 'start' | 'center' | 'end' | 'stretch'
  className?: string
}

const gapClasses = {
  none: 'gap-0',
  sm: 'gap-2 sm:gap-3 md:gap-4',
  md: 'gap-3 sm:gap-4 md:gap-6 lg:gap-8',
  lg: 'gap-4 sm:gap-6 md:gap-8 lg:gap-10',
  xl: 'gap-6 sm:gap-8 md:gap-10 lg:gap-12',
  '2xl': 'gap-8 sm:gap-10 md:gap-12 lg:gap-16',
}

const alignItemsClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
}

const justifyItemsClasses = {
  start: 'justify-items-start',
  center: 'justify-items-center',
  end: 'justify-items-end',
  stretch: 'justify-items-stretch',
}

const colClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
}

export function ResponsiveGrid({
  children,
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  alignItems = 'stretch',
  justifyItems = 'stretch',
  className = '',
  ...props
}: ResponsiveGridProps) {
  const defaultCols = columns.default || 1
  const smColsVal = columns.sm
  const mdColsVal = columns.md
  const lgColsVal = columns.lg
  const xlColsVal = columns.xl
  const xxlColsVal = columns['2xl']

  return (
    <div
      className={cn(
        'grid',
        colClasses[defaultCols] || 'grid-cols-1',
        smColsVal && colClasses[smColsVal] ? `sm:${colClasses[smColsVal]}` : '',
        mdColsVal && colClasses[mdColsVal] ? `md:${colClasses[mdColsVal]}` : '',
        lgColsVal && colClasses[lgColsVal] ? `lg:${colClasses[lgColsVal]}` : '',
        xlColsVal && colClasses[xlColsVal] ? `xl:${colClasses[xlColsVal]}` : '',
        xxlColsVal && colClasses[xxlColsVal] ? `2xl:${colClasses[xxlColsVal]}` : '',
        gapClasses[gap],
        alignItemsClasses[alignItems],
        justifyItemsClasses[justifyItems],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Container query responsive grid
interface ContainerQueryGridProps {
  children: ReactNode
  minItemWidth?: number
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const containerGapClasses = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
}

export function ContainerQueryGrid({
  children,
  minItemWidth = 280,
  gap = 'md',
  className = '',
}: ContainerQueryGridProps) {
  return (
    <div
      className={`container-query grid ${containerGapClasses[gap]} ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
      }}
    >
      {children}
    </div>
  )
}

// Masonry-like responsive grid
interface MasonryGridProps {
  children: ReactNode
  columns?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
  }
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function MasonryGrid({
  children,
  columns: _columns = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className = '',
}: MasonryGridProps) {
  return (
    <div
      className={`
        columns-1
        sm:columns-2
        md:columns-3
        lg:columns-4
        ${containerGapClasses[gap]}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// Auto-fit responsive grid with minimum width
interface AutoFitGridProps {
  children: ReactNode
  minWidth?: number
  maxWidth?: string
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function AutoFitGrid({
  children,
  minWidth = 280,
  maxWidth = '1fr',
  gap = 'md',
  className = '',
}: AutoFitGridProps) {
  return (
    <div
      className={`grid gap-responsive ${containerGapClasses[gap]} ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, ${maxWidth}))`,
      }}
    >
      {children}
    </div>
  )
}
