import { useEffect, useRef, useCallback, useState, useMemo, memo, lazy, Suspense } from 'react'
import { useChannels } from '@/hooks/useChannels'
import { questions as staticQuestions } from '@/data/questions'
import { flashcards as staticFlashcards } from '@/data/flashcards'
import { examQuestions as staticExam } from '@/data/exam'
import { voicePrompts as staticVoice } from '@/data/voicePractice'
import { codingChallenges as staticCoding } from '@/data/coding'
import { useGeneratedContent } from '@/hooks/useGeneratedContent'
import { useMergeContent } from '@/hooks/useMergeContent'
import { useAnalytics } from '@/hooks/useAnalytics'
import { AppProviders } from '@/components/app/AppProviders'
import { OnboardingModal } from '@/components/OnboardingModal'
import { Spinner } from '@/components/ui/spinner'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { StudyContent } from '@/components/layout/StudyContent'
import { useContentStore, useSectionCounts } from '@/stores/contentStore'
import { LazyWrapper } from '@/components/LazyWrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { useQueryBackdoor } from '@/utils/queryBackdoor'
import { BackdoorIndicator } from '@/components/debug/BackdoorIndicator'

// Lazy load modals for code splitting
const LazySearchModal = lazy(() =>
  import('@/components/SearchModal').then(m => ({ default: m.SearchModal }))
)
const LazyChannelBrowser = lazy(() =>
  import('@/components/layout/ChannelBrowser').then(m => ({ default: m.ChannelBrowser }))
)

export type Section = 'qa' | 'flashcards' | 'exam' | 'voice' | 'coding' | 'stats'

import { SearchModalWrapperMemo } from '@/components/SearchModalWrapper'

const SidebarMemo = memo(Sidebar)
const TopBarMemo = memo(TopBar)

function App() {
  const allChannels = useChannels()
  const analytics = useAnalytics()
  const analyticsRef = useRef(analytics)

  // Process query string backdoors (only in development)
  const { state: backdoorState, logs: backdoorLogs } = useQueryBackdoor({
    clearAfterProcessing: true,
    logToConsole: true,
    showIndicator: true,
  })

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
    () => allChannels.channels.find(c => c.id === channelId) ?? allChannels.channels[0],
    [allChannels.channels, channelId]
  )

  const pinnedChannels = useMemo(() => {
    if (selectedChannelIds.length === 0) {
      return allChannels.channels.slice(0, 8)
    }
    return selectedChannelIds
      .map(id => allChannels.channels.find(c => c.id === id))
      .filter(Boolean) as typeof allChannels.channels
  }, [allChannels.channels, selectedChannelIds])

  const sectionCounts = useSectionCounts(channelId, currentChannel?.tagFilter)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const { isSearchOpen } = useContentStore.getState()
        useContentStore.getState().setIsSearchOpen(!isSearchOpen)
      }
      if (e.key === 'Escape') {
        useContentStore.getState().setIsSearchOpen(false)
        setShowChannelBrowser(false)
        closeMobileSidebar()
      }
    },
    [setShowChannelBrowser, closeMobileSidebar]
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

  const handleCloseChannelBrowser = useCallback(() => {
    setShowChannelBrowser(false)
  }, [setShowChannelBrowser])

  const handleSwitchChannel = useCallback((id: string) => switchChannel(id), [switchChannel])

  if (showOnboarding) {
    return (
      <AppProviders theme={theme}>
        <OnboardingModal
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
          channels={allChannels.channels}
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
                allChannels={allChannels.channels}
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
          <div
            style={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 'var(--dp-r-lg)',
              background: 'var(--dp-glass-2)',
              border: '1px solid var(--dp-border-0)',
              boxShadow: 'var(--dp-shadow-lg)',
              backdropFilter: 'blur(16px)',
              fontSize: 12.5,
              color: 'var(--dp-text-2)',
            }}
          >
            <Spinner className="size-3" />
            Syncing content…
          </div>
        )}

        {/* Dev-mode backdoor indicator */}
        <BackdoorIndicator log={backdoorLogs} active={backdoorState.active} />
      </div>
    </AppProviders>
  )
}

// Search functionality consolidated in SearchModalWrapper component

export default memo(App)
