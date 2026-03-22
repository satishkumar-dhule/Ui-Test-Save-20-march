/**
 * State Management Hooks - V2
 * 
 * Modern React hooks for state management using Zustand and React Query.
 * Export all hooks from this single entry point.
 */

// Content hooks (React Query)
export {
  useContent,
  useContentById,
  useContentByType,
  useContentByChannel,
  useContentStats,
  useContentSearch,
  useCreateContent,
  useUpdateContent,
  useDeleteContent,
  contentKeys,
} from './useContent'

// Filter hooks
export {
  useFilters,
  useFilteredItems,
  useFilterURLSync,
  useChannelFilter,
  useTypeFilter,
  useStatusFilter,
  useSearchFilter,
  useSortFilter,
  useTagsFilter,
  useActiveFilterCount,
  useHasActiveFilters,
  useResetFilters,
} from './useFilters'

// UI hooks
export {
  useUI,
  useTheme,
  useSidebar,
  useModal,
  useNotifications,
  useLoading,
  useUIState,
} from './useUI'

// User hooks
export {
  useUser,
  usePreferences,
  useSavedChannels,
  useRecentSearches,
  useAuth,
  useUserState,
} from './useUser'

// Re-export stores for direct access if needed
export { useContentStore } from '../stores-v2/contentStore'
export { useUserStore } from '../stores-v2/userStore'
export { useUIStore } from '../stores-v2/uiStore'
export { useFilterStore } from '../stores-v2/filterStore'

// Re-export types
export * from '../stores-v2/types'