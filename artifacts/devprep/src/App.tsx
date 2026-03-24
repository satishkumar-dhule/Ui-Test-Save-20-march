import { useEffect, useRef, useCallback, useState, useMemo, memo, lazy, Suspense } from 'react'
import { useChannels } from '@/hooks/useChannels'
import { questions as staticQuestions } from '@/data/questions'
import { flashcards as staticFlashcards } from '@/data/flashcards'
import { examQuestions as staticExam } from '@/data/exam'
import { voicePrompts as staticVoice } from '@/data/voicePractice'
import { codingChallenges as staticCoding } from '@/data/coding'
import { useGeneratedContent } from '@/hooks/useGeneratedContent'
import { searchContent } from '@/services/dbClient'
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

  const sectionCounts = useSectionCounts(currentChannel?.tagFilter)

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
          onEditPinned={() => useContentStore.getState().setShowOnboarding(true)}
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
          <div className="fixed inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-3">
              <Spinner className="size-8" />
              <span className="text-sm text-muted-foreground">Loading study content...</span>
            </div>
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

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setIsSearchLoading(true)
    try {
      const results = await searchContent(query)
      const mapped: SearchResult[] = (results ?? []).map(r => ({
        id: r.id,
        type: r.content_type as SearchResult['type'],
        title:
          typeof r.data === 'object' && r.data !== null && 'title' in r.data
            ? String((r.data as Record<string, unknown>).title)
            : 'Untitled',
        preview:
          typeof r.data === 'object' && r.data !== null && 'preview' in r.data
            ? String((r.data as Record<string, unknown>).preview)
            : '',
        ...(r.channel_id && { channelId: r.channel_id }),
      }))
      setSearchResults(mapped)
    } catch {
      setSearchResults([])
    } finally {
      setIsSearchLoading(false)
    }
  }, [])

  const handleClose = useCallback(() => {
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }, [setIsSearchOpen])

  const handleSelect = useCallback(
    (result: SearchResult) => {
      handleClose()
      if ('channelId' in result && result.channelId) {
        useContentStore.getState().switchChannel(result.channelId)
      }
    },
    [handleClose]
  )

  const handleClear = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
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
      />
    </Suspense>
  )
}

export default memo(App)
