/**
 * Navigation Store - Global navigation state management
 * 
 * Manages route state, breadcrumbs, command palette, and navigation history.
 * Provides centralized navigation control for the entire application.
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// ============================================================================
// Navigation Types
// ============================================================================

export interface Breadcrumb {
  label: string
  path: string
  icon?: string
}

export interface NavItem {
  id: string
  label: string
  path: string
  icon: string
  description?: string
  children?: NavItem[]
  badge?: number
  shortcut?: string
}

export interface NavigationState {
  // Current route
  activeRoute: string
  previousRoute: string | null
  
  // Breadcrumbs
  breadcrumbs: Breadcrumb[]
  
  // UI state
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  searchOpen: boolean
  
  // History
  recentRoutes: string[]
  maxRecentRoutes: number
  
  // Navigation items cache
  navigationItems: NavItem[]
  
  // Loading state
  isNavigating: boolean
}

export interface NavigationActions {
  // Route management
  setActiveRoute: (route: string) => void
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void
  addBreadcrumb: (crumb: Breadcrumb) => void
  clearBreadcrumbs: () => void
  
  // UI toggles
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleSearch: () => void
  setSearchOpen: (open: boolean) => void
  
  // History management
  addRecentRoute: (route: string) => void
  clearRecentRoutes: () => void
  removeFromRecent: (route: string) => void
  
  // Navigation items
  setNavigationItems: (items: NavItem[]) => void
  updateNavItem: (id: string, updates: Partial<NavItem>) => void
  
  // Loading state
  setNavigating: (isNavigating: boolean) => void
}

type NavigationStore = NavigationState & NavigationActions

// ============================================================================
// Initial State
// ============================================================================

const initialState: NavigationState = {
  activeRoute: '/',
  previousRoute: null,
  breadcrumbs: [{ label: 'Home', path: '/', icon: '🏠' }],
  sidebarOpen: true,
  commandPaletteOpen: false,
  searchOpen: false,
  recentRoutes: [],
  maxRecentRoutes: 10,
  navigationItems: [],
  isNavigating: false,
}

// ============================================================================
// Default Navigation Items
// ============================================================================

const defaultNavigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: '🏠',
    description: 'Overview of your progress and recent activity',
  },
  {
    id: 'content',
    label: 'Content Library',
    path: '/content',
    icon: '📚',
    description: 'Browse all learning content',
    children: [
      { id: 'content-all', label: 'All Content', path: '/content', icon: '📋' },
      { id: 'content-questions', label: 'Questions', path: '/content/question', icon: '❓' },
      { id: 'content-flashcards', label: 'Flashcards', path: '/content/flashcard', icon: '🎴' },
      { id: 'content-exams', label: 'Exams', path: '/content/exam', icon: '📝' },
      { id: 'content-coding', label: 'Coding Challenges', path: '/content/coding', icon: '💻' },
      { id: 'content-voice', label: 'Voice Practice', path: '/content/voice', icon: '🎙️' },
    ],
  },
  {
    id: 'channels',
    label: 'Channels',
    path: '/channels',
    icon: '📡',
    description: 'Topic-specific learning tracks',
    children: [
      { id: 'channels-all', label: 'All Channels', path: '/channels', icon: '🌐' },
      { id: 'channels-javascript', label: 'JavaScript', path: '/channels/javascript', icon: '🟨' },
      { id: 'channels-react', label: 'React', path: '/channels/react', icon: '⚛️' },
      { id: 'channels-algorithms', label: 'Algorithms', path: '/channels/algorithms', icon: '🧮' },
      { id: 'channels-devops', label: 'DevOps', path: '/channels/devops', icon: '🔧' },
      { id: 'channels-kubernetes', label: 'Kubernetes', path: '/channels/kubernetes', icon: '⎈' },
      { id: 'channels-typescript', label: 'TypeScript', path: '/channels/typescript', icon: '🔷' },
      { id: 'channels-nodejs', label: 'Node.js', path: '/channels/nodejs', icon: '🟩' },
      { id: 'channels-python', label: 'Python', path: '/channels/python', icon: '🐍' },
      { id: 'channels-system-design', label: 'System Design', path: '/channels/system-design', icon: '🏗️' },
      { id: 'channels-database', label: 'Database', path: '/channels/database', icon: '🗄️' },
      { id: 'channels-security', label: 'Security', path: '/channels/security', icon: '🔒' },
    ],
  },
  {
    id: 'practice',
    label: 'Practice',
    path: '/practice',
    icon: '🎯',
    description: 'Interactive practice sessions',
    children: [
      { id: 'practice-exam', label: 'Exam Practice', path: '/practice/exam', icon: '📝' },
      { id: 'practice-coding', label: 'Coding Challenges', path: '/practice/coding', icon: '💻' },
      { id: 'practice-voice', label: 'Voice Interviews', path: '/practice/voice', icon: '🎤' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/analytics',
    icon: '📊',
    description: 'Progress tracking and insights',
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: '⚙️',
    description: 'Preferences and account settings',
  },
]

// ============================================================================
// Store Creation
// ============================================================================

export const useNavigationStore = create<NavigationStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        navigationItems: defaultNavigationItems,

        // ====================================================================
        // Route Management
        // ====================================================================

        setActiveRoute: (route: string) => {
          const { activeRoute, recentRoutes, maxRecentRoutes } = get()
          
          // Update recent routes (avoid duplicates, keep most recent first)
          const newRecentRoutes = [
            route,
            ...recentRoutes.filter(r => r !== route)
          ].slice(0, maxRecentRoutes)
          
          set({
            activeRoute: route,
            previousRoute: activeRoute,
            recentRoutes: newRecentRoutes,
            isNavigating: false,
          }, false, 'setActiveRoute')
        },

        setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => {
          set({ breadcrumbs }, false, 'setBreadcrumbs')
        },

        addBreadcrumb: (crumb: Breadcrumb) => {
          const { breadcrumbs } = get()
          // Avoid duplicates
          if (!breadcrumbs.some(b => b.path === crumb.path)) {
            set({ breadcrumbs: [...breadcrumbs, crumb] }, false, 'addBreadcrumb')
          }
        },

        clearBreadcrumbs: () => {
          set({ breadcrumbs: [{ label: 'Home', path: '/', icon: '🏠' }] }, false, 'clearBreadcrumbs')
        },

        // ====================================================================
        // UI Toggles
        // ====================================================================

        toggleSidebar: () => {
          const { sidebarOpen } = get()
          set({ sidebarOpen: !sidebarOpen }, false, 'toggleSidebar')
        },

        setSidebarOpen: (open: boolean) => {
          set({ sidebarOpen: open }, false, 'setSidebarOpen')
        },

        toggleCommandPalette: () => {
          const { commandPaletteOpen } = get()
          set({ commandPaletteOpen: !commandPaletteOpen }, false, 'toggleCommandPalette')
        },

        setCommandPaletteOpen: (open: boolean) => {
          set({ commandPaletteOpen: open }, false, 'setCommandPaletteOpen')
        },

        toggleSearch: () => {
          const { searchOpen } = get()
          set({ searchOpen: !searchOpen }, false, 'toggleSearch')
        },

        setSearchOpen: (open: boolean) => {
          set({ searchOpen: open }, false, 'setSearchOpen')
        },

        // ====================================================================
        // History Management
        // ====================================================================

        addRecentRoute: (route: string) => {
          const { recentRoutes, maxRecentRoutes } = get()
          const newRecentRoutes = [
            route,
            ...recentRoutes.filter(r => r !== route)
          ].slice(0, maxRecentRoutes)
          
          set({ recentRoutes: newRecentRoutes }, false, 'addRecentRoute')
        },

        clearRecentRoutes: () => {
          set({ recentRoutes: [] }, false, 'clearRecentRoutes')
        },

        removeFromRecent: (route: string) => {
          const { recentRoutes } = get()
          set({ 
            recentRoutes: recentRoutes.filter(r => r !== route) 
          }, false, 'removeFromRecent')
        },

        // ====================================================================
        // Navigation Items
        // ====================================================================

        setNavigationItems: (items: NavItem[]) => {
          set({ navigationItems: items }, false, 'setNavigationItems')
        },

        updateNavItem: (id: string, updates: Partial<NavItem>) => {
          const { navigationItems } = get()
          const updatedItems = navigationItems.map(item =>
            item.id === id ? { ...item, ...updates } : item
          )
          set({ navigationItems: updatedItems }, false, 'updateNavItem')
        },

        // ====================================================================
        // Loading State
        // ====================================================================

        setNavigating: (isNavigating: boolean) => {
          set({ isNavigating }, false, 'setNavigating')
        },
      }),
      {
        name: 'navigation-store',
        partialize: (state) => ({
          // Persist only these fields
          sidebarOpen: state.sidebarOpen,
          recentRoutes: state.recentRoutes,
          navigationItems: state.navigationItems,
        }),
      }
    ),
    {
      name: 'NavigationStore',
      enabled: import.meta.env.DEV,
    }
  )
)

// ============================================================================
// Selectors
// ============================================================================

export const navigationSelectors = {
  activeRoute: (state: NavigationStore) => state.activeRoute,
  previousRoute: (state: NavigationStore) => state.previousRoute,
  breadcrumbs: (state: NavigationStore) => state.breadcrumbs,
  sidebarOpen: (state: NavigationStore) => state.sidebarOpen,
  commandPaletteOpen: (state: NavigationStore) => state.commandPaletteOpen,
  searchOpen: (state: NavigationStore) => state.searchOpen,
  recentRoutes: (state: NavigationStore) => state.recentRoutes,
  navigationItems: (state: NavigationStore) => state.navigationItems,
  isNavigating: (state: NavigationStore) => state.isNavigating,
  
  // Derived selectors
  currentNavItem: (state: NavigationStore) => 
    findNavItemByPath(state.navigationItems, state.activeRoute),
  
  flatNavigationItems: (state: NavigationStore) => 
    flattenNavigationItems(state.navigationItems),
  
  // Quick access items (dashboard, content, practice)
  quickAccessItems: (state: NavigationStore) =>
    state.navigationItems.filter(item => 
      ['dashboard', 'content', 'practice'].includes(item.id)
    ),
}

// ============================================================================
// Helper Functions
// ============================================================================

function findNavItemByPath(items: NavItem[], path: string): NavItem | null {
  for (const item of items) {
    if (item.path === path) return item
    if (item.children) {
      const child = findNavItemByPath(item.children, path)
      if (child) return child
    }
  }
  return null
}

function flattenNavigationItems(items: NavItem[]): NavItem[] {
  const result: NavItem[] = []
  
  function flatten(item: NavItem) {
    result.push(item)
    if (item.children) {
      item.children.forEach(flatten)
    }
  }
  
  items.forEach(flatten)
  return result
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Hook for navigation with automatic breadcrumb updates
 */
export function useNavigation() {
  const store = useNavigationStore()
  
  const navigate = (path: string, options?: { replace?: boolean }) => {
    store.setNavigating(true)
    
    // In a real app, you would call your router here
    // For now, we'll simulate navigation
    setTimeout(() => {
      store.setActiveRoute(path)
      
      // Auto-generate breadcrumbs based on path
      const breadcrumbs = generateBreadcrumbs(path, store.navigationItems)
      store.setBreadcrumbs(breadcrumbs)
    }, 0)
  }
  
  const goBack = () => {
    if (store.previousRoute) {
      navigate(store.previousRoute)
    }
  }
  
  const goHome = () => {
    navigate('/')
  }
  
  return {
    ...store,
    navigate,
    goBack,
    goHome,
  }
}

/**
 * Generate breadcrumbs from path and navigation items
 */
function generateBreadcrumbs(path: string, navItems: NavItem[]): Breadcrumb[] {
  const breadcrumbs: Breadcrumb[] = [{ label: 'Home', path: '/', icon: '🏠' }]
  
  if (path === '/') return breadcrumbs
  
  const segments = path.split('/').filter(Boolean)
  let currentPath = ''
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    
    // Try to find matching nav item
    const navItem = findNavItemByPath(navItems, currentPath)
    
    if (navItem) {
      breadcrumbs.push({
        label: navItem.label,
        path: currentPath,
        icon: navItem.icon,
      })
    } else {
      // Fallback: convert segment to label
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
      breadcrumbs.push({
        label,
        path: currentPath,
      })
    }
  })
  
  return breadcrumbs
}

// Export types for external use
export type { NavigationStore as NavigationStoreType }