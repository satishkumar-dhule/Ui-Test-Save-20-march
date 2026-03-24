import { useQuery } from '@tanstack/react-query'
import { fetchContentByType, type ContentRecord } from '@/services/contentApi'
import { QUERY_KEYS } from '@/lib/queryClient'
import { transformRecord, type ContentItem, type UseContentOptions } from './useContent'

export function useContentByType(type: string | null, options: UseContentOptions = {}) {
  const enabled = options.enabled !== false && !!type

  return useQuery({
    queryKey: QUERY_KEYS.byType(type || ''),
    queryFn: async () => {
      const records = await fetchContentByType(type!, {
        channelId: options.channelId,
        status: options.status,
        minQuality: options.minQuality,
        limit: options.limit,
        offset: options.offset,
      })
      return records.map(transformRecord)
    },
    enabled,
    staleTime: 30_000,
  })
}

export type UseContentByTypeResult = {
  items: ContentItem[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<unknown>
}
