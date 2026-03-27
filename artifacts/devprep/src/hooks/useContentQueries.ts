/**
 * @deprecated This module has been partially consolidated into useContent.ts
 * Re-exports unique utilities that aren't in useContent.ts
 */

export {
  useChannelContent,
  useContentStats,
  useRefreshContent,
  useOptimisticUpdate,
  QUERY_KEYS,
  API_ENDPOINTS,
  CACHE_CONFIG,
  getContentEndpoint,
  getChannelContentEndpoint,
  queryClient,
} from '@/lib/queryClient'

export type { ContentFilters } from '@/lib/queryClient'

// Re-export from useContent for convenience
export { useContent } from './useContent'
export type { ContentItem, UseContentOptions } from './useContent'
