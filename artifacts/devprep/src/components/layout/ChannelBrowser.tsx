import { useState, useMemo, useCallback } from 'react'
import type { Channel } from '@/data/channels'
import {
  X,
  Search,
  Pin,
  PinOff,
  Layers,
  Check,
  Code2,
  Shield,
  Database,
  Globe,
  Cpu,
  Server,
  Terminal,
  Braces,
  FileCode2,
  Boxes,
  Container,
  Network,
  Binary,
  GitBranch,
  Cloud,
  Lock,
  GraduationCap,
  Mountain,
  Workflow,
  BookOpen,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from 'lucide-react'

/* ── Channel icon map ──────────────────────────────────────────────── */
const CHANNEL_ICONS: Record<string, LucideIcon> = {
  javascript: Zap,
  typescript: FileCode2,
  react: Code2,
  vue: Globe,
  angular: Braces,
  node: Server,
  python: Terminal,
  java: Cpu,
  go: Zap,
  rust: Shield,
  algorithms: Binary,
  'system-design': Layers,
  devops: Workflow,
  kubernetes: Container,
  networking: Network,
  sql: Database,
  postgresql: Database,
  docker: Boxes,
  'aws-saa': Cloud,
  'aws-dev': Cloud,
  'aws-ai': Cloud,
  cka: GraduationCap,
  terraform: Mountain,
}
import { Zap } from 'lucide-react'

function getChannelIcon(id: string): LucideIcon {
  return CHANNEL_ICONS[id] || BookOpen
}

/* ── Category config ──────────────────────────────────────────────── */
interface CategoryConfig {
  label: string
  icon: LucideIcon
  color: string
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  Frontend: { label: 'Frontend', icon: Code2, color: '#61dafb' },
  Backend: { label: 'Backend', icon: Server, color: '#f89820' },
  Languages: { label: 'Languages', icon: Braces, color: '#a371f7' },
  Databases: { label: 'Databases', icon: Database, color: '#f6c547' },
  Infrastructure: { label: 'Infrastructure', icon: Workflow, color: '#ffa657' },
  'CS Fundamentals': { label: 'CS Fundamentals', icon: Binary, color: '#bc8cff' },
  'Cloud / Certs': { label: 'Certifications', icon: GraduationCap, color: '#ff9900' },
  Security: { label: 'Security', icon: Lock, color: '#ff7b72' },
  Other: { label: 'Other', icon: Layers, color: '#8b949e' },
}

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
  if (
    [
      'node',
      'python',
      'java',
      'go',
      'rust',
      'php',
      'ruby',
      'scala',
      'kotlin',
      'swift',
      'csharp',
      'cpp',
      'c',
    ].includes(id)
  )
    return 'Backend'
  if (
    [
      'sql',
      'postgresql',
      'mysql',
      'mongodb',
      'redis',
      'elasticsearch',
      'cassandra',
      'dynamodb',
    ].includes(id)
  )
    return 'Databases'
  if (
    [
      'devops',
      'docker',
      'kubernetes',
      'linux',
      'networking',
      'terraform',
      'ansible',
      'prometheus',
      'grafana',
      'nginx',
    ].includes(id)
  )
    return 'Infrastructure'
  if (
    [
      'algorithms',
      'system-design',
      'data-structures',
      'operating-systems',
      'computer-science',
    ].includes(id)
  )
    return 'CS Fundamentals'
  if (['security', 'web-security', 'owasp', 'cryptography'].includes(id)) return 'Security'
  if (channel.jobRole?.includes('backend') && channel.jobRole?.includes('frontend'))
    return 'Languages'
  return 'Other'
}

/* ── Component ─────────────────────────────────────────────────────── */

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
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())
  const [filterType, setFilterType] = useState<'all' | 'tech' | 'cert'>('all')

  const categorized = useMemo(() => {
    let filtered = search
      ? allChannels.filter(
          c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.id.toLowerCase().includes(search.toLowerCase()) ||
            c.description?.toLowerCase().includes(search.toLowerCase())
        )
      : allChannels

    if (filterType === 'tech') filtered = filtered.filter(c => c.type === 'tech')
    else if (filterType === 'cert') filtered = filtered.filter(c => c.type === 'cert')

    const groups: Record<string, Channel[]> = {}
    for (const ch of filtered) {
      const cat = categorize(ch)
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(ch)
    }
    return groups
  }, [allChannels, search, filterType])

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

  const toggleCollapse = useCallback((cat: string) => {
    setCollapsedCats(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }, [])

  const totalFiltered = Object.values(categorized).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div
      className="channel-browser-overlay"
      onClick={onClose}
      role="presentation"
      data-testid="channel-browser"
      style={{ animation: 'dp-fade-in 0.2s ease-out' }}
    >
      <div
        className="channel-browser-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="channel-browser-title"
        style={{ animation: 'dp-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '18px 20px 14px',
            borderBottom: '1px solid var(--dp-border-1)',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--dp-r-md)',
              background: 'linear-gradient(135deg, var(--dp-blue), var(--dp-purple))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Layers size={16} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <h2
              id="channel-browser-title"
              style={{ fontSize: 16, fontWeight: 700, color: 'var(--dp-text-0)' }}
            >
              Browse Channels
            </h2>
            <p
              style={{ fontSize: 11.5, color: 'var(--dp-text-3)', marginTop: 1 }}
              aria-live="polite"
            >
              {totalFiltered} channels ·{' '}
              <strong style={{ color: 'var(--dp-text-1)' }}>{selectedIds.length}</strong> pinned
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close channel browser"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 'var(--dp-r-md)',
              border: '1px solid var(--dp-border-1)',
              background: 'var(--dp-bg-2)',
              color: 'var(--dp-text-2)',
              cursor: 'pointer',
              transition: 'all var(--dp-dur-fast)',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Search + filters */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--dp-border-1)' }}>
          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--dp-text-3)',
                pointerEvents: 'none',
              }}
            />
            <input
              autoFocus
              type="search"
              placeholder="Search channels by name, tech, or topic..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search channels"
              style={{
                width: '100%',
                padding: '9px 12px 9px 34px',
                fontSize: 13,
                background: 'var(--dp-bg-2)',
                border: '1px solid var(--dp-border-1)',
                borderRadius: 'var(--dp-r-md)',
                color: 'var(--dp-text-0)',
                outline: 'none',
                transition: 'border-color var(--dp-dur-fast), box-shadow var(--dp-dur-fast)',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--dp-blue)'
                e.target.style.boxShadow = '0 0 0 2px var(--dp-blue-dim)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--dp-border-1)'
                e.target.style.boxShadow = 'none'
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--dp-text-3)',
                  display: 'flex',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Type filter pills */}
          <div
            style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}
            role="group"
            aria-label="Filter channels"
          >
            {/* Type pills */}
            <div
              style={{
                display: 'flex',
                gap: 3,
                padding: 3,
                borderRadius: 'var(--dp-r-md)',
                background: 'var(--dp-bg-2)',
                border: '1px solid var(--dp-border-1)',
              }}
            >
              {[
                { id: 'all' as const, label: 'All', count: allChannels.length },
                {
                  id: 'tech' as const,
                  label: 'Tech',
                  count: allChannels.filter(c => c.type === 'tech').length,
                },
                {
                  id: 'cert' as const,
                  label: 'Certs',
                  count: allChannels.filter(c => c.type === 'cert').length,
                },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  aria-pressed={filterType === tab.id}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--dp-r-sm)',
                    fontSize: 11.5,
                    fontWeight: filterType === tab.id ? 700 : 400,
                    cursor: 'pointer',
                    border: 'none',
                    background: filterType === tab.id ? 'var(--dp-bg-1)' : 'transparent',
                    color: filterType === tab.id ? 'var(--dp-text-0)' : 'var(--dp-text-2)',
                    transition: 'all var(--dp-dur-fast)',
                    boxShadow: filterType === tab.id ? 'var(--dp-shadow-sm)' : 'none',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span style={{ fontSize: 10, color: 'var(--dp-text-3)' }}>|</span>

            {/* Category pills */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveCategory(null)}
                aria-pressed={!activeCategory}
                style={{
                  padding: '3px 10px',
                  borderRadius: 'var(--dp-r-full)',
                  fontSize: 11,
                  cursor: 'pointer',
                  border: `1px solid ${!activeCategory ? 'rgba(56,139,253,0.3)' : 'var(--dp-border-1)'}`,
                  background: !activeCategory ? 'var(--dp-blue-dim)' : 'var(--dp-bg-2)',
                  color: !activeCategory ? 'var(--dp-blue)' : 'var(--dp-text-2)',
                  fontWeight: !activeCategory ? 700 : 400,
                  transition: 'all var(--dp-dur-fast)',
                }}
              >
                All Categories
              </button>
              {categories.map(cat => {
                const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['Other']
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    aria-pressed={activeCategory === cat}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 'var(--dp-r-full)',
                      fontSize: 11,
                      cursor: 'pointer',
                      border: `1px solid ${activeCategory === cat ? config.color + '44' : 'var(--dp-border-1)'}`,
                      background: activeCategory === cat ? config.color + '12' : 'var(--dp-bg-2)',
                      color: activeCategory === cat ? config.color : 'var(--dp-text-2)',
                      fontWeight: activeCategory === cat ? 700 : 400,
                      transition: 'all var(--dp-dur-fast)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {cat}
                    <span
                      style={{
                        fontSize: 9,
                        background: 'var(--dp-bg-3)',
                        padding: '0 4px',
                        borderRadius: 3,
                      }}
                    >
                      {categorized[cat]?.length}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          style={{ maxHeight: '65vh', overflowY: 'auto', padding: '8px 12px 12px' }}
          id="channel-list"
          role="list"
          aria-label="Channel list"
        >
          {visibleCategories.map(cat => {
            const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['Other']
            const CatIcon = config.icon
            const isCollapsed = collapsedCats.has(cat)
            const channels = categorized[cat] ?? []

            return (
              <div key={cat} style={{ marginBottom: 12 }} role="listitem">
                {/* Category header */}
                <button
                  onClick={() => toggleCollapse(cat)}
                  aria-expanded={!isCollapsed}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    borderRadius: 'var(--dp-r-sm)',
                    transition: 'background var(--dp-dur-fast)',
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 'var(--dp-r-sm)',
                      background: config.color + '15',
                      border: `1px solid ${config.color}25`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CatIcon size={12} style={{ color: config.color }} />
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--dp-text-2)',
                    }}
                  >
                    {cat}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--dp-text-3)' }}>
                    ({channels.length})
                  </span>
                  <div style={{ flex: 1 }} />
                  {isCollapsed ? (
                    <ChevronDown size={12} style={{ color: 'var(--dp-text-3)' }} />
                  ) : (
                    <ChevronUp size={12} style={{ color: 'var(--dp-text-3)' }} />
                  )}
                </button>

                {/* Channel grid */}
                {!isCollapsed && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: 6,
                      padding: '4px 0',
                    }}
                  >
                    {channels.map(channel => {
                      const isPinned = selectedIds.includes(channel.id)
                      const isCurrent = channel.id === currentChannelId
                      const Icon = getChannelIcon(channel.id)

                      return (
                        <div
                          key={channel.id}
                          className="channel-card"
                          style={
                            {
                              '--ch-color': channel.color,
                              borderColor: isCurrent
                                ? 'rgba(56,139,253,0.35)'
                                : isPinned
                                  ? channel.color + '33'
                                  : undefined,
                              background: isCurrent
                                ? 'var(--dp-blue-dim)'
                                : isPinned
                                  ? channel.color + '08'
                                  : undefined,
                              position: 'relative',
                            } as React.CSSProperties
                          }
                        >
                          {/* Channel icon */}
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 'var(--dp-r-sm)',
                              background: channel.color + '15',
                              border: `1px solid ${channel.color}25`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={15} style={{ color: channel.color }} />
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: 'var(--dp-text-0)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {channel.name}
                            </div>
                            {channel.certCode && (
                              <div
                                style={{ fontSize: 10, color: 'var(--dp-purple)', fontWeight: 500 }}
                              >
                                {channel.certCode}
                              </div>
                            )}
                            {channel.description && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: 'var(--dp-text-3)',
                                  marginTop: 1,
                                  overflow: 'hidden',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {channel.description}
                              </div>
                            )}
                          </div>

                          {/* Right side: status + pin */}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              gap: 3,
                              flexShrink: 0,
                            }}
                          >
                            {isCurrent && (
                              <span
                                style={{
                                  fontSize: 8.5,
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  color: 'var(--dp-blue)',
                                  whiteSpace: 'nowrap',
                                  letterSpacing: '0.05em',
                                }}
                              >
                                Active
                              </span>
                            )}
                            <button
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 22,
                                height: 22,
                                borderRadius: 'var(--dp-r-sm)',
                                border: 'none',
                                background: 'none',
                                color: isPinned ? 'var(--dp-yellow)' : 'var(--dp-text-3)',
                                cursor: 'pointer',
                                opacity: isPinned ? 1 : 0.4,
                                transition: 'all var(--dp-dur-fast)',
                              }}
                              onClick={() => onTogglePin(channel.id)}
                              aria-label={
                                isPinned ? `Unpin ${channel.name}` : `Pin ${channel.name}`
                              }
                              aria-pressed={isPinned}
                            >
                              {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                            </button>
                          </div>

                          {/* Click overlay */}
                          <button
                            onClick={() => {
                              onSelect(channel.id)
                              onClose()
                            }}
                            aria-label={`Study ${channel.name}`}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              borderRadius: 'var(--dp-r-md)',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              zIndex: 0,
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {Object.keys(categorized).length === 0 && (
            <div
              style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--dp-text-2)' }}
              role="status"
            >
              <Search size={32} style={{ margin: '0 auto 14px', color: 'var(--dp-text-3)' }} />
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--dp-text-0)',
                  marginBottom: 4,
                }}
              >
                No channels found
              </p>
              <p style={{ fontSize: 13, color: 'var(--dp-text-3)' }}>
                Try a different search term or clear filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
