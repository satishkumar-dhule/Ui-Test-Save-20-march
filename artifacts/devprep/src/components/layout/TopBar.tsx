import { memo } from 'react'
import { Sun, Moon, Search, Menu, Sparkles } from 'lucide-react'
import type { Channel } from '@/data/channels'
import type { Section } from '@/stores/contentStore'

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

export const TopBar = memo(function TopBar({
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
      {/* ── Left: Mobile menu + Breadcrumb ── */}
      <div className="topbar-left">
        <button
          className="topbar-mobile-menu md:hidden"
          onClick={onMobileMenuOpen}
          aria-label="Open navigation menu"
        >
          <Menu size={18} aria-hidden="true" />
        </button>

        <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
          <ol className="topbar-breadcrumb-list" aria-label="Current location">
            <li className="topbar-breadcrumb-item topbar-breadcrumb-home-item">
              <span className="topbar-brand">
                <Sparkles size={14} className="topbar-brand-icon" aria-hidden="true" />
                <span className="topbar-brand-text">DevPrep</span>
              </span>
            </li>

            {currentChannel && (
              <>
                <li className="topbar-breadcrumb-separator" aria-hidden="true">
                  <span className="topbar-sep-line" />
                </li>
                <li className="topbar-breadcrumb-item topbar-breadcrumb-channel-item">
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
              <span className="topbar-sep-line" />
            </li>

            <li className="topbar-breadcrumb-item" style={{ flexShrink: 0 }}>
              <span
                className="topbar-breadcrumb-section"
                aria-current="page"
                style={{
                  color: sectionInfo.color,
                  background: sectionInfo.color + '18',
                  padding: '3px 10px',
                  borderRadius: 'var(--dp-r-full)',
                  fontSize: 12,
                  fontWeight: 600,
                  border: `1px solid ${sectionInfo.color}33`,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.01em',
                }}
              >
                {sectionInfo.label}
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* ── Center: Search (⌘K hidden on mobile) ── */}
      <button
        className="topbar-search"
        onClick={onSearchOpen}
        data-testid="search-button"
        aria-label="Search content"
      >
        <Search size={14} className="topbar-search-icon" aria-hidden="true" />
        <span className="topbar-search-label">Search</span>
        <kbd className="topbar-search-kbd hidden sm:inline-flex" aria-hidden="true">
          <span>⌘</span>
          <span>K</span>
        </kbd>
      </button>

      {/* ── Right: Theme toggle ── */}
      <div className="topbar-right">
        <div className="topbar-divider" aria-hidden="true" />
        <button
          className="topbar-theme-toggle"
          onClick={onThemeToggle}
          data-testid="theme-toggle"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span className="topbar-theme-track" data-active={theme === 'dark'}>
            <Moon size={11} className="topbar-theme-moon" aria-hidden="true" />
            <Sun size={11} className="topbar-theme-sun" aria-hidden="true" />
            <span className="topbar-theme-thumb" data-active={theme === 'dark'} />
          </span>
        </button>
      </div>
    </header>
  )
})
