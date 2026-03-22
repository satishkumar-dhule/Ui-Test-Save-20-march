import { forwardRef, type ReactNode, type HTMLAttributes } from 'react'

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /**
   * Maximum width variant
   * - 'sm': 640px
   * - 'md': 768px
   * - 'lg': 1024px
   * - 'xl': 1280px
   * - '2xl': 1536px
   * - 'full': 100%
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /**
   * Horizontal padding variant
   */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Whether to center horizontally
   */
  centered?: boolean
  /**
   * Whether to fill available height
   */
  fluid?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
}

const paddingClasses = {
  none: 'px-0',
  sm: 'px-4 sm:px-6 md:px-8',
  md: 'px-6 sm:px-8 md:px-12 lg:px-16',
  lg: 'px-8 sm:px-12 md:px-16 lg:px-20 xl:px-24',
  xl: 'px-10 sm:px-16 md:px-20 lg:px-24 xl:px-32',
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      children,
      size = 'lg',
      padding = 'md',
      centered = true,
      fluid = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = fluid ? 'w-full h-full' : 'w-full'
    const centerClasses = centered ? 'mx-auto' : ''
    const sizeClass = sizeClasses[size]
    const paddingClass = paddingClasses[padding]

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${centerClasses} ${sizeClass} ${paddingClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Container.displayName = 'Container'
