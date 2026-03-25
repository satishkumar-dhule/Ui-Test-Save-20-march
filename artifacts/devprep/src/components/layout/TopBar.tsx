import { Sun, Moon, Search, Menu, ChevronRight, Zap } from 'lucide-react'
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

const SECTION_LABELS: Record<Section, { label: string; color: string }> = {
  qa: { label: 'Q&A', color: '#388bfd' },
  flashcards: { label: 'Flashcards', color: '#3fb950' },
  exam: { label: 'Mock Exam', color: '#ff7b72' },
  voice: { label: 'Voice Practice', color: '#bc8cff' },
  coding: { label: 'Coding', color: '#f7df1e' },
  stats: { label: 'Statistics', color: '#39d3f4' },
}

export function TopBar({
  currentChannel,
  section,
  theme,
  onThemeToggle,
  onSearchOpen,
  onMobileMenuOpen,
}: TopBarProps) {
  const sectionInfo = SECTION_LABELS[section]

  return (
    <header className="topbar" role="banner" data-testid="header">
      <button
        className="topbar-mobile-menu md:hidden"
        onClick={onMobileMenuOpen}
        aria-label="Open navigation menu"
      >
        <Menu size={17} aria-hidden="true" />
      </button>

      <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
        <ol className="topbar-breadcrumb-list" aria-label="Current location">
          <li className="topbar-breadcrumb-item">
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--dp-text-2)',
              }}
            >
              <Zap size={13} style={{ color: 'var(--dp-blue)' }} aria-hidden="true" />
              DevPrep
            </span>
          </li>

          {currentChannel && (
            <>
              <li className="topbar-breadcrumb-separator" aria-hidden="true">
                <ChevronRight size={11} />
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
            <ChevronRight size={11} />
          </li>

          <li className="topbar-breadcrumb-item">
            <span
              className="topbar-breadcrumb-section"
              aria-current="page"
              style={{
                color: sectionInfo.color,
                background: sectionInfo.color + '18',
                padding: '2px 8px',
                borderRadius: 'var(--dp-r-full)',
                fontSize: 12,
                fontWeight: 700,
                border: `1px solid ${sectionInfo.color}33`,
              }}
            >
              {sectionInfo.label}
            </span>
          </li>
        </ol>
      </nav>

      <div style={{ flex: 1 }} />

      <button
        className="topbar-search"
        onClick={onSearchOpen}
        data-testid="search-button"
        aria-label="Search content (⌘K)"
      >
        <Search size={13} aria-hidden="true" />
        <span className="topbar-search-label">Search content...</span>
        <kbd className="topbar-search-kbd">⌘K</kbd>
      </button>

      <button
        className="topbar-icon-btn"
        onClick={onThemeToggle}
        data-testid="theme-toggle"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <Sun size={15} aria-hidden="true" />
        ) : (
          <Moon size={15} aria-hidden="true" />
        )}
      </button>
    </header>
  )
}
