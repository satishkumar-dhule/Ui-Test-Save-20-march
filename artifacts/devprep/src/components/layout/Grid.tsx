import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'

interface GridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /**
   * Number of columns at each breakpoint
   */
  columns?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  /**
   * Gap size between items
   */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Whether to use auto-fit responsive grid
   */
  autoFit?: boolean
  /**
   * Minimum width for auto-fit items (px)
   */
  minItemWidth?: number
}

const gapClasses = {
  none: 'gap-0',
  xs: 'gap-1 sm:gap-2',
  sm: 'gap-2 sm:gap-3 md:gap-4',
  md: 'gap-3 sm:gap-4 md:gap-6 lg:gap-8',
  lg: 'gap-4 sm:gap-6 md:gap-8 lg:gap-10',
  xl: 'gap-6 sm:gap-8 md:gap-10 lg:gap-12',
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  (
    {
      children,
      columns = { default: 1, sm: 2, md: 3, lg: 4 },
      gap = 'md',
      autoFit = false,
      minItemWidth = 280,
      className = '',
      ...props
    },
    ref
  ) => {
    const gapClass = gapClasses[gap]

    if (autoFit) {
      return (
        <div
          ref={ref}
          className={`grid ${gapClass} ${className}`}
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
          }}
          {...props}
        >
          {children}
        </div>
      )
    }

    const gridCols = `grid-cols-${columns.default || 1}`
    const smCols = columns.sm ? `sm:grid-cols-${columns.sm}` : ''
    const mdCols = columns.md ? `md:grid-cols-${columns.md}` : ''
    const lgCols = columns.lg ? `lg:grid-cols-${columns.lg}` : ''
    const xlCols = columns.xl ? `xl:grid-cols-${columns.xl}` : ''
    const cols2xl = columns['2xl'] ? `2xl:grid-cols-${columns['2xl']}` : ''

    return (
      <div
        ref={ref}
        className={`grid ${gridCols} ${smCols} ${mdCols} ${lgCols} ${xlCols} ${cols2xl} ${gapClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Grid.displayName = 'Grid'
