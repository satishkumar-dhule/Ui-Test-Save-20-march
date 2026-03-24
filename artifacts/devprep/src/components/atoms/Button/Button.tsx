import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    if (loading) {
      return (
        <button
          ref={ref}
          className={cn(buttonVariants({ variant, size, className }), 'gap-2')}
          disabled={isDisabled}
          aria-busy="true"
          {...props}
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading</span>
          {children}
        </button>
      )
    }

    const content = (
      <>
        {leftIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {children}
        {rightIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </>
    )

    if (asChild && React.isValidElement<{ className?: string }>(children)) {
      const childClassName = (children as React.ReactElement<{ className?: string }>).props
        .className
      return React.cloneElement(children, {
        className: cn(buttonVariants({ variant, size, className }), childClassName),
        ref,
        disabled: isDisabled,
        'aria-disabled': isDisabled,
        ...props,
      } as React.HTMLAttributes<HTMLElement>)
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }), 'gap-2')}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        {...props}
      >
        {content}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
