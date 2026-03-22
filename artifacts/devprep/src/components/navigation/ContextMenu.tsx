import * as React from 'react'
import { ChevronRight, Check, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Enhanced ContextMenu props
export interface ContextMenuProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  modal?: boolean
}

export interface ContextMenuTriggerProps {
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export interface ContextMenuContentProps {
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

export interface ContextMenuItemProps {
  children: React.ReactNode
  className?: string
  disabled?: boolean
  onSelect?: () => void
  inset?: boolean
  shortcut?: string
  icon?: React.ReactNode
}

export interface ContextMenuGroupProps {
  children: React.ReactNode
  className?: string
}

export interface ContextMenuLabelProps {
  children: React.ReactNode
  className?: string
  inset?: boolean
}

export interface ContextMenuSeparatorProps {
  className?: string
}

export interface ContextMenuSubProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export interface ContextMenuCheckboxItemProps {
  children: React.ReactNode
  className?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
}

export interface ContextMenuRadioGroupProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

export interface ContextMenuRadioItemProps {
  children: React.ReactNode
  className?: string
  value: string
  disabled?: boolean
}

export interface ContextMenuSubContentProps {
  children: React.ReactNode
  className?: string
}

export interface ContextMenuSubTriggerProps {
  children: React.ReactNode
  className?: string
  inset?: boolean
  icon?: React.ReactNode
}

export interface ContextMenuShortcutProps {
  children: React.ReactNode
  className?: string
}

// Context for context menu state
interface ContextMenuContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  position: { x: number; y: number }
  setPosition: (position: { x: number; y: number }) => void
  contentRef: React.RefObject<HTMLDivElement | null>
}

const ContextMenuContext = React.createContext<ContextMenuContextValue | null>(null)

// Main ContextMenu component
export function ContextMenu({ children, open: controlledOpen, onOpenChange, modal = true }: ContextMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
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
      if (contentRef.current && !contentRef.current.contains(target)) {
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

  const value = React.useMemo(() => ({
    open,
    setOpen,
    position,
    setPosition,
    contentRef,
  }), [open, setOpen, position])

  return (
    <ContextMenuContext.Provider value={value}>
      <div className="relative">
        {children}
      </div>
    </ContextMenuContext.Provider>
  )
}

// ContextMenuTrigger
export const ContextMenuTrigger = React.forwardRef<HTMLDivElement, ContextMenuTriggerProps>(
  ({ children, className, disabled, ...props }, ref) => {
    const context = React.useContext(ContextMenuContext)
    if (!context) throw new Error('ContextMenuTrigger must be used within ContextMenu')

    const { setOpen, setPosition } = context

    const handleContextMenu = (event: React.MouseEvent) => {
      if (disabled) return
      
      event.preventDefault()
      setPosition({ x: event.clientX, y: event.clientY })
      setOpen(true)
    }

    return (
      <div
        ref={ref}
        className={cn('inline-block', disabled && 'opacity-50 cursor-not-allowed', className)}
        onContextMenu={handleContextMenu}
        data-disabled={disabled ? '' : undefined}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ContextMenuTrigger.displayName = 'ContextMenuTrigger'

// ContextMenuContent
export const ContextMenuContent = React.forwardRef<HTMLDivElement, ContextMenuContentProps>(
  ({ children, className, align = 'start', side = 'bottom', sideOffset = 4, ...props }, ref) => {
    const context = React.useContext(ContextMenuContext)
    if (!context) throw new Error('ContextMenuContent must be used within ContextMenu')

    const { open, position, contentRef } = context

    if (!open) return null

    const combinedRef = React.useCallback((node: HTMLDivElement | null) => {
      ;(contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    }, [ref, contentRef])

    // Calculate position based on mouse position
    const style = {
      left: position.x,
      top: position.y,
    }

    return (
      <div
        ref={combinedRef}
        role="menu"
        aria-orientation="vertical"
        className={cn(
          'fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
          'animate-in fade-in-0 zoom-in-95',
          className
        )}
        style={style}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ContextMenuContent.displayName = 'ContextMenuContent'

// ContextMenuItem
export const ContextMenuItem = React.forwardRef<HTMLDivElement, ContextMenuItemProps>(
  ({ children, className, disabled, onSelect, inset, shortcut, icon, ...props }, ref) => {
    const context = React.useContext(ContextMenuContext)
    if (!context) throw new Error('ContextMenuItem must be used within ContextMenu')

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
        {shortcut && (
          <span className="ml-auto text-xs tracking-widest opacity-60">
            {shortcut}
          </span>
        )}
      </div>
    )
  }
)
ContextMenuItem.displayName = 'ContextMenuItem'

// ContextMenuGroup
export const ContextMenuGroup = React.forwardRef<HTMLDivElement, ContextMenuGroupProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="group"
        className={cn('', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ContextMenuGroup.displayName = 'ContextMenuGroup'

// ContextMenuLabel
export const ContextMenuLabel = React.forwardRef<HTMLDivElement, ContextMenuLabelProps>(
  ({ children, className, inset, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'px-2 py-1.5 text-sm font-semibold',
          inset && 'pl-8',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ContextMenuLabel.displayName = 'ContextMenuLabel'

// ContextMenuSeparator
export const ContextMenuSeparator = React.forwardRef<HTMLDivElement, ContextMenuSeparatorProps>(
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
ContextMenuSeparator.displayName = 'ContextMenuSeparator'

// ContextMenuSub
export const ContextMenuSub = React.forwardRef<HTMLDivElement, ContextMenuSubProps>(
  ({ children, open: controlledOpen, onOpenChange }, ref) => {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen

    const setOpen = React.useCallback((newOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    }, [isControlled, onOpenChange])

    return (
      <div ref={ref} className="relative">
        {React.Children.map(children, (child) => {
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
ContextMenuSub.displayName = 'ContextMenuSub'

// ContextMenuSubTrigger
export const ContextMenuSubTrigger = React.forwardRef<HTMLDivElement, ContextMenuSubTriggerProps>(
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
ContextMenuSubTrigger.displayName = 'ContextMenuSubTrigger'

// ContextMenuSubContent
export const ContextMenuSubContent = React.forwardRef<HTMLDivElement, ContextMenuSubContentProps>(
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
ContextMenuSubContent.displayName = 'ContextMenuSubContent'

// ContextMenuCheckboxItem
export const ContextMenuCheckboxItem = React.forwardRef<HTMLDivElement, ContextMenuCheckboxItemProps>(
  ({ children, className, checked, onCheckedChange, disabled, ...props }, ref) => {
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
  }
)
ContextMenuCheckboxItem.displayName = 'ContextMenuCheckboxItem'

// ContextMenuRadioGroup
export const ContextMenuRadioGroup = React.forwardRef<HTMLDivElement, ContextMenuRadioGroupProps>(
  ({ children, value, onValueChange, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="radiogroup"
        className={cn('', className)}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              selected: child.props.value === value,
              onSelect: () => onValueChange?.(child.props.value),
            })
          }
          return child
        })}
      </div>
    )
  }
)
ContextMenuRadioGroup.displayName = 'ContextMenuRadioGroup'

// ContextMenuRadioItem
export const ContextMenuRadioItem = React.forwardRef<HTMLDivElement, ContextMenuRadioItemProps>(
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
ContextMenuRadioItem.displayName = 'ContextMenuRadioItem'

// ContextMenuShortcut
export const ContextMenuShortcut: React.FC<ContextMenuShortcutProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <span
      className={cn('ml-auto text-xs tracking-widest opacity-60', className)}
      {...props}
    >
      {children}
    </span>
  )
}
ContextMenuShortcut.displayName = 'ContextMenuShortcut'

// Export all components
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuShortcut,
}