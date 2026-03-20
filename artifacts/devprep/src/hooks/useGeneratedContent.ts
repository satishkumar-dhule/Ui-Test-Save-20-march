import { useState, useEffect, useCallback } from 'react'
import type { Question } from '@/data/questions'
import type { Flashcard } from '@/data/flashcards'
import type { ExamQuestion } from '@/data/exam'
import type { VoicePrompt } from '@/data/voicePractice'
import type { CodingChallenge } from '@/data/coding'
import { fetchAllContent } from '@/services/dbApi'

export interface GeneratedContentMap {
  question?: Question[]
  flashcard?: Flashcard[]
  exam?: ExamQuestion[]
  voice?: VoicePrompt[]
  coding?: CodingChallenge[]
}

const CACHE_KEY = 'devprep:generated-content'
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
  } catch {}
}

interface UseGeneratedContentResult {
  generated: GeneratedContentMap
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useGeneratedContent(): UseGeneratedContentResult {
  const [generated, setGenerated] = useState<GeneratedContentMap>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const records = await fetchAllContent({})
      const grouped: Record<string, unknown[]> = {
        question: [],
        flashcard: [],
        exam: [],
        voice: [],
        coding: [],
      }

      for (const record of records) {
        const type = record.content_type
        if (grouped[type] && record.data !== undefined && record.data !== null) {
          grouped[type].push(record.data)
        }
      }

      const transformed = grouped as unknown as GeneratedContentMap
      setGenerated(transformed)
      saveCache(transformed)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      console.warn('[DevPrep] Generated content unavailable:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const cached = loadCache()
    if (cached) {
      setGenerated(cached)
      return
    }

    fetchContent()
  }, [fetchContent])

  const refresh = useCallback(() => {
    localStorage.removeItem(CACHE_KEY)
    fetchContent()
  }, [fetchContent])

  return { generated, loading, error, refresh }
}
