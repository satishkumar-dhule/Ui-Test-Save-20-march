import { useState, useMemo } from 'react'
import type { Channel } from '@/data/channels'
import { cn } from '@/lib/utils'
import { X, Search, Pin, PinOff, Check } from 'lucide-react'

const CATEGORY_ORDER = [
  'Frontend', 'Backend', 'Languages', 'Databases', 'Infrastructure',
  'CS Fundamentals', 'Cloud / Certs', 'Security', 'Other'
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

  const visibleCategories = activeCategory
    ? categories.filter(c => c === activeCategory)
    : categories

  return (
    <div className="channel-browser-overlay" onClick={onClose}>
      <div className="channel-browser" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="channel-browser-header">
          <div>
            <h2 className="channel-browser-title">Browse Channels</h2>
            <p className="channel-browser-sub">
              {allChannels.length} channels · {selectedIds.length} pinned
            </p>
          </div>
          <button className="channel-browser-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="channel-browser-search-wrap">
          <Search size={15} className="channel-browser-search-icon" />
          <input
            autoFocus
            className="channel-browser-search"
            placeholder="Search channels by name, tech, or topic..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="channel-browser-clear" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category filter pills */}
        {!search && (
          <div className="channel-browser-cats">
            <button
              className={cn('channel-cat-pill', !activeCategory && 'channel-cat-pill--active')}
              onClick={() => setActiveCategory(null)}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={cn('channel-cat-pill', activeCategory === cat && 'channel-cat-pill--active')}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              >
                {cat}
                <span className="channel-cat-pill-count">{categorized[cat]?.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Channel grid */}
        <div className="channel-browser-body">
          {visibleCategories.map(cat => (
            <div key={cat} className="channel-browser-group">
              <h3 className="channel-browser-group-title">{cat}</h3>
              <div className="channel-grid">
                {(categorized[cat] ?? []).map(channel => {
                  const isPinned = selectedIds.includes(channel.id)
                  const isCurrent = channel.id === currentChannelId
                  return (
                    <div
                      key={channel.id}
                      className={cn(
                        'channel-card',
                        isCurrent && 'channel-card--current',
                        isPinned && 'channel-card--pinned'
                      )}
                      style={{ '--ch-color': channel.color } as React.CSSProperties}
                    >
                      <div className="channel-card-header">
                        <span
                          className="channel-card-emoji"
                          style={{ color: channel.color }}
                        >
                          {channel.emoji}
                        </span>
                        <div className="channel-card-actions">
                          {isCurrent && (
                            <span className="channel-card-active-badge">
                              <Check size={10} /> Active
                            </span>
                          )}
                          <button
                            className={cn(
                              'channel-card-pin',
                              isPinned && 'channel-card-pin--active'
                            )}
                            onClick={() => onTogglePin(channel.id)}
                            title={isPinned ? 'Unpin' : 'Pin to sidebar'}
                          >
                            {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                          </button>
                        </div>
                      </div>
                      <div className="channel-card-name">{channel.name}</div>
                      {channel.certCode && (
                        <div className="channel-card-cert">{channel.certCode}</div>
                      )}
                      <div className="channel-card-desc">{channel.description}</div>
                      <button
                        className="channel-card-study-btn"
                        onClick={() => { onSelect(channel.id); onClose() }}
                        style={{ background: channel.color + '20', color: channel.color, borderColor: channel.color + '40' }}
                      >
                        Study this channel
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {Object.keys(categorized).length === 0 && (
            <div className="channel-browser-empty">
              <Search size={32} />
              <p>No channels match "<strong>{search}</strong>"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
