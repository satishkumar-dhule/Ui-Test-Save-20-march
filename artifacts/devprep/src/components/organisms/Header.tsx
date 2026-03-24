import * as React from 'react'
import { cn } from '@/lib/utils'
import { useNewTheme } from '@/hooks/useNewTheme'

export interface HeaderProps {
  logo?: React.ReactNode
  title?: string
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
  showMenuButton?: boolean
  onMenuClick?: () => void
  className?: string
}

export function Header({
  logo,
  title,
  leftContent,
  rightContent,
  showMenuButton = false,
  onMenuClick,
  className,
}: HeaderProps) {
  const { isDark } = useNewTheme()

  return (
    <header
      className={cn(
        'flex items-center justify-between h-16 px-4 bg-[var(--bg-primary)] border-b border-[var(--border-primary)]',
        className
      )}
      role="banner"
    >
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className={cn(
              'p-2 rounded-lg transition-colors lg:hidden',
              'hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]'
            )}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}
        {logo}
        {title && <h1 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h1>}
        {leftContent}
      </div>

      <div className="flex items-center gap-3">{rightContent}</div>
    </header>
  )
}

export default Header
