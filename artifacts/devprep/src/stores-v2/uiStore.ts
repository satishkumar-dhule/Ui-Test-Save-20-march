/**
 * UI Store - Global state for UI elements
 * 
 * Manages theme, modals, sidebar, notifications, and loading states.
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { UIState, UIActions, Theme, ModalType, Notification } from './types'

type UIStore = UIState & UIActions

const initialState: UIState = {
  theme: 'system',
  sidebar: {
    open: true,
    width: 280,
  },
  modal: {
    open: false,
    type: null,
    data: null,
  },
  notifications: [],
  loading: {
    global: false,
    content: false,
    search: false,
  },
}

export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setTheme: (theme: Theme) => {
          set({ theme }, false, 'setTheme')
          
          // Apply theme to document
          if (typeof document !== 'undefined') {
            const root = document.documentElement
            if (theme === 'system') {
              const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
              root.setAttribute('data-theme', systemTheme)
            } else {
              root.setAttribute('data-theme', theme)
            }
          }
        },

        toggleSidebar: () => {
          const { sidebar } = get()
          set({
            sidebar: {
              ...sidebar,
              open: !sidebar.open,
            },
          }, false, 'toggleSidebar')
        },

        setSidebarOpen: (open: boolean) => {
          const { sidebar } = get()
          set({
            sidebar: {
              ...sidebar,
              open,
            },
          }, false, 'setSidebarOpen')
        },

        openModal: (type: ModalType, data?: unknown) => {
          set({
            modal: {
              open: true,
              type,
              data,
            },
          }, false, `openModal:${type}`)
        },

        closeModal: () => {
          set({
            modal: {
              open: false,
              type: null,
              data: null,
            },
          }, false, 'closeModal')
        },

        addNotification: (notification) => {
          const { notifications } = get()
          const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          
          const newNotification: Notification = {
            ...notification,
            id,
            timestamp: Date.now(),
            read: false,
          }
          
          set({
            notifications: [newNotification, ...notifications].slice(0, 50), // Keep last 50
          }, false, 'addNotification')
          
          // Auto-remove after duration
          if (notification.duration !== undefined && notification.duration > 0) {
            setTimeout(() => {
              get().markNotificationRead(id)
            }, notification.duration)
          }
        },

        markNotificationRead: (id: string) => {
          const { notifications } = get()
          set({
            notifications: notifications.map(n =>
              n.id === id ? { ...n, read: true } : n
            ),
          }, false, 'markNotificationRead')
        },

        clearNotifications: () => {
          set({ notifications: [] }, false, 'clearNotifications')
        },

        setLoading: (key, value) => {
          const { loading } = get()
          set({
            loading: {
              ...loading,
              [key]: value,
            },
          }, false, `setLoading:${key}`)
        },
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          theme: state.theme,
          sidebar: state.sidebar,
          notifications: state.notifications,
        }),
      }
    ),
    {
      name: 'UIStore',
      enabled: import.meta.env.DEV,
    }
  )
)

// Selectors
export const uiSelectors = {
  theme: (state: UIStore) => state.theme,
  sidebarOpen: (state: UIStore) => state.sidebar.open,
  sidebarWidth: (state: UIStore) => state.sidebar.width,
  modalOpen: (state: UIStore) => state.modal.open,
  modalType: (state: UIStore) => state.modal.type,
  modalData: (state: UIStore) => state.modal.data,
  notifications: (state: UIStore) => state.notifications,
  unreadNotifications: (state: UIStore) => state.notifications.filter(n => !n.read),
  loading: (state: UIStore) => state.loading,
  isGlobalLoading: (state: UIStore) => state.loading.global,
  isContentLoading: (state: UIStore) => state.loading.content,
  isSearchLoading: (state: UIStore) => state.loading.search,
}