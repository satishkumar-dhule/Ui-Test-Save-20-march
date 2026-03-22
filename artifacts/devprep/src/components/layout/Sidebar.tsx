import { useState } from 'react'
import type { Channel } from '@/data/channels'
import type { Section } from '@/App'
import { cn } from '@/lib/utils'
import {
  MessageSquare, CreditCard, Code2, GraduationCap, Mic2,
  ChevronRight, Plus, Settings, Search, BookOpen, LayoutGrid,
  Pin, ChevronDown, ChevronUp
} from 'lucide-react'

const SECTIONS: { id: Section; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'qa', label: 'Q&A', icon: <MessageSquare size={15} />, color: '#388bfd' },
  { id: 'flashcards', label: 'Flashcards', icon: <CreditCard size={15} />, color: '#3fb950' },
  { id: 'coding', label: 'Coding', icon: <Code2 size={15} />, color: '#f7df1e' },
  { id: 'exam', label: 'Mock Exam', icon: <GraduationCap size={15} />, color: '#ff7b72' },
  { id: 'voice', label: 'Voice', icon: <Mic2 size={15} />, color: '#bc8cff' },
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
  onEditPinned: () => void
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
  onEditPinned,
  onMobileClose,
}: SidebarProps) {
  const [channelSearch, setChannelSearch] = useState('')
  const [showAllPinned, setShowAllPinned] = useState(false)

  const visiblePinned = showAllPinned ? pinnedChannels : pinnedChannels.slice(0, 10)
  const filteredPinned = channelSearch
    ? pinnedChannels.filter(c =>
        c.name.toLowerCase().includes(channelSearch.toLowerCase()) ||
        c.shortName?.toLowerCase().includes(channelSearch.toLowerCase())
      )
    : visiblePinned

  return (
    <aside
      className={cn(
        'sidebar',
        isMobileOpen && 'sidebar--mobile-open'
      )}
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <BookOpen size={18} strokeWidth={2.5} />
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">DevPrep</span>
          <span className="sidebar-logo-sub">{channels.length}+ channels</span>
        </div>
      </div>

      {/* Channel search */}
      <div className="sidebar-search">
        <Search size={13} className="sidebar-search-icon" />
        <input
          className="sidebar-search-input"
          placeholder="Find channel..."
          value={channelSearch}
          onChange={e => setChannelSearch(e.target.value)}
        />
      </div>

      {/* Pinned channels */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <Pin size={11} />
          <span>My Channels</span>
          <button className="sidebar-section-action" onClick={onEditPinned} title="Edit channels">
            <Settings size={12} />
          </button>
        </div>

        <div className="sidebar-channels">
          {filteredPinned.map(channel => (
            <button
              key={channel.id}
              className={cn(
                'sidebar-channel',
                currentChannelId === channel.id && 'sidebar-channel--active'
              )}
              onClick={() => onChannelSelect(channel.id)}
              style={
                currentChannelId === channel.id
                  ? { '--channel-color': channel.color } as React.CSSProperties
                  : undefined
              }
            >
              <span className="sidebar-channel-emoji" style={{ color: channel.color }}>
                {channel.emoji}
              </span>
              <span className="sidebar-channel-name">{channel.name}</span>
              {channel.type === 'cert' && (
                <span className="sidebar-channel-cert">{channel.certCode}</span>
              )}
              {currentChannelId === channel.id && (
                <ChevronRight size={12} className="sidebar-channel-arrow" />
              )}
            </button>
          ))}

          {pinnedChannels.length > 10 && !channelSearch && (
            <button
              className="sidebar-show-more"
              onClick={() => setShowAllPinned(v => !v)}
            >
              {showAllPinned ? (
                <><ChevronUp size={12} /> Show less</>
              ) : (
                <><ChevronDown size={12} /> +{pinnedChannels.length - 10} more</>
              )}
            </button>
          )}

          {filteredPinned.length === 0 && channelSearch && (
            <div className="sidebar-empty">No channels match</div>
          )}
        </div>

        <button className="sidebar-browse-btn" onClick={onBrowseChannels}>
          <LayoutGrid size={13} />
          <span>Browse all {channels.length}+ channels</span>
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Study sections */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <BookOpen size={11} />
          <span>Study Mode</span>
        </div>

        <div className="sidebar-sections">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={cn('sidebar-sec', section === s.id && 'sidebar-sec--active')}
              onClick={() => { onSectionChange(s.id); onMobileClose() }}
              style={section === s.id ? { '--sec-color': s.color } as React.CSSProperties : undefined}
            >
              <span className="sidebar-sec-icon" style={{ color: s.color }}>
                {s.icon}
              </span>
              <span className="sidebar-sec-label">{s.label}</span>
              <span className="sidebar-sec-count">
                {sectionCounts[s.id] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="sidebar-footer">
        <button className="sidebar-footer-btn" onClick={onBrowseChannels}>
          <Plus size={14} />
          <span>Add channels</span>
        </button>
      </div>
    </aside>
  )
}
