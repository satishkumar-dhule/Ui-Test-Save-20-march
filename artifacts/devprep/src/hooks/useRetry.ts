import { useState, useCallback } from 'react'

interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
  backoff?: boolean
  onRetry?: (attempt: number, error: Error) => void
  onError?: (error: Error, attempts: number) => void
}

interface RetryState {
  attempts: number
  isRetrying: boolean
  lastError: Error | null
}

export function useRetry<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  options: RetryOptions = {}
) {
  const { maxAttempts = 3, delayMs = 1000, backoff = true, onRetry, onError } = options

  const [state, setState] = useState<RetryState>({
    attempts: 0,
    isRetrying: false,
    lastError: null,
  })

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      let lastError: Error | null = null

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          setState({ attempts: attempt, isRetrying: attempt < maxAttempts, lastError: null })
          const result = await fn(...args)
          return result
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))

          if (attempt < maxAttempts) {
            const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs
            onRetry?.(attempt, lastError)

            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }

      setState({ attempts: maxAttempts, isRetrying: false, lastError })
      onError?.(lastError!, maxAttempts)
      throw lastError
    },
    [fn, maxAttempts, delayMs, backoff, onRetry, onError]
  )

  return { execute, ...state }
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxAttempts = 3, delayMs = 1000, backoff = true, onRetry, onError } = options

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < maxAttempts) {
        const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs
        onRetry?.(attempt, lastError)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  onError?.(lastError!, maxAttempts)
  throw lastError
}
