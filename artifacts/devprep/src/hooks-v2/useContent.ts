/**
 * useContent - React Query hooks for content data
 * 
 * Provides hooks for fetching, caching, and updating content from the API.
 * Integrates with React Query for server state management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useContentStore } from '../stores-v2/contentStore'
import { useFilterStore } from '../stores-v2/filterStore'
import { ContentItem, ContentType, FilterState } from '../stores-v2/types'

// API endpoints
const API_BASE = '/api'
const CONTENT_ENDPOINT = `${API_BASE}/content`

// Query keys
export const contentKeys = {
  all: ['content'] as const,
  lists: () => [...contentKeys.all, 'list'] as const,
  list: (filters: Partial<FilterState>) => [...contentKeys.lists(), filters] as const,
  details: () => [...contentKeys.all, 'detail'] as const,
  detail: (id: string) => [...contentKeys.details(), id] as const,
  stats: () => [...contentKeys.all, 'stats'] as const,
  search: (query: string) => [...contentKeys.all, 'search', query] as const,
  byChannel: (channelId: string) => [...contentKeys.all, 'channel', channelId] as const,
  byType: (type: ContentType) => [...contentKeys.all, 'type', type] as const,
}

// Fetch functions
async function fetchContent(filters?: Partial<FilterState>): Promise<ContentItem[]> {
  const params = new URLSearchParams()
  
  if (filters?.channel) params.set('channel', filters.channel)
  if (filters?.type) params.set('type', filters.type)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.search) params.set('search', filters.search)
  if (filters?.sort) {
    params.set('sort', `${filters.sort.field}:${filters.sort.order}`)
  }
  
  const url = `${CONTENT_ENDPOINT}?${params.toString()}`
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch content: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.data || []
}

async function fetchContentById(id: string): Promise<ContentItem> {
  const response = await fetch(`${CONTENT_ENDPOINT}/${id}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch content: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.data
}

async function fetchContentByType(type: ContentType): Promise<ContentItem[]> {
  const response = await fetch(`${CONTENT_ENDPOINT}/type/${type}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch content by type: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.data || []
}

async function fetchContentByChannel(channelId: string): Promise<ContentItem[]> {
  const response = await fetch(`${CONTENT_ENDPOINT}/channel/${channelId}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch content by channel: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.data || []
}

async function fetchContentStats(): Promise<Record<string, unknown>> {
  const response = await fetch(`${CONTENT_ENDPOINT}/stats`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch stats: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.data
}

// Hook for fetching content with filters
export function useContent(options?: {
  filters?: Partial<FilterState>
  enabled?: boolean
  refetchInterval?: number
}) {
  const storeFilters = useFilterStore()
  const filters = options?.filters || {
    channel: storeFilters.channel,
    type: storeFilters.type,
    status: storeFilters.status,
    difficulty: storeFilters.difficulty,
    search: storeFilters.search,
    sort: storeFilters.sort,
    tags: storeFilters.tags,
  }
  
  return useQuery({
    queryKey: contentKeys.list(filters),
    queryFn: () => fetchContent(filters),
    enabled: options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for fetching a single content item
export function useContentById(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: contentKeys.detail(id),
    queryFn: () => fetchContentById(id),
    enabled: options?.enabled !== false && !!id,
    staleTime: 60000, // 1 minute
  })
}

// Hook for fetching content by type
export function useContentByType(type: ContentType, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: contentKeys.byType(type),
    queryFn: () => fetchContentByType(type),
    enabled: options?.enabled !== false,
    staleTime: 30000,
  })
}

// Hook for fetching content by channel
export function useContentByChannel(channelId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: contentKeys.byChannel(channelId),
    queryFn: () => fetchContentByChannel(channelId),
    enabled: options?.enabled !== false && !!channelId,
    staleTime: 30000,
  })
}

// Hook for content stats
export function useContentStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: contentKeys.stats(),
    queryFn: fetchContentStats,
    enabled: options?.enabled !== false,
    staleTime: 60000, // 1 minute
  })
}

// Hook for searching content
export function useContentSearch(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: contentKeys.search(query),
    queryFn: async () => {
      const response = await fetch(`${CONTENT_ENDPOINT}/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Search failed')
      const data = await response.json()
      return data.data || []
    },
    enabled: options?.enabled !== false && query.length >= 2,
    staleTime: 30000,
  })
}

// Mutations
export function useCreateContent() {
  const queryClient = useQueryClient()
  const { addItem } = useContentStore()
  
  return useMutation({
    mutationFn: async (content: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await fetch(CONTENT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create content: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.data
    },
    onSuccess: (newContent) => {
      // Update store
      addItem(newContent)
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: contentKeys.stats() })
    },
  })
}

export function useUpdateContent() {
  const queryClient = useQueryClient()
  const { updateItem } = useContentStore()
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ContentItem> }) => {
      const response = await fetch(`${CONTENT_ENDPOINT}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update content: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.data
    },
    onSuccess: (updatedContent) => {
      // Update store
      updateItem(updatedContent.id, updatedContent)
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: contentKeys.detail(updatedContent.id) })
    },
  })
}

export function useDeleteContent() {
  const queryClient = useQueryClient()
  const { removeItem } = useContentStore()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${CONTENT_ENDPOINT}/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete content: ${response.statusText}`)
      }
      
      return id
    },
    onSuccess: (id) => {
      // Update store
      removeItem(id)
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: contentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: contentKeys.stats() })
    },
  })
}