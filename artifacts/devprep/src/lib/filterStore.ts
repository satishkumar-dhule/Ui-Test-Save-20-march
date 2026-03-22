import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ContentType, ContentStatus, FilterState, FilterActions } from '@/stores/types'

export type { FilterState }

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
