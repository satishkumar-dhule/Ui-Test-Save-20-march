import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/queryClient'
import { useContentStore, type ContentItem, type ContentStats } from '@/lib/contentStore'
import type { ContentType, ContentStatus } from '@/stores/types'
import { fetchAllContent, fetchContentStats } from '@/services/contentApi'

interface UseContentOptions {
  channelId?: string
  type?: ContentType
  status?: ContentStatus
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

function mapStatus(status: string): ContentItem['status'] {
  if (status === 'published' || status === 'approved') return 'approved'
  if (status === 'rejected') return 'rejected'
  return 'pending'
}

export function useContent(options: UseContentOptions = {}): UseContentResult {
  const { channelId, type, status, minQuality, limit, enabled = true } = options
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
      const records = await fetchAllContent({
        channelId,
        contentType: type,
        status,
        minQuality,
        limit,
      })
      const items: ContentItem[] = records.map(r => ({
        id: r.id,
        channelId: r.channel_id,
        contentType: r.content_type as ContentType,
        data: r.data,
        qualityScore: r.quality_score,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        status: mapStatus(r.status),
      }))
      useContentStore.getState().addItems(items)
      return items
    },
    enabled,
    staleTime: 30 * 1000,
  })

  const storeItems = useContentStore(state => {
    const all = Object.values(state.items)
    return all.filter(item => {
      if (channelId && item.channelId !== channelId) return false
      if (type && item.contentType !== type) return false
      if (status && item.status !== status) return false
      if (minQuality !== undefined && item.qualityScore < minQuality) return false
      return true
    })
  })

  const items = data ?? storeItems
  const displayItems = limit ? items.slice(0, limit) : items

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
    queryFn: async (): Promise<ContentStats> => {
      const s = await fetchContentStats()
      return {
        totalItems: s.total,
        byType: {
          question: s.question,
          flashcard: s.flashcard,
          exam: s.exam,
          voice: s.voice,
          coding: s.coding,
        } as Record<ContentType, number>,
        byChannel: {} as Record<string, number>,
        lastFetched: Date.now(),
      }
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
      useContentStore.getState().confirmOptimisticUpdate(item.id)
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
      useContentStore.getState().confirmOptimisticUpdate(id)
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
      useContentStore.getState().confirmOptimisticUpdate(id)
      useContentStore.getState().removeItem(id)
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
