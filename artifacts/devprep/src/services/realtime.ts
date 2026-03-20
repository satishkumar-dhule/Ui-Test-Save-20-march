import type { ConnectionStatus } from '@/types/realtime'

export type RealtimeEventType =
  | 'db_updated'
  | 'content_added'
  | 'content_updated'
  | 'ping'
  | 'pong'
  | 'connected'
  | 'disconnected'

export interface RealtimeEvent {
  type: RealtimeEventType
  data?: unknown
  timestamp?: number
}

export interface RealtimeOptions {
  url?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
}

const DEFAULT_OPTIONS: Required<RealtimeOptions> = {
  url: typeof window !== 'undefined' ? `ws://${window.location.host}/ws` : 'ws://localhost:3001',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
}

type EventHandler = (event: RealtimeEvent) => void

class RealtimeClient {
  private ws: WebSocket | null = null
  private options: Required<RealtimeOptions>
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private handlers: Map<RealtimeEventType, Set<EventHandler>> = new Map()
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set()
  private connectionStatus: ConnectionStatus = 'disconnected'

  constructor(options: RealtimeOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  getStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  private setStatus(status: ConnectionStatus): void {
    this.connectionStatus = status
    this.statusListeners.forEach(listener => listener(status))
  }

  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener)
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  on(eventType: RealtimeEventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    this.handlers.get(eventType)!.add(handler)
    return () => {
      this.handlers.get(eventType)?.delete(handler)
    }
  }

  off(eventType: RealtimeEventType, handler: EventHandler): void {
    this.handlers.get(eventType)?.delete(handler)
  }

  private emit(event: RealtimeEvent): void {
    const handlers = this.handlers.get(event.type)
    if (handlers) {
      handlers.forEach(handler => handler(event))
    }
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    this.setStatus('connecting')

    try {
      this.ws = new WebSocket(this.options.url)

      this.ws.onopen = () => {
        this.setStatus('connected')
        this.reconnectAttempts = 0
        this.emit({ type: 'connected' })
        this.startHeartbeat()
      }

      this.ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data) as RealtimeEvent
          this.emit({ ...data, timestamp: Date.now() })
        } catch {
          console.warn('[RealtimeClient] Invalid message format')
        }
      }

      this.ws.onclose = () => {
        this.setStatus('disconnected')
        this.emit({ type: 'disconnected' })
        this.stopHeartbeat()
        this.scheduleReconnect()
      }

      this.ws.onerror = () => {
        this.setStatus('disconnected')
      }
    } catch {
      this.setStatus('disconnected')
      this.scheduleReconnect()
    }
  }

  disconnect(): void {
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.setStatus('disconnected')
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.warn('[RealtimeClient] Max reconnect attempts reached')
      return
    }

    if (this.reconnectTimer) {
      return
    }

    this.reconnectAttempts++
    const delay = this.options.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, this.options.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  send(event: RealtimeEvent): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(event))
    }
  }
}

let instance: RealtimeClient | null = null

export function getRealtimeClient(options?: RealtimeOptions): RealtimeClient {
  if (!instance) {
    instance = new RealtimeClient(options)
  }
  return instance
}

export function createRealtimeClient(options?: RealtimeOptions): RealtimeClient {
  if (instance) {
    instance.disconnect()
  }
  instance = new RealtimeClient(options)
  return instance
}
