import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'

interface StackProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /**
   * Direction of the stack
   */
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  /**
   * Gap size between items
   */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Whether to wrap items
   */
  wrap?: boolean
  /**
   * Alignment along cross axis
   */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  /**
   * Alignment along main axis
   */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
}

const directionClasses = {
  row: 'flex-row',
  column: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'column-reverse': 'flex-col-reverse',
}

const gapClasses = {
  none: 'gap-0',
  xs: 'gap-1 sm:gap-2',
  sm: 'gap-2 sm:gap-3 md:gap-4',
  md: 'gap-3 sm:gap-4 md:gap-6 lg:gap-8',
  lg: 'gap-4 sm:gap-6 md:gap-8 lg:gap-10',
  xl: 'gap-6 sm:gap-8 md:gap-10 lg:gap-12',
}

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
}

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    {
      children,
      direction = 'column',
      gap = 'md',
      wrap = false,
      align = 'stretch',
      justify = 'start',
      className = '',
      ...props
    },
    ref
  ) => {
    const directionClass = directionClasses[direction]
    const gapClass = gapClasses[gap]
    const alignClass = alignClasses[align]
    const justifyClass = justifyClasses[justify]
    const wrapClass = wrap ? 'flex-wrap' : 'flex-nowrap'

    return (
      <div
        ref={ref}
        className={`flex ${directionClass} ${gapClass} ${alignClass} ${justifyClass} ${wrapClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Stack.displayName = 'Stack'
