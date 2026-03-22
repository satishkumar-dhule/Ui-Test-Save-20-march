/**
 * V2 Provider Composition
 * 
 * Central provider composition for all V2 systems.
 * Integrates: Error Boundary, Theme, Query Client, State Stores, WebSocket, Accessibility
 * 
 * @author INTEGRATION_MASTER (Jennifer Wong)
 * @version 2.0.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTheme, useNotifications } from '@/hooks-v2'
import { useNewTheme } from '@/hooks/useNewTheme'

// ============================================================================
// Error Boundary
// ============================================================================

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[V2 ErrorBoundary] Caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
            <div className="text-center p-8 max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 text-destructive">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-destructive mb-2">Something went wrong</h1>
              <p className="text-muted-foreground mb-4">{this.state.error?.message}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Reload Application
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// ============================================================================
// Theme Provider V2
// ============================================================================

interface ThemeContextType {
  theme: string
  setTheme: (theme: 'light' | 'dark' | 'high-contrast') => void
  cycleTheme: () => void
  isDark: boolean
  isHighContrast: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProviderV2({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, cycleTheme, isDark, isHighContrast } = useNewTheme()

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, isDark, isHighContrast }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeV2() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useThemeV2 must be used within a ThemeProviderV2')
  }
  return context
}

// ============================================================================
// Query Client Provider V2
// ============================================================================

export function QueryProviderV2({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

// ============================================================================
// Notification Provider V2
// ============================================================================

interface NotificationContextType {
  notifications: any[]
  unreadCount: number
  add: (notification: any) => void
  markRead: (id: string) => void
  clear: () => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProviderV2({ children }: { children: React.ReactNode }) {
  const notifications = useNotifications()

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationV2() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotificationV2 must be used within a NotificationProviderV2')
  }
  return context
}

// ============================================================================
// Accessibility Provider V2
// ============================================================================

interface A11yContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  skipToContent: () => void
  reducedMotion: boolean
  highContrast: boolean
}

const A11yContext = createContext<A11yContextType | undefined>(undefined)

export function A11yProviderV2({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const announcerRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(motionQuery.matches)
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }
    motionQuery.addEventListener('change', handleMotionChange)

    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: more)')
    setHighContrast(contrastQuery.matches)
    
    const handleContrastChange = (e: MediaQueryListEvent) => {
      setHighContrast(e.matches)
    }
    contrastQuery.addEventListener('change', handleContrastChange)

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange)
      contrastQuery.removeEventListener('change', handleContrastChange)
    }
  }, [])

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute('aria-live', priority)
      announcerRef.current.textContent = message
    }
  }

  const skipToContent = () => {
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView()
    }
  }

  return (
    <A11yContext.Provider value={{ announce, skipToContent, reducedMotion, highContrast }}>
      {children}
      {/* Screen reader announcer */}
      <div
        ref={announcerRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
    </A11yContext.Provider>
  )
}

export function useA11yV2() {
  const context = useContext(A11yContext)
  if (context === undefined) {
    throw new Error('useA11yV2 must be used within an A11yProviderV2')
  }
  return context
}

// ============================================================================
// Loading Provider V2
// ============================================================================

interface LoadingContextType {
  global: boolean
  content: boolean
  search: boolean
  setGlobal: (value: boolean) => void
  setContent: (value: boolean) => void
  setSearch: (value: boolean) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProviderV2({ children }: { children: React.ReactNode }) {
  const [global, setGlobal] = useState(false)
  const [content, setContent] = useState(false)
  const [search, setSearch] = useState(false)

  return (
    <LoadingContext.Provider value={{ global, content, search, setGlobal, setContent, setSearch }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoadingV2() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoadingV2 must be used within a LoadingProviderV2')
  }
  return context
}

// ============================================================================
// Main App Providers V2
// ============================================================================

interface AppProvidersV2Props {
  children: React.ReactNode
}

export function AppProvidersV2({ children }: AppProvidersV2Props) {
  return (
    <ErrorBoundary>
      <QueryProviderV2>
        <ThemeProviderV2>
          <NotificationProviderV2>
            <A11yProviderV2>
              <LoadingProviderV2>
                {children}
              </LoadingProviderV2>
            </A11yProviderV2>
          </NotificationProviderV2>
        </ThemeProviderV2>
      </QueryProviderV2>
    </ErrorBoundary>
  )
}

// Export all providers for individual use
export {
  ErrorBoundary,
  ThemeProviderV2,
  QueryProviderV2,
  NotificationProviderV2,
  A11yProviderV2,
  LoadingProviderV2,
}

// Export hooks
export {
  useThemeV2,
  useNotificationV2,
  useA11yV2,
  useLoadingV2,
}