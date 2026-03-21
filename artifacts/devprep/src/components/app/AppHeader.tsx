import { Sun, Moon, Search } from 'lucide-react'
import type { Channel } from '@/data/channels'

interface AppHeaderProps {
  currentChannel: Channel
  theme: 'dark' | 'light'
  onThemeToggle: () => void
  onSearchOpen: () => void
  onRealtimeDashboard?: () => void
}

export function AppHeader({
  currentChannel: ch,
  theme,
  onThemeToggle,
  onSearchOpen,
}: AppHeaderProps) {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-between px-6 border-b border-border/50 bg-background/80 backdrop-blur-md"
      style={{ height: 56 }}
      data-testid="header"
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <span className="font-headline text-base font-bold tracking-tight text-foreground">
          Dev<span className="text-primary/80">Prep</span>
        </span>
        {ch && (
          <>
            <span className="text-border text-lg font-light">/</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground tracking-wide">
                {ch.emoji} {ch.name}
              </span>
              {ch.certCode && (
                <span
                  className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full border"
                  style={{
                    color: ch.color,
                    background: ch.color + '15',
                    borderColor: ch.color + '30',
                  }}
                >
                  {ch.certCode}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          data-testid="search-button"
          onClick={onSearchOpen}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
          title="Search (Cmd+K)"
          aria-label="Search"
        >
          <Search size={15} />
        </button>
        <button
          data-testid="theme-toggle"
          onClick={onThemeToggle}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </div>
  )
}
