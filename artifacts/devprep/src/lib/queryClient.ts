import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
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
  byType: (type: string) => [...QUERY_KEYS.all, 'type', type] as const,
  stats: () => [...QUERY_KEYS.all, 'stats'] as const,
  search: (query: string) => [...QUERY_KEYS.all, 'search', query] as const,
} as const

export interface ContentFilters {
  channelId?: string
  type?: string
  status?: 'pending' | 'approved' | 'rejected'
  minQuality?: number
  limit?: number
  offset?: number
}

export const API_ENDPOINTS = {
  content: '/api/content',
  search: '/api/search',
  searchVector: '/api/search/vector',
} as const

export const WEBSOCKET_CONFIG = {
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000,
  reconnectMultiplier: 2,
  pingInterval: 30000,
  pongTimeout: 5000,
} as const
