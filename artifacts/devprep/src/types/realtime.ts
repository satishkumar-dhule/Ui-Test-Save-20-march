export type ContentType = 'question' | 'flashcard' | 'exam' | 'voice' | 'coding'

export type WebSocketMessageType =
  | 'CONTENT_ADDED'
  | 'CONTENT_UPDATED'
  | 'CONTENT_DELETED'
  | 'CONNECTION_STATUS'
  | 'PING'
  | 'PONG'

export interface BaseWebSocketMessage {
  type: WebSocketMessageType
  timestamp: number
  channelId?: string
}

export interface ContentAddedMessage extends BaseWebSocketMessage {
  type: 'CONTENT_ADDED'
  payload: {
    id: string
    contentType: ContentType
    data: unknown
    qualityScore: number
    channelId: string
  }
}

export interface ContentUpdatedMessage extends BaseWebSocketMessage {
  type: 'CONTENT_UPDATED'
  payload: {
    id: string
    contentType: ContentType
    data: unknown
    qualityScore?: number
    channelId: string
  }
}

export interface ContentDeletedMessage extends BaseWebSocketMessage {
  type: 'CONTENT_DELETED'
  payload: {
    id: string
    contentType: ContentType
    channelId: string
  }
}

export interface ConnectionStatusMessage extends BaseWebSocketMessage {
  type: 'CONNECTION_STATUS'
  payload: {
    status: 'connected' | 'disconnected' | 'reconnecting'
    retryCount?: number
    nextRetryIn?: number
  }
}

export interface PingMessage extends BaseWebSocketMessage {
  type: 'PING'
}

export interface PongMessage extends BaseWebSocketMessage {
  type: 'PONG'
}

export type WebSocketMessage =
  | ContentAddedMessage
  | ContentUpdatedMessage
  | ContentDeletedMessage
  | ConnectionStatusMessage
  | PingMessage
  | PongMessage

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

export interface RealtimeMetadata {
  lastUpdated: number
  source: 'static' | 'generated' | 'realtime'
  pendingSync: boolean
}

export interface ContentStats {
  totalItems: number
  byType: Record<ContentType, number>
  byChannel: Record<string, number>
  lastFetched: number | null
}

export interface GeneratedContentItem {
  id: string
  type: ContentType
  channelId: string
  title: string
  preview: string
  qualityScore: number
  createdAt: number
  tags: string[]
  difficulty?: string
}

export interface ContentActivity {
  id: string
  type: ContentType
  channelId: string
  title: string
  timestamp: number
  status: 'success' | 'failed' | 'pending'
  durationMs?: number
}

export interface ContentFilter {
  type?: ContentType
  channelId?: string
  minQuality?: number
}

export const contentTypeLabels: Record<ContentType, string> = {
  question: 'Question',
  flashcard: 'Flashcard',
  exam: 'Exam',
  voice: 'Voice',
  coding: 'Coding Challenge',
}

export const contentTypeColors: Record<ContentType, string> = {
  question: 'bg-emerald-500/20 text-emerald-400',
  flashcard: 'bg-blue-500/20 text-blue-400',
  exam: 'bg-amber-500/20 text-amber-400',
  voice: 'bg-purple-500/20 text-purple-400',
  coding: 'bg-cyan-500/20 text-cyan-400',
}
