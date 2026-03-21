import { useState, useCallback } from 'react'

interface UseMobileNavigationOptions {
  initialOpen?: boolean
}

export function useMobileNavigation(options: UseMobileNavigationOptions = {}) {
  const { initialOpen = false } = options
  const [isDrawerOpen, setIsDrawerOpen] = useState(initialOpen)

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false)
  }, [])

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev)
  }, [])

  return {
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    setIsDrawerOpen,
  }
}
