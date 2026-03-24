import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
  separator?: React.ReactNode
}

export function Breadcrumbs({ items, className, separator }: BreadcrumbsProps) {
  const defaultSeparator = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )

  return (
    <nav
      className={cn('flex items-center gap-2 text-sm', className)}
      role="navigation"
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-2 list-none">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-[var(--text-tertiary)]" aria-hidden="true">
                  {separator || defaultSeparator}
                </span>
              )}
              {item.current || isLast ? (
                <span
                  className={cn(
                    'font-medium',
                    item.current || isLast
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-tertiary)]'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href || '#'}
                  className={cn(
                    'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                    'transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]'
                  )}
                >
                  {item.label}
                </a>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumbs
