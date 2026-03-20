import { WEBSOCKET_CONFIG } from '@/lib/queryClient'
import type {
  WebSocketMessage,
  WebSocketMessageType,
  ContentAddedMessage,
  ContentUpdatedMessage,
  ContentDeletedMessage,
} from '@/types/realtime'
import { useRealtimeStore } from '@/lib/realtimeStore'
import { useContentStore } from '@/lib/contentStore'
import { queryClient } from '@/lib/queryClient'
import { QUERY_KEYS } from '@/lib/queryClient'

type MessageHandler = (message: WebSocketMessage) => void

class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempt = 0
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private handlers: Map<WebSocketMessageType, Set<MessageHandler>> = new Map()
  private isIntentionallyClosed = false

  constructor(url: string) {
    this.url = url
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.isIntentionallyClosed = false
    const realtimeStore = useRealtimeStore.getState()
    realtimeStore.setConnectionStatus('connecting')

    try {
      this.ws = new WebSocket(this.url)
      this.setupEventHandlers()
    } catch (error) {
      console.error('[WebSocket] Failed to create WebSocket:', error)
      this.scheduleReconnect()
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      const realtimeStore = useRealtimeStore.getState()
      realtimeStore.setConnectionStatus('connected')
      realtimeStore.setLastConnectedAt(Date.now())
      this.reconnectAttempt = 0
      this.startPingInterval()
      console.log('[WebSocket] Connected')
    }

    this.ws.onmessage = event => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error)
      }
    }

    this.ws.onclose = event => {
      const realtimeStore = useRealtimeStore.getState()
      this.stopPingInterval()

      if (!this.isIntentionallyClosed) {
        realtimeStore.setConnectionStatus('disconnected')
        realtimeStore.setLastDisconnectedAt(Date.now())
        console.log(`[WebSocket] Closed: ${event.code} ${event.reason}`)
        this.scheduleReconnect()
      } else {
        realtimeStore.setConnectionStatus('disconnected')
      }
    }

    this.ws.onerror = error => {
      console.error('[WebSocket] Error:', error)
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const realtimeStore = useRealtimeStore.getState()

    if (message.type === 'PONG') {
      return
    }

    if (message.type === 'CONNECTION_STATUS') {
      realtimeStore.setConnectionStatus(message.payload.status)
      if (message.payload.retryCount !== undefined) {
        realtimeStore.setConnectionStatus('reconnecting')
        realtimeStore.incrementRetryCount()
      }
      if (message.payload.nextRetryIn !== undefined) {
        realtimeStore.setNextRetryIn(message.payload.nextRetryIn)
      }
      return
    }

    const contentStore = useContentStore.getState()

    switch (message.type) {
      case 'CONTENT_ADDED': {
        const addedMessage = message as ContentAddedMessage
        contentStore.addItem({
          id: addedMessage.payload.id,
          channelId: addedMessage.payload.channelId,
          contentType: addedMessage.payload.contentType,
          data: addedMessage.payload.data,
          qualityScore: addedMessage.payload.qualityScore,
          status: 'pending',
          createdAt: message.timestamp,
          updatedAt: message.timestamp,
          metadata: { lastUpdated: message.timestamp, source: 'realtime', pendingSync: false },
        })
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
        break
      }
      case 'CONTENT_UPDATED': {
        const updatedMessage = message as ContentUpdatedMessage
        contentStore.updateItem(updatedMessage.payload.id, {
          data: updatedMessage.payload.data,
          qualityScore: updatedMessage.payload.qualityScore,
          metadata: { lastUpdated: message.timestamp, source: 'realtime', pendingSync: false },
        })
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
        break
      }
      case 'CONTENT_DELETED': {
        const deletedMessage = message as ContentDeletedMessage
        contentStore.removeItem(deletedMessage.payload.id)
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
        break
      }
    }

    const handlers = this.handlers.get(message.type)
    if (handlers) {
      handlers.forEach(handler => handler(message))
    }
  }

  private scheduleReconnect(): void {
    if (this.isIntentionallyClosed) return

    const realtimeStore = useRealtimeStore.getState()
    realtimeStore.setConnectionStatus('reconnecting')
    realtimeStore.incrementRetryCount()

    const delay = Math.min(
      WEBSOCKET_CONFIG.reconnectBaseDelay *
        Math.pow(WEBSOCKET_CONFIG.reconnectMultiplier, this.reconnectAttempt),
      WEBSOCKET_CONFIG.reconnectMaxDelay
    )

    realtimeStore.setNextRetryIn(delay)
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt + 1})`)

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempt++
      this.connect()
    }, delay)
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }))
      }
    }, WEBSOCKET_CONFIG.pingInterval)
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    this.stopPingInterval()
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }
    useRealtimeStore.getState().setConnectionStatus('disconnected')
  }

  send(message: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('[WebSocket] Cannot send message - not connected')
    }
  }

  subscribe(type: WebSocketMessageType, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler)
    return () => {
      this.handlers.get(type)?.delete(handler)
    }
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

let wsClient: WebSocketClient | null = null

export function getWebSocketClient(url?: string): WebSocketClient {
  if (!wsClient && url) {
    wsClient = new WebSocketClient(url)
  }
  if (!wsClient) {
    throw new Error('WebSocket client not initialized. Provide URL on first call.')
  }
  return wsClient
}

export function initializeWebSocket(url: string): WebSocketClient {
  if (wsClient) {
    wsClient.disconnect()
  }
  wsClient = new WebSocketClient(url)
  return wsClient
}

export { WebSocketClient }
