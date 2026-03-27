/**
 * Query String Backdoor System
 *
 * Provides URL-based shortcuts for testing and development.
 * These backdoors allow testers to jump directly to specific pages or states.
 *
 * IMPORTANT: These are TESTING-ONLY features!
 * They are only active in development mode.
 *
 * @author DevPrep Team
 * @version 1.0.0
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useContentStore } from '@/stores/contentStore'
import { isValidTheme, type ThemeName } from '@/hooks/useNewTheme'

// ============================================================================
// Types
// ============================================================================

export interface BackdoorState {
  active: boolean
  page: string | null
  channel: string | null
  content: string | null
  tab: string | null
  generate: boolean
  theme: ThemeName | null
  skipOnboarding: boolean
}

export interface BackdoorLog {
  timestamp: number
  action: string
  value: string | boolean
}

interface QueryBackdoorConfig {
  /** Clear query params after processing (default: true) */
  clearAfterProcessing?: boolean
  /** Log backdoor activations to console (default: true in dev) */
  logToConsole?: boolean
  /** Show visual indicator (default: true in dev) */
  showIndicator?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const VALID_PAGES = ['dashboard', 'content', 'exam', 'coding', 'voice', 'onboarding'] as const
const VALID_TABS = ['questions', 'cards', 'exams'] as const
const VALID_CONTENT_TYPES = ['question', 'flashcard', 'exam'] as const
const VALID_THEMES: ThemeName[] = ['light', 'dark', 'high-contrast']

type ValidPage = (typeof VALID_PAGES)[number]
type ValidTab = (typeof VALID_TABS)[number]
type ValidContentType = (typeof VALID_CONTENT_TYPES)[number]

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Parse URL search params and extract backdoor values
 */
export function parseBackdoorParams(searchParams: URLSearchParams): BackdoorState {
  const page = searchParams.get('page') as ValidPage | null
  const channel = searchParams.get('channel')
  const content = searchParams.get('content') as ValidContentType | null
  const tab = searchParams.get('tab') as ValidTab | null
  const generate = searchParams.get('generate') === 'true'
  const themeParam = searchParams.get('theme') as ThemeName | null
  const skipOnboarding = searchParams.get('skipOnboarding') === 'true'

  // Validate theme
  const theme = themeParam && isValidTheme(themeParam) ? themeParam : null

  return {
    active: !!(page || channel || content || tab || generate || theme || skipOnboarding),
    page: page && VALID_PAGES.includes(page) ? page : null,
    channel,
    content: content && VALID_CONTENT_TYPES.includes(content) ? content : null,
    tab: tab && VALID_TABS.includes(tab) ? tab : null,
    generate,
    theme,
    skipOnboarding,
  }
}

/**
 * Clear query params from URL
 */
export function clearBackdoorParams(): void {
  if (typeof window === 'undefined') return

  // Replace URL without triggering navigation
  const url = new URL(window.location.href)
  const paramsToRemove = [
    'page',
    'channel',
    'content',
    'tab',
    'generate',
    'theme',
    'skipOnboarding',
  ]

  paramsToRemove.forEach(param => url.searchParams.delete(param))

  window.history.replaceState({}, '', url.toString())
}

/**
 * Create a backdoor URL
 */
export function createBackdoorUrl(params: Partial<BackdoorState>): string {
  if (typeof window === 'undefined') return ''

  const url = new URL(window.location.origin + window.location.pathname)

  if (params.page) url.searchParams.set('page', params.page)
  if (params.channel) url.searchParams.set('channel', params.channel)
  if (params.content) url.searchParams.set('content', params.content)
  if (params.tab) url.searchParams.set('tab', params.tab)
  if (params.generate) url.searchParams.set('generate', 'true')
  if (params.theme) url.searchParams.set('theme', params.theme)
  if (params.skipOnboarding) url.searchParams.set('skipOnboarding', 'true')

  return url.toString()
}

// ============================================================================
// Navigation Functions
// ============================================================================

const PAGE_TO_SECTION: Record<string, string> = {
  dashboard: 'qa',
  content: 'qa',
  exam: 'exam',
  coding: 'coding',
  voice: 'voice',
}

const TAB_TO_SECTION: Record<string, string> = {
  questions: 'qa',
  cards: 'flashcards',
  exams: 'exam',
}

const CONTENT_TO_SECTION: Record<string, string> = {
  question: 'qa',
  flashcard: 'flashcards',
  exam: 'exam',
}

/**
 * Apply backdoor state to the application
 */
export function applyBackdoorState(state: BackdoorState): void {
  const store = useContentStore.getState()

  // Handle page navigation
  if (state.page) {
    const section = PAGE_TO_SECTION[state.page]
    if (section) {
      store.setSection(section as 'qa' | 'flashcards' | 'exam' | 'voice' | 'coding' | 'stats')
    }

    // Special handling for onboarding
    if (state.page === 'onboarding') {
      store.setShowOnboarding(true)
    }
  }

  // Handle tab selection (this would require tab state if different from section)
  if (state.tab) {
    const section = TAB_TO_SECTION[state.tab]
    if (section) {
      store.setSection(section as 'qa' | 'flashcards' | 'exam' | 'voice' | 'coding' | 'stats')
    }
  }

  // Handle content type selection
  if (state.content) {
    const section = CONTENT_TO_SECTION[state.content]
    if (section) {
      store.setSection(section as 'qa' | 'flashcards' | 'exam' | 'voice' | 'coding' | 'stats')
    }
  }

  // Handle channel selection
  if (state.channel) {
    store.switchChannel(state.channel)
  }

  // Handle generate modal
  if (state.generate) {
    store.setIsSearchOpen(true) // Using search modal as generate trigger
  }

  // Handle theme - only apply light/dark from backdoor, high-contrast handled separately
  if (state.theme && state.theme !== 'high-contrast') {
    store.setTheme(state.theme)
  }

  // Handle skip onboarding
  if (state.skipOnboarding) {
    try {
      localStorage.setItem('devprep:onboarded', '1')
      store.completeOnboarding([])
    } catch {
      // ignore
    }
  }
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to track and display backdoor activation history
 */
export function useBackdoorLog() {
  const [logs, setLogs] = useState<BackdoorLog[]>([])

  const addLog = useCallback((action: string, value: string | boolean) => {
    setLogs(prev => [
      { timestamp: Date.now(), action, value },
      ...prev.slice(0, 9), // Keep last 10 logs
    ])
  }, [])

  const clearLogs = useCallback(() => setLogs([]), [])

  return { logs, addLog, clearLogs }
}

/**
 * Hook to access current backdoor state
 */
export function useBackdoorState(): BackdoorState & { logs: BackdoorLog[] } {
  const [state, setState] = useState<BackdoorState>({
    active: false,
    page: null,
    channel: null,
    content: null,
    tab: null,
    generate: false,
    theme: null,
    skipOnboarding: false,
  })
  const [logs, setLogs] = useState<BackdoorLog[]>([])

  useEffect(() => {
    // Only run in development
    if (!import.meta.env.DEV) return

    const searchParams = new URLSearchParams(window.location.search)
    const parsed = parseBackdoorParams(searchParams)
    setState(parsed)

    if (parsed.active) {
      // Log all activated backdoors
      if (parsed.page) {
        setLogs(prev => [...prev, { timestamp: Date.now(), action: 'page', value: parsed.page! }])
      }
      if (parsed.channel) {
        setLogs(prev => [
          ...prev,
          { timestamp: Date.now(), action: 'channel', value: parsed.channel! },
        ])
      }
      if (parsed.content) {
        setLogs(prev => [
          ...prev,
          { timestamp: Date.now(), action: 'content', value: parsed.content! },
        ])
      }
      if (parsed.tab) {
        setLogs(prev => [...prev, { timestamp: Date.now(), action: 'tab', value: parsed.tab! }])
      }
      if (parsed.generate) {
        setLogs(prev => [...prev, { timestamp: Date.now(), action: 'generate', value: true }])
      }
      if (parsed.theme) {
        setLogs(prev => [...prev, { timestamp: Date.now(), action: 'theme', value: parsed.theme! }])
      }
      if (parsed.skipOnboarding) {
        setLogs(prev => [...prev, { timestamp: Date.now(), action: 'skipOnboarding', value: true }])
      }
    }
  }, [])

  return { ...state, logs }
}

/**
 * Main hook for processing query backdoors
 *
 * Usage:
 * ```tsx
 * function App() {
 *   const { active, backdoorLog } = useQueryBackdoor()
 *
 *   return (
 *     <>
 *       {/* Your app content *\/}
 *       {active && <BackdoorIndicator log={backdoorLog} />}
 *     </>
 *   )
 * }
 * ```
 */
export function useQueryBackdoor(config: QueryBackdoorConfig = {}): {
  state: BackdoorState
  logs: BackdoorLog[]
  clearParams: () => void
} {
  const { clearAfterProcessing = true, logToConsole = true, showIndicator = true } = config
  const hasProcessed = useRef(false)
  const [logs, setLogs] = useState<BackdoorLog[]>([])

  const state = useBackdoorState()

  useEffect(() => {
    // Only run in development mode
    if (!import.meta.env.DEV) return undefined

    // Skip if not active or already processed
    if (!state.active || hasProcessed.current) return undefined
    hasProcessed.current = true

    // Log to console
    if (logToConsole) {
      console.group(
        '%c🔓 DevPrep Backdoor Activated',
        'color: #ff6b6b; font-weight: bold; font-size: 14px;'
      )
      console.log('Backdoor state:', state)
      console.log('Backdoor logs:', logs)
      console.groupEnd()
    }

    // Apply the backdoor state
    applyBackdoorState(state)

    // Clear URL params after processing
    if (clearAfterProcessing) {
      // Use a small delay to ensure state is applied first
      const timeoutId = setTimeout(() => {
        clearBackdoorParams()
      }, 100)
      return () => clearTimeout(timeoutId)
    }

    return undefined
  }, [state, logToConsole, clearAfterProcessing, logs])

  const clearParams = useCallback(() => {
    clearBackdoorParams()
    hasProcessed.current = false
  }, [])

  return {
    state,
    logs,
    clearParams,
  }
}

// ============================================================================
// Predefined Backdoor Scenarios
// ============================================================================

export const BACKDOOR_SCENARIOS = {
  /** Jump to DevOps dashboard with all filters */
  devopsTest: () => {
    const url = createBackdoorUrl({
      page: 'dashboard',
      channel: 'devops',
    })
    window.location.href = url
  },

  /** Jump to AWS exam prep */
  awsExamTest: () => {
    const url = createBackdoorUrl({
      page: 'exam',
      channel: 'aws-saa',
    })
    window.location.href = url
  },

  /** Jump to coding challenges */
  codingTest: () => {
    const url = createBackdoorUrl({
      page: 'coding',
    })
    window.location.href = url
  },

  /** Jump to voice practice */
  voiceTest: () => {
    const url = createBackdoorUrl({
      page: 'voice',
    })
    window.location.href = url
  },

  /** Skip onboarding with specific channels */
  quickStart: (channels: string[]) => {
    const url = new URL(window.location.origin)
    url.searchParams.set('skipOnboarding', 'true')
    channels.forEach(ch => url.searchParams.append('channel', ch))
    window.location.href = url.toString()
  },

  /** Open generate modal on content page */
  generateModalTest: () => {
    const url = createBackdoorUrl({
      page: 'content',
      generate: true,
    })
    window.location.href = url
  },

  /** Test dark mode */
  darkModeTest: () => {
    const url = createBackdoorUrl({
      theme: 'dark',
    })
    window.location.href = url
  },

  /** Test high contrast mode */
  highContrastTest: () => {
    const url = createBackdoorUrl({
      theme: 'high-contrast',
    })
    window.location.href = url
  },
} as const

// ============================================================================
// Export all types and utilities
// ============================================================================

export type { QueryBackdoorConfig }
