import { useState, useEffect, useCallback, useRef } from 'react'
import type { Question } from '@/data/questions'
import type { Flashcard } from '@/data/flashcards'
import type { ExamQuestion } from '@/data/exam'
import type { VoicePrompt } from '@/data/voicePractice'
import type { CodingChallenge } from '@/data/coding'
import { fetchAllContent, type ContentRecord, RequestCancelledError } from '@/services/contentApi'

export interface GeneratedContentMap {
  question?: Question[]
  flashcard?: Flashcard[]
  exam?: ExamQuestion[]
  voice?: VoicePrompt[]
  coding?: CodingChallenge[]
}

const CACHE_KEY = 'devprep:generated-content-v2'
const CACHE_TTL_MS = 2 * 60 * 1000

type CacheEntry = { ts: number; data: GeneratedContentMap }

function hasContent(data: GeneratedContentMap): boolean {
  return Object.values(data).some(arr => Array.isArray(arr) && arr.length > 0)
}

function loadCache(): GeneratedContentMap | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
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
    const entry: CacheEntry = { ts: Date.now(), data }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    /* ignore cache write errors */
  }
}

const memoryCache = new Map<string, { ts: number; data: GeneratedContentMap }>()
let fetchPromise: Promise<void> | null = null

interface UseGeneratedContentResult {
  generated: GeneratedContentMap
  loading: boolean
  error: string | null
  refresh: () => void
  cancel: () => void
  parseErrors?: Array<{ type: string; message: string }>
}

interface QueryResult {
  data: GeneratedContentMap
  parseErrors: Array<{ type: string; message: string }>
}

async function queryAllContentFromApi(signal?: AbortSignal): Promise<QueryResult> {
  const records = await fetchAllContent({
    status: 'published,approved',
    limit: 1000,
    signal,
  })

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
    if (fetchPromise) {
      fetchPromise = null
    }
    setLoading(false)
  }, [])

  const fetchContent = useCallback(async (): Promise<void> => {
    if (fetchPromise) return fetchPromise

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)

    fetchPromise = queryAllContentFromApi(abortControllerRef.current.signal)
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
        // API server is optional — silently fall back to static content
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
        fetchPromise = null
      })

    return fetchPromise
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
    fetchPromise = null
    fetchContent()
  }, [fetchContent])

  return { generated, loading, error, refresh, cancel, parseErrors }
}
