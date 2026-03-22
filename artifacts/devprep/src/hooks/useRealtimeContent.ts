import { useCallback, useState } from 'react'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { initDatabase, getDatabase } from '@/services/dbClient'
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

async function queryContent(params: {
  channelId?: string
  contentType?: ContentType
}): Promise<GeneratedContentMap> {
  await initDatabase()
  const db = getDatabase()
  if (!db) throw new Error('Database not initialized')

  const conditions: string[] = [`status IN ('published', 'approved')`]
  if (params.channelId) {
    conditions.push(`channel_id = '${params.channelId.replace(/'/g, "''")}'`)
  }
  if (params.contentType) {
    conditions.push(`content_type = '${params.contentType.replace(/'/g, "''")}'`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = db.exec(
    `SELECT content_type, data FROM generated_content ${whereClause} ORDER BY created_at DESC`
  )

  const grouped: Record<string, unknown[]> = {
    question: [],
    flashcard: [],
    exam: [],
    voice: [],
    coding: [],
  }

  if (!result[0]) return grouped as unknown as GeneratedContentMap

  for (const row of result[0].values) {
    const [type, dataStr] = row
    if (grouped[type as string] && typeof dataStr === 'string') {
      try {
        grouped[type as string].push(JSON.parse(dataStr))
      } catch {
        console.warn(`[DevPrep] Failed to parse JSON for ${type}`)
      }
    }
  }

  return grouped as unknown as GeneratedContentMap
}

async function queryContentStats(): Promise<ContentStats> {
  await initDatabase()
  const db = getDatabase()
  if (!db) throw new Error('Database not initialized')

  const result = db.exec(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN content_type = 'question' THEN 1 ELSE 0 END) as question,
      SUM(CASE WHEN content_type = 'flashcard' THEN 1 ELSE 0 END) as flashcard,
      SUM(CASE WHEN content_type = 'exam' THEN 1 ELSE 0 END) as exam,
      SUM(CASE WHEN content_type = 'voice' THEN 1 ELSE 0 END) as voice,
      SUM(CASE WHEN content_type = 'coding' THEN 1 ELSE 0 END) as coding
    FROM generated_content
    WHERE status IN ('published', 'approved')
  `)

  if (!result[0]?.values[0]) {
    return { total: 0, question: 0, flashcard: 0, exam: 0, voice: 0, coding: 0 }
  }

  const [total, question, flashcard, exam, voice, coding] = result[0].values[0]
  return {
    total: (total as number) || 0,
    question: (question as number) || 0,
    flashcard: (flashcard as number) || 0,
    exam: (exam as number) || 0,
    voice: (voice as number) || 0,
    coding: (coding as number) || 0,
  }
}

async function queryContentByType<T>(
  type: ContentType,
  params: {
    channelId?: string
    limit?: number
  }
): Promise<T[]> {
  await initDatabase()
  const db = getDatabase()
  if (!db) throw new Error('Database not initialized')

  const conditions: string[] = [`status IN ('published', 'approved')`, `content_type = '${type}'`]
  if (params.channelId) {
    conditions.push(`channel_id = '${params.channelId.replace(/'/g, "''")}'`)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limitClause = params.limit ? `LIMIT ${params.limit}` : ''

  const result = db.exec(
    `SELECT data FROM generated_content ${whereClause} ORDER BY created_at DESC ${limitClause}`
  )

  const items: T[] = []
  if (result[0]) {
    for (const row of result[0].values) {
      const [dataStr] = row
      if (typeof dataStr === 'string') {
        try {
          items.push(JSON.parse(dataStr) as T)
        } catch {
          console.warn(`[DevPrep] Failed to parse JSON for ${type}`)
        }
      }
    }
  }
  return items
}

export function useRealtimeContent(
  options: UseRealtimeContentOptions = {}
): UseRealtimeContentResult {
  const { channelId, contentType, queryOptions = {}, enabled = true } = options
  const queryClient = useQueryClient()
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)

  const queryKey = ['generated-content', channelId, contentType]

  const queryFn = useCallback(async (): Promise<GeneratedContentMap> => {
    return queryContent({ channelId, contentType })
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
    queryFn: queryContentStats,
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
      queryContentByType<Question>('question', {
        channelId,
        limit,
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

interface UseContentTypeOptions {
  type: ContentType
  channelId?: string
  limit?: number
  enabled?: boolean
}

export function useContentType<T>(options: UseContentTypeOptions): {
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
      queryContentByType<T>(type, {
        channelId,
        limit,
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
    queryFn: queryContentStats,
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
