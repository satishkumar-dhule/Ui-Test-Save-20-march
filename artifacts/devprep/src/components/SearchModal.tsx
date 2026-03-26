'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import {
  Search,
  FileText,
  Code,
  Mic,
  MessageSquare,
  Layers,
  X,
  Clock,
  Frown,
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
          background: 'color-mix(in srgb, var(--search-accent) 15%, transparent)',
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
  flashcard: { label: 'Flashcard', icon: Layers, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  question: {
    label: 'Question',
    icon: MessageSquare,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
  },
  coding: { label: 'Coding', icon: Code, color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
  voice: { label: 'Voice', icon: Mic, color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  exam: { label: 'Exam', icon: FileText, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
}

const SECTION_QUICK_ACTIONS = [
  { label: 'Browse Flashcards', icon: Layers, section: 'flashcards', color: '#22c55e' },
  { label: 'Practice Questions', icon: MessageSquare, section: 'qa', color: '#3b82f6' },
  { label: 'Coding Challenges', icon: Code, section: 'coding', color: '#eab308' },
  { label: 'Voice Practice', icon: Mic, section: 'voice', color: '#a855f7' },
  { label: 'Mock Exam', icon: FileText, section: 'exam', color: '#ef4444' },
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

function SkeletonRow({ delay }: { delay: number }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="h-8 w-8 flex-shrink-0 rounded-lg"
        style={{
          background: 'var(--search-chip-bg)',
          animation: 'skeleton-pulse 1.5s ease-in-out infinite',
          animationDelay: `${delay}ms`,
        }}
      />
      <div className="flex-1 space-y-1.5">
        <div
          className="h-3 rounded-md"
          style={{
            width: `${60 + Math.random() * 30}%`,
            background: 'var(--search-chip-bg)',
            animation: 'skeleton-pulse 1.5s ease-in-out infinite',
            animationDelay: `${delay + 80}ms`,
          }}
        />
        <div
          className="h-2.5 rounded-md"
          style={{
            width: `${40 + Math.random() * 40}%`,
            background: 'var(--search-chip-bg)',
            animation: 'skeleton-pulse 1.5s ease-in-out infinite',
            animationDelay: `${delay + 160}ms`,
          }}
        />
      </div>
      <div
        className="h-5 w-14 flex-shrink-0 rounded-md"
        style={{
          background: 'var(--search-chip-bg)',
          animation: 'skeleton-pulse 1.5s ease-in-out infinite',
          animationDelay: `${delay + 120}ms`,
        }}
      />
    </div>
  )
}

const ResultItem = React.memo<ResultItemProps>(
  ({ result, query, isActive, index, onSelect, onHover }) => {
    const cfg = TYPE_CONFIG[result.type]
    const Icon = cfg.icon

    return (
      <button
        className="group flex w-full items-center gap-3 px-5 py-2.5 text-left outline-none transition-all duration-150"
        style={{
          background: isActive ? 'var(--search-hover-bg)' : 'transparent',
          borderLeft: isActive ? `3px solid ${cfg.color}` : '3px solid transparent',
          paddingLeft: isActive ? 'calc(20px - 3px)' : '20px',
        }}
        onClick={onSelect}
        onMouseEnter={onHover}
        role="option"
        aria-selected={isActive}
        data-testid="search-result"
      >
        <span
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-transform duration-150"
          style={{
            background: cfg.bg,
            color: cfg.color,
            transform: isActive ? 'scale(1.1)' : 'scale(1)',
          }}
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
            className="flex-shrink-0 opacity-50 transition-opacity duration-150"
            style={{ color: 'var(--search-text-secondary)' }}
            aria-hidden="true"
          >
            <CornerDownLeft size={12} />
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
  const [inputFocused, setInputFocused] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches())
      setMounted(true)
      setExiting(false)
      return undefined
    }
    if (!mounted) return undefined
    setExiting(true)
    const timer = setTimeout(() => {
      setMounted(false)
      setExiting(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [isOpen, mounted])

  React.useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => inputRef.current?.focus(), 80)
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

  const groupedByChannel = React.useMemo(() => {
    if (filteredResults.length === 0) return null
    const channelMap = new Map<string, SearchResult[]>()
    const noChannel: SearchResult[] = []

    for (const r of filteredResults) {
      if (r.channelId) {
        const arr = channelMap.get(r.channelId) ?? []
        arr.push(r)
        channelMap.set(r.channelId, arr)
      } else {
        noChannel.push(r)
      }
    }

    const groups: { channelId: string; results: SearchResult[] }[] = []
    for (const [channelId, items] of channelMap) {
      groups.push({ channelId, results: items })
    }
    if (noChannel.length > 0) {
      groups.unshift({ channelId: 'Other', results: noChannel })
    }
    return groups.length > 1 ? groups : null
  }, [filteredResults])

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
  const filteredCount = filteredResults.length

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center px-4"
      style={{
        paddingTop: 'clamp(48px, 10vh, 120px)',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: exiting ? 'searchFadeOut 200ms ease-in forwards' : 'searchFadeIn 250ms ease-out',
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
            '0 0 0 1px rgba(0,0,0,0.04), 0 25px 65px rgba(0,0,0,0.45), 0 0 100px rgba(99,102,241,0.05)',
          maxHeight: 'min(580px, 75dvh)',
          animation: exiting
            ? 'searchModalOut 180ms ease-in forwards'
            : 'searchModalIn 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div
          className="relative flex items-center gap-3 border-b px-4"
          style={{
            borderColor: inputFocused
              ? 'color-mix(in srgb, var(--search-accent) 40%, var(--search-border))'
              : 'var(--search-border)',
            paddingTop: '16px',
            paddingBottom: '16px',
            transition: 'border-color 200ms ease',
          }}
        >
          <Search
            size={20}
            className="flex-shrink-0 transition-colors duration-200"
            style={{
              color: inputFocused ? 'var(--search-accent)' : 'var(--search-text-tertiary)',
            }}
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            data-testid="search-input"
            type="text"
            placeholder="Search flashcards, questions, challenges..."
            value={query}
            onChange={handleInputChange}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            aria-label="Search content"
            aria-autocomplete="list"
            aria-expanded={hasResults}
            className="flex-1 bg-transparent text-[16px] font-medium outline-none placeholder:font-normal placeholder:transition-colors placeholder:duration-200"
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
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-150 hover:scale-105 hover:brightness-125"
              style={{
                background: 'var(--search-chip-bg)',
                color: 'var(--search-text-tertiary)',
              }}
            >
              <X size={13} aria-hidden="true" />
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
          {inputFocused && (
            <div
              className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, transparent, var(--search-accent), transparent)',
                animation: 'focusLine 300ms ease-out',
              }}
            />
          )}
        </div>

        {/* Result count bar */}
        {!showEmpty && !isLoading && hasResults && (
          <div
            className="flex items-center justify-between border-b px-4 py-1.5"
            style={{
              borderColor: 'var(--search-border)',
              background: 'color-mix(in srgb, var(--search-chip-bg) 50%, transparent)',
            }}
          >
            <span
              className="text-[11px] font-medium"
              style={{ color: 'var(--search-text-tertiary)' }}
            >
              {activeFilter === 'all'
                ? `${totalResults} result${totalResults !== 1 ? 's' : ''} found`
                : `${filteredCount} ${TYPE_CONFIG[activeFilter].label}${filteredCount !== 1 ? 's' : ''}`}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--search-text-tertiary)' }}>
              &ldquo;{query}&rdquo;
            </span>
          </div>
        )}

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
                transform: activeFilter === 'all' ? 'scale(1.02)' : 'scale(1)',
              }}
              aria-pressed={activeFilter === 'all'}
            >
              <LayoutGrid size={11} />
              All
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
                    transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  }}
                  aria-pressed={isActive}
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
              {/* Hero empty state */}
              <div className="flex flex-col items-center px-6 py-8">
                <div
                  className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{
                    background: 'color-mix(in srgb, var(--search-accent) 8%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--search-accent) 15%, transparent)',
                  }}
                >
                  <Search
                    size={28}
                    className="opacity-50"
                    style={{ color: 'var(--search-accent)' }}
                    aria-hidden="true"
                  />
                </div>
                <p
                  className="mb-1 text-[15px] font-semibold"
                  style={{ color: 'var(--search-text-primary)' }}
                >
                  Search everything
                </p>
                <p
                  className="text-center text-[12px] leading-relaxed"
                  style={{ color: 'var(--search-text-tertiary)' }}
                >
                  Find flashcards, questions, coding challenges, and more
                </p>
              </div>

              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="mb-1">
                  <div className="flex items-center justify-between px-4 pb-2 pt-1">
                    <span
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: 'var(--search-text-tertiary)' }}
                    >
                      <History size={11} aria-hidden="true" />
                      Recent searches
                    </span>
                    <button
                      onClick={handleClearAllRecent}
                      className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors duration-100 hover:brightness-125"
                      style={{ color: 'var(--search-text-tertiary)' }}
                      aria-label="Clear all recent searches"
                    >
                      <Trash2 size={10} aria-hidden="true" />
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                    {recentSearches.map(q => (
                      <button
                        key={q}
                        onClick={() => handleRecentSearch(q)}
                        className="group flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-[12px] transition-all duration-150 hover:scale-[1.02]"
                        style={{
                          borderColor: 'var(--search-border)',
                          background: 'var(--search-chip-bg)',
                          color: 'var(--search-text-secondary)',
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLElement
                          el.style.borderColor =
                            'color-mix(in srgb, var(--search-accent) 30%, var(--search-border))'
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLElement
                          el.style.borderColor = 'var(--search-border)'
                        }}
                      >
                        <Clock size={11} className="flex-shrink-0 opacity-50" aria-hidden="true" />
                        <span className="max-w-[140px] truncate">{q}</span>
                        <span
                          onClick={e => handleRemoveRecent(e, q)}
                          role="button"
                          aria-label={`Remove "${q}" from recent searches`}
                          className="ml-0.5 flex items-center rounded-full p-0.5 opacity-0 transition-opacity duration-100 group-hover:opacity-100"
                          style={{ color: 'var(--search-text-tertiary)' }}
                        >
                          <X size={10} aria-hidden="true" />
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="mx-4" style={{ height: 1, background: 'var(--search-border)' }} />
                </div>
              )}

              {/* Quick actions */}
              <div className="px-4 pb-1.5 pt-2">
                <span
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--search-text-tertiary)' }}
                >
                  <Sparkles size={11} aria-hidden="true" />
                  Quick actions
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 px-3 pb-3">
                {SECTION_QUICK_ACTIONS.map(action => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.section}
                      onClick={() => handleNavigate(action.section)}
                      className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[12px] font-medium transition-all duration-150 hover:scale-[1.01]"
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

              {/* Keyboard shortcuts */}
              {recentSearches.length === 0 && (
                <div
                  className="mx-4 mb-3 flex items-center justify-center gap-4 rounded-xl py-3"
                  style={{ background: 'var(--search-chip-bg)' }}
                >
                  {[
                    {
                      keys: [<ArrowUp key="u" size={10} />, <ArrowDown key="d" size={10} />],
                      label: 'Navigate',
                    },
                    { keys: [<CornerDownLeft key="e" size={10} />], label: 'Select' },
                    {
                      keys: [
                        <span key="tab" className="text-[10px] font-bold">
                          Tab
                        </span>,
                      ],
                      label: 'Filter',
                    },
                  ].map(({ keys, label }) => (
                    <span
                      key={label}
                      className="flex items-center gap-1.5 text-[11px]"
                      style={{ color: 'var(--search-text-tertiary)' }}
                    >
                      <span
                        className="inline-flex h-5 min-w-[20px] items-center justify-center gap-0.5 rounded border px-1"
                        style={{
                          background: 'var(--search-bg)',
                          borderColor: 'var(--search-border)',
                          color: 'var(--search-text-secondary)',
                        }}
                      >
                        {keys}
                      </span>
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Loading skeleton state */}
          {!showEmpty && isLoading && (
            <div data-testid="search-loading" role="status" aria-live="polite" className="py-1">
              <div className="px-4 pb-2 pt-3">
                <div
                  className="h-2.5 w-20 rounded-md"
                  style={{
                    background: 'var(--search-chip-bg)',
                    animation: 'skeleton-pulse 1.5s ease-in-out infinite',
                  }}
                />
              </div>
              {[0, 1, 2, 3, 4].map(i => (
                <SkeletonRow key={i} delay={i * 100} />
              ))}
            </div>
          )}

          {/* No results state */}
          {!showEmpty && !isLoading && !hasResults && (
            <div
              data-testid="search-empty-state"
              role="status"
              className="flex flex-col items-center px-6 py-12"
            >
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{
                  background: 'color-mix(in srgb, var(--search-text-tertiary) 6%, transparent)',
                  border: '1px solid var(--search-border)',
                }}
              >
                <Frown
                  size={28}
                  className="opacity-40"
                  style={{ color: 'var(--search-text-tertiary)' }}
                  aria-hidden="true"
                />
              </div>
              <p
                className="mb-1 text-[15px] font-semibold"
                style={{ color: 'var(--search-text-primary)' }}
              >
                No results found
              </p>
              <p
                className="mb-5 max-w-[280px] text-center text-[12px] leading-relaxed"
                style={{ color: 'var(--search-text-tertiary)' }}
              >
                Try different keywords, check your spelling, or browse all content types below
              </p>
              <div className="flex gap-2">
                {activeFilter !== 'all' && (
                  <button
                    onClick={() => setActiveFilter('all')}
                    className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[12px] font-semibold transition-all duration-150 hover:scale-[1.02]"
                    style={{
                      borderColor: 'var(--search-accent)',
                      color: 'var(--search-accent)',
                      background: 'color-mix(in srgb, var(--search-accent) 6%, transparent)',
                    }}
                  >
                    <LayoutGrid size={12} />
                    Search all types
                  </button>
                )}
                <button
                  onClick={() => {
                    onSearch('')
                    inputRef.current?.focus()
                  }}
                  className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[12px] font-medium transition-all duration-150 hover:scale-[1.02]"
                  style={{
                    borderColor: 'var(--search-border)',
                    color: 'var(--search-text-secondary)',
                    background: 'var(--search-chip-bg)',
                  }}
                >
                  Clear search
                </button>
              </div>
            </div>
          )}

          {/* Results grouped by channel */}
          {!showEmpty && !isLoading && hasResults && groupedByChannel && (
            <div className="pb-1 pt-0.5">
              {groupedByChannel.map((channelGroup, chIdx) => {
                let globalIndex = 0
                for (let i = 0; i < chIdx; i++) {
                  globalIndex += groupedByChannel[i].results.length
                }
                return (
                  <div key={channelGroup.channelId}>
                    <div
                      className="flex items-center gap-2 border-b px-4 pb-1.5 pt-3"
                      style={{ borderColor: 'var(--search-border)' }}
                    >
                      <span
                        className="opacity-50"
                        style={{ color: 'var(--search-text-tertiary)' }}
                        aria-hidden="true"
                      >
                        <FolderOpen size={11} />
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: 'var(--search-text-tertiary)' }}
                      >
                        {channelGroup.channelId}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{ color: 'var(--search-text-tertiary)' }}
                      >
                        {channelGroup.results.length}
                      </span>
                    </div>
                    {channelGroup.results.map((result, idx) => (
                      <ResultItem
                        key={result.id}
                        result={result}
                        query={query}
                        isActive={globalIndex + idx === activeIndex}
                        index={globalIndex + idx}
                        onSelect={() => handleSelectResult(result)}
                        onHover={() => setActiveIndex(globalIndex + idx)}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {/* Results flat list (single channel or no channel grouping) */}
          {!showEmpty &&
            !isLoading &&
            hasResults &&
            !groupedByChannel &&
            activeFilter === 'all' && (
              <div className="pb-1 pt-0.5">
                {(() => {
                  const groups: {
                    type: SearchResultType
                    label: string
                    results: SearchResult[]
                  }[] = []
                  for (const type of FILTER_TYPES) {
                    const items = filteredResults.filter(r => r.type === type)
                    if (items.length > 0) {
                      groups.push({ type, label: TYPE_CONFIG[type].label, results: items })
                    }
                  }
                  let globalIndex = 0
                  return groups.map((group, groupIdx) => {
                    const cfg = TYPE_CONFIG[group.type]
                    const GroupIcon = cfg.icon
                    const startIdx = globalIndex
                    globalIndex += group.results.length
                    return (
                      <div key={group.type}>
                        <div className="flex items-center gap-2 px-4 pb-1 pt-3">
                          <span
                            style={{ color: cfg.color }}
                            className="opacity-70"
                            aria-hidden="true"
                          >
                            <GroupIcon size={12} />
                          </span>
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
                        {group.results.map((result, idx) => (
                          <ResultItem
                            key={result.id}
                            result={result}
                            query={query}
                            isActive={startIdx + idx === activeIndex}
                            index={startIdx + idx}
                            onSelect={() => handleSelectResult(result)}
                            onHover={() => setActiveIndex(startIdx + idx)}
                          />
                        ))}
                      </div>
                    )
                  })
                })()}
              </div>
            )}

          {/* Results flat list for specific filter */}
          {!showEmpty && !isLoading && hasResults && activeFilter !== 'all' && (
            <div className="pb-1 pt-0.5">
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
                {
                  icon: (
                    <>
                      <ArrowUp size={9} />
                      <ArrowDown size={9} />
                    </>
                  ),
                  label: 'navigate',
                },
                { icon: <CornerDownLeft size={9} />, label: 'open' },
                { icon: <span className="text-[9px] font-bold">Tab</span>, label: 'filter' },
              ].map(({ icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-1 text-[10px]"
                  style={{ color: 'var(--search-text-tertiary)' }}
                >
                  <kbd
                    className="inline-flex h-4 min-w-[16px] items-center justify-center gap-0.5 rounded border px-1"
                    style={{
                      background: 'var(--search-bg)',
                      borderColor: 'var(--search-border)',
                      color: 'var(--search-text-secondary)',
                    }}
                  >
                    {icon}
                  </kbd>
                  {label}
                </span>
              ))}
            </div>
            <span
              className="text-[10px] font-medium"
              style={{ color: 'var(--search-text-tertiary)' }}
            >
              {filteredCount} of {totalResults}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes searchFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes searchFadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes searchModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes searchModalOut {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.97) translateY(6px); }
        }
        @keyframes focusLine {
          from { opacity: 0; transform: scaleX(0.5); }
          to { opacity: 1; transform: scaleX(1); }
        }
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>,
    document.body
  )
}
