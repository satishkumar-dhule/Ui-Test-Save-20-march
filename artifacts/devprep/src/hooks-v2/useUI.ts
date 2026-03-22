/**
 * useUI - React hooks for UI state management
 * 
 * Provides hooks for theme, modal, sidebar, and notification management.
 */

import { useEffect } from 'react'
import { useUIStore } from '../stores-v2/uiStore'
import { Theme, ModalType, Notification } from '../stores-v2/types'

// Main UI hook
export function useUI() {
  return useUIStore()
}

// Theme hooks
export function useTheme() {
  const { theme, setTheme } = useUIStore()
  
  // Apply theme on change
  useEffect(() => {
    if (typeof document === 'undefined') return
    
    const root = document.documentElement
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.setAttribute('data-theme', systemTheme)
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light')
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      root.setAttribute('data-theme', theme)
      return () => {} // Empty cleanup for non-system theme
    }
  }, [theme])
  
  return { theme, setTheme }
}

// Sidebar hooks
export function useSidebar() {
  const { sidebar, toggleSidebar, setSidebarOpen } = useUIStore()
  
  return {
    isOpen: sidebar.open,
    width: sidebar.width,
    toggle: toggleSidebar,
    setOpen: setSidebarOpen,
  }
}

// Modal hooks
export function useModal() {
  const { modal, openModal, closeModal } = useUIStore()
  
  return {
    isOpen: modal.open,
    type: modal.type,
    data: modal.data,
    open: openModal,
    close: closeModal,
  }
}

// Notification hooks
export function useNotifications() {
  const { 
    notifications, 
    addNotification, 
    markNotificationRead, 
    clearNotifications 
  } = useUIStore()
  
  const unreadCount = notifications.filter(n => !n.read).length
  
  return {
    notifications,
    unreadCount,
    add: addNotification,
    markRead: markNotificationRead,
    clear: clearNotifications,
    
    // Convenience methods
    success: (title: string, message?: string) => 
      addNotification({ type: 'success', title, message }),
    error: (title: string, message?: string) => 
      addNotification({ type: 'error', title, message }),
    warning: (title: string, message?: string) => 
      addNotification({ type: 'warning', title, message }),
    info: (title: string, message?: string) => 
      addNotification({ type: 'info', title, message }),
  }
}

// Loading hooks
export function useLoading() {
  const { loading, setLoading } = useUIStore()
  
  return {
    ...loading,
    setGlobal: (value: boolean) => setLoading('global', value),
    setContent: (value: boolean) => setLoading('content', value),
    setSearch: (value: boolean) => setLoading('search', value),
  }
}

// Combined UI state hook
export function useUIState() {
  const theme = useTheme()
  const sidebar = useSidebar()
  const modal = useModal()
  const notifications = useNotifications()
  const loading = useLoading()
  
  return {
    theme,
    sidebar,
    modal,
    notifications,
    loading,
  }
}