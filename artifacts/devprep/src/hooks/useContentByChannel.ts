import { useQuery } from '@tanstack/react-query'
import { fetchChannelContent, type ContentRecord } from '@/services/contentApi'
import { QUERY_KEYS } from '@/lib/queryClient'
import { transformRecord, type ContentItem, type UseContentOptions } from './useContent'

export function useContentByChannel(channelId: string | null, options: UseContentOptions = {}) {
  const enabled = options.enabled !== false && !!channelId

  return useQuery({
    queryKey: QUERY_KEYS.byChannel(channelId || ''),
    queryFn: async () => {
      const records = await fetchChannelContent(channelId!, {
        contentType: options.contentType,
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

export type UseContentByChannelResult = {
  items: ContentItem[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<unknown>
}
