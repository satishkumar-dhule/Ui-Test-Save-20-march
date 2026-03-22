/**
 * useFilters - React hooks for filter state management
 * 
 * Provides hooks for accessing and updating filter state.
 * Includes URL synchronization support.
 */

import { useEffect } from 'react'
import { useFilterStore, buildQueryParams } from '../stores-v2/filterStore'
import { FilterState, ContentType, ContentStatus } from '../stores-v2/types'

// Hook to get current filters
export function useFilters() {
  return useFilterStore()
}

// Hook to get filtered items from a list
export function useFilteredItems<T extends { 
  channelId: string
  contentType: ContentType
  status: ContentStatus
  tags?: string[]
}>(items: T[]) {
  const filters = useFilterStore()
  
  return items.filter(item => {
    // Channel filter
    if (filters.channel && item.channelId !== filters.channel) return false
    
    // Type filter
    if (filters.type && item.contentType !== filters.type) return false
    
    // Status filter
    if (filters.status && item.status !== filters.status) return false
    
    // Tags filter (all tags must match)
    if (filters.tags.length > 0) {
      const itemTags = item.tags || []
      if (!filters.tags.every(tag => itemTags.includes(tag))) return false
    }
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const itemStr = JSON.stringify(item).toLowerCase()
      if (!itemStr.includes(searchLower)) return false
    }
    
    return true
  })
}

// Hook for URL synchronization
export function useFilterURLSync() {
  const filters = useFilterStore()
  
  // Sync filters to URL
  const syncToURL = () => {
    if (typeof window === 'undefined') return
    
    const params = buildQueryParams(filters)
    const newURL = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newURL)
  }
  
  // Load filters from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const params = new URLSearchParams(window.location.search)
    const urlFilters: Partial<FilterState> = {}
    
    const channel = params.get('channel')
    if (channel) urlFilters.channel = channel
    
    const type = params.get('type') as ContentType | null
    if (type) urlFilters.type = type
    
    const status = params.get('status') as ContentStatus | null
    if (status) urlFilters.status = status
    
    const search = params.get('search')
    if (search) urlFilters.search = search
    
    const tags = params.get('tags')
    if (tags) urlFilters.tags = tags.split(',')
    
    const sort = params.get('sort')
    if (sort) {
      const [field, order] = sort.split(':')
      urlFilters.sort = {
        field: field as FilterState['sort']['field'],
        order: order as FilterState['sort']['order'],
      }
    }
    
    // Apply URL filters if any exist
    if (Object.keys(urlFilters).length > 0) {
      useFilterStore.setState(urlFilters)
    }
  }, [])
  
  return { syncToURL }
}

// Specialized filter hooks
export function useChannelFilter() {
  const { channel, setChannel } = useFilterStore()
  return { channel, setChannel }
}

export function useTypeFilter() {
  const { type, setType } = useFilterStore()
  return { type, setType }
}

export function useStatusFilter() {
  const { status, setStatus } = useFilterStore()
  return { status, setStatus }
}

export function useSearchFilter() {
  const { search, setSearch } = useFilterStore()
  return { search, setSearch }
}

export function useSortFilter() {
  const { sort, setSort } = useFilterStore()
  return { sort, setSort }
}

export function useTagsFilter() {
  const { tags, addTag, removeTag, clearTags } = useFilterStore()
  return { tags, addTag, removeTag, clearTags }
}

// Hook to get active filter count
export function useActiveFilterCount() {
  const filters = useFilterStore()
  
  let count = 0
  if (filters.channel) count++
  if (filters.type) count++
  if (filters.status) count++
  if (filters.search) count++
  count += filters.tags.length
  
  return count
}

// Hook to check if any filters are active
export function useHasActiveFilters() {
  const count = useActiveFilterCount()
  return count > 0
}

// Hook to reset all filters
export function useResetFilters() {
  const { reset } = useFilterStore()
  return reset
}