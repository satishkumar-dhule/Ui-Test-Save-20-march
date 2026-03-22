/**
 * Theme Switching Hook
 * Provides theme state management with localStorage persistence
 *
 * @author THEME_MASTER (Lisa Park)
 * @version 4.0.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react'

// Theme types
export type ThemeName = 'light' | 'dark' | 'high-contrast'

// Theme configuration interface
export interface ThemeConfig {
  name: ThemeName
  label: string
  description: string
  icon?: string
}

// Available themes
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

// Local storage key
const THEME_STORAGE_KEY = 'devprep-theme-preference'

// Default theme
const DEFAULT_THEME: ThemeName = 'light'

/**
 * Get the system theme preference
 */
const getSystemTheme = (): ThemeName => {
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
const getSavedTheme = (): ThemeName | null => {
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
const saveTheme = (theme: ThemeName): void => {
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
const applyTheme = (theme: ThemeName): void => {
  if (typeof window === 'undefined') return

  // Add no-transitions class to prevent flash
  document.documentElement.classList.add('no-transitions')

  // Set theme attribute
  document.documentElement.setAttribute('data-theme', theme)

  // Remove no-transitions class after a frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('no-transitions')
    })
  })
}

/**
 * Theme hook return interface
 */
export interface UseNewThemeReturn {
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
 * Theme switching hook
 *
 * @returns Theme state and controls
 *
 * @example
 * ```tsx
 * const { theme, setTheme, cycleTheme, isDark } = useNewTheme();
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
export function useNewTheme(): UseNewThemeReturn {
  // Initialize state
  const [theme, setThemeState] = useState<ThemeName>(() => {
    // Check saved preference first, then system preference
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
 * Theme context type (for use with React Context)
 */
export interface ThemeContextType extends UseNewThemeReturn {
  isLoading: boolean
}

export default useNewTheme
