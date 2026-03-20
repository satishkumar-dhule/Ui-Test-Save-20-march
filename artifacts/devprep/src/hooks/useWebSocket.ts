import { useEffect, useCallback } from 'react'
import { useRealtimeStore } from '@/lib/realtimeStore'
import { initializeWebSocket, getWebSocketClient } from '@/services/websocket'
import type { ConnectionStatus, WebSocketMessage, WebSocketMessageType } from '@/types/realtime'

interface UseWebSocketOptions {
  url?: string
  autoConnect?: boolean
  onMessage?: (message: WebSocketMessage) => void
  onStatusChange?: (status: ConnectionStatus) => void
}

interface UseWebSocketResult {
  connect: () => void
  disconnect: () => void
  send: (message: object) => void
  subscribe: (
    type: WebSocketMessageType,
    handler: (message: WebSocketMessage) => void
  ) => () => void
  status: ConnectionStatus
  isConnected: boolean
  retryCount: number
  nextRetryIn: number | null
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketResult {
  const { url, autoConnect = true, onMessage, onStatusChange } = options

  const connectionStatus = useRealtimeStore(state => state.connectionStatus)
  const retryCount = useRealtimeStore(state => state.retryCount)
  const nextRetryIn = useRealtimeStore(state => state.nextRetryIn)

  useEffect(() => {
    if (autoConnect && url) {
      const ws = initializeWebSocket(url)
      ws.connect()
      return () => {
        ws.disconnect()
      }
    }
    return undefined
  }, [autoConnect, url])

  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(connectionStatus)
    }
  }, [connectionStatus, onStatusChange])

  useEffect(() => {
    if (onMessage && url) {
      const ws = getWebSocketClient(url)
      const unsubscribers: (() => void)[] = []

      const messageTypes: WebSocketMessageType[] = [
        'CONTENT_ADDED',
        'CONTENT_UPDATED',
        'CONTENT_DELETED',
      ]

      messageTypes.forEach(type => {
        const unsub = ws.subscribe(type, onMessage)
        unsubscribers.push(unsub)
      })

      return () => {
        unsubscribers.forEach(unsub => unsub())
      }
    }
    return undefined
  }, [onMessage, url])

  const connect = useCallback(() => {
    if (url) {
      const ws = getWebSocketClient(url)
      ws.connect()
    }
  }, [url])

  const disconnect = useCallback(() => {
    if (url) {
      const ws = getWebSocketClient(url)
      ws.disconnect()
    }
  }, [url])

  const send = useCallback(
    (message: object) => {
      if (url) {
        const ws = getWebSocketClient(url)
        ws.send(message)
      }
    },
    [url]
  )

  const subscribe = useCallback(
    (type: WebSocketMessageType, handler: (message: WebSocketMessage) => void) => {
      if (url) {
        const ws = getWebSocketClient(url)
        return ws.subscribe(type, handler)
      }
      return () => {}
    },
    [url]
  )

  return {
    connect,
    disconnect,
    send,
    subscribe,
    status: connectionStatus,
    isConnected: connectionStatus === 'connected',
    retryCount,
    nextRetryIn,
  }
}
