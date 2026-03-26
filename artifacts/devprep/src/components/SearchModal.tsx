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
  BookOpen,
  Star,
  TrendingUp,
  ArrowRight,
} from 'lucide-react'
import type { SearchResult, SearchResultType } from '@/types/search'

const RECENT_SEARCHES_KEY = 'devprep-recent-searches'
const MAX_RECENT = 6

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

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 1)
  if (terms.length === 0) return text

  const pattern = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  const parts = text.split(pattern)

  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark
        key={i}
        style={{
          background: 'var(--dp-blue)22',
          color: 'var(--dp-blue)',
          borderRadius: 3,
          padding: '0 2px',
          fontWeight: 700,
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
  { label: string; icon: React.FC<{ size?: number }> ; color: string; bg: string }
> = {
  flashcard: { label: 'Flashcard', icon: FileText, color: '#3fb950', bg: '#3fb95018' },
  question: { label: 'Question', icon: ClipboardList, color: '#388bfd', bg: '#388bfd18' },
  coding: { label: 'Coding', icon: Code, color: '#f7df1e', bg: '#f7df1e18' },
  voice: { label: 'Voice', icon: Mic, color: '#bc8cff', bg: '#bc8cff18' },
  exam: { label: 'Exam', icon: Layers, color: '#ff7b72', bg: '#ff7b7218' },
}

const SECTION_QUICK_ACTIONS = [
  { label: 'Browse Flashcards', icon: FileText, section: 'flashcards', color: '#3fb950' },
  { label: 'Practice Questions', icon: ClipboardList, section: 'qa', color: '#388bfd' },
  { label: 'Coding Challenges', icon: Code, section: 'coding', color: '#f7df1e' },
  { label: 'Voice Practice', icon: Mic, section: 'voice', color: '#bc8cff' },
  { label: 'Mock Exam', icon: Layers, section: 'exam', color: '#ff7b72' },
  { label: 'Statistics', icon: TrendingUp, section: 'stats', color: '#39d3f4' },
]

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
  onSelect: () => void
  onHover: () => void
}

const ResultItem = React.memo<ResultItemProps>(({ result, query, isActive, onSelect, onHover }) => {
  const cfg = TYPE_CONFIG[result.type]
  const Icon = cfg.icon

  return (
    <button
      className="search-result-item"
      data-active={isActive}
      onClick={onSelect}
      onMouseEnter={onHover}
      role="option"
      aria-selected={isActive}
      data-testid="search-result"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '10px 16px',
        background: isActive ? 'var(--dp-bg-2)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.1s',
        borderRadius: 0,
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          borderRadius: 8,
          background: cfg.bg,
          color: cfg.color,
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        <Icon size={15} />
      </span>

      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          data-testid="search-result-title"
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--dp-text-0)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {highlightText(result.title, query)}
        </span>
        {result.preview && (
          <span
            data-testid="search-result-preview"
            style={{
              display: 'block',
              fontSize: 11,
              color: 'var(--dp-text-3)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: 2,
            }}
          >
            {highlightText(result.preview, query)}
          </span>
        )}
      </span>

      <span
        data-testid="search-result-type"
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: cfg.color,
          background: cfg.bg,
          border: `1px solid ${cfg.color}33`,
          borderRadius: 4,
          padding: '2px 6px',
          flexShrink: 0,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {cfg.label}
      </span>

      {result.channelId && (
        <span
          style={{
            fontSize: 10,
            color: 'var(--dp-text-4)',
            flexShrink: 0,
            maxWidth: 80,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {result.channelId}
        </span>
      )}

      {isActive && (
        <span style={{ color: 'var(--dp-text-4)', flexShrink: 0 }} aria-hidden="true">
          <ChevronRight size={12} />
        </span>
      )}
    </button>
  )
})
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

  React.useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches())
    }
  }, [isOpen])

  React.useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [isOpen])

  React.useEffect(() => {
    setActiveIndex(0)
  }, [results])

  React.useEffect(() => {
    if (!isOpen) {
      setActiveFilter('all')
    }
  }, [isOpen])

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
    },
    [onClose, filteredResults.length, activeItem, onSelect, query]
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

  const handleRemoveRecent = React.useCallback(
    (e: React.MouseEvent, q: string) => {
      e.stopPropagation()
      removeRecentSearch(q)
      setRecentSearches(prev => prev.filter(r => r !== q))
    },
    []
  )

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

  if (!isOpen) return null

  const showEmpty = query.trim() === ''
  const hasResults = filteredResults.length > 0
  const totalResults = results.length

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 'clamp(40px, 10vh, 120px)',
        paddingLeft: 16,
        paddingRight: 16,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onClick={handleBackdropClick}
      data-testid="search-modal"
      aria-modal="true"
      role="dialog"
      aria-label="Search"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          background: 'var(--dp-bg-0)',
          border: '1px solid var(--dp-border-1)',
          borderRadius: 14,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'min(640px, 80dvh)',
        }}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderBottom: '1px solid var(--dp-border-1)',
          }}
        >
          <Search
            size={17}
            style={{ color: 'var(--dp-text-3)', flexShrink: 0 }}
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
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 15,
              color: 'var(--dp-text-0)',
              caretColor: 'var(--dp-blue)',
            }}
          />
          {query && (
            <button
              data-testid="search-clear-button"
              onClick={handleClear}
              aria-label="Clear search"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--dp-bg-3)',
                border: 'none',
                borderRadius: 6,
                width: 24,
                height: 24,
                cursor: 'pointer',
                color: 'var(--dp-text-3)',
                flexShrink: 0,
              }}
            >
              <X size={13} aria-hidden="true" />
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close search"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--dp-bg-3)',
              border: '1px solid var(--dp-border-1)',
              borderRadius: 6,
              padding: '2px 6px',
              cursor: 'pointer',
              color: 'var(--dp-text-3)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.02em',
              flexShrink: 0,
            }}
          >
            esc
          </button>
        </div>

        {/* Type Filter Tabs — only shown when results exist */}
        {!showEmpty && (
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: '8px 12px',
              borderBottom: '1px solid var(--dp-border-1)',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            <button
              onClick={() => { setActiveFilter('all'); setActiveIndex(0) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 10px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: activeFilter === 'all' ? 'var(--dp-blue)' : 'var(--dp-border-1)',
                background: activeFilter === 'all' ? 'var(--dp-blue)18' : 'transparent',
                color: activeFilter === 'all' ? 'var(--dp-blue)' : 'var(--dp-text-3)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              All
              {totalResults > 0 && (
                <span
                  style={{
                    background: activeFilter === 'all' ? 'var(--dp-blue)' : 'var(--dp-bg-3)',
                    color: activeFilter === 'all' ? '#fff' : 'var(--dp-text-3)',
                    borderRadius: 10,
                    padding: '0 5px',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {totalResults}
                </span>
              )}
            </button>

            {(Object.keys(TYPE_CONFIG) as SearchResultType[]).map(type => {
              const cfg = TYPE_CONFIG[type]
              const count = typeCounts[type] ?? 0
              if (count === 0) return null
              const Icon = cfg.icon
              const isActive = activeFilter === type
              return (
                <button
                  key={type}
                  onClick={() => { setActiveFilter(type); setActiveIndex(0) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '3px 10px',
                    borderRadius: 20,
                    border: '1px solid',
                    borderColor: isActive ? cfg.color : 'var(--dp-border-1)',
                    background: isActive ? cfg.bg : 'transparent',
                    color: isActive ? cfg.color : 'var(--dp-text-3)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={11} />
                  {cfg.label}
                  <span
                    style={{
                      background: isActive ? cfg.color : 'var(--dp-bg-3)',
                      color: isActive ? '#fff' : 'var(--dp-text-3)',
                      borderRadius: 10,
                      padding: '0 5px',
                      fontSize: 10,
                      fontWeight: 700,
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
          style={{
            flex: 1,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
          }}
        >
          {/* Empty query state */}
          {showEmpty && (
            <div style={{ padding: '8px 0 4px' }}>
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 16px 4px',
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'var(--dp-text-4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    <Clock size={10} aria-hidden="true" />
                    Recent Searches
                  </div>
                  {recentSearches.map(q => (
                    <button
                      key={q}
                      onClick={() => handleRecentSearch(q)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '8px 16px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'var(--dp-text-2)',
                        fontSize: 13,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => {
                        ;(e.currentTarget as HTMLElement).style.background = 'var(--dp-bg-2)'
                      }}
                      onMouseLeave={e => {
                        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                      }}
                    >
                      <Clock size={13} style={{ color: 'var(--dp-text-4)', flexShrink: 0 }} aria-hidden="true" />
                      <span style={{ flex: 1 }}>{q}</span>
                      <span
                        onClick={e => handleRemoveRecent(e, q)}
                        role="button"
                        aria-label={`Remove "${q}" from recent searches`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          color: 'var(--dp-text-4)',
                          padding: 4,
                          borderRadius: 4,
                        }}
                      >
                        <X size={11} aria-hidden="true" />
                      </span>
                    </button>
                  ))}
                  <div
                    style={{
                      height: 1,
                      background: 'var(--dp-border-1)',
                      margin: '8px 16px',
                    }}
                  />
                </div>
              )}

              {/* Quick navigate */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 16px 4px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--dp-text-4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                <Zap size={10} aria-hidden="true" />
                Quick Navigate
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 4,
                  padding: '4px 12px 12px',
                }}
              >
                {SECTION_QUICK_ACTIONS.map(action => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.section}
                      onClick={() => handleNavigate(action.section)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        background: 'var(--dp-bg-1)',
                        border: '1px solid var(--dp-border-1)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'var(--dp-text-2)',
                        fontSize: 12,
                        fontWeight: 500,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.background = 'var(--dp-bg-2)'
                        el.style.borderColor = `${action.color}44`
                        el.style.color = action.color
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement
                        el.style.background = 'var(--dp-bg-1)'
                        el.style.borderColor = 'var(--dp-border-1)'
                        el.style.color = 'var(--dp-text-2)'
                      }}
                    >
                      <Icon size={13} style={{ color: action.color }} aria-hidden="true" />
                      {action.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Loading state */}
          {!showEmpty && isLoading && (
            <div
              data-testid="search-loading"
              role="status"
              aria-live="polite"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 16px',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  border: '2px solid var(--dp-border-1)',
                  borderTopColor: 'var(--dp-blue)',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }}
                aria-hidden="true"
              />
              <span style={{ fontSize: 13, color: 'var(--dp-text-3)' }}>Searching...</span>
            </div>
          )}

          {/* No results state */}
          {!showEmpty && !isLoading && !hasResults && (
            <div
              data-testid="search-empty-state"
              role="status"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '40px 16px',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--dp-bg-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Search size={22} style={{ color: 'var(--dp-text-4)' }} aria-hidden="true" />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--dp-text-1)', margin: 0 }}>
                No results for &ldquo;{query}&rdquo;
              </p>
              <p style={{ fontSize: 12, color: 'var(--dp-text-4)', margin: 0, textAlign: 'center' }}>
                Try different keywords or check the spelling
              </p>
              {activeFilter !== 'all' && (
                <button
                  onClick={() => setActiveFilter('all')}
                  style={{
                    marginTop: 8,
                    padding: '6px 14px',
                    border: '1px solid var(--dp-border-1)',
                    borderRadius: 8,
                    background: 'transparent',
                    color: 'var(--dp-blue)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Search all types
                </button>
              )}
            </div>
          )}

          {/* Results */}
          {!showEmpty && !isLoading && hasResults && (
            <div style={{ padding: '4px 0' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 16px 6px',
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'var(--dp-text-4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                  {activeFilter !== 'all' && ` · ${TYPE_CONFIG[activeFilter].label}s`}
                </span>
                <span style={{ fontSize: 10, color: 'var(--dp-text-4)' }}>
                  sorted by relevance
                </span>
              </div>
              {filteredResults.map((result, idx) => (
                <ResultItem
                  key={result.id}
                  result={result}
                  query={query}
                  isActive={idx === activeIndex}
                  onSelect={() => handleSelectResult(result)}
                  onHover={() => setActiveIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer — keyboard hints */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            borderTop: '1px solid var(--dp-border-1)',
            background: 'var(--dp-bg-1)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {[
              { keys: ['↑', '↓'], label: 'navigate' },
              { keys: ['↵'], label: 'select' },
              { keys: ['esc'], label: 'close' },
            ].map(({ keys, label }) => (
              <span
                key={label}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--dp-text-4)' }}
              >
                {keys.map(k => (
                  <kbd
                    key={k}
                    style={{
                      background: 'var(--dp-bg-3)',
                      border: '1px solid var(--dp-border-1)',
                      borderRadius: 4,
                      padding: '1px 5px',
                      fontSize: 10,
                      fontFamily: 'inherit',
                      fontWeight: 600,
                    }}
                  >
                    {k}
                  </kbd>
                ))}
                <span>{label}</span>
              </span>
            ))}
          </div>

          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: 'var(--dp-text-4)',
            }}
          >
            <Zap size={10} style={{ color: 'var(--dp-blue)' }} aria-hidden="true" />
            DevPrep
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .search-result-item:hover { background: var(--dp-bg-2) !important; }
      `}</style>
    </div>,
    document.body
  )
}
