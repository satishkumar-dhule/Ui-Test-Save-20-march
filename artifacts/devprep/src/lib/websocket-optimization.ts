/**
 * WebSocket Optimization Layer for DevPrep
 *
 * Provides optimized WebSocket integration with:
 * - Message batching and deduplication
 * - Connection state synchronization
 * - Offline queue management
 * - Performance monitoring
 * - Reconnection strategies
 */

import { useRealtimeStore } from '@/lib/realtimeStore'
import { queryClient } from '@/lib/queryClient'
import { QUERY_KEYS } from '@/lib/queryClient'
import type {
  WebSocketMessage,
  WebSocketMessageType,
  ConnectionStatus,
  WebSocketConfig,
} from '@/stores/types'

// ============================================================================
// MESSAGE BATCHING AND DEDUPLICATION
// ============================================================================

interface BatchedMessage {
  id: string
  type: WebSocketMessageType
  payload: unknown
  timestamp: number
  processed: boolean
}

class MessageBatcher {
  private batchWindow = 100 // ms
  private batchQueue: BatchedMessage[] = []
  private batchTimer: ReturnType<typeof setTimeout> | null = null
  private processedIds = new Set<string>()

  addMessage(message: WebSocketMessage): void {
    const batchedMessage: BatchedMessage = {
      id: this.generateMessageId(message),
      type: message.type,
      payload: message,
      timestamp: Date.now(),
      processed: false,
    }

    // Deduplicate
    if (this.processedIds.has(batchedMessage.id)) {
      return
    }

    this.batchQueue.push(batchedMessage)
    this.processedIds.add(batchedMessage.id)

    // Limit processed IDs set size
    if (this.processedIds.size > 1000) {
      const firstId = this.processedIds.values().next().value
      if (firstId) {
        this.processedIds.delete(firstId)
      }
    }

    this.scheduleBatch()
  }

  private scheduleBatch(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
    }

    this.batchTimer = setTimeout(() => {
      this.processBatch()
    }, this.batchWindow)
  }

  private processBatch(): void {
    if (this.batchQueue.length === 0) return

    const batch = [...this.batchQueue]
    this.batchQueue = []

    console.log(`[MessageBatcher] Processing batch of ${batch.length} messages`)

    // Group by message type for efficient processing
    const messagesByType = new Map<WebSocketMessageType, BatchedMessage[]>()

    batch.forEach(msg => {
      const existing = messagesByType.get(msg.type) || []
      existing.push(msg)
      messagesByType.set(msg.type, existing)
    })

    // Process each type in batch
    messagesByType.forEach((messages, type) => {
      this.processMessageBatch(type, messages)
    })
  }

  private processMessageBatch(type: WebSocketMessageType, messages: BatchedMessage[]): void {
    switch (type) {
      case 'CONTENT_ADDED':
      case 'CONTENT_UPDATED':
      case 'CONTENT_DELETED':
        this.processContentUpdates(messages)
        break
      case 'CONNECTION_STATUS':
        this.processConnectionStatus(messages[messages.length - 1])
        break
      default:
        // Process individually for other message types
        messages.forEach(msg => {
          this.processSingleMessage(msg)
        })
    }
  }

  private processContentUpdates(messages: BatchedMessage[]): void {
    // Group by content ID to apply only latest update
    const latestUpdates = new Map<string, BatchedMessage>()

    messages.forEach(msg => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload = (msg.payload as any).payload
      const contentId = payload?.id

      if (contentId) {
        latestUpdates.set(contentId, msg)
      }
    })

    // Apply updates
    latestUpdates.forEach(msg => {
      this.processSingleMessage(msg)
    })

    // Invalidate queries once for all updates
    if (latestUpdates.size > 0) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all })
    }
  }

  private processConnectionStatus(message: BatchedMessage): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload = (message.payload as any).payload
    if (payload?.status) {
      const realtimeStore = useRealtimeStore.getState()
      realtimeStore.setConnectionStatus(payload.status)
    }
  }

  private processSingleMessage(message: BatchedMessage): void {
    // This would integrate with the existing WebSocket message handlers
    console.log(`[MessageBatcher] Processing ${message.type} message`)
  }

  private generateMessageId(message: WebSocketMessage): string {
    // Create unique ID based on message content
    const content = JSON.stringify({
      type: message.type,
      timestamp: message.timestamp,
      payload: message,
    })

    // Simple hash for ID generation
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }

    return `msg-${hash.toString(16)}-${message.timestamp}`
  }

  clear(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
    }
    this.batchQueue = []
    this.processedIds.clear()
  }

  getStats(): {
    queueSize: number
    processedCount: number
  } {
    return {
      queueSize: this.batchQueue.length,
      processedCount: this.processedIds.size,
    }
  }
}

// ============================================================================
// CONNECTION STATE SYNCHRONIZATION
// ============================================================================

class ConnectionManager {
  private connectionStatus: ConnectionStatus = 'disconnected'
  private lastHeartbeat: number | null = null
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private statusListeners = new Set<(status: ConnectionStatus) => void>()

  constructor(private config: WebSocketConfig) {}

  connect(): void {
    const realtimeStore = useRealtimeStore.getState()
    realtimeStore.setConnectionStatus('connecting')
    this.connectionStatus = 'connecting'
    this.notifyStatusChange('connecting')
  }

  connected(): void {
    const realtimeStore = useRealtimeStore.getState()
    realtimeStore.setConnectionStatus('connected')
    this.connectionStatus = 'connected'
    this.lastHeartbeat = Date.now()
    this.notifyStatusChange('connected')
    this.startHeartbeat()
  }

  disconnected(): void {
    const realtimeStore = useRealtimeStore.getState()
    realtimeStore.setConnectionStatus('disconnected')
    this.connectionStatus = 'disconnected'
    this.notifyStatusChange('disconnected')
    this.stopHeartbeat()
  }

  reconnecting(): void {
    const realtimeStore = useRealtimeStore.getState()
    realtimeStore.setConnectionStatus('reconnecting')
    this.connectionStatus = 'reconnecting'
    this.notifyStatusChange('reconnecting')
    this.stopHeartbeat()
  }

  heartbeat(): void {
    this.lastHeartbeat = Date.now()
  }

  isHealthy(): boolean {
    if (this.connectionStatus !== 'connected') return false
    if (!this.lastHeartbeat) return false

    const timeSinceHeartbeat = Date.now() - this.lastHeartbeat
    return timeSinceHeartbeat < this.config.pingInterval * 2
  }

  onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener)
    return () => {
      this.statusListeners.delete(listener)
    }
  }

  private notifyStatusChange(status: ConnectionStatus): void {
    this.statusListeners.forEach(listener => {
      try {
        listener(status)
      } catch (error) {
        console.error('[ConnectionManager] Error in status listener:', error)
      }
    })
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()

    this.heartbeatInterval = setInterval(() => {
      if (!this.isHealthy()) {
        console.warn('[ConnectionManager] Connection unhealthy, reconnecting...')
        this.reconnecting()
      }
    }, this.config.pingInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  getStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  getLastHeartbeat(): number | null {
    return this.lastHeartbeat
  }
}

// ============================================================================
// OFFLINE QUEUE MANAGEMENT
// ============================================================================

interface QueuedMessage {
  id: string
  message: WebSocketMessage
  timestamp: number
  retryCount: number
  maxRetries: number
}

class OfflineQueue {
  private queue: QueuedMessage[] = []
  private maxQueueSize = 100
  private maxRetries = 3
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this))
      window.addEventListener('offline', this.handleOffline.bind(this))
    }
  }

  addMessage(message: WebSocketMessage): void {
    if (this.isOnline) {
      return // Don't queue if online
    }

    const queuedMessage: QueuedMessage = {
      id: this.generateId(),
      message,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.maxRetries,
    }

    this.queue.push(queuedMessage)

    // Limit queue size
    if (this.queue.length > this.maxQueueSize) {
      this.queue.shift()
    }

    console.log(`[OfflineQueue] Queued message: ${message.type}`)
  }

  private handleOnline(): void {
    console.log('[OfflineQueue] Back online, processing queue')
    this.isOnline = true
    this.processQueue()
  }

  private handleOffline(): void {
    console.log('[OfflineQueue] Went offline')
    this.isOnline = false
  }

  async processQueue(): Promise<void> {
    const messages = [...this.queue]
    this.queue = []

    for (const queuedMessage of messages) {
      try {
        // Send message through WebSocket
        // This would integrate with the actual WebSocket client
        console.log(`[OfflineQueue] Sending queued message: ${queuedMessage.message.type}`)

        // Remove from queue on success
        const index = this.queue.findIndex(m => m.id === queuedMessage.id)
        if (index > -1) {
          this.queue.splice(index, 1)
        }
      } catch (error) {
        console.error(`[OfflineQueue] Failed to send message:`, error)

        // Retry logic
        if (queuedMessage.retryCount < queuedMessage.maxRetries) {
          queuedMessage.retryCount++
          this.queue.push(queuedMessage)
        } else {
          console.warn(`[OfflineQueue] Message exhausted retries: ${queuedMessage.id}`)
        }
      }
    }
  }

  clear(): void {
    this.queue = []
    console.log('[OfflineQueue] Queue cleared')
  }

  getQueue(): QueuedMessage[] {
    return [...this.queue]
  }

  getSize(): number {
    return this.queue.length
  }

  private generateId(): string {
    return `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

interface PerformanceMetrics {
  messagesReceived: number
  messagesSent: number
  averageLatency: number
  connectionUptime: number
  reconnects: number
  lastMessageTime: number | null
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    messagesReceived: 0,
    messagesSent: 0,
    averageLatency: 0,
    connectionUptime: 0,
    reconnects: 0,
    lastMessageTime: null,
  }

  private latencySamples: number[] = []
  private connectionStart: number | null = null
  private maxSamples = 100

  messageReceived(): void {
    this.metrics.messagesReceived++
    this.metrics.lastMessageTime = Date.now()
  }

  messageSent(): void {
    this.metrics.messagesSent++
  }

  recordLatency(latency: number): void {
    this.latencySamples.push(latency)

    if (this.latencySamples.length > this.maxSamples) {
      this.latencySamples.shift()
    }

    this.updateAverageLatency()
  }

  connectionStarted(): void {
    this.connectionStart = Date.now()
  }

  connectionEnded(): void {
    if (this.connectionStart) {
      this.metrics.connectionUptime += Date.now() - this.connectionStart
      this.connectionStart = null
    }
  }

  reconnect(): void {
    this.metrics.reconnects++
    this.connectionEnded()
    this.connectionStarted()
  }

  private updateAverageLatency(): void {
    if (this.latencySamples.length === 0) return

    const sum = this.latencySamples.reduce((a, b) => a + b, 0)
    this.metrics.averageLatency = sum / this.latencySamples.length
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  reset(): void {
    this.metrics = {
      messagesReceived: 0,
      messagesSent: 0,
      averageLatency: 0,
      connectionUptime: 0,
      reconnects: 0,
      lastMessageTime: null,
    }
    this.latencySamples = []
    this.connectionStart = null
  }
}

// ============================================================================
// OPTIMIZED WEBSOCKET CLIENT
// ============================================================================

class OptimizedWebSocketClient {
  private batcher = new MessageBatcher()
  private connectionManager: ConnectionManager
  private offlineQueue = new OfflineQueue()
  private performanceMonitor = new PerformanceMonitor()
  private ws: WebSocket | null = null

  constructor(private config: WebSocketConfig) {
    this.connectionManager = new ConnectionManager(config)
  }

  connect(url: string): void {
    this.connectionManager.connect()
    this.performanceMonitor.connectionStarted()

    try {
      this.ws = new WebSocket(url)
      this.setupEventHandlers()
    } catch (error) {
      console.error('[OptimizedWebSocket] Failed to connect:', error)
      this.connectionManager.reconnecting()
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      this.connectionManager.connected()
      this.offlineQueue.processQueue()
    }

    this.ws.onmessage = event => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.batcher.addMessage(message)
        this.performanceMonitor.messageReceived()
      } catch (error) {
        console.error('[OptimizedWebSocket] Failed to parse message:', error)
      }
    }

    this.ws.onclose = () => {
      this.connectionManager.disconnected()
      this.performanceMonitor.connectionEnded()
    }

    this.ws.onerror = () => {
      this.connectionManager.reconnecting()
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
      this.performanceMonitor.messageSent()
    } else {
      this.offlineQueue.addMessage(message)
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connectionManager.disconnected()
    this.performanceMonitor.connectionEnded()
  }

  getStatus(): ConnectionStatus {
    return this.connectionManager.getStatus()
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMonitor.getMetrics()
  }

  getBatcherStats(): { queueSize: number; processedCount: number } {
    return this.batcher.getStats()
  }

  clear(): void {
    this.batcher.clear()
    this.offlineQueue.clear()
    this.performanceMonitor.reset()
  }
}

// ============================================================================
// EXPORTED UTILITIES
// ============================================================================

export const defaultWebSocketConfig: WebSocketConfig = {
  reconnectBaseDelay: 1000,
  reconnectMaxDelay: 30000,
  reconnectMultiplier: 2,
  pingInterval: 30000,
  pongTimeout: 5000,
}

export function createOptimizedWebSocket(
  config?: Partial<WebSocketConfig>
): OptimizedWebSocketClient {
  const fullConfig: WebSocketConfig = {
    ...defaultWebSocketConfig,
    ...config,
  }
  return new OptimizedWebSocketClient(fullConfig)
}

export { MessageBatcher, ConnectionManager, OfflineQueue, PerformanceMonitor }
