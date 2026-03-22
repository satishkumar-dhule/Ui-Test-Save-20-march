import { useState, useCallback, useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

export type Theme = 'dark' | 'light' | 'high-contrast' | 'blue-light' | 'ocean' | 'forest'

interface ThemeOptions {
  primaryHue?: number
  primarySaturation?: number
  primaryLightness?: number
  spacingMultiplier?: number
  fontSizeMultiplier?: number
  radiusMultiplier?: number
}

/**
 * Custom hook for theme management with localStorage persistence
 * Supports multiple theme variants and customization options
 */
export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('devprep:theme', 'dark')
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Get available themes
  const getAvailableThemes = useCallback((): Theme[] => {
    return ['light', 'dark', 'high-contrast', 'blue-light', 'ocean', 'forest']
  }, [])

  // Toggle between light and dark mode
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'dark' ? 'light' : 'dark'
      return newTheme
    })
  }, [setTheme])

  // Set specific theme with transition
  const setThemeWithTransition = useCallback(
    (newTheme: Theme) => {
      setIsTransitioning(true)
      setTheme(newTheme)

      // Reset transition state after animation completes
      setTimeout(() => {
        setIsTransitioning(false)
      }, 250)
    },
    [setTheme]
  )

  // Set theme customization options
  const setCustomization = useCallback((options: ThemeOptions) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).devprepTheme) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).devprepTheme.setCustomization(options)
    }
  }, [])

  // Reset theme customization
  const resetCustomization = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).devprepTheme) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).devprepTheme.resetCustomization()
    }
  }, [])

  // Preview theme without saving
  const previewTheme = useCallback((previewTheme: Theme) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).devprepTheme) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).devprepTheme.previewTheme(previewTheme)
    }
  }, [])

  // Cancel theme preview
  const cancelPreview = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).devprepTheme) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).devprepTheme.cancelPreview()
    }
  }, [])

  // Check if system prefers dark mode
  const getSystemTheme = useCallback((): Theme => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a theme recently
      const lastManualChange = localStorage.getItem('devprep:theme:lastManualChange')
      const now = Date.now()

      // If manual change was more than 24 hours ago, respect system preference
      if (!lastManualChange || now - parseInt(lastManualChange) > 24 * 60 * 60 * 1000) {
        const newTheme = e.matches ? 'dark' : 'light'
        setTheme(newTheme)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [setTheme])

  // Record manual theme changes
  useEffect(() => {
    localStorage.setItem('devprep:theme:lastManualChange', Date.now().toString())
  }, [theme])

  // Get current theme info
  const getThemeInfo = useCallback(() => {
    const themes = getAvailableThemes()
    const currentThemeInfo = themes.find(t => t === theme) || 'dark'

    return {
      name: currentThemeInfo,
      isDark: theme === 'dark',
      isLight: theme === 'light',
      isHighContrast: theme === 'high-contrast',
      isSystemDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
      isSystemLight: window.matchMedia('(prefers-color-scheme: light)').matches,
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
    }
  }, [theme, getAvailableThemes])

  return {
    theme,
    setTheme,
    toggleTheme,
    setThemeWithTransition,
    isTransitioning,
    getAvailableThemes,
    setCustomization,
    resetCustomization,
    previewTheme,
    cancelPreview,
    getSystemTheme,
    getThemeInfo,
  }
}
