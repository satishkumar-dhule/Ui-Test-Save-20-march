import { cn } from '@/lib/utils/cn'
import { forwardRef } from 'react'

export interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, htmlFor, error, helperText, required, disabled, children, className }, ref) => {
    const errorId = htmlFor ? `${htmlFor}-error` : undefined
    const helperId = htmlFor ? `${htmlFor}-helper` : undefined

    return (
      <div ref={ref} className={cn('flex flex-col gap-2', className)}>
        <label
          htmlFor={htmlFor}
          className={cn(
            'text-sm font-medium text-text-primary',
            required && "after:content-['_*'] after:text-error-500"
          )}
        >
          {label}
        </label>
        <div className="relative">{children}</div>
        {(helperText || error) && (
          <p
            id={error ? errorId : helperId}
            className={cn(
              'text-xs mt-1 flex items-center gap-1',
              error ? 'text-error-500' : 'text-text-tertiary'
            )}
          >
            {error && <span className="w-1 h-1 rounded-full bg-error-500 inline-block" />}
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)
FormField.displayName = 'FormField'
