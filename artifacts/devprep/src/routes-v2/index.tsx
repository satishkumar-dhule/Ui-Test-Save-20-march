/**
 * V2 Routing System
 * 
 * Central routing configuration for all V2 pages.
 * Uses wouter for client-side routing with React 19 features.
 * 
 * @author INTEGRATION_MASTER (Jennifer Wong)
 * @version 2.0.0
 */

import React, { Suspense, lazy } from 'react'
import { Route, Switch, useLocation, Redirect } from 'wouter'
import { useLoadingV2 } from '@/providers-v2'
import { useUIStore } from '@/stores-v2'

// ============================================================================
// Lazy-loaded Page Components
// ============================================================================

// Import pages directly for now (can be lazy-loaded later for code splitting)
import {
  HomePage,
  ContentPage,
  OnboardingPage,
  ExamPage,
  CodingPage,
  VoicePage,
} from '@/pages-v2'

// ============================================================================
// Loading Component
// ============================================================================

interface LoadingSpinnerProps {
  message?: string
}

function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="relative">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 animate-pulse rounded-full bg-primary/30" />
        </div>
      </div>
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  )
}

// ============================================================================
// Error Component
// ============================================================================

interface ErrorFallbackProps {
  error?: Error
  resetErrorBoundary?: () => void
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md text-center">
        <div className="mb-4 text-6xl">⚠️</div>
        <h1 className="mb-2 text-2xl font-bold text-destructive">Page Error</h1>
        <p className="mb-4 text-muted-foreground">
          {error?.message || 'Something went wrong loading this page.'}
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Reload Page
          </button>
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className="rounded-md border px-4 py-2 hover:bg-accent"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Page Wrapper with Error Boundary
// ============================================================================

interface PageWrapperProps {
  children: React.ReactNode
  title?: string
}

function PageWrapper({ children, title }: PageWrapperProps) {
  const { setContent } = useLoadingV2()
  
  React.useEffect(() => {
    setContent(true)
    return () => setContent(false)
  }, [setContent])
  
  React.useEffect(() => {
    if (title) {
      document.title = `${title} | DevPrep`
    }
    return () => {
      document.title = 'DevPrep - Technical Interview Prep'
    }
  }, [title])
  
  return <>{children}</>
}

// ============================================================================
// Route Configuration
// ============================================================================

export interface RouteConfig {
  path: string
  component: React.ComponentType<any>
  title?: string
  exact?: boolean
  protected?: boolean
  roles?: string[]
}

export const routes: RouteConfig[] = [
  // Public routes
  {
    path: '/',
    component: HomePage,
    title: 'Dashboard',
    exact: true,
  },
  {
    path: '/onboarding',
    component: OnboardingPage,
    title: 'Get Started',
    exact: true,
  },
  
  // Content routes
  {
    path: '/content',
    component: ContentPage,
    title: 'All Content',
    exact: true,
  },
  {
    path: '/content/:type',
    component: ContentPage,
    title: 'Content',
    exact: true,
  },
  
  // Practice routes
  {
    path: '/practice/exam',
    component: ExamPage,
    title: 'Exam Practice',
    exact: true,
  },
  {
    path: '/practice/exam/:id',
    component: ExamPage,
    title: 'Take Exam',
    exact: true,
  },
  {
    path: '/practice/coding',
    component: CodingPage,
    title: 'Coding Practice',
    exact: true,
  },
  {
    path: '/practice/coding/:id',
    component: CodingPage,
    title: 'Solve Challenge',
    exact: true,
  },
  {
    path: '/practice/voice',
    component: VoicePage,
    title: 'Voice Practice',
    exact: true,
  },
  {
    path: '/practice/voice/:id',
    component: VoicePage,
    title: 'Voice Interview',
    exact: true,
  },
  
  // Catch-all 404 route
  {
    path: '/:rest*',
    component: NotFoundPage,
    title: '404 Not Found',
  },
]

// ============================================================================
// 404 Not Found Page
// ============================================================================

function NotFoundPage() {
  const [, setLocation] = useLocation()
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 text-8xl">🔍</div>
        <h1 className="mb-2 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Page Not Found</p>
        <p className="mb-6 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setLocation('/')}
            className="rounded-md bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Go Home
          </button>
          <button
            onClick={() => window.history.back()}
            className="rounded-md border px-6 py-2 hover:bg-accent"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Route Renderer
// ============================================================================

function RouteRenderer({ config }: { config: RouteConfig }) {
  const Component = config.component
  
  return (
    <PageWrapper title={config.title}>
      <Suspense fallback={<LoadingSpinner message={`Loading ${config.title || 'page'}...`} />}>
        <Component />
      </Suspense>
    </PageWrapper>
  )
}

// ============================================================================
// Main Router Component
// ============================================================================

export function AppRouter() {
  return (
    <Switch>
      {routes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
        >
          <RouteRenderer config={route} />
        </Route>
      ))}
    </Switch>
  )
}

// ============================================================================
// Navigation Helpers
// ============================================================================

export function useNavigation() {
  const [location, setLocation] = useLocation()
  
  const navigate = (path: string) => {
    setLocation(path)
  }
  
  const goBack = () => {
    window.history.back()
  }
  
  const goHome = () => {
    setLocation('/')
  }
  
  return {
    location,
    navigate,
    goBack,
    goHome,
  }
}

// ============================================================================
// Active Route Detection
// ============================================================================

export function useActiveRoute() {
  const [location] = useLocation()
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location === '/'
    }
    return location.startsWith(path)
  }
  
  const getCurrentRoute = () => {
    return routes.find((route) => {
      if (route.path === '/') {
        return location === '/'
      }
      return location.startsWith(route.path)
    })
  }
  
  return {
    isActive,
    getCurrentRoute,
    currentPath: location,
  }
}

// ============================================================================
// Route Guards (for future use)
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  redirectTo = '/onboarding' 
}: ProtectedRouteProps) {
  // This can be extended with auth state from stores-v2
  const isAuthenticated = true // TODO: Get from auth store
  const userRoles: string[] = [] // TODO: Get from user store
  
  if (!isAuthenticated) {
    return <Redirect to={redirectTo} />
  }
  
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role))
    if (!hasRequiredRole) {
      return <Redirect to="/" />
    }
  }
  
  return <>{children}</>
}

// ============================================================================
// Breadcrumb Helper
// ============================================================================

export interface Breadcrumb {
  label: string
  path: string
}

export function useBreadcrumbs(): Breadcrumb[] {
  const [location] = useLocation()
  const breadcrumbs: Breadcrumb[] = [{ label: 'Home', path: '/' }]
  
  // Parse path segments and build breadcrumbs
  const segments = location.split('/').filter(Boolean)
  let currentPath = ''
  
  segments.forEach((segment) => {
    currentPath += `/${segment}`
    const route = routes.find((r) => r.path === currentPath)
    
    if (route && route.title) {
      breadcrumbs.push({
        label: route.title,
        path: currentPath,
      })
    } else {
      // Convert segment to label
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
      breadcrumbs.push({ label, path: currentPath })
    }
  })
  
  return breadcrumbs
}

// Export components and hooks
export { LoadingSpinner, ErrorFallback, PageWrapper, NotFoundPage }
export default AppRouter