import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Search,
  Clock,
  Plus,
  FileText,
  HelpCircle,
  Mic,
  Code,
  BookOpen,
  Filter,
  X,
} from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { useSearchShortcut } from '@/hooks/useSearchShortcut'
import { SearchResults } from './SearchResults'
import { SearchFilters } from './SearchFilters'
import { useContent } from '@/hooks/useContent'
import type { ContentType } from '@/stores/types'

interface SearchResult {
  id: string
  title: string
  description: string
  type: ContentType
  channelId: string
  tags: string[]
  score: number
  url: string
}

interface SearchFilters {
  channels: string[]
  types: ContentType[]
  difficulties: string[]
  tags: string[]
}

const STORAGE_KEY = 'devprep:search-recent'
const MAX_RECENT = 5

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    channels: [],
    types: [],
    difficulties: [],
    tags: [],
  })

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Fetch all content for search
  const { items, isLoading } = useContent({ limit: 1000 })

  // Keyboard shortcut
  useSearchShortcut(() => setOpen(true))

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setRecentSearches(JSON.parse(saved))
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback(
    (search: string) => {
      if (!search.trim()) return

      const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, MAX_RECENT)
      setRecentSearches(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    },
    [recentSearches]
  )

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [debouncedQuery])

  // Search function
  const searchResults = useCallback((): SearchResult[] => {
    if (!debouncedQuery.trim()) return []

    const lowerQuery = debouncedQuery.toLowerCase()
    const results: SearchResult[] = []

    items.forEach(item => {
      const data = item.data as any
      const title = data?.title || data?.question || data?.prompt || 'Untitled'
      const description = data?.description || data?.content || data?.answer || ''

      // Check if matches filters
      if (filters.channels.length && !filters.channels.includes(item.channelId)) return
      if (filters.types.length && !filters.types.includes(item.contentType)) return
      if (filters.difficulties.length && !filters.difficulties.includes((data as any)?.difficulty))
        return

      // Simple text search
      const searchableText =
        `${title} ${description} ${item.channelId} ${(data as any)?.difficulty || ''}`.toLowerCase()

      if (searchableText.includes(lowerQuery)) {
        // Calculate relevance score
        let score = 0
        if (title.toLowerCase().includes(lowerQuery)) score += 10
        if (description.toLowerCase().includes(lowerQuery)) score += 5
        if (item.channelId.toLowerCase().includes(lowerQuery)) score += 3

        results.push({
          id: item.id,
          title,
          description: description.slice(0, 100) + (description.length > 100 ? '...' : ''),
          type: item.contentType,
          channelId: item.channelId,
          tags: data?.tags || [item.channelId],
          score,
          url: `/${item.contentType}/${item.id}`,
        })
      }
    })

    return results.sort((a, b) => b.score - a.score)
  }, [items, debouncedQuery, filters])

  const results = searchResults()

  // Quick actions
  const quickActions = [
    {
      id: 'create-question',
      title: 'Create Question',
      description: 'Generate a new question',
      icon: <Plus className="h-4 w-4" />,
      action: () => (window.location.href = '/create/question'),
    },
    {
      id: 'create-flashcard',
      title: 'Create Flashcard',
      description: 'Generate a new flashcard',
      icon: <Plus className="h-4 w-4" />,
      action: () => (window.location.href = '/create/flashcard'),
    },
    {
      id: 'view-exams',
      title: 'View Exams',
      description: 'Browse all exam questions',
      icon: <BookOpen className="h-4 w-4" />,
      action: () => (window.location.href = '/exam'),
    },
    {
      id: 'voice-practice',
      title: 'Voice Practice',
      description: 'Practice with voice prompts',
      icon: <Mic className="h-4 w-4" />,
      action: () => (window.location.href = '/voice'),
    },
    {
      id: 'coding-challenges',
      title: 'Coding Challenges',
      description: 'Practice coding problems',
      icon: <Code className="h-4 w-4" />,
      action: () => (window.location.href = '/coding'),
    },
  ]

  // Handle select
  const handleSelect = useCallback(
    (result: SearchResult | string) => {
      if (typeof result === 'string') {
        // Recent search
        setQuery(result)
        saveRecentSearch(result)
      } else {
        // Navigate to result
        saveRecentSearch(debouncedQuery)
        setOpen(false)
        window.location.href = result.url
      }
    },
    [debouncedQuery, saveRecentSearch]
  )

  // Handle quick action
  const handleQuickAction = useCallback((action: (typeof quickActions)[0]) => {
    setOpen(false)
    action.action()
  }, [])

  // Clear recent search
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!listRef.current) return

      const items = listRef.current.querySelectorAll('[data-cmdk-item]')
      if (!items.length) return

      const currentIndex = selectedIndex

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, items.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          const selectedItem = items[currentIndex] as HTMLElement
          if (selectedItem) {
            selectedItem.click()
          }
          break
        case 'Escape':
          setOpen(false)
          break
      }
    },
    [selectedIndex]
  )

  // Open/close handlers
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setQuery('')
      setDebouncedQuery('')
      setShowFilters(false)
    }
  }, [])

  return (
    <>
      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <div className="flex flex-col h-[600px]">
          {/* Header with filters toggle */}
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Search</span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle filters"
            >
              <Filter className="h-3 w-3" />
              Filters
            </button>
          </div>

          {/* Search input */}
          <CommandInput
            placeholder="Search content, features, or actions..."
            value={query}
            onValueChange={setQuery}
            ref={inputRef}
            aria-label="Search query"
          />

          {/* Filters */}
          {showFilters && <SearchFilters filters={filters} onFiltersChange={setFilters} />}

          {/* Results list */}
          <CommandList ref={listRef}>
            {/* Loading state */}
            {isLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2" />
                Searching...
              </div>
            )}

            {/* Empty state */}
            {!isLoading && debouncedQuery && results.length === 0 && (
              <CommandEmpty>
                <div className="flex flex-col items-center py-6">
                  <Search className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No results found for "{debouncedQuery}"
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try different keywords or filters
                  </p>
                </div>
              </CommandEmpty>
            )}

            {/* Recent searches */}
            {!debouncedQuery && recentSearches.length > 0 && (
              <CommandGroup heading="Recent Searches">
                {recentSearches.map((search, index) => (
                  <CommandItem
                    key={search}
                    onSelect={() => handleSelect(search)}
                    data-cmdk-item
                    data-selected={selectedIndex === index}
                    className="cursor-pointer"
                  >
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="flex-1">{search}</span>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setRecentSearches(prev => prev.filter(s => s !== search))
                      }}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${search} from recent searches`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </CommandItem>
                ))}
                <CommandItem
                  onSelect={clearRecentSearches}
                  className="text-xs text-muted-foreground justify-center"
                >
                  Clear all recent searches
                </CommandItem>
              </CommandGroup>
            )}

            {/* Quick actions */}
            {!debouncedQuery && (
              <CommandGroup heading="Quick Actions">
                {quickActions.map((action, index) => (
                  <CommandItem
                    key={action.id}
                    onSelect={() => handleQuickAction(action)}
                    data-cmdk-item
                    data-selected={selectedIndex === recentSearches.length + index}
                    className="cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      {action.icon}
                      <div>
                        <div className="font-medium">{action.title}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Search results */}
            {debouncedQuery && results.length > 0 && (
              <SearchResults
                results={results}
                selectedIndex={selectedIndex}
                onSelect={handleSelect}
                filters={filters}
              />
            )}
          </CommandList>

          {/* Footer with keyboard hints */}
          <div className="border-t px-3 py-2 text-xs text-muted-foreground flex justify-between">
            <div className="flex gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
            {results.length > 0 && <span>{results.length} results</span>}
          </div>
        </div>
      </CommandDialog>
    </>
  )
}
