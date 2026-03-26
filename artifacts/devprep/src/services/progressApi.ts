/**
 * Progress API — localStorage is the source of truth.
 * All reads are synchronous from localStorage. API sync is fire-and-forget (one attempt, silent).
 */

const LS_PROGRESS_KEY = 'devprep:progress'
const API_BASE = '/api/progress'

export interface ProgressData {
  channelId: string
  flashcards: Record<string, string>
  coding: Record<string, string>
  exams: Record<string, { score: number; total: number; passed: boolean; date: string }>
  voice: Record<string, number>
  qa: Record<string, { answered: boolean; correct: boolean }>
}

function getEmpty(): ProgressData {
  return { channelId: '', flashcards: {}, coding: {}, exams: {}, voice: {}, qa: {} }
}

function lsGet(): ProgressData {
  try {
    const raw = localStorage.getItem(LS_PROGRESS_KEY)
    if (!raw) return getEmpty()
    const parsed = JSON.parse(raw) as Partial<ProgressData>
    return {
      channelId: parsed.channelId ?? '',
      flashcards: parsed.flashcards ?? {},
      coding: parsed.coding ?? {},
      exams: parsed.exams ?? {},
      voice: parsed.voice ?? {},
      qa: parsed.qa ?? {},
    }
  } catch {
    return getEmpty()
  }
}

function lsSet(data: ProgressData): void {
  try {
    localStorage.setItem(LS_PROGRESS_KEY, JSON.stringify(data))
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/** Fire-and-forget: one attempt, no retries, no logging noise */
function syncToApi(endpoint: string, body: unknown): void {
  fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {
    // API not running — expected in this environment, ignore silently
  })
}

export const progressApi = {
  /** Load progress — always from localStorage (instant, synchronous under the hood). */
  async load(_channelId: string): Promise<ProgressData> {
    return lsGet()
  },

  /** Load all progress synchronously (no async needed). */
  loadSync(): ProgressData {
    return lsGet()
  },

  saveFlashcard(channelId: string, cardId: string, status: string): void {
    const data = lsGet()
    data.channelId = channelId
    data.flashcards[cardId] = status
    lsSet(data)
    syncToApi('/flashcard', { channelId, cardId, status })
  },

  saveCoding(channelId: string, challengeId: string, status: string): void {
    const data = lsGet()
    data.channelId = channelId
    data.coding[challengeId] = status
    lsSet(data)
    syncToApi('/coding', { channelId, challengeId, status })
  },

  saveExam(
    channelId: string,
    examId: string,
    result: { score: number; total: number; passed: boolean }
  ): void {
    const data = lsGet()
    data.channelId = channelId
    const existing = data.exams[examId]
    const pct = result.total > 0 ? result.score / result.total : 0
    const existingPct = existing ? existing.score / existing.total : -1
    if (pct >= existingPct) {
      data.exams[examId] = { ...result, date: new Date().toISOString() }
    }
    lsSet(data)
    syncToApi('/exam', { channelId, examId, ...result })
  },

  saveVoice(channelId: string, promptId: string, rating: number): void {
    const data = lsGet()
    data.channelId = channelId
    data.voice[promptId] = rating
    lsSet(data)
    syncToApi('/voice', { channelId, promptId, rating })
  },

  saveQA(channelId: string, questionId: string, answered: boolean, correct: boolean): void {
    const data = lsGet()
    data.channelId = channelId
    data.qa[questionId] = { answered, correct }
    lsSet(data)
    syncToApi('/qa', { channelId, questionId, answered, correct })
  },
}
