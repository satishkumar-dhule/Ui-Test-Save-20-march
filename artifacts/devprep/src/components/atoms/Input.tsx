import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export type InputType = 'text' | 'password' | 'email' | 'search' | 'number' | 'tel' | 'url'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: InputType
  error?: boolean
  helperText?: string
  leftElement?: React.ReactNode
  rightElement?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      error = false,
      helperText,
      leftElement,
      rightElement,
      disabled,
      id,
      'aria-describedby': ariaDescribedby,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId()
    const helperId = `${inputId}-helper`
    const hasHelper = !!(helperText || error)

    const borderColor = error
      ? 'border-destructive focus:ring-destructive/20'
      : 'border-input focus:border-primary focus:ring-primary/20'

    return (
      <div className="w-full">
        <div
          className={cn(
            'flex items-center w-full rounded-lg',
            'bg-background border transition-colors duration-150',
            'focus-within:ring-2',
            borderColor,
            disabled && 'opacity-50 cursor-not-allowed bg-muted',
            leftElement && 'has-[leftElement]:pl-3',
            rightElement && 'has-[rightElement]:pr-3',
            className
          )}
        >
          {leftElement && (
            <span className="flex items-center text-muted-foreground pl-3">{leftElement}</span>
          )}
          <input
            ref={ref}
            type={type}
            id={inputId}
            disabled={disabled}
            aria-invalid={error}
            aria-describedby={hasHelper ? helperId : undefined}
            className={cn(
              'flex-1 min-w-0 px-4 py-3',
              'bg-transparent text-sm text-foreground placeholder:text-muted-foreground',
              'outline-none',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium'
            )}
            {...props}
          />
          {rightElement && (
            <span className="flex items-center text-muted-foreground pr-3">{rightElement}</span>
          )}
        </div>
        {hasHelper && (
          <p
            id={helperId}
            className={cn('mt-1.5 text-xs', error ? 'text-destructive' : 'text-muted-foreground')}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
