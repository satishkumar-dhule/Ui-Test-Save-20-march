import { useCallback, useState } from 'react'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import {
  fetchAllContent as dbFetchAllContent,
  fetchContentByType as dbFetchContentByType,
  fetchContentStats as dbFetchContentStats,
  fetchChannelContent as dbFetchChannelContent,
} from '@/services/dbApi'
import type { Question } from '@/data/questions'
import type { Flashcard } from '@/data/flashcards'
import type { ExamQuestion } from '@/data/exam'
import type { VoicePrompt } from '@/data/voicePractice'
import type { CodingChallenge } from '@/data/coding'
import type { ContentStats } from '@/services/contentApi'

export interface GeneratedContentMap {
  question?: Question[]
  flashcard?: Flashcard[]
  exam?: ExamQuestion[]
  voice?: VoicePrompt[]
  coding?: CodingChallenge[]
}

export type ContentType = 'question' | 'flashcard' | 'exam' | 'voice' | 'coding'

interface UseRealtimeContentOptions {
  channelId?: string
  contentType?: ContentType
  queryOptions?: Omit<UseQueryOptions<GeneratedContentMap>, 'queryKey' | 'queryFn'>
  enabled?: boolean
}

interface UseRealtimeContentResult {
  content: GeneratedContentMap
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => void
  stats: ContentStats | null
  lastUpdate: number | null
}

export function useRealtimeContent(
  options: UseRealtimeContentOptions = {}
): UseRealtimeContentResult {
  const { channelId, contentType, queryOptions = {}, enabled = true } = options
  const queryClient = useQueryClient()
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)

  const queryKey = ['generated-content', channelId, contentType]

  const queryFn = useCallback(async (): Promise<GeneratedContentMap> => {
    const allContent = await dbFetchAllContent({
      channelId,
      contentType,
      status: undefined,
    })

    const result: GeneratedContentMap = {}
    const grouped: Record<string, unknown[]> = {
      question: [],
      flashcard: [],
      exam: [],
      voice: [],
      coding: [],
    }

    for (const record of allContent) {
      const type = record.content_type as ContentType
      if (grouped[type]) {
        grouped[type].push(record.data)
      }
    }

    if (grouped.question.length) result.question = grouped.question as Question[]
    if (grouped.flashcard.length) result.flashcard = grouped.flashcard as Flashcard[]
    if (grouped.exam.length) result.exam = grouped.exam as ExamQuestion[]
    if (grouped.voice.length) result.voice = grouped.voice as VoicePrompt[]
    if (grouped.coding.length) result.coding = grouped.coding as CodingChallenge[]

    return result
  }, [channelId, contentType])

  const query = useQuery({
    queryKey,
    queryFn,
    staleTime: 30000,
    refetchInterval: 60000,
    ...queryOptions,
    enabled,
  })

  const statsQuery = useQuery({
    queryKey: ['content-stats'],
    queryFn: dbFetchContentStats,
    staleTime: 60000,
    enabled,
  })

  const refetch = useCallback(() => {
    setLastUpdate(Date.now())
    queryClient.invalidateQueries({ queryKey })
  }, [queryClient, queryKey])

  return {
    content: query.data || {},
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch,
    stats: statsQuery.data || null,
    lastUpdate,
  }
}

interface UseRealtimeQuestionsOptions {
  channelId?: string
  limit?: number
  enabled?: boolean
}

export function useRealtimeQuestions(options: UseRealtimeQuestionsOptions = {}): {
  questions: Question[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const { channelId, limit = 50, enabled = true } = options
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['realtime-questions', channelId, limit],
    queryFn: () =>
      dbFetchContentByType<Question>('question', {
        channelId,
        limit,
        status: undefined,
      }),
    staleTime: 30000,
    enabled,
  })

  return {
    questions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: () =>
      queryClient.invalidateQueries({ queryKey: ['realtime-questions', channelId, limit] }),
  }
}

interface UseContentTypeOptions<T> {
  type: ContentType
  channelId?: string
  limit?: number
  enabled?: boolean
}

export function useContentType<T>(options: UseContentTypeOptions<T>): {
  data: T[]
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => void
} {
  const { type, channelId, limit = 50, enabled = true } = options
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [`realtime-${type}`, channelId, limit],
    queryFn: () =>
      dbFetchContentByType<T>(type, {
        channelId,
        limit,
        status: undefined,
      }),
    staleTime: 30000,
    enabled,
  })

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: () =>
      queryClient.invalidateQueries({ queryKey: [`realtime-${type}`, channelId, limit] }),
  }
}

export function useRealtimeStats(): {
  stats: ContentStats | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['content-stats'],
    queryFn: dbFetchContentStats,
    staleTime: 60000,
    refetchInterval: 30000,
  })

  return {
    stats: query.data || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['content-stats'] }),
  }
}
