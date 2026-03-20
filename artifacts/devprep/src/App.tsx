import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { channels } from '@/data/channels'
import { questions as staticQuestions } from '@/data/questions'
import { flashcards as staticFlashcards } from '@/data/flashcards'
import { examQuestions as staticExam } from '@/data/exam'
import { voicePrompts as staticVoice } from '@/data/voicePractice'
import { codingChallenges as staticCoding } from '@/data/coding'
import { useGeneratedContent } from '@/hooks/useGeneratedContent'
import { useMergeContent } from '@/hooks/useMergeContent'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useSearchShortcut } from '@/hooks/useSearchShortcut'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { AppHeader, ChannelSelector, SectionTabs, AppContent, AppProviders } from '@/components/app'
import { OnboardingModal } from '@/components/OnboardingModal'
import { SearchModal } from '@/components/SearchModal'
import { Spinner } from '@/components/ui/spinner'
import { NewContentBanner, useNewContentBanner } from '@/components/NewContentBanner'
import { RealtimeDashboard } from '@/pages/RealtimeDashboard'
import type { SearchResult } from '@/types/search'
import type { GeneratedContentItem } from '@/types/realtime'

export type Section = 'qa' | 'flashcards' | 'exam' | 'voice' | 'coding'

export default function App() {
  const [currentView, setCurrentView] = useState<'main' | 'realtime'>('main')

  // =========================================================================
  // Core State
  // =========================================================================
  const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('devprep:theme', 'dark')
  const [channelId, setChannelId] = useLocalStorage('devprep:channelId', 'javascript')
  const [section, setSection] = useLocalStorage<Section>('devprep:section', 'qa')
  const [selectedIdsArr, setSelectedIdsArr] = useLocalStorage<string[]>('devprep:selectedIds', [])
  const [channelTypeFilter, setChannelTypeFilter] = useLocalStorage<'tech' | 'cert'>(
    'devprep:channelTypeFilter',
    (() => {
      const certIds = selectedIdsArr.filter(id => {
        const ch = channels.find(c => c.id === id)
        return ch?.type === 'cert'
      })
      return certIds.length > 0 ? 'cert' : 'tech'
    })()
  )
  const [showOnboarding, setShowOnboarding] = useState(selectedIdsArr.length === 0)

  // =========================================================================
  // Realtime Content State
  // =========================================================================
  const { content: newContent, showContent, dismissContent } = useNewContentBanner()

  // Convert selectedIds array to Set
  const selectedIds = useMemo(
    () => (selectedIdsArr.length > 0 ? new Set(selectedIdsArr) : new Set<string>()),
    [selectedIdsArr]
  )

  // =========================================================================
  // Generated Content
  // =========================================================================
  const { generated, loading } = useGeneratedContent()

  // Merge static + generated content using the reusable hook
  const allQuestions = useMergeContent(staticQuestions, generated.question)
  const allFlashcards = useMergeContent(staticFlashcards, generated.flashcard)
  const allExam = useMergeContent(staticExam, generated.exam)
  const allVoice = useMergeContent(staticVoice, generated.voice)
  const allCoding = useMergeContent(staticCoding, generated.coding)

  // =========================================================================
  // Analytics
  // =========================================================================
  const analytics = useAnalytics()
  const visitStartRef = useRef<{
    channelId: string
    section: string
    time: number
  } | null>(null)

  // =========================================================================
  // Search State
  // =========================================================================
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchQueryRef = useRef<string>('')

  const openSearch = useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  useSearchShortcut(openSearch)

  useEffect(() => {
    if (isSearchOpen) {
      analytics.trackSearchOpened()
    }
  }, [isSearchOpen, analytics])

  // =========================================================================
  // Derived Data
  // =========================================================================
  const currentChannel = useMemo(
    () => channels.find(c => c.id === channelId) || channels[0],
    [channelId]
  )

  const selectedChannels = useMemo(() => channels.filter(c => selectedIds.has(c.id)), [selectedIds])
  const selectedTechChannels = selectedChannels.filter(c => c.type === 'tech')
  const selectedCertChannels = selectedChannels.filter(c => c.type === 'cert')

  // Filter content based on current channel's tag filter
  const filteredQuestions = useMemo(() => {
    const filter = currentChannel?.tagFilter
    if (!filter) return allQuestions
    return allQuestions.filter(q => q.tags?.some(t => filter.includes(t)) ?? false)
  }, [currentChannel, allQuestions])

  const filteredFlashcards = useMemo(() => {
    const filter = currentChannel?.tagFilter
    if (!filter) return allFlashcards
    return allFlashcards.filter(f => f.tags?.some(t => filter.includes(t)) ?? false)
  }, [currentChannel, allFlashcards])

  const filteredExamQs = useMemo(
    () => allExam.filter(q => q.channelId === channelId),
    [allExam, channelId]
  )

  const filteredVoicePs = useMemo(
    () => allVoice.filter(p => p.channelId === channelId),
    [allVoice, channelId]
  )

  const filteredCoding = useMemo(() => {
    const filter = currentChannel?.tagFilter
    if (!filter) return allCoding
    return allCoding.filter(c => c.tags?.some(t => filter.includes(t)) ?? c.channelId === channelId)
  }, [currentChannel, channelId, allCoding])

  const sectionCounts: Record<Section, number> = {
    qa: filteredQuestions.length,
    flashcards: filteredFlashcards.length,
    exam: filteredExamQs.length,
    voice: filteredVoicePs.length,
    coding: filteredCoding.length,
  }

  // =========================================================================
  // Actions
  // =========================================================================
  const handleChannelSwitch = useCallback(
    (id: string) => {
      const newCh = channels.find(c => c.id === id)
      if (!newCh) return
      setChannelId(id)
      const counts: Record<Section, number> = {
        qa: filteredQuestions.length,
        flashcards: filteredFlashcards.length,
        exam: filteredExamQs.length,
        voice: filteredVoicePs.length,
        coding: filteredCoding.length,
      }
      if (counts[section] === 0) {
        const preferred: Section[] = ['coding', 'exam', 'voice', 'flashcards', 'qa']
        const fallback = preferred.find(s => counts[s] > 0)
        if (fallback) setSection(fallback)
      }
    },
    [
      section,
      filteredQuestions,
      filteredFlashcards,
      filteredExamQs,
      filteredVoicePs,
      filteredCoding,
      setChannelId,
    ]
  )

  const handleOnboardingDone = useCallback(
    (ids: Set<string>) => {
      setSelectedIdsArr([...ids])
      setShowOnboarding(false)
      const firstId = [...ids][0]
      if (firstId) handleChannelSwitch(firstId)

      const selectedChs = channels.filter(c => ids.has(c.id))
      const techIds = selectedChs.filter(c => c.type === 'tech').map(c => c.id)
      const certIds = selectedChs.filter(c => c.type === 'cert').map(c => c.id)

      console.log('Tracking onboarding - techIds:', techIds, 'certIds:', certIds)

      if (techIds.length > 0) {
        analytics.trackSignedUpTechChannels(techIds)
      }
      if (certIds.length > 0) {
        analytics.trackSignedUpCerts(certIds)
      }
    },
    [handleChannelSwitch, analytics]
  )

  // Auto-switch channel type filter when available channels change
  useEffect(() => {
    const availableChannels =
      channelTypeFilter === 'tech' ? selectedTechChannels : selectedCertChannels
    if (availableChannels.length === 0) {
      const fallbackFilter = channelTypeFilter === 'tech' ? 'cert' : 'tech'
      const fallbackChannels =
        fallbackFilter === 'tech' ? selectedTechChannels : selectedCertChannels
      if (fallbackChannels.length > 0) {
        setChannelTypeFilter(fallbackFilter)
      }
      return
    }
    const currentChannel = availableChannels.find(c => c.id === channelId)
    if (!currentChannel) {
      handleChannelSwitch(availableChannels[0].id)
    }
  }, [
    channelTypeFilter,
    selectedTechChannels,
    selectedCertChannels,
    channelId,
    handleChannelSwitch,
  ])

  // Track visit duration
  useEffect(() => {
    if (visitStartRef.current) {
      const duration = Date.now() - visitStartRef.current.time
      analytics.trackVisitedQuest(
        visitStartRef.current.channelId,
        visitStartRef.current.section,
        duration
      )
    }
    visitStartRef.current = { channelId, section, time: Date.now() }
  }, [channelId, section, analytics])

  // =========================================================================
  // Search Handler
  // =========================================================================
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query)
      searchQueryRef.current = query

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      if (!query.trim()) {
        setSearchResults([])
        setSearchLoading(false)
        return
      }

      setSearchLoading(true)

      searchTimeoutRef.current = setTimeout(async () => {
        const currentQuery = searchQueryRef.current
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(currentQuery)}`)
          if (searchQueryRef.current !== currentQuery) {
            return
          }

          const data = await response.json()
          if (searchQueryRef.current !== currentQuery) {
            return
          }

          if (data.ok && Array.isArray(data.data)) {
            setSearchResults(data.data)
            analytics.trackSearchQuery(currentQuery)
          } else if (!data.ok && data.error) {
            console.error('Search API error:', data.error)
            setSearchResults([])
          }
        } catch (err) {
          console.error('Search fetch error:', err)
          if (searchQueryRef.current === currentQuery) {
            setSearchResults([])
          }
        } finally {
          if (searchQueryRef.current === currentQuery) {
            setSearchLoading(false)
          }
        }
      }, 300)
    },
    [analytics]
  )

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  const handleSearchResultSelect = useCallback(
    (result: SearchResult) => {
      const typeToSection: Record<string, Section> = {
        flashcard: 'flashcards',
        question: 'qa',
        coding: 'coding',
        voice: 'voice',
        exam: 'exam',
      }

      const newSection = typeToSection[result.type] || 'qa'
      analytics.trackSearchResultSelected(searchQuery, result.type, result.id)
      setSection(newSection)
      setIsSearchOpen(false)
      setSearchQuery('')
      setSearchResults([])
    },
    [analytics, searchQuery]
  )

  const handleSearchClear = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
  }, [])

  const handleSearchClose = useCallback(() => {
    setIsSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }, [])

  // =========================================================================
  // Render
  // =========================================================================
  if (showOnboarding) {
    return (
      <>
        <div className="h-screen flex flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center bg-background" />
        </div>
        <OnboardingModal onDone={handleOnboardingDone} theme={theme} />
      </>
    )
  }

  const handleNewContentView = (content: GeneratedContentItem) => {
    dismissContent()
    const typeToSection: Record<string, Section> = {
      question: 'qa',
      flashcard: 'flashcards',
      coding: 'coding',
      voice: 'voice',
      exam: 'exam',
    }
    setSection(typeToSection[content.type] || 'qa')
    setCurrentView('main')
  }

  const handleRealtimeContentClick = (item: GeneratedContentItem) => {
    const typeToSection: Record<string, Section> = {
      question: 'qa',
      flashcard: 'flashcards',
      coding: 'coding',
      voice: 'voice',
      exam: 'exam',
    }
    setSection(typeToSection[item.type] || 'qa')
    setCurrentView('main')
  }

  return (
    <AppProviders theme={theme}>
      <div
        className="h-screen flex flex-col overflow-hidden bg-background text-foreground relative"
        data-testid="app-root"
      >
        {currentView === 'realtime' ? (
          <>
            <div className="absolute top-4 left-4 z-50">
              <button
                onClick={() => setCurrentView('main')}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Back to App
              </button>
            </div>
            <RealtimeDashboard onNavigateToContent={handleRealtimeContentClick} />
          </>
        ) : (
          <>
            <AppHeader
              currentChannel={currentChannel}
              theme={theme}
              onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              onSearchOpen={openSearch}
              onRealtimeDashboard={() => setCurrentView('realtime')}
            />

            <ChannelSelector
              channelId={channelId}
              channelTypeFilter={channelTypeFilter}
              selectedTechChannels={selectedTechChannels}
              selectedCertChannels={selectedCertChannels}
              theme={theme}
              onChannelSwitch={handleChannelSwitch}
              onChannelTypeFilterChange={setChannelTypeFilter}
              onEditChannels={() => setShowOnboarding(true)}
            />

            <SectionTabs
              section={section}
              sectionCounts={sectionCounts}
              onSectionChange={setSection}
            />

            <AppContent
              section={section}
              channelId={channelId}
              filteredQuestions={filteredQuestions}
              filteredFlashcards={filteredFlashcards}
              filteredExamQs={filteredExamQs}
              filteredVoicePs={filteredVoicePs}
              filteredCoding={filteredCoding}
              onQuestionAnswered={analytics.trackQAAnswered}
              onFlashcardUpdate={analytics.updateFlashcardProgress}
              onCodingUpdate={(id, status) => analytics.updateCodingProgress(id, channelId, status)}
              onExamComplete={(score, total, passed, durationMs) => {
                analytics.trackExamAttempt({
                  channelId,
                  channelName: currentChannel.name || channelId,
                  score,
                  totalQuestions: total,
                  passed,
                  durationMs,
                })
              }}
              onVoicePractice={(promptId, rating) =>
                analytics.trackVoicePractice(promptId, channelId, rating)
              }
            />
          </>
        )}

        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-50"
            data-testid="loading-overlay"
          >
            <div className="flex flex-col items-center gap-3">
              <Spinner className="size-8" />
              <span className="text-sm text-muted-foreground">Loading generated content...</span>
            </div>
          </div>
        )}

        {showOnboarding && (
          <OnboardingModal
            onDone={handleOnboardingDone}
            initialSelected={selectedIds}
            theme={theme}
          />
        )}

        <SearchModal
          isOpen={isSearchOpen}
          onClose={handleSearchClose}
          onSearch={handleSearch}
          onClear={handleSearchClear}
          query={searchQuery}
          results={searchResults}
          isLoading={searchLoading}
          onSelect={handleSearchResultSelect}
        />

        <NewContentBanner
          content={newContent}
          onDismiss={dismissContent}
          onView={handleNewContentView}
        />
      </div>
    </AppProviders>
  )
}
