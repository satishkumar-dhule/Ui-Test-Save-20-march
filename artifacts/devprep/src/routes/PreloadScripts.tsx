/**
 * Route Prefetcher - Preload scripts for HTML head
 */

import { useEffect } from 'react'

interface PreloadRouteProps {
  route: string
  as?: 'script' | 'style' | 'image' | 'font'
}

export function PreloadRoute({ route, as = 'script' }: PreloadRouteProps) {
  useEffect(() => {
    const chunkName = getChunkName(route)
    if (!chunkName) return

    const existing = document.querySelector(`link[rel="preload"][data-chunk="${chunkName}"]`)
    if (existing) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = as
    link.href = `/assets/${chunkName}.js`
    link.setAttribute('data-chunk', chunkName)

    document.head.appendChild(link)

    return () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link)
      }
    }
  }, [route, as])

  return null
}

function getChunkName(route: string): string | null {
  const chunkMap: Record<string, string> = {
    qa: 'page-qa',
    flashcards: 'page-flashcards',
    exam: 'page-exam',
    voice: 'page-voice',
    coding: 'page-coding',
    dashboard: 'page-realtime',
    ai: 'page-ai',
    onboarding: 'page-onboarding',
  }
  return chunkMap[route.toLowerCase()] || null
}

interface PrefetchHintsProps {
  routes?: string[]
}

export function PrefetchHints({ routes = ['qa', 'flashcards'] }: PrefetchHintsProps) {
  useEffect(() => {
    routes.forEach(route => {
      const chunkName = getChunkName(route)
      if (!chunkName) return

      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.as = 'script'
      link.href = `/assets/${chunkName}.js`
      link.setAttribute('data-chunk', chunkName)

      document.head.appendChild(link)
    })
  }, [routes])

  return null
}

export { PreloadRoute as default }
