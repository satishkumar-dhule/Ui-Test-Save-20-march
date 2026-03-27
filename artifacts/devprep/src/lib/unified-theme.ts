/**
 * DevPrep Theme System
 *
 * Unified theme implementation combining:
 * - Channel colors from legacy theme.ts
 * - Modern theme hook from useNewTheme.ts
 *
 * @version 5.0.0
 * @consolidation 2026-03-27
 */

// ============================================================================
// CHANNEL COLORS - Channel-specific visual identification
// ============================================================================

export const CHANNEL_COLORS = {
  javascript: '#f7df1e',
  react: '#61dafb',
  algorithms: '#a371f7',
  devops: '#ffa657',
  kubernetes: '#326ce5',
  networking: '#3fb950',
  'system-design': '#bc8cff',
  'aws-saa': '#ff9900',
  'aws-dev': '#ff9900',
  cka: '#326ce5',
  terraform: '#7b42bc',
} as const

export type ChannelColorKey = keyof typeof CHANNEL_COLORS

// ============================================================================
// THEME TYPES - Core theme definitions
// ============================================================================

export type ThemeName = 'light' | 'dark' | 'high-contrast'

export interface ThemeConfig {
  name: ThemeName
  label: string
  description: string
  icon?: string
}

export const THEMES: ThemeConfig[] = [
  {
    name: 'light',
    label: 'Light',
    description: 'Clean, bright theme for daytime use',
  },
  {
    name: 'dark',
    label: 'Dark',
    description: 'Easy on the eyes for low-light environments',
  },
  {
    name: 'high-contrast',
    label: 'High Contrast',
    description: 'Maximum contrast for accessibility',
  },
]

// Legacy theme types (for backward compatibility)
export type LegacyTheme = 'dark' | 'light' | 'high-contrast' | 'blue-light' | 'ocean' | 'forest'

// ============================================================================
// THEME PERSISTENCE - localStorage keys and helpers
// ============================================================================

const THEME_STORAGE_KEY = 'devprep-theme-preference'
const DEFAULT_THEME: ThemeName = 'light'

/**
 * Get the system theme preference
 */
export function getSystemTheme(): ThemeName {
  if (typeof window === 'undefined') return DEFAULT_THEME

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches

  if (prefersHighContrast) return 'high-contrast'
  if (prefersDark) return 'dark'
  return 'light'
}

/**
 * Get saved theme from localStorage
 */
export function getSavedTheme(): ThemeName | null {
  if (typeof window === 'undefined') return null

  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved && ['light', 'dark', 'high-contrast'].includes(saved)) {
      return saved as ThemeName
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error)
  }

  return null
}

/**
 * Save theme to localStorage
 */
export function saveTheme(theme: ThemeName): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (error) {
    console.warn('Failed to save theme to localStorage:', error)
  }
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: ThemeName): void {
  if (typeof window === 'undefined') return

  // Add no-transitions class to prevent flash
  document.documentElement.classList.add('no-transitions')

  // Set theme attribute
  document.documentElement.setAttribute('data-theme', theme)

  // Also toggle .dark class for backward compatibility
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  // Remove no-transitions class after a frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('no-transitions')
    })
  })
}

// ============================================================================
// THEME HOOK - React hook for theme management
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react'

export interface UseThemeReturn {
  /** Current theme name */
  theme: ThemeName
  /** Current theme configuration */
  themeConfig: ThemeConfig
  /** Set theme manually */
  setTheme: (theme: ThemeName) => void
  /** Cycle through available themes */
  cycleTheme: () => void
  /** Reset to system preference */
  resetToSystem: () => void
  /** Available themes */
  themes: ThemeConfig[]
  /** Check if current theme matches */
  isTheme: (theme: ThemeName) => boolean
  /** Check if dark mode is active */
  isDark: boolean
  /** Check if high contrast is active */
  isHighContrast: boolean
}

/**
 * Primary theme switching hook
 *
 * Features:
 * - localStorage persistence
 * - System preference detection
 * - Theme cycling
 * - Accessibility support (high contrast)
 *
 * @returns Theme state and controls
 *
 * @example
 * ```tsx
 * const { theme, setTheme, cycleTheme, isDark } = useTheme();
 *
 * // Set specific theme
 * setTheme('dark');
 *
 * // Cycle through themes
 * cycleTheme();
 *
 * // Check current theme
 * if (isDark) {
 *   console.log('Dark mode is active');
 * }
 * ```
 */
export function useTheme(): UseThemeReturn {
  // Initialize state
  const [theme, setThemeState] = useState<ThemeName>(() => {
    return getSavedTheme() || getSystemTheme()
  })

  // Get current theme config
  const themeConfig = useMemo(() => {
    return THEMES.find(t => t.name === theme) || THEMES[0]
  }, [theme])

  // Computed booleans
  const isDark = theme === 'dark'
  const isHighContrast = theme === 'high-contrast'

  // Set theme function
  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme)
    saveTheme(newTheme)
    applyTheme(newTheme)
  }, [])

  // Cycle through themes
  const cycleTheme = useCallback(() => {
    const currentIndex = THEMES.findIndex(t => t.name === theme)
    const nextIndex = (currentIndex + 1) % THEMES.length
    setTheme(THEMES[nextIndex].name)
  }, [theme, setTheme])

  // Reset to system preference
  const resetToSystem = useCallback(() => {
    const systemTheme = getSystemTheme()
    setTheme(systemTheme)
  }, [setTheme])

  // Check if current theme matches
  const isTheme = useCallback(
    (checkTheme: ThemeName) => {
      return theme === checkTheme
    },
    [theme]
  )

  // Apply theme on mount
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const contrastQuery = window.matchMedia('(prefers-contrast: more)')

    const handleChange = () => {
      // Only update if user hasn't set a preference
      if (!getSavedTheme()) {
        setThemeState(getSystemTheme())
      }
    }

    darkModeQuery.addEventListener('change', handleChange)
    contrastQuery.addEventListener('change', handleChange)

    return () => {
      darkModeQuery.removeEventListener('change', handleChange)
      contrastQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return {
    theme,
    themeConfig,
    setTheme,
    cycleTheme,
    resetToSystem,
    themes: THEMES,
    isTheme,
    isDark,
    isHighContrast,
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get theme configuration by name
 */
export function getThemeConfig(name: ThemeName): ThemeConfig {
  return THEMES.find(t => t.name === name) || THEMES[0]
}

/**
 * Check if a theme name is valid
 */
export function isValidTheme(name: string): name is ThemeName {
  return ['light', 'dark', 'high-contrast'].includes(name)
}

/**
 * Get all theme names
 */
export function getThemeNames(): ThemeName[] {
  return THEMES.map(t => t.name)
}

/**
 * Legacy theme validation (for backward compatibility)
 */
export function isValidLegacyTheme(name: string): name is LegacyTheme {
  return ['dark', 'light', 'high-contrast', 'blue-light', 'ocean', 'forest'].includes(name)
}

// ============================================================================
// DEPRECATED RE-EXPORTS - For backward compatibility
// ============================================================================

// Re-export the hooks from their original locations for backward compatibility
// These are deprecated - use useTheme from this file instead
export { useNewTheme } from '@/hooks/useNewTheme'
export { useTheme as useLegacyTheme } from '@/hooks/useTheme'

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export interface ThemeContextType extends UseThemeReturn {
  isLoading: boolean
}

export default useTheme
