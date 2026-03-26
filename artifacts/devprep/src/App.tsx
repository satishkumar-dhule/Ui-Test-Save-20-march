import { useEffect, useRef, useCallback, useState, useMemo, memo, lazy, Suspense } from 'react'
import { useChannels } from '@/hooks/useChannels'
import { questions as staticQuestions } from '@/data/questions'
import { flashcards as staticFlashcards } from '@/data/flashcards'
import { examQuestions as staticExam } from '@/data/exam'
import { voicePrompts as staticVoice } from '@/data/voicePractice'
import { codingChallenges as staticCoding } from '@/data/coding'
import { useGeneratedContent } from '@/hooks/useGeneratedContent'
import { searchContentScored } from '@/services/dbClient'
import { useMergeContent } from '@/hooks/useMergeContent'
import { useAnalytics } from '@/hooks/useAnalytics'
import { AppProviders } from '@/components/app/AppProviders'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { Spinner } from '@/components/ui/spinner'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { StudyContent } from '@/components/layout/StudyContent'
import { SectionTabs } from '@/components/app/SectionTabs'
import { useContentStore, useSectionCounts } from '@/stores/contentStore'
import type { SearchResult } from '@/types/search'
import { LazyWrapper } from '@/components/LazyWrapper'
import { Skeleton } from '@/components/ui/skeleton'

const LazySearchModal = lazy(() =>
  import('@/components/SearchModal').then(m => ({ default: m.SearchModal }))
)
const LazyChannelBrowser = lazy(() =>
  import('@/components/layout/ChannelBrowser').then(m => ({ default: m.ChannelBrowser }))
)

export type Section = 'qa' | 'flashcards' | 'exam' | 'voice' | 'coding' | 'stats'

const SidebarMemo = memo(Sidebar)
const TopBarMemo = memo(TopBar)
const SearchModalWrapperMemo = memo(SearchModalWrapper)

function App() {
  const allChannels = useChannels()
  const analytics = useAnalytics()
  const analyticsRef = useRef(analytics)

  useEffect(() => {
    analyticsRef.current = analytics
  }, [analytics])

  const {
    channelId,
    selectedChannelIds,
    section,
    theme,
    showOnboarding,
    showChannelBrowser,
    isMobileSidebarOpen,
    isSearchOpen,
    setShowChannelBrowser,
    setMergedContent,
    setGeneratedContentLoading,
    setSection,
    toggleTheme,
    completeOnboarding,
    switchChannel,
    toggleSelectedChannel,
    closeMobileSidebar,
  } = useContentStore()

  const { generated: generatedContent, loading } = useGeneratedContent()

  useEffect(() => {
    setGeneratedContentLoading(loading)
  }, [loading, setGeneratedContentLoading])

  const allQuestions = useMergeContent(staticQuestions, generatedContent?.question)
  const allFlashcards = useMergeContent(staticFlashcards, generatedContent?.flashcard)
  const allExam = useMergeContent(staticExam, generatedContent?.exam)
  const allVoice = useMergeContent(staticVoice, generatedContent?.voice)
  const allCoding = useMergeContent(staticCoding, generatedContent?.coding)

  useEffect(() => {
    setMergedContent({
      questions: allQuestions,
      flashcards: allFlashcards,
      exam: allExam,
      voice: allVoice,
      coding: allCoding,
    })
  }, [allQuestions, allFlashcards, allExam, allVoice, allCoding, setMergedContent])

  const currentChannel = useMemo(
    () => allChannels.find(c => c.id === channelId) ?? allChannels[0],
    [allChannels, channelId]
  )

  const pinnedChannels = useMemo(() => {
    if (selectedChannelIds.length === 0) {
      return allChannels.slice(0, 8)
    }
    return selectedChannelIds
      .map(id => allChannels.find(c => c.id === id))
      .filter(Boolean) as typeof allChannels
  }, [allChannels, selectedChannelIds])

  const sectionCounts = useSectionCounts(channelId, currentChannel?.tagFilter)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        useContentStore.getState().setIsSearchOpen(!isSearchOpen)
      }
      if (e.key === 'Escape') {
        useContentStore.getState().setIsSearchOpen(false)
        setShowChannelBrowser(false)
        closeMobileSidebar()
      }
    },
    [isSearchOpen, setShowChannelBrowser, closeMobileSidebar]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const stableTrackQAAnswered = useCallback(
    (questionId: string) => analyticsRef.current.trackQAAnswered?.(questionId),
    []
  )
  const stableUpdateFlashcard = useCallback(
    (cardId: string, status: 'unseen' | 'reviewing' | 'known' | 'hard') =>
      analyticsRef.current.updateFlashcardProgress?.(cardId, status),
    []
  )
  const stableUpdateCoding = useCallback(
    (challengeId: string, status: 'not_started' | 'in_progress' | 'completed') =>
      analyticsRef.current.updateCodingProgress?.(challengeId, channelId, status),
    [channelId]
  )
  const stableExamComplete = useCallback(
    (score: number, total: number, passed: boolean, durationMs: number) =>
      analyticsRef.current.trackExamAttempt?.({
        channelId,
        channelName: currentChannel?.name ?? '',
        score,
        totalQuestions: total,
        passed,
        durationMs,
      }),
    [channelId, currentChannel]
  )
  const stableVoicePractice = useCallback(
    (promptId: string, rating: number) =>
      analyticsRef.current.trackVoicePractice?.(promptId, channelId, rating),
    [channelId]
  )

  const handleSetShowChannelBrowser = useCallback(() => {
    setShowChannelBrowser(true)
  }, [setShowChannelBrowser])

  const handleCloseChannelBrowser = useCallback(() => {
    setShowChannelBrowser(false)
  }, [setShowChannelBrowser])

  const handleSwitchChannel = useCallback((id: string) => switchChannel(id), [switchChannel])

  if (showOnboarding) {
    return (
      <AppProviders theme={theme}>
        <OnboardingPage
          onDone={completeOnboarding}
          initialSelected={selectedChannelIds.length > 0 ? new Set(selectedChannelIds) : undefined}
        />
      </AppProviders>
    )
  }

  return (
    <AppProviders theme={theme}>
      <div className="app-root" data-testid="app-root">
        <SidebarMemo
          channels={allChannels}
          pinnedChannels={pinnedChannels}
          currentChannelId={channelId}
          section={section}
          sectionCounts={sectionCounts}
          isMobileOpen={isMobileSidebarOpen}
          onChannelSelect={handleSwitchChannel}
          onSectionChange={setSection}
          onBrowseChannels={() => setShowChannelBrowser(true)}
          onMobileClose={closeMobileSidebar}
        />

        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={closeMobileSidebar}
          />
        )}

        <div className="app-main">
          <TopBarMemo
            currentChannel={currentChannel}
            section={section}
            theme={theme}
            onThemeToggle={toggleTheme}
            onSearchOpen={() => useContentStore.getState().setIsSearchOpen(true)}
            onMobileMenuOpen={() => useContentStore.getState().setIsMobileSidebarOpen(true)}
          />

          <StudyContent
            section={section}
            channelId={channelId}
            onQuestionAnswered={stableTrackQAAnswered}
            onFlashcardUpdate={stableUpdateFlashcard}
            onCodingUpdate={stableUpdateCoding}
            onExamComplete={stableExamComplete}
            onVoicePractice={stableVoicePractice}
          />
        </div>

        {showChannelBrowser && (
          <LazyWrapper skeleton={{ variant: 'card' }} retryable>
            <Suspense
              fallback={
                <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
                  <Skeleton className="h-96 w-[600px] max-w-[90vw]" />
                </div>
              }
            >
              <LazyChannelBrowser
                allChannels={allChannels}
                selectedIds={selectedChannelIds}
                currentChannelId={channelId}
                onSelect={handleSwitchChannel}
                onTogglePin={toggleSelectedChannel}
                onClose={handleCloseChannelBrowser}
              />
            </Suspense>
          </LazyWrapper>
        )}

        <SearchModalWrapperMemo />

        {loading && (
          <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 'var(--dp-r-lg)', background: 'var(--dp-glass-2)', border: '1px solid var(--dp-border-0)', boxShadow: 'var(--dp-shadow-lg)', backdropFilter: 'blur(16px)', fontSize: 12.5, color: 'var(--dp-text-2)' }}>
            <Spinner className="size-3" />
            Syncing content…
          </div>
        )}
      </div>
    </AppProviders>
  )
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
      // 1. Search DB-generated content
      const results = searchContentScored(query)
      const mapped: SearchResult[] = (results ?? []).map(r => {
        const d = (r.data ?? {}) as Record<string, unknown>
        const type = r.content_type as SearchResult['type']
        const title: string = (() => {
          if (type === 'flashcard') return String(d.front ?? 'Flashcard')
          if (type === 'question') return String(d.title ?? 'Question')
          if (type === 'coding') return String(d.title ?? 'Challenge')
          if (type === 'exam') return String(d.question ?? 'Exam question').slice(0, 100)
          if (type === 'voice') return String(d.prompt ?? 'Voice prompt').slice(0, 100)
          return String(d.title ?? d.front ?? d.question ?? d.prompt ?? 'Untitled')
        })()
        const preview: string = (() => {
          if (type === 'flashcard') return String(d.back ?? d.hint ?? '').slice(0, 120)
          if (type === 'question') {
            const sections = d.sections as Array<{ type: string; content: string }> | undefined
            const first = sections?.find(s => s.type === 'text')?.content ?? ''
            return first.slice(0, 120)
          }
          if (type === 'coding') return String(d.description ?? '').slice(0, 120)
          if (type === 'exam') return String(d.explanation ?? '').slice(0, 120)
          if (type === 'voice') return String(d.domain ?? d.type ?? '').slice(0, 120)
          return ''
        })()
        return {
          id: r.id,
          type,
          title,
          preview,
          score: r.searchScore,
          matchedIn: r.matchedIn,
          ...(r.channel_id && { channelId: r.channel_id }),
        }
      })

      // 2. Search static data
      const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1)
      const dbIds = new Set(mapped.map(r => r.id))

      function scoreText(text: string): number {
        const lc = text.toLowerCase()
        return terms.reduce((acc, t) => acc + (lc.includes(t) ? 1 : 0), 0)
      }

      const staticResults: SearchResult[] = []

      for (const q of staticQuestions) {
        if (dbIds.has(q.id)) continue
        const titleScore = scoreText(q.title) * 3
        const tagScore = q.tags ? q.tags.reduce((a, t) => a + scoreText(t), 0) : 0
        const total = titleScore + tagScore
        if (total === 0) continue
        const firstSection = q.sections?.find(s => s.type === 'short') as { content?: string } | undefined
        staticResults.push({
          id: q.id,
          type: 'question',
          title: q.title,
          preview: firstSection?.content?.slice(0, 120) ?? '',
          score: total,
          matchedIn: titleScore > 0 ? 'title' : 'body',
          ...(q.channelId && { channelId: q.channelId }),
        })
      }

      for (const f of staticFlashcards) {
        if (dbIds.has(f.id)) continue
        const frontScore = scoreText(f.front) * 3
        const backScore = scoreText(f.back)
        const tagScore = f.tags ? f.tags.reduce((a, t) => a + scoreText(t), 0) : 0
        const total = frontScore + backScore + tagScore
        if (total === 0) continue
        staticResults.push({
          id: f.id,
          type: 'flashcard',
          title: f.front,
          preview: f.back.slice(0, 120),
          score: total,
          matchedIn: frontScore > 0 ? 'title' : 'body',
          ...(f.channelId && { channelId: f.channelId }),
        })
      }

      for (const e of staticExam) {
        if (dbIds.has(e.id)) continue
        const qScore = scoreText(e.question) * 3
        const total = qScore
        if (total === 0) continue
        staticResults.push({
          id: e.id,
          type: 'exam',
          title: e.question.slice(0, 100),
          preview: e.explanation?.slice(0, 120) ?? '',
          score: total,
          matchedIn: 'title',
          channelId: e.channelId,
        })
      }

      for (const v of staticVoice) {
        if (dbIds.has(v.id)) continue
        const pScore = scoreText(v.prompt) * 3
        const domainScore = v.domain ? scoreText(v.domain) : 0
        const total = pScore + domainScore
        if (total === 0) continue
        staticResults.push({
          id: v.id,
          type: 'voice',
          title: v.prompt.slice(0, 100),
          preview: v.domain ?? v.type ?? '',
          score: total,
          matchedIn: 'title',
          channelId: v.channelId,
        })
      }

      for (const c of staticCoding) {
        if (dbIds.has(c.id)) continue
        const titleScore = scoreText(c.title) * 3
        const descScore = scoreText(c.description ?? '')
        const total = titleScore + descScore
        if (total === 0) continue
        staticResults.push({
          id: c.id,
          type: 'coding',
          title: c.title,
          preview: c.description?.slice(0, 120) ?? '',
          score: total,
          matchedIn: titleScore > 0 ? 'title' : 'body',
        })
      }

      // 3. Merge and sort
      const combined = [...mapped, ...staticResults]
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 80)

      setSearchResults(combined)
    } catch {
      setSearchResults([])
    } finally {
      setIsSearchLoading(false)
    }
  }, [])

  const handleSearch = useCallback((query: string) => {
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
  }, [runSearch])

  const handleClose = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
    setIsSearchLoading(false)
  }, [setIsSearchOpen])

  const TYPE_TO_SECTION: Record<string, Section> = {
    question: 'qa',
    flashcard: 'flashcards',
    exam: 'exam',
    voice: 'voice',
    coding: 'coding',
  }

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

export default memo(App)
