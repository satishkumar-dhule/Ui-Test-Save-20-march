/**
 * Client-Side Error Reporting Hook
 *
 * Provides integration with external error tracking services.
 * Currently supports basic error logging (can be extended for others).
 */

import { useEffect, useRef, useCallback, useState } from 'react'

export interface ErrorReport {
  id: string
  message: string
  stack?: string
  timestamp: number
  context?: Record<string, unknown>
  user?: {
    id?: string
    email?: string
  }
  tags?: Record<string, string>
}

export interface UseErrorReportingOptions {
  /** Enable error reporting */
  enabled?: boolean
  /** Application version */
  release?: string
  /** Environment */
  environment?: string
  /** User ID (if authenticated) */
  userId?: string
  /** User email (if authenticated) */
  userEmail?: string
  /** Additional tags to include with every error */
  tags?: Record<string, string>
  /** Maximum number of errors to keep in memory */
  maxErrors?: number
  /** Callback when error is reported */
  onError?: (error: ErrorReport) => void
}

export interface UseErrorReportingReturn {
  /** Report a custom error */
  reportError: (error: Error | string, context?: Record<string, unknown>) => string
  /** Get list of reported errors */
  getErrors: () => ErrorReport[]
  /** Clear error history */
  clearErrors: () => void
  /** Set user context */
  setUser: (userId: string, email?: string) => void
  /** Add a tag to all future errors */
  addTag: (key: string, value: string) => void
  /** Whether error reporting is configured */
  isConfigured: boolean
}

// In-memory error storage
const errorStorage: ErrorReport[] = []
let maxStorageSize = 100

class ErrorReporter {
  private options: Required<UseErrorReportingOptions>
  private tags: Record<string, string> = {}
  private user: { id?: string; email?: string } = {}

  constructor(options: UseErrorReportingOptions) {
    this.options = {
      enabled: options.enabled ?? true,
      release: options.release ?? '1.0.0',
      environment:
        options.environment ??
        (typeof import.meta !== 'undefined' && import.meta.env?.MODE
          ? String(import.meta.env.MODE)
          : 'development'),
      userId: options.userId ?? '',
      userEmail: options.userEmail ?? '',
      tags: options.tags ?? {},
      maxErrors: options.maxErrors ?? 100,
      onError: options.onError ?? (() => {}),
    }
    maxStorageSize = this.options.maxErrors

    if (this.options.userId) {
      this.user = { id: this.options.userId, email: this.options.userEmail }
    }

    this.tags = { ...this.options.tags }
  }

  report(error: Error | string, context?: Record<string, unknown>): string {
    if (!this.options.enabled) return ''

    const errorId = crypto.randomUUID()
    const errorMessage = typeof error === 'string' ? error : error.message
    const errorStack = typeof error === 'string' ? undefined : error.stack

    const report: ErrorReport = {
      id: errorId,
      message: errorMessage,
      stack: errorStack,
      timestamp: Date.now(),
      context,
      user: this.user.id ? this.user : undefined,
      tags: { ...this.tags },
    }

    errorStorage.push(report)
    if (errorStorage.length > maxStorageSize) {
      errorStorage.shift()
    }

    if (this.options.environment === 'development') {
      console.error(`[ErrorReporter] Error ${errorId}:`, {
        message: errorMessage,
        stack: errorStack,
        context,
      })
    }

    this.options.onError(report)

    return errorId
  }

  getErrors(): ErrorReport[] {
    return [...errorStorage]
  }

  clearErrors(): void {
    errorStorage.length = 0
  }

  setUser(userId: string, email?: string): void {
    this.user = { id: userId, email }
  }

  addTag(key: string, value: string): void {
    this.tags[key] = value
  }

  updateOptions(options: Partial<UseErrorReportingOptions>): void {
    Object.assign(this.options, options)
  }

  get isConfigured(): boolean {
    return this.options.enabled
  }
}

let reporterInstance: ErrorReporter | null = null

export function useErrorReporting(options: UseErrorReportingOptions = {}): UseErrorReportingReturn {
  if (!reporterInstance) {
    // eslint-disable-next-line react-hooks/globals
    reporterInstance = new ErrorReporter(options)
  }

  const [, forceUpdate] = useState({})
  const optionsRef = useRef(options)

  useEffect(() => {
    if (JSON.stringify(options) !== JSON.stringify(optionsRef.current)) {
      optionsRef.current = options
      reporterInstance?.updateOptions(options)
    }
  }, [options])

  const reportError = useCallback(
    (error: Error | string, context?: Record<string, unknown>): string => {
      const errorId = reporterInstance?.report(error, context) ?? ''
      forceUpdate({})
      return errorId
    },
    []
  )

  const getErrors = useCallback((): ErrorReport[] => {
    return reporterInstance?.getErrors() ?? []
  }, [])

  const clearErrors = useCallback((): void => {
    reporterInstance?.clearErrors()
    forceUpdate({})
  }, [])

  const setUser = useCallback((userId: string, email?: string): void => {
    reporterInstance?.setUser(userId, email)
  }, [])

  const addTag = useCallback((key: string, value: string): void => {
    reporterInstance?.addTag(key, value)
  }, [])

  return {
    reportError,
    getErrors,
    clearErrors,
    setUser,
    addTag,
    isConfigured: reporterInstance?.isConfigured ?? false,
  }
}

export function getErrorReporter(): ErrorReporter | null {
  return reporterInstance
}

export function initializeErrorReporter(options: UseErrorReportingOptions): ErrorReporter {
  reporterInstance = new ErrorReporter(options)
  return reporterInstance
}
