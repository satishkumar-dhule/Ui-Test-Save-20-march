'use client'

import * as React from 'react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Search, FileText, Code, Mic, ClipboardList, Layers, X } from 'lucide-react'
import type { SearchResult, SearchResultType } from '@/types/search'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (query: string) => void
  onClear?: () => void
  results: SearchResult[]
  isLoading: boolean
  query?: string
  onSelect?: (result: SearchResult) => void
}

const typeIcons: Record<SearchResultType, React.ReactNode> = {
  flashcard: <FileText className="h-4 w-4 text-secondary opacity-70" aria-hidden="true" />,
  question: <ClipboardList className="h-4 w-4 text-secondary opacity-70" aria-hidden="true" />,
  coding: <Code className="h-4 w-4 text-secondary opacity-70" aria-hidden="true" />,
  voice: <Mic className="h-4 w-4 text-secondary opacity-70" aria-hidden="true" />,
  exam: <Layers className="h-4 w-4 text-secondary opacity-70" aria-hidden="true" />,
}

const typeLabels: Record<SearchResultType, string> = {
  flashcard: 'Flashcard',
  question: 'Question',
  coding: 'Coding',
  voice: 'Voice',
  exam: 'Exam',
}

const typeColors: Record<SearchResultType, 'default' | 'secondary' | 'outline'> = {
  flashcard: 'default',
  question: 'secondary',
  coding: 'outline',
  voice: 'secondary',
  exam: 'default',
}

function groupResultsByType(results: SearchResult[]): Record<string, SearchResult[]> {
  return results.reduce(
    (acc, result) => {
      const key = result.type
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(result)
      return acc
    },
    {} as Record<string, SearchResult[]>
  )
}

function createResultIndexMap(results: SearchResult[]): Map<string, number> {
  const map = new Map<string, number>()
  results.forEach((result, index) => {
    map.set(result.id, index)
  })
  return map
}

const PERFORMANCE_THRESHOLD_MS = 16

interface SearchResultItemProps {
  result: SearchResult
  globalIndex: number
  isActive: boolean
  onSelect: (result: SearchResult) => void
  onClose: () => void
  onHover: (index: number) => void
  hasExternalSelect: boolean
}

const SearchResultItem = React.memo<SearchResultItemProps>(
  ({ result, globalIndex, isActive, onSelect, onClose, onHover, hasExternalSelect }) => {
    const handleSelect = React.useCallback(() => {
      if (hasExternalSelect) {
        onSelect(result)
      } else {
        onClose()
      }
    }, [result, onSelect, onClose, hasExternalSelect])

    return (
      <CommandItem
        id={`search-option-${globalIndex}`}
        value={`${result.type}-${result.id}`}
        data-testid="search-result"
        role="option"
        aria-selected={isActive}
        onSelect={handleSelect}
        onMouseEnter={() => onHover(globalIndex)}
        className="flex items-start gap-3 py-3 cursor-pointer"
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted"
          aria-hidden="true"
        >
          {typeIcons[result.type]}
        </div>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <span data-testid="search-result-title" className="text-sm font-medium truncate">
            {result.title}
          </span>
          <span
            data-testid="search-result-preview"
            className="text-xs text-muted-foreground truncate"
          >
            {result.preview}
          </span>
        </div>
        <Badge
          data-testid="search-result-type"
          variant={typeColors[result.type]}
          className="shrink-0 text-xs"
        >
          {typeLabels[result.type]}
        </Badge>
      </CommandItem>
    )
  }
)

SearchResultItem.displayName = 'SearchResultItem'

interface SearchResultGroupProps {
  type: string
  items: SearchResult[]
  resultIndexMap: Map<string, number>
  activeIndex: number
  onSelect: (result: SearchResult) => void
  onClose: () => void
  onHover: (index: number) => void
  hasExternalSelect: boolean
}

const SearchResultGroup = React.memo<SearchResultGroupProps>(
  ({ type, items, resultIndexMap, activeIndex, onSelect, onClose, onHover, hasExternalSelect }) => (
    <CommandGroup
      heading={
        <div className="flex items-center gap-2">
          {typeIcons[type as SearchResultType]}
          <span>{typeLabels[type as SearchResultType]}s</span>
          <Badge variant="secondary" className="text-xs">
            {items.length}
          </Badge>
        </div>
      }
    >
      {items.map(result => (
        <SearchResultItem
          key={result.id}
          result={result}
          globalIndex={resultIndexMap.get(result.id) ?? -1}
          isActive={resultIndexMap.get(result.id) === activeIndex}
          onSelect={onSelect}
          onClose={onClose}
          onHover={onHover}
          hasExternalSelect={hasExternalSelect}
        />
      ))}
    </CommandGroup>
  )
)

SearchResultGroup.displayName = 'SearchResultGroup'

interface SearchResultsContentProps {
  results: SearchResult[]
  groupedResults: Record<string, SearchResult[]>
  resultIndexMap: Map<string, number>
  activeIndex: number
  isLoading: boolean
  onSelect: ((result: SearchResult) => void) | undefined
  onClose: () => void
  onHover: (index: number) => void
}

const SearchResultsContent = React.memo<SearchResultsContentProps>(
  ({
    results,
    groupedResults,
    resultIndexMap,
    activeIndex,
    isLoading,
    onSelect,
    onClose,
    onHover,
  }) => {
    if (isLoading) {
      return (
        <div
          data-testid="search-loading"
          className="flex items-center justify-center py-8"
          role="status"
          aria-live="polite"
        >
          <Spinner className="h-6 w-6" aria-hidden="true" />
          <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
        </div>
      )
    }

    if (results.length === 0) {
      return (
        <CommandEmpty>
          <div data-testid="search-empty-state" className="py-6 text-center" role="status">
            <Search
              className="mx-auto h-12 w-12 text-secondary opacity-70 drop-shadow-sm"
              aria-hidden="true"
            />
            <p className="mt-4 text-sm text-muted-foreground">
              No results found. Try a different search term.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Press Escape to close</p>
          </div>
        </CommandEmpty>
      )
    }

    return (
      <>
        {Object.entries(groupedResults).map(([type, items]) => (
          <SearchResultGroup
            key={type}
            type={type}
            items={items}
            resultIndexMap={resultIndexMap}
            activeIndex={activeIndex}
            onSelect={onSelect ?? (() => {})}
            onClose={onClose}
            onHover={onHover}
            hasExternalSelect={!!onSelect}
          />
        ))}
      </>
    )
  }
)

SearchResultsContent.displayName = 'SearchResultsContent'

export function SearchModal({
  isOpen,
  onClose,
  onSearch,
  onClear,
  results,
  isLoading,
  query = '',
  onSelect,
}: SearchModalProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)
  const renderStartRef = React.useRef<number>(0)
  const searchCountRef = React.useRef<number>(0)
  const isClosingRef = React.useRef<boolean>(false)

  const prevResultsRef = React.useRef<SearchResult[]>([])

  const [activeIndex, setActiveIndex] = React.useState(0)

  React.useEffect(() => {
    const prevIds = prevResultsRef.current.map(r => r.id).join(',')
    const currIds = results.map(r => r.id).join(',')
    if (prevIds !== currIds || results.length !== prevResultsRef.current.length) {
      prevResultsRef.current = results
      setActiveIndex(0)
    }
  }, [results])

  React.useEffect(() => {
    if (!isOpen) return
    const focusTimeout = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(focusTimeout)
  }, [isOpen])

  React.useEffect(() => {
    if (!isOpen) return
    const previousActiveElement = document.activeElement as HTMLElement
    return () => {
      previousActiveElement?.focus()
    }
  }, [isOpen])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(prev => Math.min(prev + 1, results.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(prev => Math.max(prev - 1, 0))
      }
    },
    [onClose, results.length]
  )

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (isClosingRef.current) return
      if (!open) {
        isClosingRef.current = true
        onClose()
        setTimeout(() => {
          isClosingRef.current = false
        }, 100)
      }
    },
    [onClose]
  )

  const handleClear = React.useCallback(() => {
    if (onClear) {
      onClear()
    }
    onSearch('')
  }, [onClear, onSearch])

  const handleSelectResult = React.useCallback(
    (result: SearchResult) => {
      if (onSelect) {
        onSelect(result)
      } else {
        onClose()
      }
    },
    [onSelect, onClose]
  )

  const handleHover = React.useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

  const groupedResults = React.useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const start = performance.now()
    const grouped = groupResultsByType(results)
    // eslint-disable-next-line react-hooks/purity
    const duration = performance.now() - start
    if (duration > PERFORMANCE_THRESHOLD_MS) {
      console.warn(`[SearchModal] groupResultsByType exceeded threshold: ${duration.toFixed(2)}ms`)
    }
    return grouped
  }, [results])

  const resultIndexMap = React.useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const start = performance.now()
    const map = createResultIndexMap(results)
    // eslint-disable-next-line react-hooks/purity
    const duration = performance.now() - start
    if (duration > PERFORMANCE_THRESHOLD_MS) {
      console.warn(
        `[SearchModal] createResultIndexMap exceeded threshold: ${duration.toFixed(2)}ms`
      )
    }
    return map
  }, [results])

  React.useEffect(() => {
    searchCountRef.current += 1
    if (isLoading) {
      renderStartRef.current = performance.now()
    } else if (renderStartRef.current > 0) {
      const renderTime = performance.now() - renderStartRef.current
      if (renderTime > PERFORMANCE_THRESHOLD_MS) {
        console.warn(
          `[SearchModal] Search render exceeded threshold: ${renderTime.toFixed(2)}ms for ${results.length} results`
        )
      }
    }
  }, [isLoading, results.length])

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      aria-modal="true"
      aria-labelledby="search-dialog-title"
      data-testid="search-modal"
    >
      <div className="flex flex-col h-full max-h-[100dvh] sm:max-h-[600px]">
        <h2 id="search-dialog-title" className="sr-only">
          Search
        </h2>

        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b md:hidden">
          <h3 className="font-semibold text-lg">Search</h3>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg touch-manipulation"
            aria-label="Close search"
          >
            <X
              className="h-6 w-6 text-secondary opacity-70 hover:opacity-100 transition-opacity drop-shadow-sm"
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3 md:px-3 md:py-2">
          <Search
            className="mr-3 h-5 w-5 shrink-0 text-secondary opacity-70 md:mr-2 md:h-4 md:w-4"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            data-testid="search-input"
            type="text"
            role="combobox"
            placeholder="Search flashcards, questions, coding challenges..."
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-base md:text-sm outline-none placeholder:text-muted-foreground touch-manipulation"
            value={query}
            onChange={e => onSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search content"
            aria-autocomplete="list"
            aria-controls="search-results-listbox"
            aria-expanded={results.length > 0}
            aria-activedescendant={results.length > 0 ? `search-option-${activeIndex}` : undefined}
          />
          {query && (
            <button
              data-testid="search-clear-button"
              onClick={handleClear}
              className="ml-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 touch-manipulation md:ml-2"
              type="button"
              aria-label="Clear search"
            >
              <X
                className="h-5 w-5 md:h-4 md:w-4 text-secondary opacity-70 hover:opacity-100 transition-opacity drop-shadow-sm"
                aria-hidden="true"
              />
            </button>
          )}
        </div>

        {/* Results */}
        <CommandList
          ref={listRef}
          id="search-results-listbox"
          data-testid="search-results"
          className="flex-1 overflow-y-auto max-h-[calc(100dvh-180px)] md:max-h-[400px]"
          role="listbox"
          aria-label="Search results"
          aria-live="polite"
        >
          <SearchResultsContent
            results={results}
            groupedResults={groupedResults}
            resultIndexMap={resultIndexMap}
            activeIndex={activeIndex}
            isLoading={isLoading}
            onSelect={onSelect}
            onClose={onClose}
            onHover={handleHover}
          />
        </CommandList>

        {/* Mobile Footer with Keyboard Hint */}
        <div className="p-4 border-t bg-muted/30 md:hidden">
          <p className="text-sm text-muted-foreground text-center">
            Tap a result to select • Press Escape to close
          </p>
        </div>
      </div>
    </CommandDialog>
  )
}
