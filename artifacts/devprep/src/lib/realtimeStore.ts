import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ConnectionStatus, RealtimeState, RealtimeActions } from '@/stores/types'

export type { RealtimeState, RealtimeActions }

export const useRealtimeStore = create<RealtimeState & RealtimeActions>()(
  devtools(
    (set, get) => ({
      connectionStatus: 'disconnected',
      retryCount: 0,
      nextRetryIn: null,
      lastConnectedAt: null,
      lastDisconnectedAt: null,
      messageQueue: [],
      isQueueProcessing: false,

      setConnectionStatus: status =>
        set(
          state => ({
            connectionStatus: status,
            ...(status === 'connected' ? { lastConnectedAt: Date.now(), retryCount: 0 } : {}),
            ...(status === 'disconnected' ? { lastDisconnectedAt: Date.now() } : {}),
          }),
          false,
          'realtimeStore/setConnectionStatus'
        ),

      incrementRetryCount: () =>
        set(
          state => ({ retryCount: state.retryCount + 1 }),
          false,
          'realtimeStore/incrementRetryCount'
        ),

      resetRetryCount: () => set({ retryCount: 0 }, false, 'realtimeStore/resetRetryCount'),

      setNextRetryIn: ms => set({ nextRetryIn: ms }, false, 'realtimeStore/setNextRetryIn'),

      setLastConnectedAt: timestamp =>
        set({ lastConnectedAt: timestamp }, false, 'realtimeStore/setLastConnectedAt'),

      setLastDisconnectedAt: timestamp =>
        set({ lastDisconnectedAt: timestamp }, false, 'realtimeStore/setLastDisconnectedAt'),

      addToQueue: message =>
        set(
          state => ({ messageQueue: [...state.messageQueue, message] }),
          false,
          'realtimeStore/addToQueue'
        ),

      clearQueue: () => set({ messageQueue: [] }, false, 'realtimeStore/clearQueue'),

      setIsQueueProcessing: processing =>
        set({ isQueueProcessing: processing }, false, 'realtimeStore/setIsQueueProcessing'),

      processQueue: () => {
        const queue = get().messageQueue
        set({ messageQueue: [], isQueueProcessing: false }, false, 'realtimeStore/processQueue')
        return queue
      },
    }),
    { name: 'realtime-store' }
  )
)
