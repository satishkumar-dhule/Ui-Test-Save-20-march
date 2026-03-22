import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Enhanced Popover props
export interface PopoverProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
}

export interface PopoverTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

export interface PopoverContentProps {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  sideOffset?: number
  alignOffset?: number
  avoidCollisions?: boolean
  collisionPadding?: number | Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
  sticky?: 'partial' | 'always'
  hideWhenDetached?: boolean
  forceMount?: boolean
  showCloseButton?: boolean
  closeButtonText?: string
}

export interface PopoverAnchorProps {
  children: React.ReactNode
  className?: string
}

// Context for popover state
interface PopoverContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

// Main Popover component
export function Popover({ children, open: controlledOpen, onOpenChange, modal = false }: PopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [isControlled, onOpenChange])

  // Handle click outside and escape
  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        contentRef.current &&
        !contentRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, setOpen])

  // Focus management
  React.useEffect(() => {
    if (open && contentRef.current) {
      const firstFocusable = contentRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    }
  }, [open])

  const value = React.useMemo(() => ({
    open,
    setOpen,
    triggerRef,
    contentRef,
  }), [open, setOpen])

  return (
    <PopoverContext.Provider value={value}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

// PopoverTrigger
export const PopoverTrigger = React.forwardRef<HTMLElement, PopoverTriggerProps>(
  ({ children, asChild = false, className, ...props }, ref) => {
    const context = React.useContext(PopoverContext)
    if (!context) throw new Error('PopoverTrigger must be used within Popover')

    const { open, setOpen, triggerRef } = context

    const handleClick = () => {
      setOpen(!open)
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        setOpen(true)
      }
    }

    const combinedRef = React.useCallback((node: HTMLElement | null) => {
      ;(triggerRef as React.MutableRefObject<HTMLElement | null>).current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ;(ref as React.MutableRefObject<HTMLElement | null>).current = node
      }
    }, [ref, triggerRef])

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref: combinedRef,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        'aria-expanded': open,
        'aria-haspopup': 'dialog',
        ...props,
      })
    }

    return (
      <button
        ref={combinedRef}
        className={cn('inline-flex items-center justify-center', className)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-haspopup="dialog"
        {...props}
      >
        {children}
      </button>
    )
  }
)
PopoverTrigger.displayName = 'PopoverTrigger'

// PopoverContent
export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ 
    children, 
    className, 
    align = 'center', 
    side = 'bottom', 
    sideOffset = 4, 
    showCloseButton = false,
    closeButtonText = 'Close',
    ...props 
  }, ref) => {
    const context = React.useContext(PopoverContext)
    if (!context) throw new Error('PopoverContent must be used within Popover')

    const { open, setOpen, contentRef } = context

    if (!open) return null

    const combinedRef = React.useCallback((node: HTMLDivElement | null) => {
      ;(contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    }, [ref, contentRef])

    // Calculate position based on side and align
    const positionClasses = {
      top: 'bottom-full mb-2',
      bottom: 'top-full mt-2',
      left: 'right-full mr-2',
      right: 'left-full ml-2',
    }

    const alignClasses = {
      start: side === 'top' || side === 'bottom' ? 'left-0' : 'top-0',
      center: side === 'top' || side === 'bottom' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
      end: side === 'top' || side === 'bottom' ? 'right-0' : 'bottom-0',
    }

    return (
      <div
        ref={combinedRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          'absolute z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none',
          'animate-in fade-in-0 zoom-in-95',
          positionClasses[side],
          alignClasses[align],
          className
        )}
        {...props}
      >
        {showCloseButton && (
          <button
            className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            onClick={() => setOpen(false)}
            aria-label={closeButtonText}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
    )
  }
)
PopoverContent.displayName = 'PopoverContent'

// PopoverAnchor
export const PopoverAnchor = React.forwardRef<HTMLDivElement, PopoverAnchorProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('inline-block', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
PopoverAnchor.displayName = 'PopoverAnchor'

// PopoverArrow
export interface PopoverArrowProps {
  className?: string
  width?: number
  height?: number
}

export const PopoverArrow: React.FC<PopoverArrowProps> = ({
  className,
  width = 10,
  height = 5,
  ...props
}) => {
  return (
    <div
      className={cn('absolute h-2 w-4 rotate-45 rounded-sm bg-popover', className)}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      {...props}
    />
  )
}
PopoverArrow.displayName = 'PopoverArrow'

// PopoverClose
export interface PopoverCloseProps {
  children?: React.ReactNode
  className?: string
  asChild?: boolean
}

export const PopoverClose = React.forwardRef<HTMLButtonElement, PopoverCloseProps>(
  ({ children, className, asChild = false, ...props }, ref) => {
    const context = React.useContext(PopoverContext)
    if (!context) throw new Error('PopoverClose must be used within Popover')

    const { setOpen } = context

    const handleClick = () => {
      setOpen(false)
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        onClick: handleClick,
        ...props,
      })
    }

    return (
      <button
        ref={ref}
        className={cn('', className)}
        onClick={handleClick}
        {...props}
      >
        {children || <X className="h-4 w-4" />}
      </button>
    )
  }
)
PopoverClose.displayName = 'PopoverClose'

// PopoverHeader
export interface PopoverHeaderProps {
  children: React.ReactNode
  className?: string
}

export const PopoverHeader: React.FC<PopoverHeaderProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    >
      {children}
    </div>
  )
}
PopoverHeader.displayName = 'PopoverHeader'

// PopoverTitle
export interface PopoverTitleProps {
  children: React.ReactNode
  className?: string
}

export const PopoverTitle = React.forwardRef<HTMLHeadingElement, PopoverTitleProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
      >
        {children}
      </h3>
    )
  }
)
PopoverTitle.displayName = 'PopoverTitle'

// PopoverDescription
export interface PopoverDescriptionProps {
  children: React.ReactNode
  className?: string
}

export const PopoverDescription = React.forwardRef<HTMLParagraphElement, PopoverDescriptionProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)
PopoverDescription.displayName = 'PopoverDescription'

// PopoverFooter
export interface PopoverFooterProps {
  children: React.ReactNode
  className?: string
}

export const PopoverFooter: React.FC<PopoverFooterProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    >
      {children}
    </div>
  )
}
PopoverFooter.displayName = 'PopoverFooter'

// Export all components
export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverArrow,
  PopoverClose,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverFooter,
}