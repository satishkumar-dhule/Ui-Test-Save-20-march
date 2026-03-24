import * as React from 'react'
import { cn } from '@/lib/utils'
import { useNewTheme } from '@/hooks/useNewTheme'

export interface SidebarItem {
  id: string
  label: string
  icon?: React.ReactNode
  href?: string
  children?: SidebarItem[]
  badge?: string | number
  badgeVariant?: 'default' | 'primary' | 'secondary' | 'destructive'
  disabled?: boolean
}

export interface SidebarProps {
  items: SidebarItem[]
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
  activeItem?: string
  onItemClick?: (item: SidebarItem) => void
  className?: string
}

interface SidebarSection {
  title?: string
  items: SidebarItem[]
}

export function Sidebar({
  items,
  collapsed = false,
  onCollapse,
  activeItem,
  onItemClick,
  className,
}: SidebarProps) {
  const { isDark, isHighContrast } = useNewTheme()
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set())

  const handleItemClick = (item: SidebarItem) => {
    if (item.disabled) return
    if (item.children && item.children.length > 0) {
      setExpandedItems(prev => {
        const next = new Set(prev)
        if (next.has(item.id)) {
          next.delete(item.id)
        } else {
          next.add(item.id)
        }
        return next
      })
    }
    onItemClick?.(item)
  }

  const renderItem = (item: SidebarItem, depth: number = 0) => {
    const isActive = activeItem === item.id
    const isExpanded = expandedItems.has(item.id)
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.id}>
        <a
          href={item.href || '#'}
          onClick={e => {
            e.preventDefault()
            handleItemClick(item)
          }}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
            isActive
              ? 'bg-[var(--brand-primary-subtle)] text-[var(--brand-primary)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
            item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
            depth > 0 && 'ml-8 border-l border-[var(--border-secondary)]'
          )}
          aria-current={isActive ? 'page' : undefined}
          aria-disabled={item.disabled}
          role={hasChildren ? 'button' : undefined}
          aria-expanded={hasChildren ? isExpanded : undefined}
        >
          {item.icon && <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>}
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    item.badgeVariant === 'destructive'
                      ? 'bg-[var(--semantic-error)] text-white'
                      : item.badgeVariant === 'secondary'
                        ? 'bg-[var(--surface-tertiary)] text-[var(--text-secondary)]'
                        : item.badgeVariant === 'primary'
                          ? 'bg-[var(--brand-primary)] text-[var(--brand-primary-text)]'
                          : 'bg-[var(--brand-primary)] text-white'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </>
          )}
        </a>
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-1">{item.children!.map(child => renderItem(child, depth + 1))}</div>
        )}
      </div>
    )
  }

  const groupedItems = React.useMemo(() => {
    const sections: SidebarSection[] = []
    let currentSection: SidebarSection = { items: [] }

    items.forEach(item => {
      if (item.label.startsWith('---')) {
        if (currentSection.items.length > 0) {
          sections.push(currentSection)
        }
        currentSection = { title: item.label.replace(/^-/g, '').trim(), items: [] }
      } else {
        currentSection.items.push(item)
      }
    })

    if (currentSection.items.length > 0) {
      sections.push(currentSection)
    }

    return sections
  }, [items])

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] transition-all duration-250',
        collapsed ? 'w-[72px]' : 'w-[280px]',
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between px-4 border-b border-[var(--border-secondary)] min-h-[64px]">
        {!collapsed && (
          <div className="flex items-center gap-3 text-lg font-bold text-[var(--text-primary)]">
            <span>DevPrep</span>
          </div>
        )}
        {onCollapse && (
          <button
            onClick={() => onCollapse(!collapsed)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              'hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        {groupedItems.map((section, idx) => (
          <div key={idx} className="mb-6">
            {!collapsed && section.title && (
              <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider px-3 mb-2">
                {section.title}
              </h2>
            )}
            {section.items.map(item => renderItem(item))}
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
