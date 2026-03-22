/**
 * Content Store - Global state for content items
 * 
 * Uses Zustand for state management with TypeScript support.
 * Includes DevTools integration for debugging.
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { ContentItem, ContentStats, ContentStoreState, ContentActions } from './types'

type ContentStore = ContentStoreState & ContentActions

const initialState: ContentStoreState = {
  items: {},
  stats: {
    total: 0,
    byType: {
      question: 0,
      flashcard: 0,
      exam: 0,
      voice: 0,
      coding: 0,
    },
    byChannel: {},
    averageQuality: 0,
    lastUpdated: null,
  },
  selectedIds: [],
  lastFetched: null,
}

export const useContentStore = create<ContentStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setItems: (items: ContentItem[]) => {
          const itemsMap = items.reduce((acc, item) => {
            acc[item.id] = item
            return acc
          }, {} as Record<string, ContentItem>)

          const stats = calculateStats(items)
          
          set({ 
            items: itemsMap,
            stats,
            lastFetched: Date.now(),
          }, false, 'setItems')
        },

        addItem: (item: ContentItem) => {
          const { items, stats } = get()
          const newItems = { ...items, [item.id]: item }
          const newStats = calculateStats(Object.values(newItems))
          
          set({ 
            items: newItems,
            stats: newStats,
          }, false, 'addItem')
        },

        updateItem: (id: string, updates: Partial<ContentItem>) => {
          const { items, stats } = get()
          if (!items[id]) return

          const updatedItem = { ...items[id], ...updates }
          const newItems = { ...items, [id]: updatedItem }
          const newStats = calculateStats(Object.values(newItems))
          
          set({ 
            items: newItems,
            stats: newStats,
          }, false, 'updateItem')
        },

        removeItem: (id: string) => {
          const { items, stats, selectedIds } = get()
          if (!items[id]) return

          const { [id]: removed, ...newItems } = items
          const newStats = calculateStats(Object.values(newItems))
          const newSelectedIds = selectedIds.filter(selectedId => selectedId !== id)
          
          set({ 
            items: newItems,
            stats: newStats,
            selectedIds: newSelectedIds,
          }, false, 'removeItem')
        },

        clear: () => {
          set(initialState, false, 'clear')
        },

        select: (id: string) => {
          const { selectedIds, items } = get()
          if (!items[id] || selectedIds.includes(id)) return
          
          set({ 
            selectedIds: [...selectedIds, id],
          }, false, 'select')
        },

        deselect: (id: string) => {
          const { selectedIds } = get()
          if (!selectedIds.includes(id)) return
          
          set({ 
            selectedIds: selectedIds.filter(selectedId => selectedId !== id),
          }, false, 'deselect')
        },

        toggleSelect: (id: string) => {
          const { selectedIds, items } = get()
          if (!items[id]) return
          
          if (selectedIds.includes(id)) {
            get().deselect(id)
          } else {
            get().select(id)
          }
        },

        clearSelection: () => {
          set({ selectedIds: [] }, false, 'clearSelection')
        },
      }),
      {
        name: 'content-store',
        partialize: (state) => ({
          items: state.items,
          stats: state.stats,
          selectedIds: state.selectedIds,
          lastFetched: state.lastFetched,
        }),
      }
    ),
    {
      name: 'ContentStore',
      enabled: import.meta.env.DEV,
    }
  )
)

// Helper function to calculate stats
function calculateStats(items: ContentItem[]): ContentStats {
  const stats: ContentStats = {
    total: items.length,
    byType: {
      question: 0,
      flashcard: 0,
      exam: 0,
      voice: 0,
      coding: 0,
    },
    byChannel: {},
    averageQuality: 0,
    lastUpdated: Date.now(),
  }

  if (items.length === 0) return stats

  let totalQuality = 0

  items.forEach(item => {
    // Count by type
    stats.byType[item.contentType]++
    
    // Count by channel
    stats.byChannel[item.channelId] = (stats.byChannel[item.channelId] || 0) + 1
    
    // Sum quality scores
    totalQuality += item.qualityScore
  })

  stats.averageQuality = totalQuality / items.length

  return stats
}

// Selectors
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
      return dataStr.includes(lowerQuery) ||
             item.channelId.toLowerCase().includes(lowerQuery) ||
             item.contentType.toLowerCase().includes(lowerQuery)
    })
  },
}