import { create } from 'zustand'

export interface FilterState {
  channelId: string | null
  contentType: string | null
  difficulty: string | null
  status: string | null
  searchQuery: string
  sortBy: 'newest' | 'oldest' | 'popular'
  sortOrder: 'asc' | 'desc'
  setChannelId: (channelId: string | null) => void
  setContentType: (contentType: string | null) => void
  setDifficulty: (difficulty: string | null) => void
  setStatus: (status: string | null) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: 'newest' | 'oldest' | 'popular') => void
  setSortOrder: (order: 'asc' | 'desc') => void
  reset: () => void
}

export const useFilterStore = create<FilterState>(set => ({
  channelId: null,
  contentType: null,
  difficulty: null,
  status: null,
  searchQuery: '',
  sortBy: 'newest',
  sortOrder: 'desc',
  setChannelId: channelId => set({ channelId }),
  setContentType: contentType => set({ contentType }),
  setDifficulty: difficulty => set({ difficulty }),
  setStatus: status => set({ status }),
  setSearchQuery: searchQuery => set({ searchQuery }),
  setSortBy: sortBy => set({ sortBy }),
  setSortOrder: sortOrder => set({ sortOrder }),
  reset: () =>
    set({
      channelId: null,
      contentType: null,
      difficulty: null,
      status: null,
      searchQuery: '',
      sortBy: 'newest',
      sortOrder: 'desc',
    }),
}))
