import { useState, useRef, useCallback, Suspense, lazy, memo } from 'react'
import { useContentStore } from '@/stores/contentStore'
import type { SearchResult } from '@/types/search'
import type { Section } from '@/App'

const LazySearchModal = lazy(() =>
  import('@/components/SearchModal').then(m => ({ default: m.SearchModal }))
)

const TYPE_TO_SECTION: Record<string, Section> = {
  question: 'qa',
  flashcard: 'flashcards',
  exam: 'exam',
  voice: 'voice',
  coding: 'coding',
}

function SearchModalWrapper() {
  const { isSearchOpen, setIsSearchOpen } = useContentStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearchLoading(false)
      return
    }
    setIsSearchLoading(true)
    try {
      const terms = query
        .toLowerCase()
        .split(/\s+/)
        .filter(t => t.length > 1)

      function scoreText(text: string): number {
        const lc = text.toLowerCase()
        return terms.reduce((acc, t) => acc + (lc.includes(t) ? 1 : 0), 0)
      }

      // Search the SAME data source as display: mergedContent from the store.
      // This ensures search results always match what the user sees.
      const { mergedContent } = useContentStore.getState()
      const seenIds = new Set<string>()
      const results: SearchResult[] = []

      function addResult(
        id: string,
        type: SearchResult['type'],
        title: string,
        preview: string,
        titleScore: number,
        bodyScore: number,
        channelId?: string,
        tags?: string[]
      ) {
        if (seenIds.has(id)) return
        const tagScore = tags ? tags.reduce((a, t) => a + scoreText(t), 0) : 0
        const total = titleScore + bodyScore + tagScore
        if (total === 0) return
        seenIds.add(id)
        results.push({
          id,
          type,
          title: title.slice(0, 200),
          preview: preview.slice(0, 120),
          score: total,
          matchedIn:
            titleScore > 0 && bodyScore + tagScore > 0 ? 'both' : titleScore > 0 ? 'title' : 'body',
          ...(channelId && { channelId }),
        })
      }

      // 1. Search questions (from mergedContent = API data OR static fallback)
      for (const q of mergedContent.questions) {
        const d = q as unknown as Record<string, unknown>
        const title = String(d.title ?? '')
        const titleScore = scoreText(title) * 3
        const sections = d.sections as Array<{ type: string; content: string }> | undefined
        const bodyText = sections?.map(s => s.content).join(' ') ?? ''
        const bodyScore = scoreText(bodyText)
        addResult(
          String(d.id),
          'question',
          title,
          bodyText.slice(0, 120),
          titleScore,
          bodyScore,
          d.channelId as string | undefined,
          d.tags as string[] | undefined
        )
      }

      // 2. Search flashcards
      for (const f of mergedContent.flashcards) {
        const d = f as unknown as Record<string, unknown>
        const front = String(d.front ?? '')
        const back = String(d.back ?? '')
        const titleScore = scoreText(front) * 3
        const bodyScore = scoreText(back)
        addResult(
          String(d.id),
          'flashcard',
          front,
          back.slice(0, 120),
          titleScore,
          bodyScore,
          d.channelId as string | undefined,
          d.tags as string[] | undefined
        )
      }

      // 3. Search exam questions
      for (const e of mergedContent.exam) {
        const d = e as unknown as Record<string, unknown>
        const question = String(d.question ?? '')
        const qScore = scoreText(question) * 3
        const explanation = String(d.explanation ?? '')
        const bodyScore = scoreText(explanation)
        addResult(
          String(d.id),
          'exam',
          question.slice(0, 100),
          explanation.slice(0, 120),
          qScore,
          bodyScore,
          d.channelId as string | undefined
        )
      }

      // 4. Search voice prompts
      for (const v of mergedContent.voice) {
        const d = v as unknown as Record<string, unknown>
        const prompt = String(d.prompt ?? '')
        const pScore = scoreText(prompt) * 3
        const domain = String(d.domain ?? '')
        const bodyScore = scoreText(domain)
        addResult(
          String(d.id),
          'voice',
          prompt.slice(0, 100),
          domain || (d.type as string) || '',
          pScore,
          bodyScore,
          d.channelId as string | undefined
        )
      }

      // 5. Search coding challenges
      for (const c of mergedContent.coding) {
        const d = c as unknown as Record<string, unknown>
        const title = String(d.title ?? '')
        const titleScore = scoreText(title) * 3
        const desc = String(d.description ?? '')
        const bodyScore = scoreText(desc)
        addResult(
          String(d.id),
          'coding',
          title,
          desc.slice(0, 120),
          titleScore,
          bodyScore,
          d.channelId as string | undefined,
          d.tags as string[] | undefined
        )
      }

      // Sort by score descending, cap at 80
      const sorted = results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 80)
      setSearchResults(sorted)
    } catch {
      setSearchResults([])
    } finally {
      setIsSearchLoading(false)
    }
  }, [])

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (!query.trim()) {
        setSearchResults([])
        setIsSearchLoading(false)
        return
      }
      setIsSearchLoading(true)
      debounceRef.current = setTimeout(() => {
        runSearch(query)
      }, 150)
    },
    [runSearch]
  )

  const handleClose = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setIsSearchLoading(false)
  }, [setIsSearchOpen])

  const handleSelect = useCallback(
    (result: SearchResult) => {
      handleClose()
      const store = useContentStore.getState()
      if ('channelId' in result && result.channelId) {
        store.switchChannel(result.channelId)
      }
      if (result.type && TYPE_TO_SECTION[result.type]) {
        store.setSection(TYPE_TO_SECTION[result.type])
      }
    },
    [handleClose]
  )

  const handleClear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchQuery('')
    setSearchResults([])
    setIsSearchLoading(false)
  }, [])

  const handleNavigate = useCallback((section: string) => {
    useContentStore.getState().setSection(section as Section)
  }, [])

  return (
    <Suspense fallback={null}>
      <LazySearchModal
        isOpen={isSearchOpen}
        onClose={handleClose}
        onSearch={handleSearch}
        onClear={handleClear}
        results={searchResults}
        isLoading={isSearchLoading}
        query={searchQuery}
        onSelect={handleSelect}
        onNavigate={handleNavigate}
      />
    </Suspense>
  )
}

export const SearchModalWrapperMemo = memo(SearchModalWrapper)
