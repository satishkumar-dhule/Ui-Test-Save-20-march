/**
 * useUser - React hooks for user state management
 * 
 * Provides hooks for user preferences, saved channels, and recent searches.
 */

import { useUserStore } from '../stores-v2/userStore'
import { UserPreferences, Theme, ContentType } from '../stores-v2/types'

// Main user hook
export function useUser() {
  return useUserStore()
}

// Preferences hook
export function usePreferences() {
  const { preferences, setPreference, setPreferences } = useUserStore()
  
  return {
    ...preferences,
    set: setPreference,
    setMany: setPreferences,
    
    // Convenience setters
    setTheme: (theme: Theme) => setPreference('theme', theme),
    setNotifications: (enabled: boolean) => setPreference('notifications', enabled),
    setAutoRefresh: (enabled: boolean) => setPreference('autoRefresh', enabled),
    setRefreshInterval: (interval: number) => setPreference('refreshInterval', interval),
    setDefaultContentType: (type: ContentType | null) => setPreference('defaultContentType', type),
    setDisplayQualityScores: (display: boolean) => setPreference('displayQualityScores', display),
    setCompactMode: (enabled: boolean) => setPreference('compactMode', enabled),
  }
}

// Saved channels hook
export function useSavedChannels() {
  const { preferences, addSavedChannel, removeSavedChannel } = useUserStore()
  
  const isChannelSaved = (channelId: string) => 
    preferences.savedChannels.includes(channelId)
  
  const toggleChannel = (channelId: string) => {
    if (isChannelSaved(channelId)) {
      removeSavedChannel(channelId)
    } else {
      addSavedChannel(channelId)
    }
  }
  
  return {
    savedChannels: preferences.savedChannels,
    add: addSavedChannel,
    remove: removeSavedChannel,
    toggle: toggleChannel,
    isSaved: isChannelSaved,
  }
}

// Recent searches hook
export function useRecentSearches() {
  const { preferences, addRecentSearch, clearRecentSearches } = useUserStore()
  
  return {
    recentSearches: preferences.recentSearches,
    add: addRecentSearch,
    clear: clearRecentSearches,
  }
}

// Authentication hook
export function useAuth() {
  const { isAuthenticated, logout } = useUserStore()
  
  return {
    isAuthenticated,
    logout,
    // Note: login would require backend integration
  }
}

// Combined user state hook
export function useUserState() {
  const preferences = usePreferences()
  const savedChannels = useSavedChannels()
  const recentSearches = useRecentSearches()
  const auth = useAuth()
  
  return {
    preferences,
    savedChannels,
    recentSearches,
    auth,
  }
}