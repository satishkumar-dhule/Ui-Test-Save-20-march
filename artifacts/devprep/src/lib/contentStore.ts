import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { ContentType, ContentStats, RealtimeMetadata } from '@/types/realtime'

export type { ContentStats }

export interface ContentItem {
  id: string
  channelId: string
  contentType: ContentType
  data: unknown
  qualityScore: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: number
  updatedAt: number
  metadata?: RealtimeMetadata
}

interface ContentState {
  items: Record<string, ContentItem>
  pendingOptimisticUpdates: Map<string, ContentItem>
  stats: ContentStats
  lastSyncedAt: number | null
}

interface ContentActions {
  addItem: (item: ContentItem) => void
  addItems: (items: ContentItem[]) => void
  updateItem: (id: string, updates: Partial<ContentItem>) => void
  removeItem: (id: string) => void
  setPendingOptimistic: (id: string, item: ContentItem) => void
  confirmOptimisticUpdate: (id: string) => void
  rollbackOptimisticUpdate: (id: string) => void
  updateStats: (stats: ContentStats) => void
  setLastSyncedAt: (timestamp: number) => void
  clear: () => void
  getItem: (id: string) => ContentItem | undefined
  getItemsByChannel: (channelId: string) => ContentItem[]
  getItemsByType: (type: ContentType) => ContentItem[]
}

const initialStats: ContentStats = {
  totalItems: 0,
  byType: { question: 0, flashcard: 0, exam: 0, voice: 0, coding: 0 },
  byChannel: {},
  lastFetched: null,
}

export const useContentStore = create<ContentState & ContentActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      items: {},
      pendingOptimisticUpdates: new Map(),
      stats: initialStats,
      lastSyncedAt: null,

      addItem: item =>
        set(
          state => ({
            items: { ...state.items, [item.id]: item },
          }),
          false,
          'contentStore/addItem'
        ),

      addItems: items =>
        set(
          state => {
            const newItems = { ...state.items }
            items.forEach(item => {
              newItems[item.id] = item
            })
            return { items: newItems }
          },
          false,
          'contentStore/addItems'
        ),

      updateItem: (id, updates) =>
        set(
          state => {
            const existing = state.items[id]
            if (!existing) return state
            return {
              items: {
                ...state.items,
                [id]: { ...existing, ...updates, updatedAt: Date.now() },
              },
            }
          },
          false,
          'contentStore/updateItem'
        ),

      removeItem: id =>
        set(
          state => {
            const { [id]: _, ...rest } = state.items
            return { items: rest }
          },
          false,
          'contentStore/removeItem'
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
          'contentStore/setPendingOptimistic'
        ),

      confirmOptimisticUpdate: id =>
        set(
          state => {
            const newPending = new Map(state.pendingOptimisticUpdates)
            newPending.delete(id)
            return { pendingOptimisticUpdates: newPending }
          },
          false,
          'contentStore/confirmOptimisticUpdate'
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
          'contentStore/rollbackOptimisticUpdate'
        ),

      updateStats: stats => set({ stats }, false, 'contentStore/updateStats'),

      setLastSyncedAt: timestamp =>
        set({ lastSyncedAt: timestamp }, false, 'contentStore/setLastSyncedAt'),

      clear: () =>
        set(
          {
            items: {},
            pendingOptimisticUpdates: new Map(),
            stats: initialStats,
            lastSyncedAt: null,
          },
          false,
          'contentStore/clear'
        ),

      getItem: id => get().items[id],

      getItemsByChannel: channelId =>
        Object.values(get().items).filter(item => item.channelId === channelId),

      getItemsByType: type => Object.values(get().items).filter(item => item.contentType === type),
    })),
    { name: 'content-store' }
  )
)
