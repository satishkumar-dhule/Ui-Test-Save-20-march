import { useState, useMemo } from 'react'
import type { Channel } from '@/data/channels'
import { X, Search, Pin, PinOff, Check, Layers, BookOpen } from 'lucide-react'

const CATEGORY_ORDER = [
  'Frontend',
  'Backend',
  'Languages',
  'Databases',
  'Infrastructure',
  'CS Fundamentals',
  'Cloud / Certs',
  'Security',
  'Other',
]

function categorize(channel: Channel): string {
  const id = channel.id
  if (channel.type === 'cert') return 'Cloud / Certs'
  if (['javascript', 'typescript', 'react', 'vue', 'angular'].includes(id)) return 'Frontend'
  if (['node', 'python', 'java', 'go', 'rust', 'php', 'ruby', 'scala', 'kotlin', 'swift', 'csharp', 'cpp', 'c'].includes(id)) return 'Backend'
  if (['sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb'].includes(id)) return 'Databases'
  if (['devops', 'docker', 'kubernetes', 'linux', 'networking', 'terraform', 'ansible', 'prometheus', 'grafana', 'nginx'].includes(id)) return 'Infrastructure'
  if (['algorithms', 'system-design', 'data-structures', 'operating-systems', 'computer-science'].includes(id)) return 'CS Fundamentals'
  if (['security', 'web-security', 'owasp', 'cryptography'].includes(id)) return 'Security'
  if (channel.jobRole?.includes('backend') && channel.jobRole?.includes('frontend')) return 'Languages'
  return 'Other'
}

interface ChannelBrowserProps {
  allChannels: Channel[]
  selectedIds: string[]
  currentChannelId: string
  onSelect: (id: string) => void
  onTogglePin: (id: string) => void
  onClose: () => void
}

export function ChannelBrowser({
  allChannels,
  selectedIds,
  currentChannelId,
  onSelect,
  onTogglePin,
  onClose,
}: ChannelBrowserProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const categorized = useMemo(() => {
    const filtered = search
      ? allChannels.filter(
          c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.id.toLowerCase().includes(search.toLowerCase()) ||
            c.description?.toLowerCase().includes(search.toLowerCase())
        )
      : allChannels
    const groups: Record<string, Channel[]> = {}
    for (const ch of filtered) {
      const cat = categorize(ch)
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(ch)
    }
    return groups
  }, [allChannels, search])

  const categories = useMemo(
    () =>
      CATEGORY_ORDER.filter(c => categorized[c]?.length > 0).concat(
        Object.keys(categorized).filter(c => !CATEGORY_ORDER.includes(c))
      ),
    [categorized]
  )

  const visibleCategories = activeCategory ? categories.filter(c => c === activeCategory) : categories

  return (
    <div
      className="channel-browser-overlay"
      onClick={onClose}
      role="presentation"
      data-testid="channel-browser"
    >
      <div
        className="channel-browser-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="channel-browser-title"
      >
        {/* Header */}
        <div className="channel-browser-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 'var(--dp-r-md)',
              background: 'linear-gradient(135deg, var(--dp-blue), var(--dp-purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Layers size={14} color="#fff" />
            </div>
            <div>
              <h2 id="channel-browser-title" className="channel-browser-title">
                Browse Channels
              </h2>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--dp-text-3)', marginLeft: 'auto', marginRight: 8 }} aria-live="polite">
            {allChannels.length} channels · <strong style={{ color: 'var(--dp-text-1)' }}>{selectedIds.length}</strong> pinned
          </p>
          <button className="channel-browser-close" onClick={onClose} aria-label="Close channel browser">
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        {/* Search + category pills */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--dp-border-1)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="channel-browser-search-wrap">
            <Search size={13} className="channel-browser-search-icon" aria-hidden="true" />
            <input
              autoFocus
              className="channel-browser-search"
              placeholder="Search channels by name, tech, or topic..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search channels"
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dp-text-3)', display: 'flex' }}>
                <X size={13} aria-hidden="true" />
              </button>
            )}
          </div>

          {!search && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} role="group" aria-label="Filter by category">
              <button
                onClick={() => setActiveCategory(null)}
                aria-pressed={!activeCategory}
                style={{
                  padding: '4px 12px', borderRadius: 'var(--dp-r-full)', fontSize: 12, cursor: 'pointer',
                  border: `1px solid ${!activeCategory ? 'rgba(56,139,253,0.3)' : 'var(--dp-border-1)'}`,
                  background: !activeCategory ? 'var(--dp-blue-dim)' : 'var(--dp-bg-2)',
                  color: !activeCategory ? 'var(--dp-blue)' : 'var(--dp-text-2)',
                  fontWeight: !activeCategory ? 700 : 400, transition: 'all var(--dp-dur-fast)',
                }}>
                All
              </button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)} aria-pressed={activeCategory === cat}
                  style={{
                    padding: '4px 12px', borderRadius: 'var(--dp-r-full)', fontSize: 12, cursor: 'pointer',
                    border: `1px solid ${activeCategory === cat ? 'rgba(56,139,253,0.3)' : 'var(--dp-border-1)'}`,
                    background: activeCategory === cat ? 'var(--dp-blue-dim)' : 'var(--dp-bg-2)',
                    color: activeCategory === cat ? 'var(--dp-blue)' : 'var(--dp-text-2)',
                    fontWeight: activeCategory === cat ? 700 : 400, transition: 'all var(--dp-dur-fast)',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                  {cat}
                  <span style={{ fontSize: 10, background: 'var(--dp-bg-3)', padding: '0 4px', borderRadius: 4 }}>
                    {categorized[cat]?.length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="channel-browser-content" id="channel-list" role="list" aria-label="Channel list">
          {visibleCategories.map(cat => (
            <div key={cat} className="channel-browser-category" role="listitem">
              <div className="channel-browser-cat-label" id={`cat-${cat}`}>{cat}</div>
              <div className="channel-browser-grid">
                {(categorized[cat] ?? []).map(channel => {
                  const isPinned = selectedIds.includes(channel.id)
                  const isCurrent = channel.id === currentChannelId
                  return (
                    <div
                      key={channel.id}
                      className={`channel-card${isCurrent ? ' channel-card--active' : ''}${isPinned ? ' channel-card--pinned' : ''}`}
                      style={{ '--ch-color': channel.color } as React.CSSProperties}
                    >
                      <div className="channel-card-emoji" style={{ color: channel.color }}>
                        {channel.emoji}
                      </div>
                      <div className="channel-card-info" style={{ flex: 1, minWidth: 0 }}>
                        <div className="channel-card-name">{channel.name}</div>
                        {channel.certCode && (
                          <div className="channel-card-meta" style={{ color: 'var(--dp-purple)' }}>{channel.certCode}</div>
                        )}
                        {channel.description && (
                          <div className="channel-card-meta" style={{ marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {channel.description}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                        {isCurrent && (
                          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--dp-blue)', whiteSpace: 'nowrap' }}>Active</span>
                        )}
                        <button
                          className="channel-card-pin-btn"
                          style={{ opacity: 1, color: isPinned ? 'var(--dp-yellow)' : undefined }}
                          onClick={() => onTogglePin(channel.id)}
                          aria-label={isPinned ? `Unpin ${channel.name}` : `Pin ${channel.name}`}
                          aria-pressed={isPinned}
                        >
                          {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                        </button>
                      </div>

                      <button
                        onClick={() => { onSelect(channel.id); onClose() }}
                        aria-label={`Study ${channel.name}`}
                        style={{
                          position: 'absolute', inset: 0, borderRadius: 'var(--dp-r-md)',
                          background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 0,
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {Object.keys(categorized).length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--dp-text-2)' }} role="status">
              <Search size={28} style={{ margin: '0 auto 12px', color: 'var(--dp-text-3)' }} />
              <p style={{ fontSize: 14 }}>No channels match "<strong style={{ color: 'var(--dp-text-0)' }}>{search}</strong>"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
