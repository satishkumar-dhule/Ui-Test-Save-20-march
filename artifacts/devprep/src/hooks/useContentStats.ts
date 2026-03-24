import { useQuery } from '@tanstack/react-query'
import { fetchContentStats, type ContentStats as ApiContentStats } from '@/services/contentApi'
import { QUERY_KEYS } from '@/lib/queryClient'

export interface ContentStats {
  totalItems: number
  byType: Record<string, number>
  byChannel: Record<string, number>
  lastFetched: number | null
}

function transformStats(apiStats: ApiContentStats): ContentStats {
  return {
    totalItems: apiStats.total,
    byType: {
      question: apiStats.question,
      flashcard: apiStats.flashcard,
      exam: apiStats.exam,
      voice: apiStats.voice,
      coding: apiStats.coding,
    },
    byChannel: {},
    lastFetched: Date.now(),
  }
}

export function useContentStats() {
  return useQuery({
    queryKey: QUERY_KEYS.stats(),
    queryFn: async () => {
      const stats = await fetchContentStats()
      return transformStats(stats)
    },
    staleTime: 60_000,
  })
}

export type UseStatsResult = {
  stats: ContentStats | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<unknown>
}
