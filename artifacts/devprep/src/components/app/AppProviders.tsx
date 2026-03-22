import { useEffect, type ReactNode } from 'react'

export type Theme = 'dark' | 'light' | 'high-contrast' | 'blue-light' | 'ocean' | 'forest'

interface AppProvidersProps {
  theme: Theme
  children: ReactNode
}

/**
 * Context providers and global effects for the app.
 * Handles theme application to document root using data attributes.
 * Supports multiple theme variants beyond dark/light.
 *
 * NOTE: This is designed for future provider additions like:
 * - React Query Client
 * - Auth context
 * - Feature flags
 * - etc.
 */
export function AppProviders({ theme, children }: AppProvidersProps) {
  // Apply theme to document root using data attribute for CSS variable scoping
  useEffect(() => {
    const root = document.documentElement

    // Add switching class to disable transitions temporarily
    root.classList.add('theme-switching')

    // Set theme attribute
    root.setAttribute('data-theme', theme)

    // Also toggle dark class for backward compatibility with existing dark mode utilities
    root.classList.toggle('dark', theme === 'dark')

    // Remove switching class after brief delay to re-enable transitions
    const timeoutId = setTimeout(() => {
      root.classList.remove('theme-switching')
    }, 50)

    return () => clearTimeout(timeoutId)
  }, [theme])

  // Expose theme API to window for customization
  useEffect(() => {
    const themeAPI = {
      getCurrentTheme: () => theme,
      setCustomization: (options: {
        primaryHue?: number
        primarySaturation?: number
        primaryLightness?: number
        spacingMultiplier?: number
        fontSizeMultiplier?: number
        radiusMultiplier?: number
      }) => {
        const root = document.documentElement
        root.setAttribute('data-customization', 'enabled')

        if (options.primaryHue !== undefined) {
          root.style.setProperty('--custom-primary-hue', `${options.primaryHue}`)
        }
        if (options.primarySaturation !== undefined) {
          root.style.setProperty('--custom-primary-saturation', `${options.primarySaturation}%`)
        }
        if (options.primaryLightness !== undefined) {
          root.style.setProperty('--custom-primary-lightness', `${options.primaryLightness}%`)
        }
        if (options.spacingMultiplier !== undefined) {
          root.style.setProperty('--custom-spacing-multiplier', `${options.spacingMultiplier}`)
        }
        if (options.fontSizeMultiplier !== undefined) {
          root.style.setProperty('--custom-font-size-multiplier', `${options.fontSizeMultiplier}`)
        }
        if (options.radiusMultiplier !== undefined) {
          root.style.setProperty('--custom-radius-multiplier', `${options.radiusMultiplier}`)
        }
      },
      resetCustomization: () => {
        const root = document.documentElement
        root.removeAttribute('data-customization')
        root.style.removeProperty('--custom-primary-hue')
        root.style.removeProperty('--custom-primary-saturation')
        root.style.removeProperty('--custom-primary-lightness')
        root.style.removeProperty('--custom-spacing-multiplier')
        root.style.removeProperty('--custom-font-size-multiplier')
        root.style.removeProperty('--custom-radius-multiplier')
      },
      getAvailableThemes: (): Theme[] => [
        'light',
        'dark',
        'high-contrast',
        'blue-light',
        'ocean',
        'forest',
      ],
      previewTheme: (previewTheme: Theme) => {
        const root = document.documentElement
        root.setAttribute('data-preview-theme', previewTheme)
        root.setAttribute('data-theme', previewTheme)
      },
      cancelPreview: () => {
        const root = document.documentElement
        root.removeAttribute('data-preview-theme')
        root.setAttribute('data-theme', theme)
      },
    }

    // Expose API to window for external access
    ;(window as any).devprepTheme = themeAPI

    return () => {
      delete (window as any).devprepTheme
    }
  }, [theme])

  return <>{children}</>
}
