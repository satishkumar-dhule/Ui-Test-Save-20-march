/**
 * DevPrep Content Hooks - Consolidated
 *
 * This file provides a unified API for content fetching.
 *
 * Architecture:
 * - useGeneratedContent: Primary hook for API content (most used)
 * - useMergeContent: Merges static + generated content
 * - useRealtimeContent: SQLite-based content (offline/real-time)
 *
 * @deprecated hooks (maintained for backward compatibility):
 * - useContent: Use useGeneratedContent instead
 * - useContentByChannel: Use useGeneratedContent with channelId filter
 * - useContentByType: Use useGeneratedContent with type filter
 */

import { useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { useQuery, useQueryClient, useInfiniteQuery, UseQueryOptions } from '@tanstack/react-query'
import {
  fetchAllContent,
  fetchContentStats,
  type ContentRecord,
  type ContentStats,
} from '@/services/contentApi'
import { initDatabase, getDatabase } from '@/services/dbClient'
import type { Question } from '@/data/questions'
import type { Flashcard } from '@/data/flashcards'
import type { ExamQuestion } from '@/data/exam'
import type { VoicePrompt } from '@/data/voicePractice'
import type { CodingChallenge } from '@/data/coding'
import type { ContentType as ContentTypeEnum, ContentStatus } from '@/stores/types'
import { useContentStore } from '@/stores/contentStore'
import { QUERY_KEYS } from '@/lib/queryClient'

// =============================================================================
// Types
// =============================================================================

export type ContentType = 'question' | 'flashcard' | 'exam' | 'voice' | 'coding'

export interface GeneratedContentMap {
  question?: Question[]
  flashcard?: Flashcard[]
  exam?: ExamQuestion[]
  voice?: VoicePrompt[]
  coding?: CodingChallenge[]
}

export interface UseGeneratedContentOptions {
  /** Enable/disable the query */
  enabled?: boolean
  /** Custom stale time in ms */
  staleTime?: number
  /** Custom GC time in ms */
  gcTime?: number
  /** Limit number of records */
  limit?: number
  /** Filter by channel ID */
  channelId?: string
  /** Filter by content type */
  type?: ContentType
  /** Filter by status */
  status?: string
  /** Enable prefetch on mount */
  prefetchOnMount?: boolean
}

export type UseOptimizedContentOptions = UseGeneratedContentOptions

export interface UseGeneratedContentResult {
  generated: GeneratedContentMap
  loading: boolean
  error: string | null
  refresh: () => void
  cancel: () => void
  parseErrors: Array<{ type: string; message: string }>
  isStale?: boolean
  dataUpdatedAt?: number
}

// Legacy types for backward compatibility
export interface ContentItem {
  id: string
  channelId: string
  contentType: ContentType
  data: unknown
  qualityScore: number
  createdAt: string
  updatedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface UseContentOptions {
  channelId?: string
  type?: ContentTypeEnum
  status?: ContentStatus
  minQuality?: number
  limit?: number
  enabled?: boolean
}

export interface UseContentResult {
  items: ContentItem[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<unknown>
}

export type UseContentByTypeResult = {
  items: ContentItem[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<unknown>
}

export type UseContentByChannelResult = {
  items: ContentItem[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<unknown>
}

// =============================================================================
// Constants
// =============================================================================

const CACHE_KEY = 'devprep:generated-content-v2'
const CACHE_TTL_MS = 2 * 60 * 1000
const DEFAULT_STALE_TIME = 30 * 1000
const DEFAULT_GC_TIME = 10 * 60 * 1000

// =============================================================================
// Utility Functions
// =============================================================================

function hasContent(data: GeneratedContentMap): boolean {
  return Object.values(data).some(arr => Array.isArray(arr) && arr.length > 0)
}

function loadCache(): GeneratedContentMap | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry: { ts: number; data: GeneratedContentMap } = JSON.parse(raw)
    if (hasContent(entry.data) && Date.now() - entry.ts < CACHE_TTL_MS) {
      return entry.data
    }
    localStorage.removeItem(CACHE_KEY)
  } catch {
    localStorage.removeItem(CACHE_KEY)
  }
  return null
}

function saveCache(data: GeneratedContentMap) {
  if (!hasContent(data)) return
  try {
    const entry = { ts: Date.now(), data }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    /* ignore cache write errors */
  }
}

const memoryCache = new Map<string, { ts: number; data: GeneratedContentMap }>()
const fetchPromiseRef: { current: Promise<void> | null } = { current: null }

function getUserFriendlyErrorMessage(errors: Array<{ type: string; message: string }>): string {
  if (errors.length === 0) return ''
  const uniqueTypes = [...new Set(errors.map(e => e.type))]
  if (errors.length > 5) {
    return `${errors.length} records failed to load. Content may be incomplete.`
  }
  if (uniqueTypes.length > 2) {
    return `Some ${uniqueTypes.length} content types failed to load.`
  }
  return `Unable to load ${uniqueTypes.join(', ')} content. Refresh to retry.`
}

// =============================================================================
// Content Parsing (Shared Logic)
// =============================================================================

function parseContentRecords(
  records: ContentRecord[],
  options?: { channelId?: string }
): {
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

    // Filter by channel if specified
    if (options?.channelId && channelId !== options.channelId) continue

    if (!grouped[type]) continue

    try {
      const data = record.data as Record<string, unknown>
      if (data && typeof data === 'object') {
        data.channelId = channelId
        const tags = Array.isArray(record.tags) ? record.tags : []
        data.tags = tags
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
      console.warn(`[DevPrep] Failed to process ${type} record:`, errorMsg, { recordId: record.id })
    }
  }

  return { data: grouped as unknown as GeneratedContentMap, parseErrors }
}

// =============================================================================
// Primary Hook: useGeneratedContent
// =============================================================================

/**
 * Primary hook for fetching generated content from the API.
 *
 * Features:
 * - Fetches all content types (questions, flashcards, exams, voice, coding)
 * - LocalStorage caching with TTL
 * - Memory caching
 * - Abort controller support for cancellation
 * - Parse error handling
 * - Graceful fallback on network errors
 *
 * @example
 * const { generated, loading, error, refresh } = useGeneratedContent()
 * const questions = generated.question ?? []
 */
export function useGeneratedContent(): UseGeneratedContentResult {
  const [generated, setGenerated] = useState<GeneratedContentMap>(() => {
    const cached = loadCache()
    if (cached) memoryCache.set(CACHE_KEY, { ts: Date.now(), data: cached })
    return cached ?? {}
  })
  const [loading, setLoading] = useState(() => !loadCache())
  const [error, setError] = useState<string | null>(null)
  const [parseErrors, setParseErrors] = useState<Array<{ type: string; message: string }>>([])

  const abortControllerRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    fetchPromiseRef.current = null
    setLoading(false)
  }, [])

  const fetchContent = useCallback(async (): Promise<void> => {
    if (fetchPromiseRef.current) return fetchPromiseRef.current

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)

    fetchPromiseRef.current = queryAllContentFromApi(abortControllerRef.current.signal)
      .then(({ data, parseErrors: errors }) => {
        setGenerated(data)
        saveCache(data)
        memoryCache.set(CACHE_KEY, { ts: Date.now(), data })
        setParseErrors(errors)
        if (errors.length > 0) {
          setError(getUserFriendlyErrorMessage(errors))
        }
      })
      .catch(e => {
        if (e instanceof RequestCancelledError) {
          return
        }
        const msg = e instanceof Error ? e.message : ''
        const isNetworkError =
          msg.includes('503') ||
          msg.includes('Failed to fetch') ||
          msg.includes('NetworkError') ||
          msg.includes('API server not available')
        if (!isNetworkError) {
          setError(msg || 'Failed to load content from server')
          console.warn('[DevPrep] Generated content unavailable from API:', e)
        }
      })
      .finally(() => {
        setLoading(false)
        fetchPromiseRef.current = null
      })

    return fetchPromiseRef.current
  }, [])

  useEffect(() => {
    const cached = memoryCache.get(CACHE_KEY)
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return
    fetchContent()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [fetchContent])

  const refresh = useCallback(() => {
    localStorage.removeItem(CACHE_KEY)
    memoryCache.delete(CACHE_KEY)
    fetchPromiseRef.current = null
    fetchContent()
  }, [fetchContent])

  return { generated, loading, error, refresh, cancel, parseErrors }
}

// Request cancelled error for abort controller
class RequestCancelledError extends Error {
  constructor() {
    super('Request cancelled')
    this.name = 'RequestCancelledError'
  }
}

async function queryAllContentFromApi(signal?: AbortSignal): Promise<{
  data: GeneratedContentMap
  parseErrors: Array<{ type: string; message: string }>
}> {
  const records = await fetchAllContent({
    status: 'published,approved',
    limit: 1000,
    signal,
  })

  return parseContentRecords(records)
}

// =============================================================================
// React Query Variant: useOptimizedContent
// =============================================================================

/**
 * React Query optimized version of useGeneratedContent.
 * Use this when you need React Query's built-in caching, retry logic, etc.
 *
 * @example
 * const { generated, loading, error, refresh } = useOptimizedContent()
 */
export function useOptimizedContent(options: UseGeneratedContentOptions = {}) {
  const {
    staleTime = DEFAULT_STALE_TIME,
    gcTime = DEFAULT_GC_TIME,
    enabled = true,
    prefetchOnMount = true,
    channelId,
    type,
    status = 'published,approved',
    limit = 1000,
  } = options

  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['optimized-content', { channelId, type, status, limit }],
    queryFn: async () => {
      const records = await fetchAllContent({
        channelId,
        contentType: type,
        status,
        limit,
      })
      return parseContentRecords(records, { channelId })
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
    queryClient.invalidateQueries({ queryKey: ['optimized-content'] })
  }, [queryClient])

  const prefetch = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['optimized-content', { channelId, type, status, limit }],
      queryFn: async () => {
        const records = await fetchAllContent({
          channelId,
          contentType: type,
          status,
          limit,
        })
        return parseContentRecords(records, { channelId })
      },
      staleTime,
    })
  }, [queryClient, channelId, type, status, limit, staleTime])

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

// =============================================================================
// Infinite Query Variant
// =============================================================================

/**
 * Infinite query for paginated content loading.
 */
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

// =============================================================================
// Backward Compatibility: useContent (Legacy)
// =============================================================================

function mapStatus(status: string | number): ContentItem['status'] {
  const s = String(status)
  if (s === 'published' || s === 'approved') return 'approved'
  if (s === 'rejected') return 'rejected'
  return 'pending'
}

function transformRecord(record: ContentRecord): ContentItem {
  return {
    id: record.id,
    channelId: record.channel_id,
    contentType: record.content_type as ContentType,
    data: record.data,
    qualityScore: record.quality_score,
    createdAt: String(record.created_at),
    updatedAt: String(record.updated_at),
    status: mapStatus(record.status),
  }
}

/**
 * @deprecated Use useGeneratedContent instead. This hook is maintained
 * for backward compatibility with existing components.
 */
export function useContent(options: UseContentOptions = {}): UseContentResult {
  const { channelId, type, status, minQuality, limit, enabled = true } = options

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
      return records.map(transformRecord)
    },
    enabled,
    staleTime: DEFAULT_STALE_TIME,
  })

  const items = data ?? []

  return {
    items: limit ? items.slice(0, limit) : items,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  }
}

/**
 * @deprecated Use useGeneratedContent with channelId filter instead.
 */
export function useContentByChannel(channelId: string | null, enabled = true): UseContentResult {
  return useContent({ channelId: channelId ?? undefined, enabled: enabled && !!channelId })
}

/**
 * @deprecated Use useGeneratedContent with type filter instead.
 */
export function useContentByType(type: ContentTypeEnum | null, enabled = true): UseContentResult {
  return useContent({ type: type ?? undefined, enabled: enabled && !!type })
}

// =============================================================================
// Content Merge Hook (Unique Purpose)
// =============================================================================

/**
 * Content merger that combines static and generated (API) content.
 *
 * Strategy:
 * - Generated (API) content takes priority for items with the same ID.
 * - Static content is included for any items whose IDs don't appear in generated content.
 * - This ensures channels without API content still show their static fallback,
 *   while channels with API content get the richer generated data.
 *
 * @example
 * const allQuestions = useMergeContent(staticQuestions, generatedContent?.question)
 */
export function useMergeContent<T extends { id: string }>(
  staticContent: T[],
  generatedContent: T[] | undefined
): T[] {
  return useMemo(() => {
    // If no generated content at all, return static
    if (!generatedContent || generatedContent.length === 0) {
      return staticContent
    }
    // If no static content, return generated
    if (staticContent.length === 0) {
      return generatedContent
    }
    // Merge: generated items first, then static items not already present
    const genIds = new Set(generatedContent.map(item => item.id))
    const uniqueStatic = staticContent.filter(item => !genIds.has(item.id))
    return [...generatedContent, ...uniqueStatic]
  }, [staticContent, generatedContent])
}

// =============================================================================
// Realtime/SQLite Content Hook (Different Data Source)
// =============================================================================

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

async function queryRealtimeContent(params: {
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

async function queryRealtimeStats(): Promise<ContentStats> {
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

/**
 * Hook for fetching content from local SQLite database.
 * Use this for offline support or when you need real-time local data.
 *
 * @example
 * const { content, isLoading, refetch } = useRealtimeContent({ channelId: 'devops' })
 */
export function useRealtimeContent(
  options: UseRealtimeContentOptions = {}
): UseRealtimeContentResult {
  const { channelId, contentType, queryOptions = {}, enabled = true } = options
  const queryClient = useQueryClient()
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)

  const queryKey = ['realtime-content', channelId, contentType]

  const queryFn = useCallback(async (): Promise<GeneratedContentMap> => {
    return queryRealtimeContent({ channelId, contentType })
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
    queryKey: ['realtime-stats'],
    queryFn: queryRealtimeStats,
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

// =============================================================================
// Export all types and utilities
// =============================================================================

export { transformRecord, mapStatus }
