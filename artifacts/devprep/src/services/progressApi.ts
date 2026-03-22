// Simple logger for progress API
const logger = {
  error: (message: string, data?: Record<string, unknown>) => {
    if (import.meta.env.DEV) {
      console.error(`[ProgressAPI] ${message}`, data || '')
    }
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    if (import.meta.env.DEV) {
      console.warn(`[ProgressAPI] ${message}`, data || '')
    }
  },
}

const PROGRESS_API_BASE = '/api/progress'

export interface ProgressData {
  channelId: string
  flashcards: Record<string, string>
  coding: Record<string, string>
  exams: Record<string, { score: number; total: number; passed: boolean; date: string }>
  voice: Record<string, number>
  qa: Record<string, { answered: boolean; correct: boolean }>
}

const LS_PROGRESS_KEY = 'devprep:progress'

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 5000,
} as const

function lsGet(): ProgressData {
  try {
    const raw = localStorage.getItem(LS_PROGRESS_KEY)
    if (raw === null) return getEmptyProgress()
    return JSON.parse(raw) as ProgressData
  } catch {
    return getEmptyProgress()
  }
}

function lsSet(data: ProgressData) {
  try {
    localStorage.setItem(LS_PROGRESS_KEY, JSON.stringify(data))
  } catch (error) {
    logger.error('Failed to save progress to localStorage', { error })
  }
}

function getEmptyProgress(): ProgressData {
  return {
    channelId: '',
    flashcards: {},
    coding: {},
    exams: {},
    voice: {},
    qa: {},
  }
}

/**
 * Calculate exponential backoff delay with jitter
 */
function calculateBackoffDelay(attempt: number): number {
  const exponentialDelay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt)
  const jitter = Math.random() * 0.3 * exponentialDelay
  return Math.min(exponentialDelay + jitter, RETRY_CONFIG.maxDelayMs)
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch with retry logic for network failures
 */
async function fetchWithRetry(url: string, options?: RequestInit, attempt = 0): Promise<Response> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    return response
  } catch (networkError) {
    if (attempt < RETRY_CONFIG.maxRetries - 1) {
      const delay = calculateBackoffDelay(attempt)
      logger.warn(`Network request failed, retrying in ${delay}ms`, {
        attempt: attempt + 1,
        maxRetries: RETRY_CONFIG.maxRetries,
        url,
        error: networkError instanceof Error ? networkError.message : 'Unknown error',
      })
      await sleep(delay)
      return fetchWithRetry(url, options, attempt + 1)
    }

    logger.error('Network request failed after all retries', {
      url,
      attempts: RETRY_CONFIG.maxRetries,
      error: networkError instanceof Error ? networkError.message : 'Unknown error',
    })
    throw networkError
  }
}

async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  try {
    const response = await fetchWithRetry(`${PROGRESS_API_BASE}${endpoint}`, options)
    return response
  } catch {
    // Throw a typed error that can be handled by callers
    throw new Error('Network error')
  }
}

export const progressApi = {
  async load(channelId: string): Promise<ProgressData> {
    try {
      const response = await apiFetch(`/${channelId}`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      logger.warn('Failed to load progress from API, using localStorage fallback', {
        channelId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
    return lsGet()
  },

  async saveFlashcard(channelId: string, cardId: string, status: string): Promise<void> {
    const progress = lsGet()
    progress.channelId = channelId
    progress.flashcards[cardId] = status
    lsSet(progress)
    try {
      await apiFetch('/flashcard', {
        method: 'POST',
        body: JSON.stringify({ channelId, cardId, status }),
      })
    } catch (error) {
      logger.warn('Failed to sync flashcard progress to server', {
        channelId,
        cardId,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },

  async saveCoding(channelId: string, challengeId: string, status: string): Promise<void> {
    const progress = lsGet()
    progress.channelId = channelId
    progress.coding[challengeId] = status
    lsSet(progress)
    try {
      await apiFetch('/coding', {
        method: 'POST',
        body: JSON.stringify({ channelId, challengeId, status }),
      })
    } catch (error) {
      logger.warn('Failed to sync coding progress to server', {
        channelId,
        challengeId,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },

  async saveExam(
    channelId: string,
    examId: string,
    result: { score: number; total: number; passed: boolean }
  ): Promise<void> {
    const progress = lsGet()
    progress.channelId = channelId
    progress.exams[examId] = { ...result, date: new Date().toISOString() }
    lsSet(progress)
    try {
      await apiFetch('/exam', {
        method: 'POST',
        body: JSON.stringify({ channelId, examId, ...result }),
      })
    } catch (error) {
      logger.warn('Failed to sync exam progress to server', {
        channelId,
        examId,
        result,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },

  async saveVoice(channelId: string, promptId: string, rating: number): Promise<void> {
    const progress = lsGet()
    progress.channelId = channelId
    progress.voice[promptId] = rating
    lsSet(progress)
    try {
      await apiFetch('/voice', {
        method: 'POST',
        body: JSON.stringify({ channelId, promptId, rating }),
      })
    } catch (error) {
      logger.warn('Failed to sync voice practice progress to server', {
        channelId,
        promptId,
        rating,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },

  async saveQA(
    channelId: string,
    questionId: string,
    answered: boolean,
    correct: boolean
  ): Promise<void> {
    const progress = lsGet()
    progress.channelId = channelId
    progress.qa[questionId] = { answered, correct }
    lsSet(progress)
    try {
      await apiFetch('/qa', {
        method: 'POST',
        body: JSON.stringify({ channelId, questionId, answered, correct }),
      })
    } catch (error) {
      logger.warn('Failed to sync QA progress to server', {
        channelId,
        questionId,
        answered,
        correct,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },
}
