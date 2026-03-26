'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import {
  Search,
  FileText,
  Code,
  Mic,
  ClipboardList,
  Layers,
  X,
  Clock,
  ChevronRight,
  Zap,
  ArrowRight,
  SearchX,
  Command,
  ArrowUpRight,
  Hash,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Trash2,
  History,
  LayoutGrid,
  FolderOpen,
} from 'lucide-react'
import type { SearchResult, SearchResultType } from '@/types/search'

const RECENT_SEARCHES_KEY = 'devprep-recent-searches'
const MAX_RECENT = 8

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveRecentSearch(query: string) {
  if (!query.trim()) return
  try {
    const prev = getRecentSearches()
    const next = [query, ...prev.filter(q => q !== query)].slice(0, MAX_RECENT)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
  } catch {}
}

function removeRecentSearch(query: string) {
  try {
    const prev = getRecentSearches()
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(prev.filter(q => q !== query)))
  } catch {}
}

function clearAllRecentSearches() {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  } catch {}
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 1)
  if (terms.length === 0) return text

  const pattern = new RegExp(
    `(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  )
  const parts = text.split(pattern)

  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark
        key={i}
        className="rounded-[2px] px-0.5 font-bold"
        style={{
          background: 'color-mix(in srgb, var(--search-accent) 12%, transparent)',
          color: 'var(--search-accent)',
        }}
      >
        {part}
      </mark>
    ) : (
      part
    )
  )
}

const TYPE_CONFIG: Record<
  SearchResultType,
  {
    label: string
    icon: React.FC<{ size?: number; className?: string }>
    color: string
    bg: string
  }
> = {
  flashcard: { label: 'Flashcard', icon: FileText, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  question: {
    label: 'Question',
    icon: ClipboardList,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
  },
  coding: { label: 'Coding', icon: Code, color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
  voice: { label: 'Voice', icon: Mic, color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  exam: { label: 'Exam', icon: Layers, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
}

const SECTION_QUICK_ACTIONS = [
  { label: 'Browse Flashcards', icon: FileText, section: 'flashcards', color: '#22c55e' },
  { label: 'Practice Questions', icon: ClipboardList, section: 'qa', color: '#3b82f6' },
  { label: 'Coding Challenges', icon: Code, section: 'coding', color: '#eab308' },
  { label: 'Voice Practice', icon: Mic, section: 'voice', color: '#a855f7' },
  { label: 'Mock Exam', icon: Layers, section: 'exam', color: '#ef4444' },
]

const FILTER_TYPES: SearchResultType[] = ['flashcard', 'question', 'coding', 'voice', 'exam']

type FilterType = 'all' | SearchResultType

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (query: string) => void
  onClear?: () => void
  results: SearchResult[]
  isLoading: boolean
  query?: string
  onSelect?: (result: SearchResult) => void
  onNavigate?: (section: string) => void
}

interface ResultItemProps {
  result: SearchResult
  query: string
  isActive: boolean
  index: number
  onSelect: () => void
  onHover: () => void
}

const ResultItem = React.memo<ResultItemProps>(
  ({ result, query, isActive, index, onSelect, onHover }) => {
    const cfg = TYPE_CONFIG[result.type]
    const Icon = cfg.icon

    return (
      <button
        className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100 outline-none focus-visible:ring-2 focus-visible:ring-inset"
        style={{
          background: isActive ? 'var(--search-hover-bg)' : 'transparent',
          borderRadius: 0,
          ['--tw-ring-color' as string]: cfg.color,
        }}
        onClick={onSelect}
        onMouseEnter={onHover}
        role="option"
        aria-selected={isActive}
        data-testid="search-result"
      >
        <span
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-transform duration-150"
          style={{ background: cfg.bg, color: cfg.color }}
          aria-hidden="true"
        >
          <Icon size={16} />
        </span>

        <span className="min-w-0 flex-1">
          <span
            data-testid="search-result-title"
            className="block truncate text-[13px] font-semibold"
            style={{ color: 'var(--search-text-primary)' }}
          >
            {highlightText(result.title, query)}
          </span>
          {result.preview && (
            <span
              data-testid="search-result-preview"
              className="mt-0.5 block truncate text-[11px] leading-relaxed"
              style={{ color: 'var(--search-text-tertiary)' }}
            >
              {highlightText(result.preview, query)}
            </span>
          )}
        </span>

        {result.channelId && (
          <span
            className="hidden flex-shrink-0 items-center gap-1 text-[10px] font-medium sm:flex"
            style={{ color: 'var(--search-text-tertiary)' }}
          >
            <FolderOpen size={10} className="opacity-60" />
            {result.channelId}
          </span>
        )}

        <span
          data-testid="search-result-type"
          className="flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{
            color: cfg.color,
            background: cfg.bg,
            border: `1px solid ${cfg.color}22`,
          }}
        >
          {cfg.label}
        </span>

        {isActive && (
          <span
            className="flex-shrink-0 opacity-40"
            style={{ color: 'var(--search-text-primary)' }}
            aria-hidden="true"
          >
            <CornerDownLeft size={11} />
          </span>
        )}
      </button>
    )
  }
)
ResultItem.displayName = 'ResultItem'

export function SearchModal({
  isOpen,
  onClose,
  onSearch,
  onClear,
  results,
  isLoading,
  query = '',
  onSelect,
  onNavigate,
}: SearchModalProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [activeFilter, setActiveFilter] = React.useState<FilterType>('all')
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])
  const [mounted, setMounted] = React.useState(false)
  const [exiting, setExiting] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches())
      setMounted(true)
      setExiting(false)
    } else if (mounted) {
      setExiting(true)
      const timer = setTimeout(() => {
        setMounted(false)
        setExiting(false)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  React.useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => inputRef.current?.focus(), 60)
    return () => clearTimeout(timer)
  }, [isOpen])

  React.useEffect(() => {
    setActiveIndex(0)
  }, [results, activeFilter])

  React.useEffect(() => {
    if (!isOpen) {
      setActiveFilter('all')
    }
  }, [isOpen])

  // Scroll active item into view
  React.useEffect(() => {
    const list = listRef.current
    if (!list) return
    const activeEl = list.querySelector('[aria-selected="true"]') as HTMLElement | null
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [activeIndex])

  const filteredResults = React.useMemo(() => {
    if (activeFilter === 'all') return results
    return results.filter(r => r.type === activeFilter)
  }, [results, activeFilter])

  const typeCounts = React.useMemo(() => {
    const counts: Partial<Record<SearchResultType, number>> = {}
    for (const r of results) {
      counts[r.type] = (counts[r.type] ?? 0) + 1
    }
    return counts
  }, [results])

  // Group results by type when filter is 'all' and we have results
  const groupedResults = React.useMemo(() => {
    if (activeFilter !== 'all') return null
    const groups: { type: SearchResultType; label: string; results: SearchResult[] }[] = []
    for (const type of FILTER_TYPES) {
      const items = filteredResults.filter(r => r.type === type)
      if (items.length > 0) {
        groups.push({ type, label: TYPE_CONFIG[type].label, results: items })
      }
    }
    return groups
  }, [filteredResults, activeFilter])

  const activeItem = filteredResults[activeIndex] ?? null

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(prev => Math.min(prev + 1, filteredResults.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(prev => Math.max(prev - 1, 0))
        return
      }
      if (e.key === 'Enter' && activeItem) {
        e.preventDefault()
        if (query.trim()) saveRecentSearch(query.trim())
        if (onSelect) onSelect(activeItem)
        else onClose()
        return
      }
      // Tab to cycle filters
      if (e.key === 'Tab' && filteredResults.length > 0) {
        e.preventDefault()
        const filters: FilterType[] = ['all', ...FILTER_TYPES.filter(t => (typeCounts[t] ?? 0) > 0)]
        const currentIdx = filters.indexOf(activeFilter)
        const nextIdx = e.shiftKey
          ? (currentIdx - 1 + filters.length) % filters.length
          : (currentIdx + 1) % filters.length
        setActiveFilter(filters[nextIdx])
        setActiveIndex(0)
        return
      }
    },
    [onClose, filteredResults.length, activeItem, onSelect, query, activeFilter, typeCounts]
  )

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearch(e.target.value)
    },
    [onSearch]
  )

  const handleClear = React.useCallback(() => {
    onSearch('')
    if (onClear) onClear()
    inputRef.current?.focus()
  }, [onSearch, onClear])

  const handleSelectResult = React.useCallback(
    (result: SearchResult) => {
      if (query.trim()) saveRecentSearch(query.trim())
      if (onSelect) onSelect(result)
      else onClose()
    },
    [onSelect, onClose, query]
  )

  const handleRecentSearch = React.useCallback(
    (q: string) => {
      onSearch(q)
      inputRef.current?.focus()
    },
    [onSearch]
  )

  const handleRemoveRecent = React.useCallback((e: React.MouseEvent, q: string) => {
    e.stopPropagation()
    removeRecentSearch(q)
    setRecentSearches(prev => prev.filter(r => r !== q))
  }, [])

  const handleClearAllRecent = React.useCallback(() => {
    clearAllRecentSearches()
    setRecentSearches([])
  }, [])

  const handleNavigate = React.useCallback(
    (section: string) => {
      if (onNavigate) onNavigate(section)
      onClose()
    },
    [onNavigate, onClose]
  )

  const handleBackdropClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose]
  )

  React.useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!mounted) return null

  const showEmpty = query.trim() === ''
  const hasResults = filteredResults.length > 0
  const totalResults = results.length
  const isExiting = exiting

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center px-4"
      style={{
        paddingTop: 'clamp(40px, 10vh, 120px)',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: isExiting
          ? 'searchFadeOut 150ms ease-in forwards'
          : 'searchFadeIn 150ms ease-out',
      }}
      onClick={handleBackdropClick}
      data-testid="search-modal"
      aria-modal="true"
      role="dialog"
      aria-label="Search"
    >
      <div
        className="flex w-full max-w-[620px] flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          background: 'var(--search-bg)',
          borderColor: 'var(--search-border)',
          boxShadow:
            '0 0 0 1px rgba(0,0,0,0.05), 0 24px 80px rgba(0,0,0,0.5), 0 0 120px rgba(99,102,241,0.06)',
          maxHeight: 'min(560px, 75dvh)',
          animation: isExiting
            ? 'searchModalOut 150ms ease-in forwards'
            : 'searchModalIn 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div
          className="flex items-center gap-3 border-b px-4"
          style={{
            borderColor: 'var(--search-border)',
            paddingTop: '14px',
            paddingBottom: '14px',
          }}
        >
          <Search
            size={18}
            className="flex-shrink-0"
            style={{ color: 'var(--search-text-tertiary)' }}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            data-testid="search-input"
            type="text"
            placeholder="Search flashcards, questions, challenges..."
            value={query}
            onChange={handleInputChange}
            aria-label="Search content"
            aria-autocomplete="list"
            aria-expanded={hasResults}
            className="flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:font-normal"
            style={{
              color: 'var(--search-text-primary)',
              caretColor: 'var(--search-accent)',
            }}
          />
          {query && (
            <button
              data-testid="search-clear-button"
              onClick={handleClear}
              aria-label="Clear search"
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md transition-colors duration-100 hover:brightness-125"
              style={{
                background: 'var(--search-chip-bg)',
                color: 'var(--search-text-tertiary)',
              }}
            >
              <X size={12} aria-hidden="true" />
            </button>
          )}
          <kbd
            className="flex h-6 flex-shrink-0 items-center gap-0.5 rounded-md border px-1.5 text-[10px] font-semibold"
            style={{
              background: 'var(--search-chip-bg)',
              borderColor: 'var(--search-border)',
              color: 'var(--search-text-tertiary)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Type Filter Chips */}
        {!showEmpty && totalResults > 0 && (
          <div
            className="flex gap-1.5 border-b px-3 py-2"
            style={{
              borderColor: 'var(--search-border)',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            <button
              onClick={() => {
                setActiveFilter('all')
                setActiveIndex(0)
              }}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-150"
              style={{
                borderColor:
                  activeFilter === 'all' ? 'var(--search-accent)' : 'var(--search-border)',
                background:
                  activeFilter === 'all'
                    ? 'color-mix(in srgb, var(--search-accent) 12%, transparent)'
                    : 'transparent',
                color:
                  activeFilter === 'all' ? 'var(--search-accent)' : 'var(--search-text-tertiary)',
              }}
            >
              <LayoutGrid size={11} />
              All
              {totalResults > 0 && (
                <span
                  className="rounded-full px-1 py-px text-[10px] font-bold"
                  style={{
                    background:
                      activeFilter === 'all' ? 'var(--search-accent)' : 'var(--search-chip-bg)',
                    color: activeFilter === 'all' ? '#fff' : 'var(--search-text-tertiary)',
                  }}
                >
                  {totalResults}
                </span>
              )}
            </button>

            {FILTER_TYPES.map(type => {
              const cfg = TYPE_CONFIG[type]
              const count = typeCounts[type] ?? 0
              if (count === 0) return null
              const Icon = cfg.icon
              const isActive = activeFilter === type
              return (
                <button
                  key={type}
                  onClick={() => {
                    setActiveFilter(type)
                    setActiveIndex(0)
                  }}
                  className="flex flex-shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all duration-150"
                  style={{
                    borderColor: isActive ? cfg.color : 'var(--search-border)',
                    background: isActive ? cfg.bg : 'transparent',
                    color: isActive ? cfg.color : 'var(--search-text-tertiary)',
                  }}
                >
                  <Icon size={11} />
                  {cfg.label}
                  <span
                    className="rounded-full px-1 py-px text-[10px] font-bold"
                    style={{
                      background: isActive ? cfg.color : 'var(--search-chip-bg)',
                      color: isActive ? '#fff' : 'var(--search-text-tertiary)',
                    }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Scrollable Content Area */}
        <div
          ref={listRef}
          id="search-results-listbox"
          data-testid="search-results"
          role="listbox"
          aria-label="Search results"
          aria-live="polite"
          className="flex-1 overscroll-contain"
          style={{ overflowY: 'auto' }}
        >
          {/* Empty query state */}
          {showEmpty && (
            <div className="pb-2 pt-1">
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="mb-1">
                  <div className="flex items-center justify-between px-4 pb-1.5 pt-2">
                    <span
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: 'var(--search-text-tertiary)' }}
                    >
                      <History size={11} aria-hidden="true" />
                      Recent
                    </span>
                    <button
                      onClick={handleClearAllRecent}
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors duration-100"
                      style={{ color: 'var(--search-text-tertiary)' }}
                      aria-label="Clear all recent searches"
                    >
                      <Trash2 size={10} aria-hidden="true" />
                      Clear
                    </button>
                  </div>
                  {recentSearches.map(q => (
                    <button
                      key={q}
                      onClick={() => handleRecentSearch(q)}
                      className="group flex w-full items-center gap-3 px-4 py-2 text-left transition-colors duration-100"
                      style={{ color: 'var(--search-text-secondary)' }}
                      onMouseEnter={e => {
                        ;(e.currentTarget as HTMLElement).style.background =
                          'var(--search-hover-bg)'
                      }}
                      onMouseLeave={e => {
                        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                      }}
                    >
                      <Clock
                        size={13}
                        className="flex-shrink-0 opacity-40"
                        style={{ color: 'var(--search-text-tertiary)' }}
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate text-[13px]">{q}</span>
                      <span
                        onClick={e => handleRemoveRecent(e, q)}
                        role="button"
                        aria-label={`Remove "${q}" from recent searches`}
                        className="flex items-center rounded p-1 opacity-0 transition-opacity duration-100 group-hover:opacity-100"
                        style={{ color: 'var(--search-text-tertiary)' }}
                      >
                        <X size={11} aria-hidden="true" />
                      </span>
                    </button>
                  ))}
                  <div
                    className="mx-4 mt-1.5"
                    style={{ height: 1, background: 'var(--search-border)' }}
                  />
                </div>
              )}

              {/* Quick navigate */}
              <div className="px-4 pb-1.5 pt-2">
                <span
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--search-text-tertiary)' }}
                >
                  <Sparkles size={11} aria-hidden="true" />
                  Quick Actions
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 px-3 pb-3">
                {SECTION_QUICK_ACTIONS.map(action => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.section}
                      onClick={() => handleNavigate(action.section)}
                      className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[12px] font-medium transition-all duration-150"
                      style={{
                        background: 'var(--search-chip-bg)',
                        borderColor: 'var(--search-border)',
                        color: 'var(--search-text-secondary)',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = `${action.color}44`
                        el.style.color = action.color
                        el.style.background = `color-mix(in srgb, ${action.color} 6%, var(--search-chip-bg))`
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = 'var(--search-border)'
                        el.style.color = 'var(--search-text-secondary)'
                        el.style.background = 'var(--search-chip-bg)'
                      }}
                    >
                      <Icon
                        size={14}
                        style={{ color: action.color, flexShrink: 0 }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{action.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Shortcut hints */}
              {recentSearches.length === 0 && (
                <div
                  className="mx-4 mb-3 flex items-center justify-center gap-4 rounded-xl py-3"
                  style={{ background: 'var(--search-chip-bg)' }}
                >
                  {[
                    { keys: ['↑', '↓'], label: 'Navigate' },
                    { keys: ['↵'], label: 'Select' },
                    { keys: ['Tab'], label: 'Filter' },
                    { keys: ['Esc'], label: 'Close' },
                  ].map(({ keys, label }) => (
                    <span
                      key={label}
                      className="flex items-center gap-1.5 text-[11px]"
                      style={{ color: 'var(--search-text-tertiary)' }}
                    >
                      {keys.map(k => (
                        <kbd
                          key={k}
                          className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border px-1 text-[10px] font-semibold"
                          style={{
                            background: 'var(--search-bg)',
                            borderColor: 'var(--search-border)',
                            color: 'var(--search-text-secondary)',
                          }}
                        >
                          {k}
                        </kbd>
                      ))}
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Loading state */}
          {!showEmpty && isLoading && (
            <div
              data-testid="search-loading"
              role="status"
              aria-live="polite"
              className="flex flex-col items-center justify-center gap-3 py-12"
            >
              <div className="relative h-8 w-8">
                <div
                  className="absolute inset-0 rounded-full border-2"
                  style={{
                    borderColor: 'var(--search-border)',
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full border-2 border-transparent"
                  style={{
                    borderTopColor: 'var(--search-accent)',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
              </div>
              <span
                className="text-[13px] font-medium"
                style={{ color: 'var(--search-text-tertiary)' }}
              >
                Searching...
              </span>
            </div>
          )}

          {/* No results state */}
          {!showEmpty && !isLoading && !hasResults && (
            <div
              data-testid="search-empty-state"
              role="status"
              className="flex flex-col items-center px-6 py-10"
            >
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: 'var(--search-chip-bg)' }}
              >
                <SearchX
                  size={24}
                  style={{ color: 'var(--search-text-tertiary)' }}
                  aria-hidden="true"
                />
              </div>
              <p
                className="mb-1 text-[14px] font-semibold"
                style={{ color: 'var(--search-text-primary)' }}
              >
                No results for &ldquo;{query}&rdquo;
              </p>
              <p
                className="mb-4 max-w-[280px] text-center text-[12px] leading-relaxed"
                style={{ color: 'var(--search-text-tertiary)' }}
              >
                Try different keywords, check the spelling, or search all content types
              </p>
              {activeFilter !== 'all' && (
                <button
                  onClick={() => setActiveFilter('all')}
                  className="flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-[12px] font-semibold transition-colors duration-100"
                  style={{
                    borderColor: 'var(--search-border)',
                    color: 'var(--search-accent)',
                  }}
                  onMouseEnter={e => {
                    ;(e.currentTarget as HTMLElement).style.background = 'var(--search-chip-bg)'
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <LayoutGrid size={12} />
                  Search all types
                </button>
              )}
            </div>
          )}

          {/* Results — Grouped by type when filter is 'all' */}
          {!showEmpty && !isLoading && hasResults && activeFilter === 'all' && groupedResults && (
            <div className="pb-1 pt-0.5">
              {groupedResults.map((group, groupIdx) => {
                const cfg = TYPE_CONFIG[group.type]
                const GroupIcon = cfg.icon
                let globalIndex = 0
                for (let i = 0; i < groupIdx; i++) {
                  globalIndex += groupedResults[i].results.length
                }

                return (
                  <div key={group.type}>
                    <div className="flex items-center gap-2 px-4 pb-1 pt-3">
                      <GroupIcon
                        size={12}
                        style={{ color: cfg.color }}
                        className="opacity-70"
                        aria-hidden="true"
                      />
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: 'var(--search-text-tertiary)' }}
                      >
                        {cfg.label}s
                      </span>
                      <span
                        className="text-[10px] font-medium"
                        style={{ color: 'var(--search-text-tertiary)' }}
                      >
                        {group.results.length}
                      </span>
                    </div>
                    {group.results.map((result, idx) => {
                      const itemIndex = globalIndex + idx
                      return (
                        <ResultItem
                          key={result.id}
                          result={result}
                          query={query}
                          isActive={itemIndex === activeIndex}
                          index={itemIndex}
                          onSelect={() => handleSelectResult(result)}
                          onHover={() => setActiveIndex(itemIndex)}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}

          {/* Results — Flat list when a specific filter is active */}
          {!showEmpty && !isLoading && hasResults && activeFilter !== 'all' && (
            <div className="pb-1 pt-0.5">
              <div className="flex items-center justify-between px-4 pb-1 pt-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--search-text-tertiary)' }}
                >
                  {filteredResults.length} {TYPE_CONFIG[activeFilter].label}
                  {filteredResults.length !== 1 ? 's' : ''}
                </span>
              </div>
              {filteredResults.map((result, idx) => (
                <ResultItem
                  key={result.id}
                  result={result}
                  query={query}
                  isActive={idx === activeIndex}
                  index={idx}
                  onSelect={() => handleSelectResult(result)}
                  onHover={() => setActiveIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!showEmpty && hasResults && (
          <div
            className="flex flex-shrink-0 items-center justify-between border-t px-4 py-2"
            style={{
              borderColor: 'var(--search-border)',
              background: 'var(--search-chip-bg)',
            }}
          >
            <div className="flex items-center gap-3">
              {[
                { keys: ['↑', '↓'], label: 'navigate' },
                { keys: ['↵'], label: 'open' },
                { keys: ['Tab'], label: 'filter' },
                { keys: ['Esc'], label: 'close' },
              ].map(({ keys, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-1 text-[10px]"
                  style={{ color: 'var(--search-text-tertiary)' }}
                >
                  {keys.map(k => (
                    <kbd
                      key={k}
                      className="inline-flex h-4 min-w-[16px] items-center justify-center rounded border px-1 text-[9px] font-semibold"
                      style={{
                        background: 'var(--search-bg)',
                        borderColor: 'var(--search-border)',
                      }}
                    >
                      {k}
                    </kbd>
                  ))}
                  {label}
                </span>
              ))}
            </div>

            <span
              className="flex items-center gap-1 text-[10px] font-medium"
              style={{ color: 'var(--search-text-tertiary)' }}
            >
              <Zap size={9} style={{ color: 'var(--search-accent)' }} aria-hidden="true" />
              DevPrep
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes searchFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes searchFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes searchModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes searchModalOut {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.97) translateY(-4px); }
        }
      `}</style>
    </div>,
    document.body
  )
}
