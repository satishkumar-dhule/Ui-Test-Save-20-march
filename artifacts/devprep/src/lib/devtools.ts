/**
 * DevTools Integration for DevPrep State Management
 *
 * Provides comprehensive debugging capabilities for:
 * - Zustand stores with Redux DevTools extension
 * - React Query DevTools
 * - WebSocket connection monitoring
 * - State snapshots and time-travel debugging
 */

import type { DevToolsConfig, StateDevTools } from '@/stores/types'

// ============================================================================
// ZUSTAND DEVTOOLS INTEGRATION
// ============================================================================

/**
 * Re-export zustand devtools for convenience
 */
export { devtools as zustandDevtools } from 'zustand/middleware'

/**
 * Store name mapping for better DevTools labeling
 */
export const STORE_NAMES = {
  content: 'Content Store',
  realtime: 'Realtime Store',
  filter: 'Filter Store',
  agent: 'Agent Store',
} as const

/**
 * Action name formatting for better DevTools readability
 */
export function formatActionName(storeName: string, actionName: string): string {
  return `[${storeName}] ${actionName}`
}

// ============================================================================
// REDUX DEVTOOLS EXTENSION INTEGRATION
// ============================================================================

class ReduxDevToolsIntegration {
  private devTools: StateDevTools | null = null
  private isConnected = false
  private storeName: string

  constructor(storeName: string) {
    this.storeName = storeName
  }

  connect(config?: DevToolsConfig): boolean {
    if (typeof window === 'undefined') return false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extension = (window as any).__REDUX_DEVTOOLS_EXTENSION__
    if (!extension) {
      console.warn('[DevTools] Redux DevTools extension not found')
      return false
    }

    try {
      this.devTools = extension.connect({
        name: `${this.storeName} - DevPrep`,
        features: {
          pause: true,
          lock: true,
          persist: false,
          export: true,
          import: 'custom',
          jump: true,
          skip: false,
          reorder: false,
          dispatch: true,
          test: false,
        },
        ...config,
      })

      this.isConnected = true
      console.log(`[DevTools] Connected to ${this.storeName}`)
      return true
    } catch (error) {
      console.error('[DevTools] Failed to connect:', error)
      return false
    }
  }

  send(action: string, state: unknown, _prevState?: unknown): void {
    if (!this.isConnected || !this.devTools) return

    this.devTools.send(action, state)
  }

  subscribe(callback: (message: unknown) => void): (() => void) | null {
    if (!this.isConnected || !this.devTools) return null

    return this.devTools.subscribe(callback)
  }

  disconnect(): void {
    if (this.devTools) {
      this.devTools.disconnect()
      this.isConnected = false
      console.log(`[DevTools] Disconnected from ${this.storeName}`)
    }
  }

  logState(state: unknown, label?: string): void {
    if (!this.isConnected) return

    const message = label || `${this.storeName} State`
    console.groupCollapsed(`[DevTools] ${message}`)
    console.log('State:', state)
    console.groupEnd()
  }
}

// ============================================================================
// REACT QUERY DEVTOOLS
// ============================================================================

export function getReactQueryDevtoolsConfig() {
  return {
    initialIsOpen: false,
    position: 'bottom-right' as const,
    buttonPosition: 'bottom-right' as const,
    closeButton: true,
    arrowButton: true,
    openButton: true,
    panelStyle: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    style: {
      fontFamily: 'monospace',
    },
  }
}

// ============================================================================
// WEBSOCKET MONITORING
// ============================================================================

interface WebSocketMessage {
  type: string
  timestamp: number
  data?: unknown
}

class WebSocketMonitor {
  private messages: WebSocketMessage[] = []
  private maxMessages = 100
  private isEnabled = false

  enable(): void {
    this.isEnabled = true
    console.log('[WebSocketMonitor] Enabled')
  }

  disable(): void {
    this.isEnabled = false
    console.log('[WebSocketMonitor] Disabled')
  }

  logMessage(message: WebSocketMessage): void {
    if (!this.isEnabled) return

    this.messages.push({
      ...message,
      timestamp: Date.now(),
    })

    // Keep only last N messages
    if (this.messages.length > this.maxMessages) {
      this.messages.shift()
    }

    console.log(`[WebSocketMonitor] ${message.type}:`, message.data)
  }

  getMessages(): WebSocketMessage[] {
    return [...this.messages]
  }

  clear(): void {
    this.messages = []
    console.log('[WebSocketMonitor] Cleared')
  }

  getStats(): {
    totalMessages: number
    messagesByType: Record<string, number>
    lastMessage: WebSocketMessage | null
  } {
    const messagesByType: Record<string, number> = {}

    this.messages.forEach(msg => {
      messagesByType[msg.type] = (messagesByType[msg.type] || 0) + 1
    })

    return {
      totalMessages: this.messages.length,
      messagesByType,
      lastMessage: this.messages[this.messages.length - 1] || null,
    }
  }
}

// ============================================================================
// STATE SNAPSHOT AND TIME TRAVEL
// ============================================================================

interface StateSnapshot {
  timestamp: number
  stores: Record<string, unknown>
  url: string
}

class StateSnapshotManager {
  private snapshots: StateSnapshot[] = []
  private maxSnapshots = 50

  captureSnapshot(stores: Record<string, unknown>): StateSnapshot {
    const snapshot: StateSnapshot = {
      timestamp: Date.now(),
      stores: { ...stores },
      url: typeof window !== 'undefined' ? window.location.href : '',
    }

    this.snapshots.push(snapshot)

    // Keep only last N snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift()
    }

    console.log('[SnapshotManager] Captured snapshot:', snapshot.timestamp)
    return snapshot
  }

  getSnapshots(): StateSnapshot[] {
    return [...this.snapshots]
  }

  getSnapshot(timestamp: number): StateSnapshot | null {
    return this.snapshots.find(s => s.timestamp === timestamp) || null
  }

  restoreSnapshot(snapshot: StateSnapshot): void {
    console.log('[SnapshotManager] Restoring snapshot:', snapshot.timestamp)
    // This would need to be implemented based on the specific store structure
  }

  clear(): void {
    this.snapshots = []
    console.log('[SnapshotManager] Cleared')
  }

  exportSnapshots(): string {
    return JSON.stringify(this.snapshots, null, 2)
  }

  importSnapshots(data: string): void {
    try {
      this.snapshots = JSON.parse(data)
      console.log('[SnapshotManager] Imported snapshots:', this.snapshots.length)
    } catch (error) {
      console.error('[SnapshotManager] Failed to import snapshots:', error)
    }
  }
}

// ============================================================================
// GLOBAL DEVTOOLS INSTANCE
// ============================================================================

export const devToolsRegistry = {
  stores: new Map<string, ReduxDevToolsIntegration>(),
  webSocketMonitor: new WebSocketMonitor(),
  snapshotManager: new StateSnapshotManager(),

  registerStore(storeName: string): ReduxDevToolsIntegration {
    const integration = new ReduxDevToolsIntegration(storeName)
    integration.connect()
    this.stores.set(storeName, integration)
    return integration
  },

  getStore(storeName: string): ReduxDevToolsIntegration | null {
    return this.stores.get(storeName) || null
  },

  unregisterStore(storeName: string): void {
    const integration = this.stores.get(storeName)
    if (integration) {
      integration.disconnect()
      this.stores.delete(storeName)
    }
  },

  enableAll(): void {
    this.stores.forEach(integration => {
      integration.connect()
    })
    this.webSocketMonitor.enable()
    console.log('[DevTools] All monitoring enabled')
  },

  disableAll(): void {
    this.stores.forEach(integration => {
      integration.disconnect()
    })
    this.webSocketMonitor.disable()
    console.log('[DevTools] All monitoring disabled')
  },

  captureSnapshot(): void {
    const stores: Record<string, unknown> = {}
    this.stores.forEach((integration, name) => {
      // This would need to get the current state from each store
      stores[name] = {} // Placeholder
    })
    this.snapshotManager.captureSnapshot(stores)
  },
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Log state changes to console with formatting
 */
export function logStateChange(
  storeName: string,
  action: string,
  prevState: unknown,
  nextState: unknown
): void {
  if (process.env.NODE_ENV !== 'development') return

  console.groupCollapsed(`[${storeName}] ${action}`)
  console.log('Previous:', prevState)
  console.log('Next:', nextState)
  console.log('Diff:', getDiff(prevState, nextState))
  console.groupEnd()
}

/**
 * Simple diff calculation between two objects
 */
function getDiff(prev: unknown, next: unknown): Record<string, { from: unknown; to: unknown }> {
  const diff: Record<string, { from: unknown; to: unknown }> = {}

  if (typeof prev === 'object' && typeof next === 'object' && prev && next) {
    const allKeys = new Set([...Object.keys(prev as object), ...Object.keys(next as object)])

    allKeys.forEach(key => {
      const prevValue = (prev as Record<string, unknown>)[key]
      const nextValue = (next as Record<string, unknown>)[key]

      if (prevValue !== nextValue) {
        diff[key] = { from: prevValue, to: nextValue }
      }
    })
  }

  return diff
}

/**
 * Performance monitoring for state updates
 */
export function measureStateUpdate<T>(updateFn: () => T, storeName: string, action: string): T {
  const start = performance.now()
  const result = updateFn()
  const end = performance.now()
  const duration = end - start

  if (duration > 10) {
    console.warn(
      `[Performance] Slow state update in ${storeName}/${action}: ${duration.toFixed(2)}ms`
    )
  }

  return result
}

// ============================================================================
// AUTO-ENABLE IN DEVELOPMENT
// ============================================================================

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Expose DevTools to window for debugging
  const devTools = {
    registry: devToolsRegistry,
    stores: devToolsRegistry.stores,
    webSocketMonitor: devToolsRegistry.webSocketMonitor,
    snapshotManager: devToolsRegistry.snapshotManager,
    enable: () => devToolsRegistry.enableAll(),
    disable: () => devToolsRegistry.disableAll(),
    captureSnapshot: () => devToolsRegistry.captureSnapshot(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).__DEVTOOLS__ = devTools

  console.log('[DevTools] Available on window.__DEVTOOLS__')
  console.log('[DevTools] Enable with: window.__DEVTOOLS__.enable()')
}
