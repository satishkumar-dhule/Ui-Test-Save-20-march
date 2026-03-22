/**
 * Modern State Type Definitions for DevPrep V2
 * 
 * Clean, minimal types for new state management system.
 * Focus on strict typing and scalability.
 */

// ============================================================================
// CONTENT TYPES
// ============================================================================

export type ContentType = 'question' | 'flashcard' | 'exam' | 'voice' | 'coding'
export type ContentStatus = 'pending' | 'approved' | 'rejected'

export interface ContentItem {
  id: string
  channelId: string
  contentType: ContentType
  data: unknown
  qualityScore: number
  status: ContentStatus
  createdAt: number
  updatedAt: number
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface ContentStats {
  total: number
  byType: Record<ContentType, number>
  byChannel: Record<string, number>
  averageQuality: number
  lastUpdated: number | null
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface FilterState {
  channel: string | null
  type: ContentType | null
  status: ContentStatus | null
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null
  search: string
  sort: {
    field: 'createdAt' | 'qualityScore' | 'updatedAt'
    order: 'asc' | 'desc'
  }
  tags: string[]
}

// ============================================================================
// UI TYPES
// ============================================================================

export type Theme = 'light' | 'dark' | 'system'
export type ModalType = 'content' | 'settings' | 'search' | 'filter' | 'help'

export interface UIState {
  theme: Theme
  sidebar: {
    open: boolean
    width: number
  }
  modal: {
    open: boolean
    type: ModalType | null
    data: unknown
  }
  notifications: Notification[]
  loading: {
    global: boolean
    content: boolean
    search: boolean
  }
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  timestamp: number
  read: boolean
  duration?: number
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface UserPreferences {
  theme: Theme
  notifications: boolean
  autoRefresh: boolean
  refreshInterval: number
  defaultContentType: ContentType | null
  savedChannels: string[]
  recentSearches: string[]
  displayQualityScores: boolean
  compactMode: boolean
}

// ============================================================================
// SERVER STATE TYPES
// ============================================================================

export interface ServerState {
  health: 'healthy' | 'degraded' | 'offline'
  lastChecked: number
  version: string
  endpoints: {
    api: string
    websocket: string
  }
}

// ============================================================================
// REALTIME TYPES
// ============================================================================

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

export interface WebSocketMessage {
  type: 'CONTENT_ADDED' | 'CONTENT_UPDATED' | 'CONTENT_DELETED' | 'CONNECTION_STATUS'
  timestamp: number
  payload: unknown
}

export interface RealtimeState {
  status: WebSocketStatus
  lastConnected: number | null
  reconnectAttempts: number
  messages: WebSocketMessage[]
}

// ============================================================================
// STORE TYPES
// ============================================================================

export interface ContentStoreState {
  items: Record<string, ContentItem>
  stats: ContentStats
  selectedIds: string[]
  lastFetched: number | null
}

export interface UserStoreState {
  preferences: UserPreferences
  isAuthenticated: boolean
  lastActive: number
}

export interface UIStoreState extends UIState {}

export interface FilterStoreState extends FilterState {}

// ============================================================================
// ACTION TYPES
// ============================================================================

export interface ContentActions {
  setItems: (items: ContentItem[]) => void
  addItem: (item: ContentItem) => void
  updateItem: (id: string, updates: Partial<ContentItem>) => void
  removeItem: (id: string) => void
  clear: () => void
  select: (id: string) => void
  deselect: (id: string) => void
  toggleSelect: (id: string) => void
  clearSelection: () => void
}

export interface UserActions {
  setPreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void
  setPreferences: (prefs: Partial<UserPreferences>) => void
  addSavedChannel: (channelId: string) => void
  removeSavedChannel: (channelId: string) => void
  addRecentSearch: (query: string) => void
  clearRecentSearches: () => void
  logout: () => void
}

export interface UIActions {
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  openModal: (type: ModalType, data?: unknown) => void
  closeModal: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
  setLoading: (key: keyof UIState['loading'], value: boolean) => void
}

export interface FilterActions {
  setChannel: (channel: string | null) => void
  setType: (type: ContentType | null) => void
  setStatus: (status: ContentStatus | null) => void
  setDifficulty: (difficulty: FilterState['difficulty']) => void
  setSearch: (search: string) => void
  setSort: (field: FilterState['sort']['field'], order: FilterState['sort']['order']) => void
  addTag: (tag: string) => void
  removeTag: (tag: string) => void
  clearTags: () => void
  reset: () => void
}

// ============================================================================
// REACT QUERY TYPES
// ============================================================================

export interface QueryKey {
  readonly all: ['content']
  readonly lists: readonly ['content', 'list']
  readonly list: (filters: Partial<FilterState>) => readonly ['content', 'list', Partial<FilterState>]
  readonly details: readonly ['content', 'detail']
  readonly detail: (id: string) => readonly ['content', 'detail', string]
  readonly stats: readonly ['content', 'stats']
  readonly search: (query: string) => readonly ['content', 'search', string]
}

export interface ApiEndpoints {
  content: string
  contentByType: (type: ContentType) => string
  contentByChannel: (channelId: string) => string
  stats: string
  search: string
}

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface UseContentOptions {
  filters?: Partial<FilterState>
  enabled?: boolean
  refetchInterval?: number
}

export interface UseWebSocketOptions {
  autoConnect?: boolean
  reconnect?: boolean
  maxRetries?: number
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type StateSelector<T, R> = (state: T) => R

export type StoreSetState<T> = (partial: T | ((state: T) => T)) => void

export type StoreGetState<T> = () => T