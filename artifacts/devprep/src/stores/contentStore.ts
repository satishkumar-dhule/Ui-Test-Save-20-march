import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { useMemo, useEffect } from 'react'
import type { Question } from '@/data/questions'
import type { Flashcard } from '@/data/flashcards'
import type { ExamQuestion } from '@/data/exam'
import type { VoicePrompt } from '@/data/voicePractice'
import type { CodingChallenge } from '@/data/coding'
import type { ContentItem, ContentStats, ContentType, ContentStatus } from '@/stores/types'

export type { ContentItem, ContentStats, ContentType, ContentStatus }
export type Section = 'qa' | 'flashcards' | 'exam' | 'voice' | 'coding' | 'stats'

type ContentMap = {
  questions: Question[]
  flashcards: Flashcard[]
  exam: ExamQuestion[]
  voice: VoicePrompt[]
  coding: CodingChallenge[]
}

function createFilterByChannel<T extends object>(
  items: T[],
  channelId: string,
  tagFilter: string[] | undefined
): T[] {
  return items.filter(item => {
    const itemChannelId = (item as { channelId?: string }).channelId
    if (itemChannelId) {
      return itemChannelId === channelId
    }
    if (tagFilter?.length) {
      const tags = (item as { tags?: string[] }).tags
      return tags && tagFilter.some(tag => tags.includes(tag))
    }
    return false
  })
}

function calculateStats(items: ContentItem[]): ContentStats {
  const stats: ContentStats = {
    totalItems: items.length,
    byType: { question: 0, flashcard: 0, exam: 0, voice: 0, coding: 0 },
    byChannel: {},
    lastFetched: Date.now(),
  }

  if (items.length === 0) return stats

  items.forEach(item => {
    stats.byType[item.contentType]++
    stats.byChannel[item.channelId] = (stats.byChannel[item.channelId] || 0) + 1
  })

  return stats
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

  items: Record<string, ContentItem>
  pendingOptimisticUpdates: Map<string, ContentItem>
  stats: ContentStats
  selectedIds: string[]
  lastFetched: number | null

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

  setItems: (items: ContentItem[]) => void
  addItem: (item: ContentItem) => void
  addItems: (items: ContentItem[]) => void
  updateItem: (id: string, updates: Partial<ContentItem>) => void
  removeItem: (id: string) => void
  setPendingOptimistic: (id: string, item: ContentItem) => void
  confirmOptimisticUpdate: (id: string) => void
  rollbackOptimisticUpdate: (id: string) => void
  updateStats: (stats: ContentStats) => void
  clear: () => void
  getItem: (id: string) => ContentItem | undefined
  getItemsByChannel: (channelId: string) => ContentItem[]
  getItemsByType: (type: ContentType) => ContentItem[]

  select: (id: string) => void
  deselect: (id: string) => void
  toggleSelect: (id: string) => void
  clearSelection: () => void
}

const initialStats: ContentStats = {
  totalItems: 0,
  byType: { question: 0, flashcard: 0, exam: 0, voice: 0, coding: 0 },
  byChannel: {},
  lastFetched: null,
}

const persistConfig = {
  name: 'devprep:content-store',
  partialize: (state: ContentStore) => ({
    channelId: state.channelId,
    selectedChannelIds: state.selectedChannelIds,
    section: state.section,
    theme: state.theme,
    items: state.items,
    stats: state.stats,
    selectedIds: state.selectedIds,
    lastFetched: state.lastFetched,
  }),
}

const initialState = {
  ...getUrlState(),
  selectedChannelIds: [] as string[],
  section: 'qa' as Section,
  theme: 'dark' as const,
  showOnboarding: (() => {
    try {
      return localStorage.getItem('devprep:onboarded') !== '1'
    } catch {
      return true
    }
  })(),
  showChannelBrowser: false,
  isMobileSidebarOpen: false,
  isSearchOpen: false,
  searchQuery: '',
  generatedContentLoading: false,
  mergedContent: {
    questions: [] as Question[],
    flashcards: [] as Flashcard[],
    exam: [] as ExamQuestion[],
    voice: [] as VoicePrompt[],
    coding: [] as CodingChallenge[],
  },
  items: {} as Record<string, ContentItem>,
  pendingOptimisticUpdates: new Map<string, ContentItem>(),
  stats: initialStats,
  selectedIds: [] as string[],
  lastFetched: null as number | null,
}

function getUrlState(): { channelId: string; section: Section } {
  if (typeof window === 'undefined') {
    return { channelId: 'javascript', section: 'qa' }
  }
  const params = new URLSearchParams(window.location.search)
  const channel = params.get('channel')
  const section = params.get('section')
  return {
    channelId: channel || 'javascript',
    section: (section as Section) || 'qa',
  }
}

function syncStateToUrl(state: { channelId: string; section: Section }) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  if (state.channelId !== 'javascript') {
    params.set('channel', state.channelId)
  } else {
    params.delete('channel')
  }
  if (state.section !== 'qa') {
    params.set('section', state.section)
  } else {
    params.delete('section')
  }
  const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
  window.history.replaceState({}, '', newUrl)
}

export const useContentStore = create<ContentStore>()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get) => ({
          ...initialState,

          setChannelId: id => {
            set({ channelId: id })
            syncStateToUrl({ channelId: id, section: get().section })
          },
          setSelectedChannelIds: ids => set({ selectedChannelIds: ids }),
          toggleSelectedChannel: id =>
            set(state => ({
              selectedChannelIds: state.selectedChannelIds.includes(id)
                ? state.selectedChannelIds.filter(x => x !== id)
                : [...state.selectedChannelIds, id],
            })),
          setSection: section => {
            set({ section })
            syncStateToUrl({ channelId: get().channelId, section })
          },
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
          switchChannel: id => {
            set({ channelId: id, isMobileSidebarOpen: false })
            syncStateToUrl({ channelId: id, section: get().section })
          },

          setItems: items => {
            const itemsMap = items.reduce(
              (acc, item) => {
                acc[item.id] = item
                return acc
              },
              {} as Record<string, ContentItem>
            )
            const stats = calculateStats(items)
            set(
              {
                items: itemsMap,
                stats,
                lastFetched: Date.now(),
              },
              false,
              'setItems'
            )
          },

          addItem: item =>
            set(
              state => {
                const newItems = { ...state.items, [item.id]: item }
                const stats = calculateStats(Object.values(newItems))
                return {
                  items: newItems,
                  stats,
                }
              },
              false,
              'addItem'
            ),

          addItems: items =>
            set(
              state => {
                const newItems = { ...state.items }
                items.forEach(item => {
                  newItems[item.id] = item
                })
                const stats = calculateStats(Object.values(newItems))
                return { items: newItems, stats }
              },
              false,
              'addItems'
            ),

          updateItem: (id, updates) =>
            set(
              state => {
                const existing = state.items[id]
                if (!existing) return state
                const updatedItem = { ...existing, ...updates, updatedAt: Date.now() }
                const newItems = { ...state.items, [id]: updatedItem }
                const stats = calculateStats(Object.values(newItems))
                return {
                  items: newItems,
                  stats,
                }
              },
              false,
              'updateItem'
            ),

          removeItem: id =>
            set(
              state => {
                const { [id]: _, ...rest } = state.items
                const newStats = calculateStats(Object.values(rest))
                const newSelectedIds = state.selectedIds.filter(selectedId => selectedId !== id)
                return {
                  items: rest,
                  stats: newStats,
                  selectedIds: newSelectedIds,
                }
              },
              false,
              'removeItem'
            ),

          setPendingOptimistic: (id, item) =>
            set(
              state => {
                const newPending = new Map(state.pendingOptimisticUpdates)
                newPending.set(id, item)
                return {
                  items: { ...state.items, [id]: item },
                  pendingOptimisticUpdates: newPending,
                }
              },
              false,
              'setPendingOptimistic'
            ),

          confirmOptimisticUpdate: id =>
            set(
              state => {
                const newPending = new Map(state.pendingOptimisticUpdates)
                newPending.delete(id)
                return { pendingOptimisticUpdates: newPending }
              },
              false,
              'confirmOptimisticUpdate'
            ),

          rollbackOptimisticUpdate: id =>
            set(
              state => {
                const pending = state.pendingOptimisticUpdates.get(id)
                const newPending = new Map(state.pendingOptimisticUpdates)
                newPending.delete(id)
                if (pending) {
                  const { [id]: _, ...restItems } = state.items
                  return { items: restItems, pendingOptimisticUpdates: newPending }
                }
                return { pendingOptimisticUpdates: newPending }
              },
              false,
              'rollbackOptimisticUpdate'
            ),

          updateStats: stats => set({ stats }, false, 'updateStats'),

          clear: () =>
            set(
              {
                items: {},
                pendingOptimisticUpdates: new Map(),
                stats: initialStats,
                selectedIds: [],
                lastFetched: null,
              },
              false,
              'clear'
            ),

          getItem: id => get().items[id],

          getItemsByChannel: channelId =>
            Object.values(get().items).filter(item => item.channelId === channelId),

          getItemsByType: type =>
            Object.values(get().items).filter(item => item.contentType === type),

          select: id => {
            const { selectedIds, items } = get()
            if (!items[id] || selectedIds.includes(id)) return
            set({ selectedIds: [...selectedIds, id] }, false, 'select')
          },

          deselect: id => {
            const { selectedIds } = get()
            if (!selectedIds.includes(id)) return
            set(
              { selectedIds: selectedIds.filter(selectedId => selectedId !== id) },
              false,
              'deselect'
            )
          },

          toggleSelect: id => {
            const { selectedIds, items } = get()
            if (!items[id]) return
            if (selectedIds.includes(id)) {
              get().deselect(id)
            } else {
              get().select(id)
            }
          },

          clearSelection: () => set({ selectedIds: [] }, false, 'clearSelection'),
        }),
        persistConfig
      ),
      { name: 'ContentStore' }
    )
  )
)

export const useFilteredContent = (channelId: string, tagFilter: string[] | undefined) => {
  const { mergedContent } = useContentStore()

  return useMemo(() => {
    return {
      questions: createFilterByChannel(mergedContent.questions, channelId, tagFilter),
      flashcards: createFilterByChannel(mergedContent.flashcards, channelId, tagFilter),
      exam: createFilterByChannel(mergedContent.exam, channelId, tagFilter),
      voice: createFilterByChannel(mergedContent.voice, channelId, tagFilter),
      coding: createFilterByChannel(mergedContent.coding, channelId, tagFilter),
    }
  }, [mergedContent, channelId, tagFilter])
}

export const useSectionCounts = (channelId: string, tagFilter: string[] | undefined) => {
  const filtered = useFilteredContent(channelId, tagFilter)
  return useMemo(
    () => ({
      qa: filtered.questions.length,
      flashcards: filtered.flashcards.length,
      exam: filtered.exam.length,
      voice: filtered.voice.length,
      coding: filtered.coding.length,
      stats: 0,
    }),
    [filtered]
  )
}

export const contentSelectors = {
  items: (state: ContentStore) => state.items,
  itemsArray: (state: ContentStore) => Object.values(state.items),
  stats: (state: ContentStore) => state.stats,
  selectedItems: (state: ContentStore) =>
    state.selectedIds.map(id => state.items[id]).filter(Boolean),
  lastFetched: (state: ContentStore) => state.lastFetched,

  byChannel: (channelId: string) => (state: ContentStore) =>
    Object.values(state.items).filter(item => item.channelId === channelId),

  byType: (type: ContentItem['contentType']) => (state: ContentStore) =>
    Object.values(state.items).filter(item => item.contentType === type),

  byStatus: (status: ContentItem['status']) => (state: ContentStore) =>
    Object.values(state.items).filter(item => item.status === status),

  search: (query: string) => (state: ContentStore) => {
    const lowerQuery = query.toLowerCase()
    return Object.values(state.items).filter(item => {
      const dataStr = JSON.stringify(item.data).toLowerCase()
      return (
        dataStr.includes(lowerQuery) ||
        item.channelId.toLowerCase().includes(lowerQuery) ||
        item.contentType.toLowerCase().includes(lowerQuery)
      )
    })
  },
}
