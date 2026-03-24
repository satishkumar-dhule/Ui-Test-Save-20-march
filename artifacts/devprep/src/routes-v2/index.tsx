import { useState, useEffect, lazy, Suspense, memo, useCallback } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'

const LazyDashboardPage = lazy(() =>
  import('@/pages-v2/DashboardPage').then(m => ({ default: m.DashboardPage }))
)
const LazyContentLibraryPage = lazy(() =>
  import('@/pages-v2/ContentLibraryPage').then(m => ({ default: m.ContentLibraryPage }))
)
const LazyQuestionPage = lazy(() =>
  import('@/pages-v2/QuestionPage').then(m => ({ default: m.QuestionPage }))
)
const LazyFlashcardPage = lazy(() =>
  import('@/pages-v2/FlashcardPage').then(m => ({ default: m.FlashcardPage }))
)
const LazyExamPage = lazy(() => import('@/pages-v2/ExamPage').then(m => ({ default: m.ExamPage })))
const LazyVoicePage = lazy(() =>
  import('@/pages-v2/VoicePage').then(m => ({ default: m.VoicePage }))
)
const LazyCodingPage = lazy(() =>
  import('@/pages/CodingPage').then(m => ({ default: m.CodingPage }))
)
const LazyChannelPage = lazy(() =>
  import('@/pages-v2/ChannelPage').then(m => ({ default: m.ChannelPage }))
)
const LazySettingsPage = lazy(() =>
  import('@/pages-v2/SettingsPage').then(m => ({ default: m.SettingsPage }))
)

function SkeletonLoader() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600">Page not found</p>
      </div>
    </div>
  )
}

interface RouteConfig {
  path: string
  Component: React.LazyExoticComponent<React.ComponentType<unknown>>
}

const routes: RouteConfig[] = [
  { path: '/', Component: LazyDashboardPage },
  { path: '/content', Component: LazyContentLibraryPage },
  { path: '/content/question/:id', Component: LazyQuestionPage },
  { path: '/content/flashcard/:id', Component: LazyFlashcardPage },
  { path: '/content/exam/:id', Component: LazyExamPage },
  { path: '/content/voice/:id', Component: LazyVoicePage },
  { path: '/content/coding/:id', Component: LazyCodingPage },
  { path: '/channel/:id', Component: LazyChannelPage },
  { path: '/settings', Component: LazySettingsPage },
]

function matchRoute(
  pathname: string
): { route: RouteConfig; params: Record<string, string> } | null {
  for (const route of routes) {
    const pattern = route.path.replace(/:id/g, '([^/]+)')
    const regex = new RegExp(`^${pattern}$`)
    const match = pathname.match(regex)

    if (match) {
      const params: Record<string, string> = {}
      if (route.path.includes(':id') && match[1]) {
        params.id = match[1]
      }
      return { route, params }
    }
  }
  return null
}

export interface RouterState {
  path: string
  params: Record<string, string>
}

function useRouter() {
  const [state, setState] = useState<RouterState>({
    path: window.location.pathname || '/',
    params: {},
  })

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, '', path)
    const matched = matchRoute(path)
    setState({
      path,
      params: matched?.params || {},
    })
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      const matched = matchRoute(window.location.pathname)
      setState({
        path: window.location.pathname,
        params: matched?.params || {},
      })
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return { ...state, navigate }
}

function PageSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<SkeletonLoader />}>{children}</Suspense>
}

function RoutesV2() {
  const { path, params, navigate } = useRouter()
  const [Component, setComponent] = useState<React.ComponentType<unknown> | null>(null)

  useEffect(() => {
    if (path === '/404') {
      setComponent(() => NotFound)
      return
    }

    const matched = matchRoute(path)
    if (matched) {
      setComponent(() => matched.route.Component)
    } else if (path !== '/404') {
      navigate('/404')
    }
  }, [path, navigate])

  if (!Component) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="size-8" />
      </div>
    )
  }

  return (
    <PageSuspense>
      <Component {...params} />
    </PageSuspense>
  )
}

export default memo(RoutesV2)
export { useRouter }
