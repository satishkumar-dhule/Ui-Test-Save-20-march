/**
 * Filter Store - Global state for content filtering
 * 
 * Manages search, channel, type, status, difficulty filters and sorting.
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { FilterState, FilterActions, ContentType, ContentStatus } from './types'

type FilterStore = FilterState & FilterActions

const initialState: FilterState = {
  channel: null,
  type: null,
  status: null,
  difficulty: null,
  search: '',
  sort: {
    field: 'createdAt',
    order: 'desc',
  },
  tags: [],
}

export const useFilterStore = create<FilterStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setChannel: (channel: string | null) => {
        set({ channel }, false, 'setChannel')
      },

      setType: (type: ContentType | null) => {
        set({ type }, false, 'setType')
      },

      setStatus: (status: ContentStatus | null) => {
        set({ status }, false, 'setStatus')
      },

      setDifficulty: (difficulty: FilterState['difficulty']) => {
        set({ difficulty }, false, 'setDifficulty')
      },

      setSearch: (search: string) => {
        set({ search }, false, 'setSearch')
      },

      setSort: (field: FilterState['sort']['field'], order: FilterState['sort']['order']) => {
        set({
          sort: { field, order },
        }, false, 'setSort')
      },

      addTag: (tag: string) => {
        const { tags } = get()
        if (tags.includes(tag)) return
        
        set({
          tags: [...tags, tag],
        }, false, 'addTag')
      },

      removeTag: (tag: string) => {
        const { tags } = get()
        set({
          tags: tags.filter(t => t !== tag),
        }, false, 'removeTag')
      },

      clearTags: () => {
        set({ tags: [] }, false, 'clearTags')
      },

      reset: () => {
        set(initialState, false, 'reset')
      },
    }),
    {
      name: 'FilterStore',
      enabled: import.meta.env.DEV,
    }
  )
)

// Selectors
export const filterSelectors = {
  filters: (state: FilterStore) => state,
  channel: (state: FilterStore) => state.channel,
  type: (state: FilterStore) => state.type,
  status: (state: FilterStore) => state.status,
  difficulty: (state: FilterStore) => state.difficulty,
  search: (state: FilterStore) => state.search,
  sort: (state: FilterStore) => state.sort,
  tags: (state: FilterStore) => state.tags,
  hasActiveFilters: (state: FilterStore) =>
    state.channel !== null ||
    state.type !== null ||
    state.status !== null ||
    state.difficulty !== null ||
    state.search !== '' ||
    state.tags.length > 0,
  activeFilterCount: (state: FilterStore) => {
    let count = 0
    if (state.channel !== null) count++
    if (state.type !== null) count++
    if (state.status !== null) count++
    if (state.difficulty !== null) count++
    if (state.search !== '') count++
    count += state.tags.length
    return count
  },
}

// Helper to build query parameters from filters
export function buildQueryParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams()
  
  if (filters.channel) params.set('channel', filters.channel)
  if (filters.type) params.set('type', filters.type)
  if (filters.status) params.set('status', filters.status)
  if (filters.difficulty) params.set('difficulty', filters.difficulty)
  if (filters.search) params.set('search', filters.search)
  if (filters.sort.field !== 'createdAt' || filters.sort.order !== 'desc') {
    params.set('sort', `${filters.sort.field}:${filters.sort.order}`)
  }
  if (filters.tags.length > 0) {
    params.set('tags', filters.tags.join(','))
  }
  
  return params
}