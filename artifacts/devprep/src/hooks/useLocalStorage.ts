import { useState, useCallback } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  // Stable setter — uses functional update so it never captures stale state
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue(prev => {
        const valueToStore = value instanceof Function ? value(prev) : value
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        } catch (error) {
          console.error(error)
        }
        return valueToStore
      })
    },
    [key]
  )

  return [storedValue, setValue] as const
}
