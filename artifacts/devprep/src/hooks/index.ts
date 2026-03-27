/**
 * DevPrep Hooks Index
 *
 * Consolidated exports for all hooks.
 * Content hooks have been merged - see useContent.ts for the unified API.
 */

export {
  // Primary content hooks (consolidated in useContent.ts)
  useGeneratedContent,
  useOptimizedContent,
  useInfiniteContent,

  // Legacy content hooks (backward compatible)
  useContent,
  useContentByChannel,
  useContentByType,

  // Content utilities
  useMergeContent,
  transformRecord,
  mapStatus,

  // Realtime content (SQLite-based)
  useRealtimeContent,

  // Types
  type GeneratedContentMap,
  type ContentType,
  type ContentItem,
  type UseContentOptions,
  type UseContentResult,
  type UseGeneratedContentOptions,
  type UseGeneratedContentResult,
} from './useContent'

// Keep these exports from original index
export { useChannels } from './useChannels'
export { useWebSocket } from './useWebSocket'
export { useContentStore } from '@/stores/contentStore'
export { useRealtimeStore } from '@/lib/realtimeStore'
// Note: Filter functionality is now in contentStore
export { queryClient, QUERY_KEYS, API_ENDPOINTS, WEBSOCKET_CONFIG } from '@/lib/queryClient'
