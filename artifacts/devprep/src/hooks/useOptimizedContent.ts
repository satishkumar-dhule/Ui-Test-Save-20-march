import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { fetchAllContent, type ContentRecord } from '@/services/contentApi'
import type { Question } from '@/data/questions'
import type { Flashcard } from '@/data/flashcards'
import type { ExamQuestion } from '@/data/exam'
import type { VoicePrompt } from '@/data/voicePractice'
import type { CodingChallenge } from '@/data/coding'

export interface GeneratedContentMap {
  question?: Question[]
  flashcard?: Flashcard[]
  exam?: ExamQuestion[]
  voice?: VoicePrompt[]
  coding?: CodingChallenge[]
}

export interface UseOptimizedContentOptions {
  staleTime?: number
  gcTime?: number
  enabled?: boolean
  prefetchOnMount?: boolean
}

const DEFAULT_STALE_TIME = 2 * 60 * 1000
const DEFAULT_GC_TIME = 10 * 60 * 1000

function parseContentRecords(records: ContentRecord[]): {
  data: GeneratedContentMap
  parseErrors: Array<{ type: string; message: string }>
} {
  const grouped: Record<string, unknown[]> = {
    question: [],
    flashcard: [],
    exam: [],
    voice: [],
    coding: [],
  }

  const parseErrors: Array<{ type: string; message: string }> = []

  for (const record of records) {
    const type = record.content_type as string
    const channelId = record.channel_id as string

    if (!grouped[type]) continue

    try {
      const data = record.data as Record<string, unknown>
      if (data && typeof data === 'object') {
        data.channelId = channelId
        if (type === 'question') {
          if (!data.id) {
            data.id = `gen-${channelId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
          }
          if (!data.difficulty) data.difficulty = 'intermediate'
          if (!Array.isArray(data.sections)) data.sections = []
          if (!data.tags) data.tags = []
          if (!data.title) continue
        }
        grouped[type].push(data)
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Invalid data'
      parseErrors.push({ type, message: errorMsg })
      console.warn(`[DevPrep] Failed to process ${type} record:`, errorMsg, {
        recordId: record.id,
      })
    }
  }

  return { data: grouped as unknown as GeneratedContentMap, parseErrors }
}

export function useOptimizedContent(options: UseOptimizedContentOptions = {}) {
  const {
    staleTime = DEFAULT_STALE_TIME,
    gcTime = DEFAULT_GC_TIME,
    enabled = true,
    prefetchOnMount = true,
  } = options

  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['generated-content'],
    queryFn: async () => {
      const records = await fetchAllContent({
        status: 'published,approved',
        limit: 1000,
      })
      return parseContentRecords(records)
    },
    staleTime,
    gcTime,
    enabled,
    refetchOnWindowFocus: false,
    refetchOnMount: prefetchOnMount ? 'always' : false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  })

  const data = useMemo(() => query.data?.data ?? {}, [query.data])

  const parseErrors = useMemo(() => query.data?.parseErrors ?? [], [query.data?.parseErrors])

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['generated-content'] })
  }, [queryClient])

  const prefetch = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['generated-content'],
      queryFn: async () => {
        const records = await fetchAllContent({
          status: 'published,approved',
          limit: 1000,
        })
        return parseContentRecords(records)
      },
      staleTime,
    })
  }, [queryClient, staleTime])

  return {
    generated: data,
    loading: query.isLoading,
    error:
      query.error instanceof Error ? query.error.message : query.error ? 'Unknown error' : null,
    refresh,
    prefetch,
    parseErrors,
    isStale: query.isStale,
    dataUpdatedAt: query.dataUpdatedAt,
  }
}

export function useInfiniteContent(pageSize = 100) {
  return useInfiniteQuery({
    queryKey: ['generated-content-infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const records = await fetchAllContent({
        status: 'published,approved',
        limit: pageSize,
        offset: pageParam,
      })
      return parseContentRecords(records)
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalFetched = allPages.reduce(
        (acc, page) => {
          acc.question += page.data.question?.length ?? 0
          acc.flashcard += page.data.flashcard?.length ?? 0
          acc.exam += page.data.exam?.length ?? 0
          acc.voice += page.data.voice?.length ?? 0
          acc.coding += page.data.coding?.length ?? 0
          return acc
        },
        { question: 0, flashcard: 0, exam: 0, voice: 0, coding: 0 }
      )
      const total =
        totalFetched.question +
        totalFetched.flashcard +
        totalFetched.exam +
        totalFetched.voice +
        totalFetched.coding
      return total >= 1000 ? undefined : total
    },
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
    initialPageParam: 0,
  })
}

export function useContentByType<T extends keyof GeneratedContentMap>(type: T) {
  const { generated, loading, error, refresh, parseErrors } = useOptimizedContent()

  return {
    items: generated[type] ?? [],
    loading,
    error,
    refresh,
    parseErrors,
  }
}
