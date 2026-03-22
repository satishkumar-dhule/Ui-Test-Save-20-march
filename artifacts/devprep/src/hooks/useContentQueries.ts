import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  queryClient,
  QUERY_KEYS,
  API_ENDPOINTS,
  getContentEndpoint,
  getChannelContentEndpoint,
  type ContentFilters,
  CACHE_CONFIG,
} from '@/lib/queryClient'
import { apiCache, createQueryKey } from '@/lib/api-cache'
import type { ContentRecord } from '@/services/contentApi'

export { QUERY_KEYS, API_ENDPOINTS, CACHE_CONFIG, getContentEndpoint, getChannelContentEndpoint }
export { queryClient }
export type { ContentFilters }

export interface UseContentOptions {
  channelId?: string
  contentType?: string
  status?: string
  minQuality?: number
  limit?: number
  useCache?: boolean
  enabled?: boolean
  staleTime?: number
}

export function useContent(options: UseContentOptions = {}) {
  const {
    channelId,
    contentType,
    status,
    minQuality,
    limit,
    useCache = true,
    enabled = true,
    staleTime = CACHE_CONFIG.staleTime,
  } = options

  const filters: ContentFilters = {
    channelId,
    type: contentType,
    status: status as ContentFilters['status'],
    minQuality,
    limit,
  }

  const queryKey = [...QUERY_KEYS.all, 'list', filters]

  return useQuery({
    queryKey,
    queryFn: async () => {
      const cacheKey = createQueryKey(getContentEndpoint(filters))

      if (useCache) {
        const cached = apiCache.get(cacheKey)
        if (cached && !cached.isStale) {
          return cached.data as ContentRecord[]
        }
      }

      const response = await fetch(getContentEndpoint(filters))
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      const result = await response.json()

      if (useCache) {
        apiCache.set(cacheKey, result.data ?? [])
      }

      return (result.data ?? []) as ContentRecord[]
    },
    staleTime,
    enabled,
  })
}

export function useChannelContent<T = unknown>(
  channelId: string,
  options?: {
    contentType?: string
    status?: string
    minQuality?: number
    limit?: number
    useCache?: boolean
    enabled?: boolean
    staleTime?: number
  }
) {
  const {
    contentType,
    status,
    minQuality,
    limit,
    useCache = true,
    enabled = true,
    staleTime = CACHE_CONFIG.staleTime,
  } = options ?? {}

  const filters: Partial<ContentFilters> = {
    type: contentType,
    status: status as ContentFilters['status'],
    minQuality,
    limit,
  }

  const queryKey = [...QUERY_KEYS.byChannel(channelId), filters]
  const endpoint = getChannelContentEndpoint(channelId, filters)

  return useQuery({
    queryKey,
    queryFn: async () => {
      const cacheKey = createQueryKey(endpoint)

      if (useCache) {
        const cached = apiCache.get(cacheKey)
        if (cached && !cached.isStale) {
          const cachedData = cached.data as { data: T[] }
          return cachedData.data
        }
      }

      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      const result = await response.json()

      if (useCache) {
        apiCache.set(cacheKey, result)
      }

      return (result.data ?? []) as T[]
    },
    staleTime,
    enabled: enabled && !!channelId,
  })
}

export function useContentStats(options?: { staleTime?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.stats(),
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.contentStats)
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      return response.json()
    },
    staleTime: options?.staleTime ?? CACHE_CONFIG.staleTime,
    enabled: options?.enabled ?? true,
  })
}

export function useRefreshContent() {
  const queryClient = useQueryClient()

  return useCallback(
    (channelId?: string) => {
      if (channelId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byChannel(channelId) })
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
      apiCache.clear()
    },
    [queryClient]
  )
}

export function useOptimisticUpdate<TData, TError, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onMutate?: (variables: TVariables) => void
    onSuccess?: (data: TData, variables: TVariables) => void
    onError?: (error: TError, variables: TVariables) => void
    onSettled?: (data: TData | undefined, error: TError | undefined, variables: TVariables) => void
    queryKey?: readonly unknown[]
  }
) {
  const queryClient = useQueryClient()

  return {
    mutationFn,
    onMutate: options?.onMutate,
    onSuccess: (data: TData, variables: TVariables) => {
      if (options?.queryKey) {
        queryClient.invalidateQueries({ queryKey: options.queryKey })
      }
      options?.onSuccess?.(data, variables)
    },
    onError: (error: TError, variables: TVariables) => {
      options?.onError?.(error, variables)
    },
    onSettled: (data: TData | undefined, error: TError | undefined, variables: TVariables) => {
      if (options?.queryKey) {
        queryClient.invalidateQueries({ queryKey: options.queryKey })
      }
      options?.onSettled?.(data, error, variables)
    },
  }
}
