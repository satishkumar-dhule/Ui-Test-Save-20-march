/**
 * Comprehensive State Type Definitions for DevPrep Application
 *
 * This file provides type definitions for all state management layers:
 * 1. Global State (Zustand stores)
 * 2. Server State (React Query)
 * 3. Local State (Component-level)
 * 4. WebSocket State (Real-time synchronization)
 * 5. Filter & UI State
 */

// ============================================================================
// CONTENT TYPES
// ============================================================================

export type ContentType = 'question' | 'flashcard' | 'exam' | 'voice' | 'coding'

export type ContentStatus = 'pending' | 'approved' | 'rejected'

export interface ContentData {
  id: string
  channelId: string
  contentType: ContentType
  data: unknown
  qualityScore: number
  status: ContentStatus
  createdAt: number
  updatedAt: number
  metadata?: ContentMetadata
}

export interface ContentMetadata {
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

// ============================================================================
// WEBSOCKET TYPES
// ============================================================================

export type WebSocketMessageType =
  | 'CONTENT_ADDED'
  | 'CONTENT_UPDATED'
  | 'CONTENT_DELETED'
  | 'CONNECTION_STATUS'
  | 'PING'
  | 'PONG'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

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

export interface WebSocketConfig {
  reconnectBaseDelay: number
  reconnectMaxDelay: number
  reconnectMultiplier: number
  pingInterval: number
  pongTimeout: number
}

// ============================================================================
// REALTIME STATE TYPES
// ============================================================================

export interface RealtimeState {
  connectionStatus: ConnectionStatus
  retryCount: number
  nextRetryIn: number | null
  lastConnectedAt: number | null
  lastDisconnectedAt: number | null
  messageQueue: unknown[]
  isQueueProcessing: boolean
}

export interface RealtimeActions {
  setConnectionStatus: (status: ConnectionStatus) => void
  incrementRetryCount: () => void
  resetRetryCount: () => void
  setNextRetryIn: (ms: number | null) => void
  setLastConnectedAt: (timestamp: number) => void
  setLastDisconnectedAt: (timestamp: number) => void
  addToQueue: (message: unknown) => void
  clearQueue: () => void
  setIsQueueProcessing: (processing: boolean) => void
  processQueue: () => unknown[]
}

// ============================================================================
// CONTENT STORE TYPES
// ============================================================================

export interface ContentStoreState {
  items: Record<string, ContentData>
  pendingOptimisticUpdates: Map<string, ContentData>
  stats: ContentStats
  lastSyncedAt: number | null
}

export interface ContentStoreActions {
  addItem: (item: ContentData) => void
  addItems: (items: ContentData[]) => void
  updateItem: (id: string, updates: Partial<ContentData>) => void
  removeItem: (id: string) => void
  setPendingOptimistic: (id: string, item: ContentData) => void
  confirmOptimisticUpdate: (id: string) => void
  rollbackOptimisticUpdate: (id: string) => void
  updateStats: (stats: ContentStats) => void
  setLastSyncedAt: (timestamp: number) => void
  clear: () => void
  getItem: (id: string) => ContentData | undefined
  getItemsByChannel: (channelId: string) => ContentData[]
  getItemsByType: (type: ContentType) => ContentData[]
}

// ============================================================================
// FILTER STATE TYPES
// ============================================================================

export interface FilterState {
  channelId: string | null
  contentType: ContentType | null
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null
  status: ContentStatus | null
  searchQuery: string
  sortBy: 'newest' | 'oldest' | 'quality' | 'difficulty'
  sortOrder: 'asc' | 'desc'
}

export interface FilterActions {
  setChannelId: (channelId: string | null) => void
  setContentType: (type: ContentType | null) => void
  setDifficulty: (difficulty: FilterState['difficulty']) => void
  setStatus: (status: FilterState['status']) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: FilterState['sortBy']) => void
  setSortOrder: (order: FilterState['sortOrder']) => void
  toggleSortOrder: () => void
  resetFilters: () => void
  setMultipleFilters: (filters: Partial<FilterState>) => void
}

// ============================================================================
// AGENT STATE TYPES
// ============================================================================

export type AgentStatus = 'idle' | 'working' | 'completed' | 'failed'

export interface AgentLog {
  id: string
  agentId: string
  message: string
  timestamp: number
}

export interface Agent {
  id: string
  name: string
  status: AgentStatus
  progress: number
  currentTask: string
  logs: AgentLog[]
  startTime: number | null
  endTime: number | null
}

export interface AgentStoreState {
  agents: Record<string, Agent>
  logs: AgentLog[]
}

export interface AgentStoreActions {
  addAgent: (agent: Omit<Agent, 'logs' | 'startTime' | 'endTime'>) => void
  updateAgent: (id: string, updates: Partial<Agent>) => void
  completeAgent: (id: string, finalLog?: string) => void
  failAgent: (id: string, error: string) => void
  addLog: (agentId: string, message: string) => void
  getAgentTimeSpent: (id: string) => number
  getOverallProgress: () => number
  reset: () => void
}

// ============================================================================
// SERVER STATE TYPES (React Query)
// ============================================================================

export interface QueryFilters {
  channelId?: string
  type?: ContentType
  status?: ContentStatus
  minQuality?: number
  limit?: number
  offset?: number
}

export interface QueryKeys {
  all: readonly ['content']
  lists: () => readonly ['content', 'list']
  list: (filters: QueryFilters) => readonly ['content', 'list', QueryFilters]
  details: () => readonly ['content', 'detail']
  detail: (id: string) => readonly ['content', 'detail', string]
  byChannel: (channelId: string) => readonly ['content', 'channel', string]
  byType: (type: ContentType) => readonly ['content', 'type', ContentType]
  stats: () => readonly ['content', 'stats']
  search: (query: string) => readonly ['content', 'search', string]
}

export interface ApiEndpoints {
  content: string
  search: string
  searchVector: string
}

// ============================================================================
// LOCAL STATE TYPES
// ============================================================================

export interface LocalStorageState {
  theme: 'light' | 'dark' | 'system'
  savedChannels: string[]
  recentSearches: string[]
  preferences: UserPreferences
}

export interface UserPreferences {
  showQualityScores: boolean
  autoRefreshInterval: number
  notificationsEnabled: boolean
  defaultContentType: ContentType | null
}

// ============================================================================
// APPLICATION STATE TYPES
// ============================================================================

export interface AppState {
  // Global state (Zustand)
  content: ContentStoreState
  realtime: RealtimeState
  filters: FilterState
  agents: AgentStoreState

  // Local state (React hooks)
  ui: UIState
  preferences: LocalStorageState

  // Server state metadata
  server: ServerState
}

export interface UIState {
  isLoading: boolean
  error: string | null
  sidebarOpen: boolean
  modalOpen: boolean
  activeModal: string | null
  notifications: Notification[]
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  timestamp: number
  read: boolean
}

export interface ServerState {
  lastHealthCheck: number | null
  isOnline: boolean
  apiVersion: string
  websocketConnected: boolean
}

// ============================================================================
// STATE SUBSCRIPTION TYPES
// ============================================================================

export type StateChangeCallback<T> = (newState: T, prevState: T) => void

export interface StateSubscription {
  unsubscribe: () => void
}

export interface StoreSubscription {
  store: string
  selector: (state: unknown) => unknown
  callback: (value: unknown) => void
}

// ============================================================================
// WEBSOCKET INTEGRATION TYPES
// ============================================================================

export interface WebSocketClientConfig {
  url: string
  autoConnect: boolean
  reconnect: boolean
  maxRetries: number
}

export interface WebSocketMessageHandler {
  type: WebSocketMessageType
  handler: (message: WebSocketMessage) => void
}

export interface WebSocketSubscription {
  unsubscribe: () => void
}

// ============================================================================
// DEVTOOLS TYPES
// ============================================================================

export interface DevToolsConfig {
  enabled: boolean
  name?: string
  trace?: boolean
  traceLimit?: number
}

export interface StateDevTools {
  connect: (config?: DevToolsConfig) => void
  disconnect: () => void
  send: (action: string, state: unknown) => void
  subscribe: (callback: (message: unknown) => void) => () => void
}

// ============================================================================
// TYPE UTILITIES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type StateSelector<T, R> = (state: T) => R

export type StateEqualityFn<T> = (a: T, b: T) => boolean

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  ContentData as ContentItem,
  ContentStoreState as ContentState,
  ContentStoreActions as ContentActions,
}
