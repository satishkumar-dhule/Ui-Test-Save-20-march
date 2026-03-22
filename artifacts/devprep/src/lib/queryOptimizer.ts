import { useQueryClient, useMutation, useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { queryClient, QUERY_KEYS, type ContentFilters } from './queryClient'
import type { GeneratedContentMap } from '@/hooks/useGeneratedContent'
import type { ContentRecord, ContentStats, ApiResponse } from '@/services/contentApi'

export const QUERY_CONFIG = {
  staleTimes: {
    content: 5 * 60 * 1000,
    contentList: 2 * 60 * 1000,
    stats: 60 * 1000,
    channel: 3 * 60 * 1000,
  },
  gcTimes: {
    default: 30 * 60 * 1000,
    content: 60 * 60 * 1000,
    stats: 10 * 60 * 1000,
  },
  prefetch: {
    delay: 100,
    margin: '50%' as const,
  },
} as const

export function getOptimisticUpdate<T>(key: string[], updater: (old: T | undefined) => T): T {
  const cached = queryClient.getQueryData<T>(key)
  return updater(cached)
}

export function setQueryDataIfExists<T>(key: string[], data: T): void {
  if (queryClient.getQueryState(key)?.data !== undefined) {
    queryClient.setQueryData<T>(key, data)
  }
}

export function invalidateQueriesPattern(pattern: string[]): void {
  queryClient.invalidateQueries({ queryKey: pattern })
}

export function prefetchContentOnLoad(): void {
  const preloadDelay = QUERY_CONFIG.prefetch.delay

  setTimeout(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.byType('question'),
      queryFn: () => fetchContentByTypeOptimized('question'),
      staleTime: QUERY_CONFIG.staleTimes.contentList,
    })
  }, preloadDelay)

  setTimeout(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.byType('flashcard'),
      queryFn: () => fetchContentByTypeOptimized('flashcard'),
      staleTime: QUERY_CONFIG.staleTimes.contentList,
    })
  }, preloadDelay * 2)

  setTimeout(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.stats(),
      queryFn: () => fetchStatsOptimized(),
      staleTime: QUERY_CONFIG.staleTimes.stats,
    })
  }, preloadDelay * 3)
}

async function fetchContentByTypeOptimized(type: string): Promise<unknown[]> {
  const baseUrl = getApiBase()
  const url = new URL(`${baseUrl}/content/${type}`)
  url.searchParams.set('status', 'published,approved')
  url.searchParams.set('limit', '500')

  const response = await fetch(url.toString())
  if (!response.ok) throw new Error(`Failed to fetch ${type} content`)
  const result: ApiResponse<ContentRecord[]> = await response.json()
  return result.data?.map(r => r.data) ?? []
}

async function fetchStatsOptimized(): Promise<ContentStats | null> {
  const baseUrl = getApiBase()
  const url = new URL(`${baseUrl}/content`)
  url.searchParams.set('stats', 'true')

  const response = await fetch(url.toString())
  if (!response.ok) return null
  const result: ApiResponse<ContentRecord[]> = await response.json()
  return result.stats ?? null
}

function getApiBase(): string {
  const API_BASE = import.meta.env.VITE_API_URL || '/api'
  return API_BASE.startsWith('http') ? API_BASE : `${window.location.origin}${API_BASE}`
}

export function useOptimisticMutation<TData, TVariables, TError = Error>(
  mutationKey: string[],
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onMutate?: (variables: TVariables) => void
    onError?: (error: TError, variables: TVariables, context?: unknown) => void
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void
    queryKeysToInvalidate?: string[][]
  } = {}
) {
  return useMutation<TData, TError, TVariables>({
    mutationKey,
    mutationFn,
    onMutate: options.onMutate,
    onError: async (error, variables, context) => {
      await queryClient.cancelQueries({ queryKey: mutationKey })
      options.queryKeysToInvalidate?.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      options.onError?.(error, variables, context)
    },
    onSettled: async (data, error, variables) => {
      options.queryKeysToInvalidate?.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key })
      })
      options.onSettled?.(data, error, variables)
    },
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 15000),
  })
}

export function usePrefetchOnHover() {
  const queryClient = useQueryClient()

  const prefetchOnHover = (path: string) => {
    switch (path) {
      case '/questions':
      case '/qa':
        queryClient.prefetchQuery({
          queryKey: QUERY_KEYS.byType('question'),
          queryFn: () => fetchContentByTypeOptimized('question'),
          staleTime: QUERY_CONFIG.staleTimes.contentList,
        })
        break
      case '/flashcards':
        queryClient.prefetchQuery({
          queryKey: QUERY_KEYS.byType('flashcard'),
          queryFn: () => fetchContentByTypeOptimized('flashcard'),
          staleTime: QUERY_CONFIG.staleTimes.contentList,
        })
        break
      case '/exams':
        queryClient.prefetchQuery({
          queryKey: QUERY_KEYS.byType('exam'),
          queryFn: () => fetchContentByTypeOptimized('exam'),
          staleTime: QUERY_CONFIG.staleTimes.contentList,
        })
        break
      case '/voice':
        queryClient.prefetchQuery({
          queryKey: QUERY_KEYS.byType('voice'),
          queryFn: () => fetchContentByTypeOptimized('voice'),
          staleTime: QUERY_CONFIG.staleTimes.contentList,
        })
        break
      case '/coding':
        queryClient.prefetchQuery({
          queryKey: QUERY_KEYS.byType('coding'),
          queryFn: () => fetchContentByTypeOptimized('coding'),
          staleTime: QUERY_CONFIG.staleTimes.contentList,
        })
        break
    }
  }

  return { prefetchOnHover }
}

export function useBackgroundSync(intervalMs = 5 * 60 * 1000) {
  const queryClient = useQueryClient()

  const syncContent = async () => {
    await Promise.all([queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })])
  }

  return { syncContent, intervalMs }
}

export function createOptimizedQueryOptions<T>(
  key: string[],
  queryFn: () => Promise<T>,
  options: {
    staleTime?: number
    gcTime?: number
    prefetchOnMount?: boolean
    backgroundRefresh?: boolean
  } = {}
): UseQueryOptions<T> {
  return {
    queryKey: key,
    queryFn,
    staleTime: options.staleTime ?? QUERY_CONFIG.staleTimes.content,
    gcTime: options.gcTime ?? QUERY_CONFIG.gcTimes.default,
    refetchOnWindowFocus: false,
    refetchOnMount: options.prefetchOnMount ?? false,
    refetchOnReconnect: options.backgroundRefresh ?? true,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 20000),
  }
}

export const NETWORK_AWARE_CONFIG = {
  online: {
    refetchOnMount: false,
    refetchOnReconnect: true,
    refetchInterval: false as const,
  },
  offline: {
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: 30 * 1000,
  },
}

export function getNetworkAwareConfig(isOnline: boolean) {
  return isOnline ? NETWORK_AWARE_CONFIG.online : NETWORK_AWARE_CONFIG.offline
}

export function useQueryDeduplication() {
  const queryClient = useQueryClient()

  const deduplicatedQuery = async <T>(key: string[], queryFn: () => Promise<T>): Promise<T> => {
    const cached = queryClient.getQueryData<T>(key)
    if (cached !== undefined) return cached

    return queryClient.fetchQuery({
      queryKey: key,
      queryFn,
      staleTime: QUERY_CONFIG.staleTimes.content,
    })
  }

  return { deduplicatedQuery }
}
