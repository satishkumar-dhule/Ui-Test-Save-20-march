import { type HTMLAttributes } from 'react'

interface SpacerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Size of the spacer
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  /**
   * Axis to apply spacing
   */
  axis?: 'horizontal' | 'vertical' | 'both'
}

const sizeClasses = {
  xs: {
    horizontal: 'w-1 h-px',
    vertical: 'h-1 w-px',
    both: 'w-1 h-1',
  },
  sm: {
    horizontal: 'w-2 h-px',
    vertical: 'h-2 w-px',
    both: 'w-2 h-2',
  },
  md: {
    horizontal: 'w-4 h-px',
    vertical: 'h-4 w-px',
    both: 'w-4 h-4',
  },
  lg: {
    horizontal: 'w-6 h-px',
    vertical: 'h-6 w-px',
    both: 'w-6 h-6',
  },
  xl: {
    horizontal: 'w-8 h-px',
    vertical: 'h-8 w-px',
    both: 'w-8 h-8',
  },
  '2xl': {
    horizontal: 'w-12 h-px',
    vertical: 'h-12 w-px',
    both: 'w-12 h-12',
  },
  '3xl': {
    horizontal: 'w-16 h-px',
    vertical: 'h-16 w-px',
    both: 'w-16 h-16',
  },
  '4xl': {
    horizontal: 'w-24 h-px',
    vertical: 'h-24 w-px',
    both: 'w-24 h-24',
  },
}

export function Spacer({ size = 'md', axis = 'vertical', className = '', ...props }: SpacerProps) {
  const sizeClass = sizeClasses[size][axis]

  return <div className={`${sizeClass} shrink-0 ${className}`} aria-hidden="true" {...props} />
}
