import { Sun, Moon, Search, Menu } from 'lucide-react'
import type { Channel } from '@/data/channels'
import type { Theme } from '@/hooks/useTheme'

interface AppHeaderProps {
  currentChannel: Channel
  theme: Theme
  onThemeToggle: () => void
  onSearchOpen: () => void
  onRealtimeDashboard?: () => void
  onMenuToggle?: () => void
}

export function AppHeader({
  currentChannel: ch,
  theme,
  onThemeToggle,
  onSearchOpen,
  onMenuToggle,
}: AppHeaderProps) {
  return (
    <div
      className="glass-vision-nav flex-shrink-0 flex items-center justify-between px-4 sm:px-6 min-h-[52px] z-40"
      data-testid="header"
    >
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="glass-vision-btn md:hidden w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-xl"
            aria-label="Open navigation menu"
          >
            <Menu size={20} className="opacity-80 hover:opacity-100 transition-opacity" />
          </button>
        )}

        {/* Logo */}
        <span className="font-headline text-lg sm:text-xl font-bold tracking-tight text-foreground">
          Dev<span className="text-primary/80">Prep</span>
        </span>

        {/* Desktop channel info */}
        {ch && (
          <>
            <span className="text-border text-xl font-light hidden sm:block">/</span>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm sm:text-base text-muted-foreground tracking-wide truncate max-w-[120px] sm:max-w-none">
                {ch.emoji} {ch.name}
              </span>
              {ch.certCode && (
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border hidden sm:inline"
                  style={{
                    color: ch.color,
                    background: ch.color + '20',
                    borderColor: ch.color + '40',
                  }}
                >
                  {ch.certCode}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile channel indicator */}
        {ch && (
          <div className="glass-vision-card-sm sm:hidden flex items-center gap-2 px-3 py-2 rounded-xl">
            <span className="text-base">{ch.emoji}</span>
            <span className="text-sm text-muted-foreground truncate max-w-[80px]">
              {ch.shortName || ch.name}
            </span>
          </div>
        )}

        {/* Search button */}
        <button
          data-testid="search-button"
          onClick={onSearchOpen}
          className="glass-vision-btn w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          title="Search (Cmd+K)"
          aria-label="Search"
        >
          <Search size={18} className="opacity-80 hover:opacity-100 transition-opacity" />
        </button>

        {/* Theme toggle */}
        <button
          data-testid="theme-toggle"
          onClick={onThemeToggle}
          aria-label="Toggle theme"
          className="glass-vision-btn w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun size={18} className="opacity-80 hover:opacity-100 transition-opacity" />
          ) : (
            <Moon size={18} className="opacity-80 hover:opacity-100 transition-opacity" />
          )}
        </button>
      </div>
    </div>
  )
}
