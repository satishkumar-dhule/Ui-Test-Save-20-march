/**
 * Custom hook for syncing state with localStorage.
 * Replaces scattered useEffects that handle localStorage synchronization.
 */

import { useState, useEffect, useCallback, useRef } from "react";

export interface UseLocalStorageOptions<T> {
  /** Key to use in localStorage */
  key: string;
  /** Initial value if nothing in localStorage */
  initialValue: T;
  /** Optional validator function to validate parsed values */
  validator?: (value: unknown) => value is T;
  /** Optional callback when value changes */
  onChange?: (value: T) => void;
}

export interface UseLocalStorageReturn<T> {
  /** Current value synced with localStorage */
  value: T;
  /** Function to update the value (also saves to localStorage) */
  setValue: (value: T | ((prev: T) => T)) => void;
  /** Remove the value from localStorage */
  removeValue: () => void;
  /** Check if there's a stored value */
  hasStoredValue: boolean;
}

/**
 * Hook for persisting state to localStorage with automatic synchronization.
 */
export function useLocalStorage<T>({
  key,
  initialValue,
  validator,
  onChange,
}: UseLocalStorageOptions<T>): UseLocalStorageReturn<T> {
  const [value, setValueInternal] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const stored = window.localStorage.getItem(key);
      if (stored === null) {
        return initialValue;
      }
      const parsed = JSON.parse(stored);
      if (validator && !validator(parsed)) {
        return initialValue;
      }
      return parsed as T;
    } catch {
      return initialValue;
    }
  });

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue) as T;
          if (!validator || validator(newValue)) {
            setValueInternal(newValue);
            onChangeRef.current?.(newValue);
          }
        } catch {
          // Invalid JSON, ignore
        }
      } else if (e.key === key && e.newValue === null) {
        setValueInternal(initialValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key, initialValue, validator]);

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValueInternal((prev) => {
        const valueToStore =
          typeof newValue === "function"
            ? (newValue as (prev: T) => T)(prev)
            : newValue;

        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          onChangeRef.current?.(valueToStore);
        } catch (error) {
          console.error(`[useLocalStorage] Failed to save ${key}:`, error);
        }

        return valueToStore;
      });
    },
    [key],
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setValueInternal(initialValue);
      onChangeRef.current?.(initialValue);
    } catch (error) {
      console.error(`[useLocalStorage] Failed to remove ${key}:`, error);
    }
  }, [key, initialValue]);

  const hasStoredValue = useCallback(() => {
    return window.localStorage.getItem(key) !== null;
  }, [key]);

  return {
    value,
    setValue,
    removeValue,
    hasStoredValue: hasStoredValue(),
  };
}
