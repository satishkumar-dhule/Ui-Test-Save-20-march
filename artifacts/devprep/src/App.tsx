import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { channels as staticChannels } from '@/data/channels'
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
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { AppProviders } from '@/components/app/AppProviders'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { SearchModal } from '@/components/SearchModal'
import { Spinner } from '@/components/ui/spinner'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { ChannelBrowser } from '@/components/layout/ChannelBrowser'
import { StudyContent } from '@/components/layout/StudyContent'
import type { SearchResult } from '@/types/search'

export type Section = 'qa' | 'flashcards' | 'exam' | 'voice' | 'coding'

export default function App() {
  const allChannels = useChannels()
  const analytics = useAnalytics()
  const analyticsRef = useRef(analytics)
  analyticsRef.current = analytics

  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('devprep:theme', 'dark')
  const [channelId, setChannelId] = useLocalStorage<string>('devprep:channel', 'javascript')
  const [selectedChannelIds, setSelectedChannelIds] = useLocalStorage<string[]>(
    'devprep:selected-channels',
    []
  )
  const [section, setSection] = useLocalStorage<Section>('devprep:section', 'qa')
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem('devprep:onboarded') } catch { return false }
  })
  const [showChannelBrowser, setShowChannelBrowser] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)

  // Generated content
  const { data: generatedContent, loading } = useGeneratedContent()

  // Merge static + generated
  const allQuestions = useMergeContent(staticQuestions, generatedContent?.question)
  const allFlashcards = useMergeContent(staticFlashcards, generatedContent?.flashcard)
  const allExam = useMergeContent(staticExam, generatedContent?.exam)
  const allVoice = useMergeContent(staticVoice, generatedContent?.voice)
  const allCoding = useMergeContent(staticCoding, generatedContent?.coding)

  // Current channel
  const currentChannel = useMemo(
    () => allChannels.find(c => c.id === channelId) ?? allChannels[0],
    [allChannels, channelId]
  )

  // Pinned/selected channels — default to first 8 if nothing selected
  const pinnedChannels = useMemo(() => {
    if (selectedChannelIds.length === 0) return allChannels.slice(0, 8)
    return selectedChannelIds
      .map(id => allChannels.find(c => c.id === id))
      .filter(Boolean) as typeof allChannels
  }, [allChannels, selectedChannelIds])

  // Filter content by current channel
  const filteredQuestions = useMemo(() => {
    if (!currentChannel?.tagFilter?.length) return allQuestions
    return allQuestions.filter(q =>
      currentChannel.tagFilter!.some(tag => (q as any).tags?.includes(tag))
    )
  }, [allQuestions, currentChannel])

  const filteredFlashcards = useMemo(() => {
    if (!currentChannel?.tagFilter?.length) return allFlashcards
    return allFlashcards.filter(f =>
      currentChannel.tagFilter!.some(tag => (f as any).tags?.includes(tag))
    )
  }, [allFlashcards, currentChannel])

  const filteredExamQs = useMemo(() => {
    if (!currentChannel?.tagFilter?.length) return allExam
    return allExam.filter(q =>
      currentChannel.tagFilter!.some(tag => (q as any).tags?.includes(tag))
    )
  }, [allExam, currentChannel])

  const filteredVoicePs = useMemo(() => {
    if (!currentChannel?.tagFilter?.length) return allVoice
    return allVoice.filter(v =>
      currentChannel.tagFilter!.some(tag => (v as any).tags?.includes(tag))
    )
  }, [allVoice, currentChannel])

  const filteredCoding = useMemo(() => {
    if (!currentChannel?.tagFilter?.length) return allCoding
    return allCoding.filter(c =>
      currentChannel.tagFilter!.some(tag => (c as any).tags?.includes(tag))
    )
  }, [allCoding, currentChannel])

  const sectionCounts = useMemo(
    () => ({
      qa: filteredQuestions.length,
      flashcards: filteredFlashcards.length,
      exam: filteredExamQs.length,
      voice: filteredVoicePs.length,
      coding: filteredCoding.length,
    }),
    [filteredQuestions, filteredFlashcards, filteredExamQs, filteredVoicePs, filteredCoding]
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(v => !v)
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false)
        setShowChannelBrowser(false)
        setIsMobileSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleChannelSwitch = useCallback(
    (id: string) => {
      setChannelId(id)
      setIsMobileSidebarOpen(false)
    },
    [setChannelId]
  )

  const handleOnboardingDone = useCallback(
    (selected: Set<string>) => {
      const ids = Array.from(selected)
      setSelectedChannelIds(ids)
      if (ids.length > 0) setChannelId(ids[0])
      setShowOnboarding(false)
      try { localStorage.setItem('devprep:onboarded', '1') } catch {}
    },
    [setSelectedChannelIds, setChannelId]
  )

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) { setSearchResults([]); return }
    setIsSearchLoading(true)
    try {
      const results = await searchContent(query)
      setSearchResults(results ?? [])
    } catch {
      setSearchResults([])
    } finally {
      setIsSearchLoading(false)
    }
  }, [])

  const handleSearchClose = useCallback(() => {
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }, [])

  const handleSearchSelect = useCallback(
    (result: SearchResult) => {
      handleSearchClose()
      if ((result as any).channelId) handleChannelSwitch((result as any).channelId)
    },
    [handleChannelSwitch, handleSearchClose]
  )

  const stableTrackQAAnswered = useCallback(
    (questionId: string) => analyticsRef.current.trackQAAnswered?.(questionId),
    []
  )
  const stableUpdateFlashcard = useCallback(
    (cardId: string, status: string) => analyticsRef.current.updateFlashcard?.(cardId, status),
    []
  )
  const stableUpdateCoding = useCallback(
    (challengeId: string, status: string) =>
      analyticsRef.current.updateCoding?.(challengeId, status),
    []
  )
  const stableExamComplete = useCallback(
    (score: number, total: number, passed: boolean, durationMs: number) =>
      analyticsRef.current.trackExamComplete?.(score, total, passed, durationMs),
    []
  )
  const stableVoicePractice = useCallback(
    (promptId: string, rating: number) =>
      analyticsRef.current.trackVoicePractice?.(promptId, rating),
    []
  )

  if (showOnboarding) {
    return (
      <AppProviders theme={theme}>
        <OnboardingPage
          onDone={handleOnboardingDone}
          initialSelected={
            selectedChannelIds.length > 0 ? new Set(selectedChannelIds) : undefined
          }
        />
      </AppProviders>
    )
  }

  return (
    <AppProviders theme={theme}>
      <div className="app-root" data-testid="app-root">
        {/* Left Sidebar */}
        <Sidebar
          channels={allChannels}
          pinnedChannels={pinnedChannels}
          currentChannelId={channelId}
          section={section}
          sectionCounts={sectionCounts}
          isMobileOpen={isMobileSidebarOpen}
          onChannelSelect={handleChannelSwitch}
          onSectionChange={setSection}
          onBrowseChannels={() => setShowChannelBrowser(true)}
          onEditPinned={() => setShowOnboarding(true)}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Mobile overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Main area */}
        <div className="app-main">
          <TopBar
            currentChannel={currentChannel}
            theme={theme}
            onThemeToggle={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
            onSearchOpen={() => setIsSearchOpen(true)}
            onMobileMenuOpen={() => setIsMobileSidebarOpen(true)}
          />

          <StudyContent
            section={section}
            channelId={channelId}
            filteredQuestions={filteredQuestions}
            filteredFlashcards={filteredFlashcards}
            filteredExamQs={filteredExamQs}
            filteredVoicePs={filteredVoicePs}
            filteredCoding={filteredCoding}
            onQuestionAnswered={stableTrackQAAnswered}
            onFlashcardUpdate={stableUpdateFlashcard}
            onCodingUpdate={stableUpdateCoding}
            onExamComplete={stableExamComplete}
            onVoicePractice={stableVoicePractice}
          />
        </div>

        {/* Channel Browser */}
        {showChannelBrowser && (
          <ChannelBrowser
            allChannels={allChannels}
            selectedIds={selectedChannelIds}
            currentChannelId={channelId}
            onSelect={handleChannelSwitch}
            onTogglePin={(id) => {
              setSelectedChannelIds(prev =>
                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
              )
            }}
            onClose={() => setShowChannelBrowser(false)}
          />
        )}

        {/* Search Modal */}
        <SearchModal
          isOpen={isSearchOpen}
          onClose={handleSearchClose}
          onSearch={handleSearch}
          onClear={() => { setSearchQuery(''); setSearchResults([]) }}
          results={searchResults}
          isLoading={isSearchLoading}
          query={searchQuery}
          onSelect={handleSearchSelect}
        />

        {/* Loading overlay */}
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
