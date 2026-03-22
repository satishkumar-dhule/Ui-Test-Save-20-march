import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useCallback } from 'react'
import {
  QUERY_KEYS,
  CACHE_CONFIG,
  getContentEndpoint,
  getChannelContentEndpoint,
  type ContentFilters,
} from '@/lib/queryClient'

interface PrefetchOptions {
  channelId?: string
  contentTypes?: string[]
  priority?: 'high' | 'low'
}

const CONTENT_TYPES = ['question', 'flashcard', 'exam', 'voice', 'coding'] as const

export function usePrefetch() {
  const queryClient = useQueryClient()
  const prefetchedRef = useRef<Set<string>>(new Set())

  const shouldPrefetch = useCallback((key: string, priority: 'high' | 'low' = 'low'): boolean => {
    if (prefetchedRef.current.has(key)) return false
    if (priority === 'high') return true

    if ('requestIdleCallback' in window) {
      return true
    }
    return true
  }, [])

  const prefetchContent = useCallback(
    (filters?: ContentFilters, priority: 'high' | 'low' = 'low') => {
      const key = JSON.stringify(filters ?? {})
      if (!shouldPrefetch(key, priority)) return

      const endpoint = getContentEndpoint(filters)
      queryClient.prefetchQuery({
        queryKey: [...QUERY_KEYS.all, 'endpoint', endpoint],
        queryFn: async () => {
          const response = await fetch(endpoint)
          if (!response.ok) throw new Error('Prefetch failed')
          return response.json()
        },
        staleTime: CACHE_CONFIG.staleTime,
      })

      prefetchedRef.current.add(key)
    },
    [queryClient, shouldPrefetch]
  )

  const prefetchChannelContent = useCallback(
    (channelId: string, filters?: Partial<ContentFilters>, priority: 'high' | 'low' = 'low') => {
      const key = `${channelId}:${JSON.stringify(filters ?? {})}`
      if (!shouldPrefetch(key, priority)) return

      const endpoint = getChannelContentEndpoint(channelId, filters)
      queryClient.prefetchQuery({
        queryKey: [...QUERY_KEYS.byChannel(channelId), 'endpoint', endpoint],
        queryFn: async () => {
          const response = await fetch(endpoint)
          if (!response.ok) throw new Error('Prefetch failed')
          return response.json()
        },
        staleTime: CACHE_CONFIG.staleTime,
      })

      prefetchedRef.current.add(key)
    },
    [queryClient, shouldPrefetch]
  )

  const prefetchCurrentChannelAdjacent = useCallback(
    (currentChannelId: string, contentTypes: string[] = CONTENT_TYPES.slice()) => {
      const prefetchOnIdle = (callback: () => void) => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(callback, { timeout: 2000 })
        } else {
          setTimeout(callback, CACHE_CONFIG.prefetchDelay)
        }
      }

      prefetchOnIdle(() => {
        for (const type of contentTypes.slice(0, CACHE_CONFIG.maxPrefetchItems)) {
          prefetchChannelContent(currentChannelId, { type }, 'low')
        }
      })
    },
    [prefetchChannelContent]
  )

  const prefetchAdjacentChannels = useCallback(
    (
      currentChannelId: string,
      allChannelIds: string[],
      options: { limit?: number; contentTypes?: string[] } = {}
    ) => {
      const { limit = 2, contentTypes = ['question'] } = options
      const currentIndex = allChannelIds.indexOf(currentChannelId)
      if (currentIndex === -1) return

      const adjacentIds: string[] = []
      if (currentIndex > 0) adjacentIds.push(allChannelIds[currentIndex - 1])
      if (currentIndex < allChannelIds.length - 1) adjacentIds.push(allChannelIds[currentIndex + 1])

      const prefetchOnIdle = (callback: () => void) => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(callback, { timeout: 3000 })
        } else {
          setTimeout(callback, CACHE_CONFIG.prefetchDelay * 2)
        }
      }

      prefetchOnIdle(() => {
        const toPrefetch = adjacentIds.slice(0, limit)
        for (const channelId of toPrefetch) {
          for (const type of contentTypes.slice(0, 2)) {
            prefetchChannelContent(channelId, { type }, 'low')
          }
        }
      })
    },
    [prefetchChannelContent]
  )

  const prefetchAllContentTypes = useCallback(
    (channelId: string, priority: 'high' | 'low' = 'low') => {
      for (const type of CONTENT_TYPES) {
        prefetchChannelContent(channelId, { type }, priority)
      }
    },
    [prefetchChannelContent]
  )

  const prefetchStats = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.stats(),
      queryFn: async () => {
        const response = await fetch('/api/content/stats')
        if (!response.ok) throw new Error('Failed to fetch stats')
        return response.json()
      },
      staleTime: CACHE_CONFIG.staleTime,
    })
  }, [queryClient])

  const warmCacheOnStart = useCallback(
    (defaultChannelId?: string) => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => {
          prefetchStats()
          if (defaultChannelId) {
            prefetchAllContentTypes(defaultChannelId, 'low')
          }
        })
      } else {
        setTimeout(() => {
          prefetchStats()
          if (defaultChannelId) {
            prefetchAllContentTypes(defaultChannelId, 'low')
          }
        }, 500)
      }
    },
    [prefetchStats, prefetchAllContentTypes]
  )

  const cancelPrefetch = useCallback((key: string) => {
    prefetchedRef.current.delete(key)
  }, [])

  const clearPrefetchHistory = useCallback(() => {
    prefetchedRef.current.clear()
  }, [])

  return {
    prefetchContent,
    prefetchChannelContent,
    prefetchCurrentChannelAdjacent,
    prefetchAdjacentChannels,
    prefetchAllContentTypes,
    prefetchStats,
    warmCacheOnStart,
    cancelPrefetch,
    clearPrefetchHistory,
  }
}

export function useIdlePrefetch(callback: () => void, delay: number = 100) {
  useEffect(() => {
    const idleCallback =
      'requestIdleCallback' in window
        ? requestIdleCallback(() => callback(), { timeout: 5000 })
        : setTimeout(callback, delay)

    return () => {
      if (typeof idleCallback === 'number') {
        clearTimeout(idleCallback)
      }
    }
  }, [callback, delay])
}

export function usePrefetchOnRouteChange(
  channelId: string,
  contentTypes: string[] = CONTENT_TYPES.slice()
) {
  const { prefetchAllContentTypes, prefetchAdjacentChannels } = usePrefetch()
  const prevChannelRef = useRef<string>(channelId)

  useEffect(() => {
    if (channelId !== prevChannelRef.current) {
      prefetchAllContentTypes(channelId, 'high')
      prevChannelRef.current = channelId
    }
  }, [channelId, prefetchAllContentTypes])

  return { prefetchAllContentTypes, prefetchAdjacentChannels }
}

export function usePrefetchOnHover() {
  const queryClient = useQueryClient()

  const prefetchOnHover = useCallback(
    (endpoint: string, queryKey: readonly unknown[]) => {
      const isCached = queryClient.getQueryData(queryKey)
      if (isCached) return

      queryClient.prefetchQuery({
        queryKey,
        queryFn: async () => {
          const response = await fetch(endpoint)
          if (!response.ok) throw new Error('Prefetch failed')
          return response.json()
        },
        staleTime: CACHE_CONFIG.staleTime,
      })
    },
    [queryClient]
  )

  return { prefetchOnHover }
}
