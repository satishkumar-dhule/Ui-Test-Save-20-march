import * as React from 'react'
import { ChevronDown, ChevronRight, Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Enhanced DropdownMenu props
export interface DropdownMenuProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
}

export interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

export interface DropdownMenuContentProps {
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
}

export interface DropdownMenuItemProps {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  onSelect?: () => void
  inset?: boolean
  shortcut?: string
  icon?: React.ReactNode
}

export interface DropdownMenuGroupProps {
  children: React.ReactNode
  className?: string
}

export interface DropdownMenuLabelProps {
  children: React.ReactNode
  className?: string
  inset?: boolean
}

export interface DropdownMenuSeparatorProps {
  className?: string
}

export interface DropdownMenuSubProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export interface DropdownMenuCheckboxItemProps {
  children: React.ReactNode
  className?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

export interface DropdownMenuRadioGroupProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

export interface DropdownMenuRadioItemProps {
  children: React.ReactNode
  className?: string
  value: string
  disabled?: boolean
}

export interface DropdownMenuSubContentProps {
  children: React.ReactNode
  className?: string
}

export interface DropdownMenuSubTriggerProps {
  children: React.ReactNode
  className?: string
  inset?: boolean
  icon?: React.ReactNode
}

export interface DropdownMenuShortcutProps {
  children: React.ReactNode
  className?: string
}

// Context for dropdown menu state
interface DropdownMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null)

// Main DropdownMenu component
export function DropdownMenu({
  children,
  open: controlledOpen,
  onOpenChange,
  modal = true,
}: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    },
    [isControlled, onOpenChange]
  )

  // Handle click outside
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

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      triggerRef,
      contentRef,
    }),
    [open, setOpen]
  )

  return (
    <DropdownMenuContext.Provider value={value}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

// DropdownMenuTrigger
export const DropdownMenuTrigger = React.forwardRef<HTMLElement, DropdownMenuTriggerProps>(
  ({ children, asChild = false, className, ...props }, ref) => {
    const context = React.useContext(DropdownMenuContext)
    if (!context) throw new Error('DropdownMenuTrigger must be used within DropdownMenu')

    const { open, setOpen, triggerRef } = context

    const handleClick = () => {
      setOpen(!open)
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault()
        setOpen(true)
      }
    }

    const combinedRef = React.useCallback(
      (node: HTMLElement | null) => {
        ;(triggerRef as React.MutableRefObject<HTMLElement | null>).current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLElement | null>).current = node
        }
      },
      [ref, triggerRef]
    )

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref: combinedRef,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        'aria-expanded': open,
        'aria-haspopup': 'menu',
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
        aria-haspopup="menu"
        {...props}
      >
        {children}
        <ChevronDown className={cn('ml-2 h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
    )
  }
)
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

// DropdownMenuContent
export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ children, className, align = 'start', side = 'bottom', sideOffset = 4, ...props }, ref) => {
    const context = React.useContext(DropdownMenuContext)
    if (!context) throw new Error('DropdownMenuContent must be used within DropdownMenu')

    const { open, contentRef } = context

    if (!open) return null

    const combinedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        ;(contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      },
      [ref, contentRef]
    )

    // Calculate position based on side and align
    const positionClasses = {
      top: 'bottom-full mb-1',
      bottom: 'top-full mt-1',
      left: 'right-full mr-1',
      right: 'left-full ml-1',
    }

    const alignClasses = {
      start: side === 'top' || side === 'bottom' ? 'left-0' : 'top-0',
      center:
        side === 'top' || side === 'bottom'
          ? 'left-1/2 -translate-x-1/2'
          : 'top-1/2 -translate-y-1/2',
      end: side === 'top' || side === 'bottom' ? 'right-0' : 'bottom-0',
    }

    return (
      <div
        ref={combinedRef}
        role="menu"
        aria-orientation="vertical"
        className={cn(
          'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
          'animate-in fade-in-0 zoom-in-95',
          positionClasses[side],
          alignClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DropdownMenuContent.displayName = 'DropdownMenuContent'

// DropdownMenuItem
export const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ children, className, disabled, onSelect, inset, shortcut, icon, ...props }, ref) => {
    const context = React.useContext(DropdownMenuContext)
    if (!context) throw new Error('DropdownMenuItem must be used within DropdownMenu')

    const { setOpen } = context

    const handleClick = () => {
      if (!disabled) {
        onSelect?.()
        setOpen(false)
      }
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleClick()
      }
    }

    return (
      <div
        ref={ref}
        role="menuitem"
        tabIndex={disabled ? -1 : 0}
        className={cn(
          'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
          'focus:bg-accent focus:text-accent-foreground',
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          '[&>svg]:size-4 [&>svg]:shrink-0',
          inset && 'pl-8',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        data-disabled={disabled ? '' : undefined}
        {...props}
      >
        {icon}
        {children}
        {shortcut && <span className="ml-auto text-xs tracking-widest opacity-60">{shortcut}</span>}
      </div>
    )
  }
)
DropdownMenuItem.displayName = 'DropdownMenuItem'

// DropdownMenuGroup
export const DropdownMenuGroup = React.forwardRef<HTMLDivElement, DropdownMenuGroupProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} role="group" className={cn('', className)} {...props}>
        {children}
      </div>
    )
  }
)
DropdownMenuGroup.displayName = 'DropdownMenuGroup'

// DropdownMenuLabel
export const DropdownMenuLabel = React.forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
  ({ children, className, inset, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

// DropdownMenuSeparator
export const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, DropdownMenuSeparatorProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="separator"
        className={cn('-mx-1 my-1 h-px bg-muted', className)}
        {...props}
      />
    )
  }
)
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

// DropdownMenuSub
export const DropdownMenuSub = React.forwardRef<HTMLDivElement, DropdownMenuSubProps>(
  ({ children, open: controlledOpen, onOpenChange }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen

    const setOpen = React.useCallback(
      (newOpen: boolean) => {
        if (!isControlled) {
          setInternalOpen(newOpen)
        }
        onOpenChange?.(newOpen)
      },
      [isControlled, onOpenChange]
    )

    return (
      <div ref={ref} className="relative">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              open,
              setOpen,
            })
          }
          return child
        })}
      </div>
    )
  }
)
DropdownMenuSub.displayName = 'DropdownMenuSub'

// DropdownMenuSubTrigger
export const DropdownMenuSubTrigger = React.forwardRef<HTMLDivElement, DropdownMenuSubTriggerProps>(
  ({ children, className, inset, icon, ...props }, ref) => {
    const [open, setOpen] = React.useState(false)

    const handleClick = () => {
      setOpen(!open)
    }

    return (
      <div
        ref={ref}
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={open}
        tabIndex={0}
        className={cn(
          'flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
          'focus:bg-accent focus:text-accent-foreground',
          'data-[state=open]:bg-accent',
          inset && 'pl-8',
          className
        )}
        onClick={handleClick}
        data-state={open ? 'open' : 'closed'}
        {...props}
      >
        {icon}
        {children}
        <ChevronRight className="ml-auto h-4 w-4" />
      </div>
    )
  }
)
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger'

// DropdownMenuSubContent
export const DropdownMenuSubContent = React.forwardRef<HTMLDivElement, DropdownMenuSubContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="menu"
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg',
          'animate-in fade-in-0 zoom-in-95',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent'

// DropdownMenuCheckboxItem
export const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuCheckboxItemProps
>(({ children, className, checked, onCheckedChange, disabled, ...props }, ref) => {
  const handleClick = () => {
    if (!disabled) {
      onCheckedChange?.(!checked)
    }
  }

  return (
    <div
      ref={ref}
      role="menuitemcheckbox"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onClick={handleClick}
      data-disabled={disabled ? '' : undefined}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
})
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem'

// DropdownMenuRadioGroup
export const DropdownMenuRadioGroup = React.forwardRef<HTMLDivElement, DropdownMenuRadioGroupProps>(
  ({ children, value, onValueChange, className, ...props }, ref) => {
    return (
      <div ref={ref} role="radiogroup" className={cn('', className)} {...props}>
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
              selected: (child.props as { value?: string }).value === value,
              onSelect: () => onValueChange?.((child.props as { value?: string }).value || ''),
            })
          }
          return child
        })}
      </div>
    )
  }
)
DropdownMenuRadioGroup.displayName = 'DropdownMenuRadioGroup'

// DropdownMenuRadioItem
export const DropdownMenuRadioItem = React.forwardRef<HTMLDivElement, DropdownMenuRadioItemProps>(
  ({ children, className, value, disabled, ...props }, ref) => {
    const selected = (props as any).selected
    const onSelect = (props as any).onSelect

    const handleClick = () => {
      if (!disabled) {
        onSelect?.()
      }
    }

    return (
      <div
        ref={ref}
        role="menuitemradio"
        aria-checked={selected}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
          'focus:bg-accent focus:text-accent-foreground',
          'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
        onClick={handleClick}
        data-disabled={disabled ? '' : undefined}
        data-state={selected ? 'checked' : 'unchecked'}
        {...props}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {selected && <Circle className="h-2 w-2 fill-current" />}
        </span>
        {children}
      </div>
    )
  }
)
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem'

// DropdownMenuShortcut
export const DropdownMenuShortcut: React.FC<DropdownMenuShortcutProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <span className={cn('ml-auto text-xs tracking-widest opacity-60', className)} {...props}>
      {children}
    </span>
  )
}
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'

// DropdownMenuIcon
export interface DropdownMenuIconProps {
  children: React.ReactNode
  className?: string
}

export const DropdownMenuIcon: React.FC<DropdownMenuIconProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <span className={cn('[&>svg]:size-4 [&>svg]:shrink-0', className)} {...props}>
      {children}
    </span>
  )
}
DropdownMenuIcon.displayName = 'DropdownMenuIcon'
