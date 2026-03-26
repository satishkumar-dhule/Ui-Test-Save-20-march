import { useState, useMemo } from 'react'
import type { Channel } from '@/data/channels'
import type { Section } from '@/App'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  CreditCard,
  Code2,
  GraduationCap,
  Mic2,
  ChevronRight,
  Plus,
  Search,
  BookOpen,
  LayoutGrid,
  Pin,
  ChevronDown,
  ChevronUp,
  BarChart2,
  X,
  Zap,
  Diamond,
  Atom,
  Triangle,
  Hexagon,
  Leaf,
  Coffee,
  Database,
  Binary,
  Container,
  Cloud,
  Network,
  FileCode2,
  Braces,
  Sailboat,
  Cog,
  Mountain,
  Bot,
  Shield,
  Smartphone,
  Cpu,
  Terminal,
  type LucideIcon,
} from 'lucide-react'

const CHANNEL_ICON_MAP: Record<string, LucideIcon> = {
  javascript: Zap,
  typescript: Diamond,
  react: Atom,
  'vue.js': Triangle,
  vue: Triangle,
  angular: Braces,
  node: Hexagon,
  'node.js': Hexagon,
  python: Leaf,
  java: Coffee,
  go: Sailboat,
  rust: Cog,
  algorithms: Binary,
  'system-design': Cpu,
  devops: Cog,
  kubernetes: Container,
  networking: Network,
  sql: Database,
  postgresql: Database,
  docker: Container,
  'aws-saa': Cloud,
  'aws-dev': Cloud,
  'aws-ai': Bot,
  cka: Container,
  terraform: Mountain,
  flutter: Smartphone,
  'react-native': Smartphone,
  linux: Terminal,
  security: Shield,
}

function getChannelIcon(channel: Channel): LucideIcon {
  const exact = CHANNEL_ICON_MAP[channel.id]
  if (exact) return exact
  const lower = channel.name.toLowerCase()
  for (const [key, icon] of Object.entries(CHANNEL_ICON_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return icon
  }
  return FileCode2
}

const SECTIONS: {
  id: Section
  label: string
  icon: React.ReactNode
  color: string
  desc: string
}[] = [
  {
    id: 'qa',
    label: 'Q&A',
    icon: <MessageSquare size={15} />,
    color: '#388bfd',
    desc: 'Questions & Answers',
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    icon: <CreditCard size={15} />,
    color: '#3fb950',
    desc: 'Spaced Repetition',
  },
  {
    id: 'coding',
    label: 'Coding',
    icon: <Code2 size={15} />,
    color: '#f7df1e',
    desc: 'Practice Challenges',
  },
  {
    id: 'exam',
    label: 'Mock Exam',
    icon: <GraduationCap size={15} />,
    color: '#ff7b72',
    desc: 'Timed Assessment',
  },
  {
    id: 'voice',
    label: 'Voice',
    icon: <Mic2 size={15} />,
    color: '#bc8cff',
    desc: 'Speak & Practice',
  },
  {
    id: 'stats',
    label: 'Statistics',
    icon: <BarChart2 size={15} />,
    color: '#39d3f4',
    desc: 'Your Progress',
  },
]

interface SidebarProps {
  channels: Channel[]
  pinnedChannels: Channel[]
  currentChannelId: string
  section: Section
  sectionCounts: Record<Section, number>
  isMobileOpen: boolean
  onChannelSelect: (id: string) => void
  onSectionChange: (section: Section) => void
  onBrowseChannels: () => void
  onMobileClose: () => void
}

export function Sidebar({
  channels,
  pinnedChannels,
  currentChannelId,
  section,
  sectionCounts,
  isMobileOpen,
  onChannelSelect,
  onSectionChange,
  onBrowseChannels,
  onMobileClose,
}: SidebarProps) {
  const [channelSearch, setChannelSearch] = useState('')
  const [showAllPinned, setShowAllPinned] = useState(false)

  const visiblePinned = showAllPinned ? pinnedChannels : pinnedChannels.slice(0, 10)
  const filteredPinned = channelSearch
    ? pinnedChannels.filter(
        c =>
          c.name.toLowerCase().includes(channelSearch.toLowerCase()) ||
          c.shortName?.toLowerCase().includes(channelSearch.toLowerCase())
      )
    : visiblePinned

  const techChannels = filteredPinned.filter(c => c.type === 'tech')
  const certChannels = filteredPinned.filter(c => c.type === 'cert')

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={onMobileClose} aria-hidden="true" />
      )}

      <aside
        aria-label="Main navigation"
        className={cn('sidebar', isMobileOpen && 'sidebar--mobile-open')}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <BookOpen size={16} strokeWidth={2.5} aria-hidden="true" />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">DevPrep</span>
            <span className="sidebar-logo-sub">{channels.length}+ channels</span>
          </div>
          <button className="sidebar-close-btn" onClick={onMobileClose} aria-label="Close sidebar">
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Channel search */}
        <div className="sidebar-search" role="search" aria-label="Channel search">
          <Search size={14} className="sidebar-search-icon" aria-hidden="true" />
          <input
            className="sidebar-search-input"
            placeholder="Find channel..."
            value={channelSearch}
            onChange={e => setChannelSearch(e.target.value)}
            aria-label="Search channels"
          />
          {channelSearch && (
            <button
              className="sidebar-search-clear"
              onClick={() => setChannelSearch('')}
              aria-label="Clear search"
            >
              <X size={12} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Scrollable content area */}
        <div className="sidebar-scroll">
          {/* Tech channels */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <Pin size={11} aria-hidden="true" />
              <span>My Channels</span>
              {techChannels.length > 0 && (
                <span className="sidebar-section-count">{techChannels.length}</span>
              )}
            </div>

            <div className="sidebar-channels" role="list">
              {techChannels.map(channel => {
                const Icon = getChannelIcon(channel)
                const isActive = currentChannelId === channel.id
                return (
                  <div role="listitem" key={channel.id}>
                    <button
                      className={cn('sidebar-channel', isActive && 'sidebar-channel--active')}
                      onClick={() => {
                        onChannelSelect(channel.id)
                        onMobileClose()
                      }}
                      aria-label={`Select ${channel.name} channel`}
                      aria-current={isActive ? 'page' : undefined}
                      style={
                        isActive
                          ? ({ '--channel-color': channel.color } as React.CSSProperties)
                          : undefined
                      }
                    >
                      <span
                        className="sidebar-channel-icon"
                        style={{ color: isActive ? channel.color : undefined }}
                        aria-hidden="true"
                      >
                        <Icon size={15} />
                      </span>
                      <span className="sidebar-channel-name">{channel.name}</span>
                      {channel.type === 'cert' && (
                        <span className="sidebar-channel-cert">{channel.certCode ?? 'CERT'}</span>
                      )}
                      {isActive && (
                        <ChevronRight
                          size={13}
                          className="sidebar-channel-arrow"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </div>
                )
              })}

              {/* Cert channels */}
              {certChannels.length > 0 && (
                <>
                  <div className="sidebar-subsection-divider">
                    <span>Certifications</span>
                  </div>
                  {certChannels.map(channel => {
                    const Icon = getChannelIcon(channel)
                    const isActive = currentChannelId === channel.id
                    return (
                      <div role="listitem" key={channel.id}>
                        <button
                          className={cn('sidebar-channel', isActive && 'sidebar-channel--active')}
                          onClick={() => {
                            onChannelSelect(channel.id)
                            onMobileClose()
                          }}
                          aria-label={`Select ${channel.name} channel`}
                          aria-current={isActive ? 'page' : undefined}
                          style={
                            isActive
                              ? ({ '--channel-color': channel.color } as React.CSSProperties)
                              : undefined
                          }
                        >
                          <span
                            className="sidebar-channel-icon"
                            style={{ color: isActive ? channel.color : undefined }}
                            aria-hidden="true"
                          >
                            <Icon size={15} />
                          </span>
                          <span className="sidebar-channel-name">{channel.name}</span>
                          <span className="sidebar-channel-cert">{channel.certCode ?? 'CERT'}</span>
                          {isActive && (
                            <ChevronRight
                              size={13}
                              className="sidebar-channel-arrow"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </div>
                    )
                  })}
                </>
              )}

              {pinnedChannels.length > 10 && !channelSearch && (
                <button
                  className="sidebar-show-more"
                  onClick={() => setShowAllPinned(v => !v)}
                  aria-expanded={showAllPinned}
                >
                  {showAllPinned ? (
                    <>
                      <ChevronUp size={13} /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={13} /> +{pinnedChannels.length - 10} more channels
                    </>
                  )}
                </button>
              )}

              {filteredPinned.length === 0 && channelSearch && (
                <p className="sidebar-empty">No channels match "{channelSearch}"</p>
              )}
            </div>

            <button
              className="sidebar-browse-btn"
              onClick={onBrowseChannels}
              aria-label="Browse all channels"
            >
              <LayoutGrid size={14} aria-hidden="true" />
              <span>Browse {channels.length}+ channels</span>
              <ChevronRight size={13} aria-hidden="true" />
            </button>
          </div>

          {/* Divider */}
          <div className="sidebar-divider" />

          {/* Study sections */}
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <BookOpen size={11} aria-hidden="true" />
              <span>Study Mode</span>
            </div>

            <div className="sidebar-sections" role="tablist" aria-label="Study modes">
              {SECTIONS.map(s => {
                const isActive = section === s.id
                return (
                  <button
                    key={s.id}
                    role="tab"
                    className={cn('sidebar-sec', isActive && 'sidebar-sec--active')}
                    onClick={() => {
                      onSectionChange(s.id)
                      onMobileClose()
                    }}
                    aria-selected={isActive}
                    style={
                      isActive ? ({ '--sec-color': s.color } as React.CSSProperties) : undefined
                    }
                    title={s.desc}
                  >
                    <span
                      className="sidebar-sec-icon"
                      style={{ color: s.color }}
                      aria-hidden="true"
                    >
                      {s.icon}
                    </span>
                    <span className="sidebar-sec-label">{s.label}</span>
                    {sectionCounts[s.id] > 0 && (
                      <span className="sidebar-sec-count">{sectionCounts[s.id]}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <button
            className="sidebar-footer-btn"
            onClick={onBrowseChannels}
            aria-label="Add channels"
          >
            <Plus size={14} aria-hidden="true" />
            <span>Add channels</span>
          </button>
        </div>
      </aside>
    </>
  )
}
