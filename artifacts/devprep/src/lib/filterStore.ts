import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ContentType } from '@/types/realtime'

export interface FilterState {
  channelId: string | null
  contentType: ContentType | null
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null
  status: 'pending' | 'approved' | 'rejected' | null
  searchQuery: string
  sortBy: 'newest' | 'oldest' | 'quality' | 'difficulty'
  sortOrder: 'asc' | 'desc'
}

interface FilterActions {
  setChannelId: (channelId: string | null) => void
  setContentType: (type: ContentType | null) => void
  setDifficulty: (difficulty: FilterState['difficulty']) => void
  setStatus: (status: FilterState['status']) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: FilterState['sortBy']) => void
  setSortOrder: (order: FilterState['sortOrder']) => void
  toggleSortOrder: () => void
  resetFilters: () => void
  setMultipleFilters: (filters: Partial<FilterState>) => void
}

const initialFilters: FilterState = {
  channelId: null,
  contentType: null,
  difficulty: null,
  status: null,
  searchQuery: '',
  sortBy: 'newest',
  sortOrder: 'desc',
}

export const useFilterStore = create<FilterState & FilterActions>()(
  devtools(
    set => ({
      ...initialFilters,

      setChannelId: channelId => set({ channelId }, false, 'filterStore/setChannelId'),

      setContentType: contentType => set({ contentType }, false, 'filterStore/setContentType'),

      setDifficulty: difficulty => set({ difficulty }, false, 'filterStore/setDifficulty'),

      setStatus: status => set({ status }, false, 'filterStore/setStatus'),

      setSearchQuery: searchQuery => set({ searchQuery }, false, 'filterStore/setSearchQuery'),

      setSortBy: sortBy => set({ sortBy }, false, 'filterStore/setSortBy'),

      setSortOrder: sortOrder => set({ sortOrder }, false, 'filterStore/setSortOrder'),

      toggleSortOrder: () =>
        set(
          state => ({ sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc' }),
          false,
          'filterStore/toggleSortOrder'
        ),

      resetFilters: () => set(initialFilters, false, 'filterStore/resetFilters'),

      setMultipleFilters: filters =>
        set(state => ({ ...state, ...filters }), false, 'filterStore/setMultipleFilters'),
    }),
    { name: 'filter-store' }
  )
)
