/**
 * User Store - Global state for user preferences and authentication
 * 
 * Handles user settings, saved channels, and recent searches.
 * Persists to localStorage.
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { UserPreferences, UserStoreState, UserActions } from './types'

type UserStore = UserStoreState & UserActions

const defaultPreferences: UserPreferences = {
  theme: 'system',
  notifications: true,
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
  defaultContentType: null,
  savedChannels: [],
  recentSearches: [],
  displayQualityScores: true,
  compactMode: false,
}

const initialState: UserStoreState = {
  preferences: defaultPreferences,
  isAuthenticated: false,
  lastActive: Date.now(),
}

export const useUserStore = create<UserStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setPreference: (key, value) => {
          const { preferences } = get()
          set({
            preferences: {
              ...preferences,
              [key]: value,
            },
          }, false, `setPreference:${key}`)
        },

        setPreferences: (prefs) => {
          const { preferences } = get()
          set({
            preferences: {
              ...preferences,
              ...prefs,
            },
          }, false, 'setPreferences')
        },

        addSavedChannel: (channelId) => {
          const { preferences } = get()
          if (preferences.savedChannels.includes(channelId)) return
          
          set({
            preferences: {
              ...preferences,
              savedChannels: [...preferences.savedChannels, channelId],
            },
          }, false, 'addSavedChannel')
        },

        removeSavedChannel: (channelId) => {
          const { preferences } = get()
          set({
            preferences: {
              ...preferences,
              savedChannels: preferences.savedChannels.filter(id => id !== channelId),
            },
          }, false, 'removeSavedChannel')
        },

        addRecentSearch: (query) => {
          const { preferences } = get()
          const trimmedQuery = query.trim()
          if (!trimmedQuery) return
          
          // Remove duplicate if exists, add to front, limit to 10
          const searches = [
            trimmedQuery,
            ...preferences.recentSearches.filter(s => s !== trimmedQuery),
          ].slice(0, 10)
          
          set({
            preferences: {
              ...preferences,
              recentSearches: searches,
            },
          }, false, 'addRecentSearch')
        },

        clearRecentSearches: () => {
          const { preferences } = get()
          set({
            preferences: {
              ...preferences,
              recentSearches: [],
            },
          }, false, 'clearRecentSearches')
        },

        logout: () => {
          set({
            isAuthenticated: false,
            lastActive: Date.now(),
          }, false, 'logout')
        },
      }),
      {
        name: 'user-store',
        partialize: (state) => ({
          preferences: state.preferences,
          isAuthenticated: state.isAuthenticated,
          lastActive: state.lastActive,
        }),
      }
    ),
    {
      name: 'UserStore',
      enabled: import.meta.env.DEV,
    }
  )
)

// Selectors
export const userSelectors = {
  preferences: (state: UserStore) => state.preferences,
  isAuthenticated: (state: UserStore) => state.isAuthenticated,
  theme: (state: UserStore) => state.preferences.theme,
  savedChannels: (state: UserStore) => state.preferences.savedChannels,
  recentSearches: (state: UserStore) => state.preferences.recentSearches,
  displayQualityScores: (state: UserStore) => state.preferences.displayQualityScores,
  compactMode: (state: UserStore) => state.preferences.compactMode,
  isChannelSaved: (channelId: string) => (state: UserStore) =>
    state.preferences.savedChannels.includes(channelId),
}