import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useMemo } from 'react'
import type { Question } from '@/data/questions'
import type { Flashcard } from '@/data/flashcards'
import type { ExamQuestion } from '@/data/exam'
import type { VoicePrompt } from '@/data/voicePractice'
import type { CodingChallenge } from '@/data/coding'

export type Section = 'qa' | 'flashcards' | 'exam' | 'voice' | 'coding'

type ContentMap = {
  questions: Question[]
  flashcards: Flashcard[]
  exam: ExamQuestion[]
  voice: VoicePrompt[]
  coding: CodingChallenge[]
}

type FilterFunction = <T extends object>(items: T[]) => T[]

function createFilterByTags<T extends object>(items: T[], tagFilter: string[] | undefined): T[] {
  if (!tagFilter?.length) return items
  return items.filter(item => {
    const tags = (item as { tags?: string[] }).tags
    return tags && tagFilter.some(tag => tags.includes(tag))
  })
}

interface ContentStore {
  channelId: string
  selectedChannelIds: string[]
  section: Section
  theme: 'light' | 'dark'
  showOnboarding: boolean
  showChannelBrowser: boolean
  isMobileSidebarOpen: boolean
  isSearchOpen: boolean
  searchQuery: string
  generatedContentLoading: boolean

  mergedContent: ContentMap

  setChannelId: (id: string) => void
  setSelectedChannelIds: (ids: string[]) => void
  toggleSelectedChannel: (id: string) => void
  setSection: (section: Section) => void
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setShowOnboarding: (show: boolean) => void
  setShowChannelBrowser: (show: boolean) => void
  setIsMobileSidebarOpen: (open: boolean) => void
  setIsSearchOpen: (open: boolean) => void
  setSearchQuery: (query: string) => void
  setGeneratedContentLoading: (loading: boolean) => void
  setMergedContent: (content: Partial<ContentMap>) => void

  completeOnboarding: (selectedChannelIds: string[] | Set<string>) => void
  closeMobileSidebar: () => void
  switchChannel: (id: string) => void
}

export const useContentStore = create<ContentStore>()(
  persist(
    (set, get) => ({
      channelId: 'javascript',
      selectedChannelIds: [],
      section: 'qa',
      theme: 'dark',
      showOnboarding: true,
      showChannelBrowser: false,
      isMobileSidebarOpen: false,
      isSearchOpen: false,
      searchQuery: '',
      generatedContentLoading: false,
      mergedContent: {
        questions: [],
        flashcards: [],
        exam: [],
        voice: [],
        coding: [],
      },

      setChannelId: id => set({ channelId: id }),
      setSelectedChannelIds: ids => set({ selectedChannelIds: ids }),
      toggleSelectedChannel: id =>
        set(state => ({
          selectedChannelIds: state.selectedChannelIds.includes(id)
            ? state.selectedChannelIds.filter(x => x !== id)
            : [...state.selectedChannelIds, id],
        })),
      setSection: section => set({ section }),
      setTheme: theme => set({ theme }),
      toggleTheme: () => set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setShowOnboarding: show => set({ showOnboarding: show }),
      setShowChannelBrowser: show => set({ showChannelBrowser: show }),
      setIsMobileSidebarOpen: open => set({ isMobileSidebarOpen: open }),
      setIsSearchOpen: open => set({ isSearchOpen: open }),
      setSearchQuery: query => set({ searchQuery: query }),
      setGeneratedContentLoading: loading => set({ generatedContentLoading: loading }),
      setMergedContent: content =>
        set(state => ({
          mergedContent: { ...state.mergedContent, ...content },
        })),

      completeOnboarding: selected => {
        const ids = selected instanceof Set ? Array.from(selected) : selected
        const firstId = ids.length > 0 ? ids[0] : 'javascript'
        set({
          selectedChannelIds: ids,
          channelId: firstId,
          showOnboarding: false,
        })
        try {
          localStorage.setItem('devprep:onboarded', '1')
        } catch {
          // ignore
        }
      },
      closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
      switchChannel: id => set({ channelId: id, isMobileSidebarOpen: false }),
    }),
    {
      name: 'devprep:content-store',
      partialize: state => ({
        channelId: state.channelId,
        selectedChannelIds: state.selectedChannelIds,
        section: state.section,
        theme: state.theme,
        showOnboarding: false,
      }),
    }
  )
)

export const useFilteredContent = (tagFilter: string[] | undefined) => {
  const { mergedContent } = useContentStore()

  return useMemo(() => {
    return {
      questions: createFilterByTags(mergedContent.questions, tagFilter),
      flashcards: createFilterByTags(mergedContent.flashcards, tagFilter),
      exam: createFilterByTags(mergedContent.exam, tagFilter),
      voice: createFilterByTags(mergedContent.voice, tagFilter),
      coding: createFilterByTags(mergedContent.coding, tagFilter),
    }
  }, [mergedContent, tagFilter])
}

export const useSectionCounts = (tagFilter: string[] | undefined) => {
  const filtered = useFilteredContent(tagFilter)
  return useMemo(
    () => ({
      qa: filtered.questions.length,
      flashcards: filtered.flashcards.length,
      exam: filtered.exam.length,
      voice: filtered.voice.length,
      coding: filtered.coding.length,
    }),
    [filtered]
  )
}
