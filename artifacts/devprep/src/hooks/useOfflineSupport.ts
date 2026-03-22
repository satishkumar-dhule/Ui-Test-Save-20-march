import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS, type ContentFilters } from '@/lib/queryClient'

export interface OfflineState {
  isOnline: boolean
  pendingSync: boolean
  lastOnlineAt: number | null
  offlineQueue: OfflineAction[]
}

export interface OfflineAction {
  id: string
  type: 'create' | 'update' | 'delete'
  endpoint: string
  method: 'POST' | 'PUT' | 'DELETE'
  data?: unknown
  timestamp: number
  retries: number
}

const OFFLINE_QUEUE_KEY = 'devprep:offline-queue'
const OFFLINE_CONTENT_KEY = 'devprep:offline-content'
const MAX_RETRIES = 3

export function useOfflineSupport() {
  const queryClient = useQueryClient()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>([])
  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('devprep:last-online')
    return stored ? parseInt(stored, 10) : null
  })
  const syncInProgressRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setIsOnline(true)
      setLastOnlineAt(Date.now())
      localStorage.setItem('devprep:last-online', String(Date.now()))
      processOfflineQueue()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    loadOfflineQueue()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadOfflineQueue = useCallback(() => {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY)
      if (stored) {
        setOfflineQueue(JSON.parse(stored))
      }
    } catch {
      localStorage.removeItem(OFFLINE_QUEUE_KEY)
    }
  }, [])

  const saveOfflineQueue = useCallback((queue: OfflineAction[]) => {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
    } catch {
      const trimmed = queue.slice(-10)
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(trimmed))
    }
  }, [])

  const addToQueue = useCallback(
    (action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>) => {
      const newAction: OfflineAction = {
        ...action,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: Date.now(),
        retries: 0,
      }

      setOfflineQueue(prev => {
        const updated = [...prev, newAction]
        saveOfflineQueue(updated)
        return updated
      })
    },
    [saveOfflineQueue]
  )

  const removeFromQueue = useCallback(
    (actionId: string) => {
      setOfflineQueue(prev => {
        const updated = prev.filter(a => a.id !== actionId)
        saveOfflineQueue(updated)
        return updated
      })
    },
    [saveOfflineQueue]
  )

  const processOfflineQueue = useCallback(async () => {
    if (syncInProgressRef.current || !navigator.onLine) return
    if (offlineQueue.length === 0) return

    syncInProgressRef.current = true

    for (const action of offlineQueue) {
      try {
        const response = await fetch(action.endpoint, {
          method: action.method,
          headers: { 'Content-Type': 'application/json' },
          body: action.data ? JSON.stringify(action.data) : undefined,
        })

        if (response.ok) {
          removeFromQueue(action.id)
        } else if (action.retries >= MAX_RETRIES) {
          removeFromQueue(action.id)
        } else {
          setOfflineQueue(prev =>
            prev.map(a => (a.id === action.id ? { ...a, retries: a.retries + 1 } : a))
          )
        }
      } catch {
        if (action.retries >= MAX_RETRIES) {
          removeFromQueue(action.id)
        } else {
          setOfflineQueue(prev =>
            prev.map(a => (a.id === action.id ? { ...a, retries: a.retries + 1 } : a))
          )
        }
      }
    }

    syncInProgressRef.current = false
  }, [offlineQueue, removeFromQueue])

  const cacheForOffline = useCallback((contentType: string, data: unknown) => {
    try {
      const key = `${OFFLINE_CONTENT_KEY}:${contentType}`
      const entry = {
        data,
        timestamp: Date.now(),
      }
      localStorage.setItem(key, JSON.stringify(entry))
    } catch {
      // Storage full - skip
    }
  }, [])

  const getOfflineContent = useCallback((contentType: string): unknown => {
    try {
      const key = `${OFFLINE_CONTENT_KEY}:${contentType}`
      const stored = localStorage.getItem(key)
      if (!stored) return null

      const entry = JSON.parse(stored)
      const age = Date.now() - entry.timestamp
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours

      if (age > maxAge) {
        localStorage.removeItem(key)
        return null
      }

      return entry.data
    } catch {
      return null
    }
  }, [])

  const clearOfflineContent = useCallback(() => {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(OFFLINE_CONTENT_KEY)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }, [])

  const invalidateQueriesOnReconnect = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
  }, [queryClient])

  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      processOfflineQueue()
    }
  }, [isOnline, offlineQueue.length, processOfflineQueue])

  return {
    isOnline,
    offlineQueue,
    lastOnlineAt,
    pendingSync: offlineQueue.length > 0,
    addToQueue,
    removeFromQueue,
    processOfflineQueue,
    cacheForOffline,
    getOfflineContent,
    clearOfflineContent,
    invalidateQueriesOnReconnect,
  }
}

export function useOfflineIndicator() {
  const { isOnline, pendingSync } = useOfflineSupport()
  const [showIndicator, setShowIndicator] = useState(false)
  const wasOfflineRef = useRef(false)

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true
      setShowIndicator(true)
      return undefined
    } else if (wasOfflineRef.current) {
      wasOfflineRef.current = false
      setShowIndicator(true)
      const timeout = setTimeout(() => setShowIndicator(false), 3000)
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [isOnline])

  return { isOnline, pendingSync, showIndicator }
}

export function useCacheFirstStrategy<T>(
  contentType: string,
  fetcher: () => Promise<T>,
  options: { staleTime?: number; onStale?: (data: T) => void } = {}
) {
  const { getOfflineContent, cacheForOffline, isOnline } = useOfflineSupport()
  const [data, setData] = useState<T | null>(() => getOfflineContent(contentType) as T | null)
  const [isLoading, setIsLoading] = useState(!data)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!isOnline) {
      const cached = getOfflineContent(contentType) as T | null
      if (cached) {
        setData(cached)
        setIsLoading(false)
        return
      }
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      setData(result)
      cacheForOffline(contentType, result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'))
      const cached = getOfflineContent(contentType) as T | null
      if (cached) {
        setData(cached)
        options.onStale?.(cached)
      }
    } finally {
      setIsLoading(false)
    }
  }, [contentType, fetcher, getOfflineContent, cacheForOffline, isOnline, options])

  useEffect(() => {
    load()
  }, [load])

  const refresh = useCallback(() => {
    load()
  }, [load])

  return { data, isLoading, error, refresh, isFromCache: data !== null }
}
