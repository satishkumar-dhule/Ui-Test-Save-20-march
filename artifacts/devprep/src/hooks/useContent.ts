import { useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryClient, QUERY_KEYS, API_ENDPOINTS } from '@/lib/queryClient'
import { useContentStore, type ContentItem, type ContentStats } from '@/lib/contentStore'
import type { ContentType } from '@/types/realtime'

interface UseContentOptions {
  channelId?: string
  type?: ContentType
  status?: 'pending' | 'approved' | 'rejected'
  minQuality?: number
  limit?: number
  enabled?: boolean
}

interface UseContentResult {
  items: ContentItem[]
  stats: ContentStats | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<unknown>
}

export function useContent(options: UseContentOptions = {}): UseContentResult {
  const { channelId, type, status, minQuality, limit, enabled = true } = options
  const items = useContentStore(state => Object.values(state.items))
  const stats = useContentStore(state => state.stats)

  const queryKey = QUERY_KEYS.list({
    channelId,
    type,
    status,
    minQuality,
    limit,
  })

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      if (channelId) params.append('channelId', channelId)
      if (type) params.append('type', type)
      if (status) params.append('status', status)
      if (minQuality !== undefined) params.append('minQuality', String(minQuality))
      if (limit) params.append('limit', String(limit))

      const response = await fetch(`${API_ENDPOINTS.content}?${params}`)
      if (!response.ok) throw new Error(`Failed to fetch content: ${response.status}`)
      const json = await response.json()
      return json.data as ContentItem[]
    },
    enabled,
    staleTime: 30 * 1000,
  })

  useEffect(() => {
    if (data) {
      useContentStore.getState().addItems(data)
      useContentStore.getState().updateStats({
        totalItems: data.length,
        byType: data.reduce(
          (acc, item) => {
            acc[item.contentType] = (acc[item.contentType] || 0) + 1
            return acc
          },
          {} as Record<ContentType, number>
        ),
        byChannel: data.reduce(
          (acc, item) => {
            acc[item.channelId] = (acc[item.channelId] || 0) + 1
            return acc
          },
          {} as Record<string, number>
        ),
        lastFetched: Date.now(),
      })
    }
  }, [data])

  const filteredItems = items.filter(item => {
    if (channelId && item.channelId !== channelId) return false
    if (type && item.contentType !== type) return false
    if (status && item.status !== status) return false
    if (minQuality !== undefined && item.qualityScore < minQuality) return false
    return true
  })

  const displayItems = limit ? filteredItems.slice(0, limit) : filteredItems

  return {
    items: displayItems,
    stats,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  }
}

export function useContentByChannel(channelId: string | null, enabled = true): UseContentResult {
  return useContent({ channelId: channelId ?? undefined, enabled: enabled && !!channelId })
}

export function useContentByType(type: ContentType | null, enabled = true): UseContentResult {
  return useContent({ type: type ?? undefined, enabled: enabled && !!type })
}

export function useContentStats() {
  const stats = useContentStore(state => state.stats)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.stats(),
    queryFn: async () => {
      const response = await fetch(`${API_ENDPOINTS.content}/stats`)
      if (!response.ok) throw new Error(`Failed to fetch stats: ${response.status}`)
      return response.json() as Promise<ContentStats>
    },
    staleTime: 60 * 1000,
  })

  return {
    stats: data ?? stats,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  }
}

export function useOptimisticContent() {
  const queryClient = useQueryClient()
  const pendingUpdates = useContentStore(state => state.pendingOptimisticUpdates)

  const addContent = useCallback(
    async (item: ContentItem) => {
      useContentStore.getState().setPendingOptimistic(item.id, item)
      queryClient.setQueryData<ContentItem[]>(QUERY_KEYS.lists(), old =>
        old ? [...old, item] : [item]
      )

      try {
        const response = await fetch(API_ENDPOINTS.content, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        })

        if (!response.ok) throw new Error('Failed to add content')
        useContentStore.getState().confirmOptimisticUpdate(item.id)
      } catch {
        useContentStore.getState().rollbackOptimisticUpdate(item.id)
        throw new Error('Failed to add content')
      }
    },
    [queryClient]
  )

  const updateContent = useCallback(
    async (id: string, updates: Partial<ContentItem>) => {
      const existing = useContentStore.getState().getItem(id)
      if (!existing) return

      const optimisticItem = { ...existing, ...updates }
      useContentStore.getState().setPendingOptimistic(id, optimisticItem)
      queryClient.setQueryData<ContentItem[]>(QUERY_KEYS.lists(), old =>
        old ? old.map(item => (item.id === id ? optimisticItem : item)) : []
      )

      try {
        const response = await fetch(`${API_ENDPOINTS.content}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!response.ok) throw new Error('Failed to update content')
        useContentStore.getState().confirmOptimisticUpdate(id)
      } catch {
        useContentStore.getState().rollbackOptimisticUpdate(id)
        throw new Error('Failed to update content')
      }
    },
    [queryClient]
  )

  const deleteContent = useCallback(
    async (id: string) => {
      const existing = useContentStore.getState().getItem(id)
      if (!existing) return

      useContentStore.getState().setPendingOptimistic(id, existing)
      queryClient.setQueryData<ContentItem[]>(QUERY_KEYS.lists(), old =>
        old ? old.filter(item => item.id !== id) : []
      )

      try {
        const response = await fetch(`${API_ENDPOINTS.content}/${id}`, {
          method: 'DELETE',
        })

        if (!response.ok) throw new Error('Failed to delete content')
        useContentStore.getState().confirmOptimisticUpdate(id)
        useContentStore.getState().removeItem(id)
      } catch {
        useContentStore.getState().rollbackOptimisticUpdate(id)
        throw new Error('Failed to delete content')
      }
    },
    [queryClient]
  )

  return {
    pendingUpdates: Array.from(pendingUpdates.values()),
    addContent,
    updateContent,
    deleteContent,
  }
}
