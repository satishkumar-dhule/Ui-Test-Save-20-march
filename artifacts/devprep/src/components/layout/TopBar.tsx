import { Sun, Moon, Search, Menu, ChevronRight } from 'lucide-react'
import type { Channel } from '@/data/channels'
import type { Section } from '@/App'

interface TopBarProps {
  currentChannel: Channel | undefined
  section: Section
  theme: 'dark' | 'light'
  onThemeToggle: () => void
  onSearchOpen: () => void
  onMobileMenuOpen: () => void
}

const SECTION_LABELS: Record<Section, string> = {
  qa: 'Q&A',
  flashcards: 'Flashcards',
  exam: 'Mock Exam',
  voice: 'Voice Practice',
  coding: 'Coding',
}

export function TopBar({
  currentChannel,
  section,
  theme,
  onThemeToggle,
  onSearchOpen,
  onMobileMenuOpen,
}: TopBarProps) {
  return (
    <header className="topbar" role="banner" data-testid="header">
      {/* Mobile menu button */}
      <button
        className="topbar-mobile-menu md:hidden"
        onClick={onMobileMenuOpen}
        aria-label="Open navigation menu"
      >
        <Menu size={18} aria-hidden="true" />
      </button>

      {/* Breadcrumb navigation */}
      <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
        <ol className="topbar-breadcrumb-list" aria-label="You are here">
          <li className="topbar-breadcrumb-item">
            <a href="/" className="topbar-breadcrumb-home" aria-label="DevPrep home">
              DevPrep
            </a>
          </li>
          {currentChannel && (
            <>
              <li className="topbar-breadcrumb-separator" aria-hidden="true">
                <ChevronRight size={12} />
              </li>
              <li className="topbar-breadcrumb-item">
                <span
                  className="topbar-channel-emoji"
                  style={{ color: currentChannel.color }}
                  aria-hidden="true"
                >
                  {currentChannel.emoji}
                </span>
                <span className="topbar-breadcrumb-channel">{currentChannel.name}</span>
              </li>
            </>
          )}
          <li className="topbar-breadcrumb-separator" aria-hidden="true">
            <ChevronRight size={12} />
          </li>
          <li className="topbar-breadcrumb-item">
            <span className="topbar-breadcrumb-section" aria-current="page">
              {SECTION_LABELS[section]}
            </span>
          </li>
        </ol>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search trigger */}
      <button
        className="topbar-search"
        onClick={onSearchOpen}
        data-testid="search-button"
        aria-label="Search content"
      >
        <Search size={14} aria-hidden="true" />
        <span className="topbar-search-label">Search content...</span>
        <kbd className="topbar-search-kbd">⌘K</kbd>
      </button>

      {/* Theme toggle */}
      <button
        className="topbar-icon-btn"
        onClick={onThemeToggle}
        data-testid="theme-toggle"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <Sun size={16} aria-hidden="true" />
        ) : (
          <Moon size={16} aria-hidden="true" />
        )}
      </button>
    </header>
  )
}
