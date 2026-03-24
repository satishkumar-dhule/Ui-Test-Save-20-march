import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card'
import { Text } from '@/components/atoms/Text'
import { Button } from '@/components/atoms/Button/Button'
import { Badge } from '@/components/atoms/Badge'
import { Input } from '@/components/atoms/Input'
import { Skeleton } from '@/components/ui/skeleton'
import { useChannels } from '@/hooks/useChannels'
import { useGeneratedContent } from '@/hooks/useGeneratedContent'
import { cn } from '@/lib/utils/cn'

type ContentType = 'question' | 'flashcard' | 'exam' | 'voice' | 'coding'
type Difficulty = 'easy' | 'medium' | 'hard'
type ViewMode = 'grid' | 'list'

interface FilterState {
  types: ContentType[]
  channels: string[]
  difficulty: Difficulty | null
  search: string
}

interface ContentItem {
  id: string
  type: ContentType
  title: string
  description?: string
  difficulty: Difficulty
  channelId: string
  tags: string[]
  progress?: 'not_started' | 'in_progress' | 'completed'
}

const ITEMS_PER_PAGE = 12

const contentTypeLabels: Record<ContentType, string> = {
  question: 'Questions',
  flashcard: 'Flashcards',
  exam: 'Exams',
  voice: 'Voice',
  coding: 'Coding',
}

const contentTypeEmojis: Record<ContentType, string> = {
  question: '❓',
  flashcard: '📚',
  exam: '📝',
  voice: '🎤',
  coding: '💻',
}

const difficultyColors: Record<Difficulty, string> = {
  easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  hard: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

function FilterSidebar({
  filters,
  onFilterChange,
  channels,
  loading,
}: {
  filters: FilterState
  onFilterChange: (updates: Partial<FilterState>) => void
  channels: Array<{ id: string; name: string; emoji: string }>
  loading: boolean
}) {
  const contentTypes: ContentType[] = ['question', 'flashcard', 'exam', 'voice', 'coding']
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard']

  const handleTypeToggle = (type: ContentType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type]
    onFilterChange({ types: newTypes })
  }

  const handleChannelToggle = (channelId: string) => {
    const newChannels = filters.channels.includes(channelId)
      ? filters.channels.filter(c => c !== channelId)
      : [...filters.channels, channelId]
    onFilterChange({ channels: newChannels })
  }

  const handleDifficultySelect = (difficulty: Difficulty | null) => {
    onFilterChange({ difficulty })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-20" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Text variant="span" size="sm" weight="semibold" className="block mb-3">
          Content Type
        </Text>
        <div className="space-y-2">
          {contentTypes.map(type => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.types.includes(type)}
                onChange={() => handleTypeToggle(type)}
                className="rounded border-border text-primary focus:ring-primary/20"
              />
              <Text variant="span" size="sm" className="group-hover:text-primary transition-colors">
                {contentTypeEmojis[type]} {contentTypeLabels[type]}
              </Text>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Text variant="span" size="sm" weight="semibold" className="block mb-3">
          Channel
        </Text>
        <div className="space-y-2">
          {channels.slice(0, 8).map(channel => (
            <label key={channel.id} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.channels.includes(channel.id)}
                onChange={() => handleChannelToggle(channel.id)}
                className="rounded border-border text-primary focus:ring-primary/20"
              />
              <Text variant="span" size="sm" className="group-hover:text-primary transition-colors">
                {channel.emoji} {channel.name}
              </Text>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Text variant="span" size="sm" weight="semibold" className="block mb-3">
          Difficulty
        </Text>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleDifficultySelect(null)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm transition-all',
              filters.difficulty === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            All
          </button>
          {difficulties.map(difficulty => (
            <button
              key={difficulty}
              onClick={() => handleDifficultySelect(difficulty)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm capitalize transition-all',
                filters.difficulty === difficulty
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              {difficulty}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SearchWithAutocomplete({
  value,
  onChange,
  suggestions,
  onSelect,
  loading,
}: {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  onSelect: (suggestion: string) => void
  loading: boolean
}) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const filteredSuggestions = useMemo(() => {
    if (!inputValue.trim()) return suggestions.slice(0, 5)
    return suggestions.filter(s => s.toLowerCase().includes(inputValue.toLowerCase())).slice(0, 5)
  }, [inputValue, suggestions])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    setShowSuggestions(true)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    onChange(suggestion)
    onSelect(suggestion)
    setShowSuggestions(false)
  }

  return (
    <div className="relative w-full max-w-md">
      <Input
        type="search"
        placeholder="Search content..."
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        leftElement={<span className="text-muted-foreground">🔍</span>}
        disabled={loading}
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 overflow-hidden">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2 text-left hover:bg-muted transition-colors"
            >
              <Text variant="span" size="sm">
                {suggestion}
              </Text>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ContentCard({
  item,
  viewMode,
  onClick,
}: {
  item: ContentItem
  viewMode: ViewMode
  onClick: () => void
}) {
  const progressIcons = {
    not_started: '○',
    in_progress: '◐',
    completed: '●',
  }

  const progressColors: Record<string, string> = {
    not_started: 'text-muted',
    in_progress: 'text-amber-500',
    completed: 'text-emerald-500',
  }

  return (
    <Card
      variant="interactive"
      padding="md"
      className={cn(
        'animate-fade-in cursor-pointer',
        viewMode === 'list' ? 'flex items-center gap-4' : ''
      )}
      onClick={onClick}
    >
      <div className={cn(viewMode === 'list' ? 'flex-1' : 'space-y-3')}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl">{contentTypeEmojis[item.type]}</span>
            <Badge variant="secondary" size="sm">
              {contentTypeLabels[item.type]}
            </Badge>
            <span className={cn('text-lg', progressColors[item.progress || 'not_start'])}>
              {progressIcons[item.progress || 'not_started']}
            </span>
          </div>
          <Badge className={difficultyColors[item.difficulty]} size="sm">
            {item.difficulty}
          </Badge>
        </div>

        <div className={viewMode === 'list' ? 'flex items-center gap-4' : ''}>
          <div className={viewMode === 'list' ? 'flex-1 min-w-0' : ''}>
            <Text variant="h3" size="lg" weight="semibold" className="truncate mb-1">
              {item.title}
            </Text>
            {item.description && (
              <Text variant="p" size="sm" color="muted" className="line-clamp-2">
                {item.description}
              </Text>
            )}
          </div>

          {viewMode === 'list' && item.tags.length > 0 && (
            <div className="flex gap-1 flex-shrink-0">
              {item.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {viewMode === 'grid' && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 4).map(tag => (
              <Badge key={tag} variant="outline" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function ContentCardSkeleton({ viewMode }: { viewMode: ViewMode }) {
  return (
    <Card padding="md" className={viewMode === 'list' ? 'flex items-center gap-4' : ''}>
      <div className={viewMode === 'list' ? 'flex-1 space-y-2' : 'space-y-3'}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-6 w-3/4 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </Card>
  )
}

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const maxVisiblePages = 5
  let visiblePages = pages

  if (totalPages > maxVisiblePages) {
    const start = Math.max(1, currentPage - 2)
    const end = Math.min(totalPages, start + maxVisiblePages - 1)
    visiblePages = pages.slice(start - 1, end)
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ← Prev
      </Button>
      {totalPages > maxVisiblePages && currentPage > 3 && (
        <>
          <Button variant="outline" size="sm" onClick={() => onPageChange(1)}>
            1
          </Button>
          <Text variant="span" size="sm" color="muted">
            ...
          </Text>
        </>
      )}
      {visiblePages.map(page => (
        <Button
          key={page}
          variant={page === currentPage ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}
      {totalPages > maxVisiblePages && currentPage < totalPages - 2 && (
        <>
          <Text variant="span" size="sm" color="muted">
            ...
          </Text>
          <Button variant="outline" size="sm" onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </Button>
        </>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next →
      </Button>
    </div>
  )
}

function EmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean
  onClearFilters: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <span className="text-5xl mb-4">🔍</span>
      <Text variant="h2" size="xl" weight="semibold" className="mb-2">
        No results found
      </Text>
      <Text variant="p" size="lg" color="muted" className="max-w-md mb-6">
        {hasFilters
          ? "Try adjusting your filters or search terms to find what you're looking for."
          : 'No content available. Try generating some content first.'}
      </Text>
      {hasFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  )
}

export function ContentLibraryPage() {
  const { generated, loading: contentLoading } = useGeneratedContent()
  const channels = useChannels()

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    channels: [],
    difficulty: null,
    search: '',
  })

  const [isPageLoading, setIsPageLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    Object.values(generated).forEach(items => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach((tag: string) => tags.add(tag))
          }
        })
      }
    })
    return Array.from(tags).sort()
  }, [generated])

  const contentItems = useMemo((): ContentItem[] => {
    const items: ContentItem[] = []

    const typeMap: Record<string, ContentType> = {
      question: 'question',
      flashcard: 'flashcard',
      exam: 'exam',
      voice: 'voice',
      coding: 'coding',
    }

    Object.entries(generated).forEach(([type, content]) => {
      if (!Array.isArray(content)) return
      const contentType = typeMap[type]
      if (!contentType) return

      content.forEach((item: Record<string, unknown>) => {
        const itemTyped = item as Record<string, unknown>
        const title =
          typeof itemTyped.title === 'string'
            ? itemTyped.title
            : typeof itemTyped.front === 'string'
              ? itemTyped.front
              : 'Untitled'
        const description =
          typeof itemTyped.description === 'string'
            ? itemTyped.description
            : typeof itemTyped.back === 'string'
              ? itemTyped.back
              : undefined
        const difficulty =
          typeof itemTyped.difficulty === 'string' ? (itemTyped.difficulty as Difficulty) : 'medium'
        const channelId = typeof itemTyped.channelId === 'string' ? itemTyped.channelId : 'unknown'
        const tags = Array.isArray(itemTyped.tags)
          ? itemTyped.tags.filter((t): t is string => typeof t === 'string')
          : []

        items.push({
          id: String(itemTyped.id || Math.random().toString(36).slice(2)),
          type: contentType,
          title,
          description,
          difficulty,
          channelId,
          tags,
          progress: 'not_started' as const,
        })
      })
    })

    return items
  }, [generated])

  const filteredItems = useMemo(() => {
    return contentItems.filter(item => {
      if (filters.types.length > 0 && !filters.types.includes(item.type)) {
        return false
      }

      if (filters.channels.length > 0 && !filters.channels.includes(item.channelId)) {
        return false
      }

      if (filters.difficulty && item.difficulty !== filters.difficulty) {
        return false
      }

      if (filters.search.trim()) {
        const searchLower = filters.search.toLowerCase()
        const matchesTitle = item.title.toLowerCase().includes(searchLower)
        const matchesTags = item.tags.some(tag => tag.toLowerCase().includes(searchLower))
        const matchesDescription = item.description?.toLowerCase().includes(searchLower)
        if (!matchesTitle && !matchesTags && !matchesDescription) {
          return false
        }
      }

      return true
    })
  }, [contentItems, filters])

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleFilterChange = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }))
    setCurrentPage(1)
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilters({
      types: [],
      channels: [],
      difficulty: null,
      search: '',
    })
    setCurrentPage(1)
  }, [])

  const handleContentClick = (item: ContentItem) => {
    console.log('Navigate to content:', item.id, item.type)
  }

  const hasActiveFilters =
    filters.types.length > 0 ||
    filters.channels.length > 0 ||
    filters.difficulty !== null ||
    filters.search.trim() !== ''

  if (isPageLoading || contentLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="flex gap-6">
          <div className="w-64 flex-shrink-0 space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-10 w-full mb-4" />
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-4'
              }
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <ContentCardSkeleton key={i} viewMode={viewMode} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Text variant="h1" size="2xl" weight="bold" className="mb-1">
            Content Library
          </Text>
          <Text variant="p" size="sm" color="muted">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} available
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <span className="text-lg">▦</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <span className="text-lg">☰</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-64 flex-shrink-0">
          <Card padding="md">
            <CardHeader className="pb-4">
              <CardTitle>Filters</CardTitle>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-primary hover:underline"
                >
                  Clear all
                </button>
              )}
            </CardHeader>
            <CardContent>
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                channels={channels}
                loading={contentLoading}
              />
            </CardContent>
          </Card>
        </aside>

        <div className="flex-1 min-w-0 space-y-4">
          <SearchWithAutocomplete
            value={filters.search}
            onChange={search => handleFilterChange({ search })}
            suggestions={allTags}
            onSelect={suggestion => handleFilterChange({ search: suggestion })}
            loading={contentLoading}
          />

          {paginatedItems.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters} onClearFilters={handleClearFilters} />
          ) : (
            <>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-4'
                }
              >
                {paginatedItems.map((item, index) => (
                  <div key={item.id} style={{ animationDelay: `${index * 50}ms` }}>
                    <ContentCard
                      item={item}
                      viewMode={viewMode}
                      onClick={() => handleContentClick(item)}
                    />
                  </div>
                ))}
              </div>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContentLibraryPage
