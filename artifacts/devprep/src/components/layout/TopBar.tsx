import { Sun, Moon, Search, Menu } from 'lucide-react'
import type { Channel } from '@/data/channels'

interface TopBarProps {
  currentChannel: Channel | undefined
  theme: 'dark' | 'light'
  onThemeToggle: () => void
  onSearchOpen: () => void
  onMobileMenuOpen: () => void
}

export function TopBar({
  currentChannel,
  theme,
  onThemeToggle,
  onSearchOpen,
  onMobileMenuOpen,
}: TopBarProps) {
  return (
    <header className="topbar">
      {/* Mobile menu button */}
      <button className="topbar-mobile-menu md:hidden" onClick={onMobileMenuOpen}>
        <Menu size={18} />
      </button>

      {/* Current channel badge */}
      <div className="topbar-channel">
        {currentChannel && (
          <>
            <span
              className="topbar-channel-emoji"
              style={{ color: currentChannel.color }}
            >
              {currentChannel.emoji}
            </span>
            <span className="topbar-channel-name">{currentChannel.name}</span>
            {currentChannel.type === 'cert' && currentChannel.certCode && (
              <span className="topbar-channel-cert">{currentChannel.certCode}</span>
            )}
          </>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search trigger */}
      <button className="topbar-search" onClick={onSearchOpen}>
        <Search size={14} />
        <span className="topbar-search-label">Search content...</span>
        <kbd className="topbar-search-kbd">⌘K</kbd>
      </button>

      {/* Theme toggle */}
      <button className="topbar-icon-btn" onClick={onThemeToggle} title="Toggle theme">
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </header>
  )
}
