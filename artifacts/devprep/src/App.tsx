
import { Route, Switch } from 'wouter'
import { HomePage } from '@/components/pages/Home'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { channels as staticChannels } from '@/data/channels'
import { useChannels } from '@/hooks/useChannels'
import { useMobileNavigation } from '@/hooks/useMobileNavigation'
import { questions as staticQuestions } from '@/data/questions'
import { flashcards as staticFlashcards } from '@/data/flashcards'
import { examQuestions as staticExam } from '@/data/exam'
import { voicePrompts as staticVoice } from '@/data/voicePractice'
import { codingChallenges as staticCoding } from '@/data/coding'
import { useGeneratedContent } from '@/hooks/useGeneratedContent'
import { searchContent } from '@/services/dbClient'
import { useMergeContent } from '@/hooks/useMergeContent'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useSearchShortcut } from '@/hooks/useSearchShortcut'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import {
  AppHeader,
  ChannelSelector,
  SectionTabs,
  AppContent,
  AppProviders,
  NavigationDrawer,
  BottomNav,
} from '@/components/app'

import { OnboardingPage } from '@/pages/OnboardingPage'
import { SearchModal } from '@/components/SearchModal'
import { Spinner } from '@/components/ui/spinner'
import { NewContentBanner, useNewContentBanner } from '@/components/NewContentBanner'
import { RealtimeDashboard } from '@/pages/RealtimeDashboard'
import type { SearchResult } from '@/types/search'
import type { GeneratedContentItem } from '@/types/realtime'

export type Section = 'qa' | 'flashcards' | 'exam' | 'voice' | 'coding'

    <AppProviders theme={theme}>
      <div
        className="h-screen flex flex-col bg-background text-foreground relative overflow-hidden"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
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
            {/* Mobile Header with Hamburger Menu */}
            <div className="md:hidden">
              <AppHeader
                currentChannel={currentChannel}
                theme={theme}
                onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                onSearchOpen={openSearch}
                onMenuToggle={openDrawer}
              />
            </div>

            {/* Desktop Header - hidden on mobile */}
            <div className="hidden md:block">
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
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomNav
              section={section}
              sectionCounts={sectionCounts}
              onSectionChange={setSection}
            />

            {/* Mobile Navigation Drawer */}
            <NavigationDrawer
              isOpen={isDrawerOpen}
              onClose={closeDrawer}
              currentChannel={currentChannel}
              channelId={channelId}
              channelTypeFilter={channelTypeFilter}
              selectedTechChannels={selectedTechChannels}
              selectedCertChannels={selectedCertChannels}
              section={section}
              sectionCounts={sectionCounts}
              onChannelSwitch={handleChannelSwitch}
              onChannelTypeFilterChange={setChannelTypeFilter}
              onEditChannels={() => setShowOnboarding(true)}
              onSectionChange={setSection}
              onSearchOpen={openSearch}
              onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              theme={theme}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-0 pb-16 md:pb-0 overflow-hidden">
              <AppContent
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
            </main>
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
        </Route>
      </Switch>
    </div>
  )
}
