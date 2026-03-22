import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
      retry: 1,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
    mutations: {
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 15000),
    },
  },
})

export const QUERY_KEYS = {
  all: ['content'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters: ContentFilters) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
  byChannel: (channelId: string) => [...QUERY_KEYS.all, 'channel', channelId] as const,
  byChannelType: (channelId: string, type: string) =>
    [...QUERY_KEYS.all, 'channel', channelId, 'type', type] as const,
  byType: (type: string) => [...QUERY_KEYS.all, 'type', type] as const,
  stats: () => [...QUERY_KEYS.all, 'stats'] as const,
  search: (query: string) => [...QUERY_KEYS.all, 'search', query] as const,
  channels: () => ['channels'] as const,
  health: () => ['health'] as const,
  difficultyStats: () => [...QUERY_KEYS.all, 'difficulty-stats'] as const,
  allContent: () => [...QUERY_KEYS.all, 'all'] as const,
  grouped: () => [...QUERY_KEYS.all, 'grouped'] as const,
} as const

export interface ContentFilters {
  channelId?: string
  type?: string
  status?: 'pending' | 'approved' | 'rejected' | 'published'
  minQuality?: number
  limit?: number
  offset?: number
  since?: number
}

export const API_ENDPOINTS = {
  content: '/api/content',
  contentStats: '/api/content/stats',
  contentDifficultyStats: '/api/content/difficulty-stats',
  search: '/api/search',
  searchVector: '/api/search/vector',
  channels: '/api/channels',
  health: '/api/health',
} as const

export const WEBSOCKET_CONFIG = {
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000,
  reconnectMultiplier: 2,
  pingInterval: 30000,
  pongTimeout: 5000,
} as const

export const CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  prefetchDelay: 100,
  maxPrefetchItems: 5,
} as const

export const NETWORK_AWARE = {
  online: {
    refetchOnMount: false,
    refetchOnReconnect: true,
    refetchInterval: false,
  },
  offline: {
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: 30 * 1000,
  },
} as const

export function getContentEndpoint(filters?: ContentFilters): string {
  const params = new URLSearchParams()
  if (filters?.channelId) params.set('channel', filters.channelId)
  if (filters?.type) params.set('type', filters.type)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.minQuality !== undefined) params.set('quality', String(filters.minQuality))
  if (filters?.limit) params.set('limit', String(filters.limit))
  if (filters?.offset) params.set('offset', String(filters.offset))
  if (filters?.since) params.set('since', String(filters.since))

  const queryString = params.toString()
  return queryString ? `${API_ENDPOINTS.content}?${queryString}` : API_ENDPOINTS.content
}

export function getChannelContentEndpoint(
  channelId: string,
  filters?: Partial<ContentFilters>
): string {
  const params = new URLSearchParams()
  if (filters?.type) params.set('type', filters.type)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.minQuality !== undefined) params.set('quality', String(filters.minQuality))
  if (filters?.limit) params.set('limit', String(filters.limit))
  if (filters?.offset) params.set('offset', String(filters.offset))

  const queryString = params.toString()
  return queryString
    ? `/api/channels/${channelId}/content?${queryString}`
    : `/api/channels/${channelId}/content`
}
