/**
 * @deprecated This module has been consolidated into useContent.ts
 * Re-exports for backward compatibility.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  QUERY_KEYS,
  API_ENDPOINTS,
  getContentEndpoint,
  getChannelContentEndpoint,
  type ContentFilters,
  CACHE_CONFIG,
} from '@/lib/queryClient'
import { queryClient } from '@/lib/queryClient'

export { QUERY_KEYS, API_ENDPOINTS, CACHE_CONFIG, getContentEndpoint, getChannelContentEndpoint }
export { queryClient }
export type { ContentFilters }

export function useChannelContent<T = unknown>(
  channelId: string,
  options?: {
    contentType?: string
    status?: string
    minQuality?: number
    limit?: number
    enabled?: boolean
    staleTime?: number
  }
) {
  const {
    contentType,
    status,
    minQuality,
    limit,
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
      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }
      const result = await response.json()
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
  const qc = useQueryClient()

  return useCallback(
    (channelId?: string) => {
      if (channelId) {
        qc.invalidateQueries({ queryKey: QUERY_KEYS.byChannel(channelId) })
      }
      qc.invalidateQueries({ queryKey: QUERY_KEYS.all })
    },
    [qc]
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
  const qc = useQueryClient()

  return {
    mutationFn,
    onMutate: options?.onMutate,
    onSuccess: (data: TData, variables: TVariables) => {
      if (options?.queryKey) {
        qc.invalidateQueries({ queryKey: options.queryKey })
      }
      options?.onSuccess?.(data, variables)
    },
    onError: (error: TError, variables: TVariables) => {
      options?.onError?.(error, variables)
    },
    onSettled: (data: TData | undefined, error: TError | undefined, variables: TVariables) => {
      if (options?.queryKey) {
        qc.invalidateQueries({ queryKey: options.queryKey })
      }
      options?.onSettled?.(data, error, variables)
    },
  }
}
