import { useCallback, useRef, useEffect, useState, useMemo } from 'react'

export interface DebouncedValue<T> {
  value: T
  isPending: boolean
}

export function useDebounce<T>(value: T, delay: number): DebouncedValue<T> {
  const [debouncedValue, setDebouncedValue] = useState(value)
  const [isPending, setIsPending] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef(false)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (!pendingRef.current && value !== debouncedValue) {
      setIsPending(true)
      pendingRef.current = true
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
      setIsPending(false)
      pendingRef.current = false
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay, debouncedValue])

  return { value: debouncedValue, isPending }
}

type AnyFunction = (...args: never[]) => unknown

export function useDebouncedCallback<T extends AnyFunction>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState(value)
  const lastExecuted = useRef<number>(Date.now())

  useEffect(() => {
    const now = Date.now()
    const timeSinceLastExecution = now - lastExecuted.current

    if (timeSinceLastExecution >= interval) {
      lastExecuted.current = now
      setThrottledValue(value)
      return
    }
    const timerId = setTimeout(() => {
      lastExecuted.current = Date.now()
      setThrottledValue(value)
    }, interval - timeSinceLastExecution)

    return () => clearTimeout(timerId)
  }, [value, interval])

  return throttledValue
}

export function useThrottledCallback<T extends AnyFunction>(
  callback: T,
  interval: number
): (...args: Parameters<T>) => void {
  const lastExecuted = useRef<number>(0)
  const pendingArgs = useRef<Parameters<T> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastExecution = now - lastExecuted.current

      if (timeSinceLastExecution >= interval) {
        lastExecuted.current = now
        callback(...args)
      } else {
        pendingArgs.current = args
        if (!timeoutRef.current) {
          timeoutRef.current = setTimeout(() => {
            if (pendingArgs.current) {
              lastExecuted.current = Date.now()
              callback(...pendingArgs.current)
              pendingArgs.current = null
            }
            timeoutRef.current = null
          }, interval - timeSinceLastExecution)
        }
      }
    },
    [callback, interval]
  )
}

export function useMemoCompare<T>(value: T, compare: (prev: T | undefined, next: T) => boolean): T {
  const prevRef = useRef<T | undefined>(undefined)
  const prev = prevRef.current

  const isEqual = useMemo(() => compare(prev, value), [prev, value, compare])

  const memoizedValue = useMemo(() => {
    if (!isEqual) {
      prevRef.current = value
    }
    return isEqual && prev !== undefined ? prev : value
  }, [value, isEqual, prev])

  return memoizedValue
}

export function useStableMemo<T>(factory: () => T, deps: unknown[]): T {
  const depsRef = useRef(deps)
  const valueRef = useRef<T | null>(null)

  const depsChanged = deps.some((dep, i) => !Object.is(dep, depsRef.current[i]))

  if (depsChanged || valueRef.current === null) {
    depsRef.current = deps
    valueRef.current = factory()
  }

  return valueRef.current
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined as unknown as T)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

export function useCreation<T>(factory: () => T, deps: unknown[]): T {
  const { current } = useRef<{ deps: unknown[]; value: T }>({
    deps: [],
    value: factory(),
  })

  if (deps.some((dep, i) => !Object.is(dep, current.deps[i]))) {
    current.deps = deps
    current.value = factory()
  }

  return current.value
}
