import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface CheckboxProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> {
  /** Unique ID for accessibility association */
  id?: string
  /** ID of the label element that describes this checkbox */
  labelId?: string
}

const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, id, labelId, ...props }, ref) => {
    const checkboxId = id || React.useId()

    return (
      <CheckboxPrimitive.Root
        ref={ref}
        id={checkboxId}
        className={cn(
          'grid place-content-center peer h-[44px] min-w-[44px] shrink-0 rounded-md border-2 border-primary shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground touch-target',
          className
        )}
        aria-labelledby={labelId}
        {...props}
      >
        <CheckboxPrimitive.Indicator className={cn('grid place-content-center text-current')}>
          <Check className="h-5 w-5" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    )
  }
)
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
