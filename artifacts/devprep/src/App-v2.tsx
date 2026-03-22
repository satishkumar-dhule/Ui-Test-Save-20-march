/**
 * Main App V2 Component
 *
 * Root application component that integrates all V2 systems:
 * - Providers (Theme, Query, Notifications, A11y, Loading)
 * - Router (Client-side routing with wouter)
 * - Layout (Responsive layout with header, sidebar, content)
 * - State (Zustand stores, React Query)
 * - Components (V2 atoms, molecules, organisms)
 *
 * @author INTEGRATION_MASTER (Jennifer Wong)
 * @version 2.0.0
 */

import React, { useEffect } from 'react'
import { useLocation } from 'wouter'
import { AppProvidersV2 } from '@/providers-v2'
import { AppRouter } from '@/routes-v2'
import { useThemeV2, useNotificationV2 } from '@/providers-v2'
import { useNavigation, useBreadcrumbs } from '@/routes-v2'
import { useNewTheme } from '@/hooks/useNewTheme'

// ============================================================================
// Layout Components
// ============================================================================

interface HeaderProps {
  onMenuToggle?: () => void
}

function Header({ onMenuToggle }: HeaderProps) {
  const { theme, cycleTheme, isDark } = useThemeV2()
  const { unreadCount } = useNotificationV2()
  const { navigate } = useNavigation()
  const [location] = useLocation()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Mobile menu button */}
        <button onClick={onMenuToggle} className="mr-2 px-2 md:hidden" aria-label="Toggle menu">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">DP</span>
          </div>
          <span className="hidden font-bold sm:inline-block">DevPrep</span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-6 text-sm font-medium mx-6">
          <a
            href="#"
            onClick={e => {
              e.preventDefault()
              navigate('/')
            }}
            className={`transition-colors hover:text-foreground/80 ${location === '/' ? 'text-foreground' : 'text-foreground/60'}`}
          >
            Dashboard
          </a>
          <a
            href="#"
            onClick={e => {
              e.preventDefault()
              navigate('/content')
            }}
            className={`transition-colors hover:text-foreground/80 ${location.startsWith('/content') ? 'text-foreground' : 'text-foreground/60'}`}
          >
            Content
          </a>
          <a
            href="#"
            onClick={e => {
              e.preventDefault()
              navigate('/practice/exam')
            }}
            className={`transition-colors hover:text-foreground/80 ${location.startsWith('/practice') ? 'text-foreground' : 'text-foreground/60'}`}
          >
            Practice
          </a>
        </nav>

        {/* Right side actions */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* Theme toggle */}
          <button
            onClick={cycleTheme}
            className="p-2 hover:bg-accent rounded-md"
            aria-label={`Current theme: ${theme}. Click to switch.`}
          >
            {isDark ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-accent rounded-md" aria-label="Notifications">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Settings */}
          <button className="p-2 hover:bg-accent rounded-md" aria-label="Settings">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation()
  const { navigate } = useNavigation()

  const navItems = [
    { label: 'Dashboard', path: '/', icon: '🏠' },
    { label: 'All Content', path: '/content', icon: '📚' },
    { label: 'Questions', path: '/content/question', icon: '❓' },
    { label: 'Flashcards', path: '/content/flashcard', icon: '🎴' },
    { label: 'Exam Practice', path: '/practice/exam', icon: '📝' },
    { label: 'Coding Practice', path: '/practice/coding', icon: '💻' },
    { label: 'Voice Practice', path: '/practice/voice', icon: '🎙️' },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Mobile close button */}
          <div className="flex items-center justify-between p-4 border-b md:hidden">
            <span className="font-semibold">Menu</span>
            <button onClick={onClose} className="p-2 hover:bg-accent rounded-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(item => (
              <a
                key={item.path}
                href="#"
                onClick={e => {
                  e.preventDefault()
                  navigate(item.path)
                  onClose()
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  location === item.path || (item.path !== '/' && location.startsWith(item.path))
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="text-xs text-muted-foreground">DevPrep v2.0 • Made with ❤️</div>
          </div>
        </div>
      </aside>
    </>
  )
}

function Breadcrumbs() {
  const breadcrumbs = useBreadcrumbs()

  if (breadcrumbs.length <= 1) return null

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          {index > 0 && <span>/</span>}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <a
              href="#"
              onClick={e => {
                e.preventDefault()
                // Navigate to breadcrumb path
              }}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </a>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

// ============================================================================
// Main App Content
// ============================================================================

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
      >
        Skip to main content
      </a>

      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="main-content" className="flex-1 p-6 md:p-8" tabIndex={-1}>
          <Breadcrumbs />
          <AppRouter />
        </main>
      </div>
    </div>
  )
}

// ============================================================================
// Main App Component
// ============================================================================

export default function AppV2() {
  // Apply initial theme on mount
  const { theme } = useNewTheme()

  useEffect(() => {
    // Set initial theme attribute
    document.documentElement.setAttribute('data-theme', theme)

    // Add theme class for Tailwind compatibility
    if (theme === 'dark' || theme === 'high-contrast') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <AppProvidersV2>
      <AppContent />
    </AppProvidersV2>
  )
}

// Named export for compatibility
export { AppV2 }
