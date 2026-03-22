/**
 * Redis SDK Hooks System
 * @package @devprep/redis-sdk
 */

export type HookType = 'pre' | 'post' | 'error'

export interface HookContext {
  command: string
  args: (string | number)[]
  key?: string
  startTime: number
  endTime?: number
  duration?: number
  result?: unknown
  error?: Error
  retryCount?: number
}

export type HookHandler = (context: HookContext) => void | Promise<void>

export interface HookRegistration {
  type: HookType
  command?: string | string[]
  handler: HookHandler
  once?: boolean
}

export interface HookMetrics {
  totalCalls: number
  totalDuration: number
  averageDuration: number
  errors: number
  errorRate: number
  byCommand: Record<string, CommandMetrics>
}

export interface CommandMetrics {
  calls: number
  totalDuration: number
  averageDuration: number
  errors: number
  lastCalled: number
}

export interface LogEntry {
  timestamp: number
  level: 'debug' | 'info' | 'warn' | 'error'
  command: string
  args: (string | number)[]
  duration?: number
  error?: string
  result?: string
}

class HooksManager {
  private hooks: Map<string, HookRegistration[]> = new Map()
  private globalPreHooks: HookRegistration[] = []
  private globalPostHooks: HookRegistration[] = []
  private globalErrorHooks: HookRegistration[] = []
  private metrics: HookMetrics = {
    totalCalls: 0,
    totalDuration: 0,
    averageDuration: 0,
    errors: 0,
    errorRate: 0,
    byCommand: {},
  }
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private enabled = true
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info'

  constructor() {
    this.initializeDefaultHooks()
  }

  /**
   * Initialize default logging hooks
   */
  private initializeDefaultHooks(): void {
    this.registerHook({
      type: 'post',
      handler: (ctx) => {
        this.addLog({
          timestamp: Date.now(),
          level: ctx.error ? 'error' : 'info',
          command: ctx.command,
          args: ctx.args,
          duration: ctx.duration,
          error: ctx.error?.message,
        })
      },
    })
  }

  /**
   * Register a hook
   */
  registerHook(registration: HookRegistration): () => void {
    const id = this.generateHookId()
    
    if (registration.command) {
      const commands = Array.isArray(registration.command) 
        ? registration.command 
        : [registration.command]
      
      for (const cmd of commands) {
        const key = `cmd:${cmd}`
        if (!this.hooks.has(key)) {
          this.hooks.set(key, [])
        }
        this.hooks.get(key)!.push({ ...registration, command: cmd })
      }
    } else {
      if (registration.type === 'pre') {
        this.globalPreHooks.push(registration)
      } else if (registration.type === 'post') {
        this.globalPostHooks.push(registration)
      } else if (registration.type === 'error') {
        this.globalErrorHooks.push(registration)
      }
    }

    return () => this.unregisterHook(id)
  }

  /**
   * Unregister a hook by ID (placeholder - actual implementation would need ID tracking)
   */
  private unregisterHook(_id: string): void {
    // Implementation would track and remove hooks by ID
  }

  /**
   * Generate unique hook ID
   */
  private generateHookId(): string {
    return `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Execute pre-hooks
   */
  async executePreHooks(context: HookContext): Promise<void> {
    if (!this.enabled) return

    const commandHooks = this.hooks.get(`cmd:${context.command}`) || []
    const preHooks = [
      ...commandHooks.filter(h => h.type === 'pre'),
      ...this.globalPreHooks.filter(h => h.type === 'pre'),
    ]

    for (const hook of preHooks) {
      try {
        await hook.handler(context)
      } catch (error) {
        console.error(`[Redis Hooks] Pre-hook error for ${context.command}:`, error)
      }
    }
  }

  /**
   * Execute post-hooks
   */
  async executePostHooks(context: HookContext): Promise<void> {
    if (!this.enabled) return

    const commandHooks = this.hooks.get(`cmd:${context.command}`) || []
    const postHooks = [
      ...commandHooks.filter(h => h.type === 'post'),
      ...this.globalPostHooks.filter(h => h.type === 'post'),
    ]

    for (const hook of postHooks) {
      try {
        await hook.handler(context)
      } catch (error) {
        console.error(`[Redis Hooks] Post-hook error for ${context.command}:`, error)
      }
    }
  }

  /**
   * Execute error hooks
   */
  async executeErrorHooks(context: HookContext): Promise<void> {
    const commandHooks = this.hooks.get(`cmd:${context.command}`) || []
    const errorHooks = [
      ...commandHooks.filter(h => h.type === 'error'),
      ...this.globalErrorHooks.filter(h => h.type === 'error'),
    ]

    for (const hook of errorHooks) {
      try {
        await hook.handler(context)
      } catch (error) {
        console.error(`[Redis Hooks] Error-hook error for ${context.command}:`, error)
      }
    }
  }

  /**
   * Wrap a function with hooks
   */
  wrapWithHooks<T extends (...args: any[]) => any>(
    command: string,
    fn: T
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const context: HookContext = {
        command,
        args: args as (string | number)[],
        startTime: Date.now(),
      }

      if (args.length > 0 && typeof args[0] === 'string') {
        context.key = args[0]
      }

      await this.executePreHooks(context)

      try {
        const result = await fn(...args)
        context.result = result
        context.endTime = Date.now()
        context.duration = context.endTime - context.startTime
        
        this.updateMetrics(context)
        await this.executePostHooks(context)
        
        return result
      } catch (error) {
        context.endTime = Date.now()
        context.duration = context.endTime - context.startTime
        context.error = error as Error
        
        this.updateMetrics(context, true)
        await this.executeErrorHooks(context)
        
        throw error
      }
    }
  }

  /**
   * Update metrics
   */
  private updateMetrics(context: HookContext, isError = false): void {
    this.metrics.totalCalls++
    
    if (context.duration) {
      this.metrics.totalDuration += context.duration
      this.metrics.averageDuration = this.metrics.totalDuration / this.metrics.totalCalls
    }
    
    if (isError) {
      this.metrics.errors++
      this.metrics.errorRate = this.metrics.errors / this.metrics.totalCalls
    }

    if (!this.metrics.byCommand[context.command]) {
      this.metrics.byCommand[context.command] = {
        calls: 0,
        totalDuration: 0,
        averageDuration: 0,
        errors: 0,
        lastCalled: Date.now(),
      }
    }

    const cmdMetrics = this.metrics.byCommand[context.command]
    cmdMetrics.calls++
    cmdMetrics.lastCalled = Date.now()
    
    if (context.duration) {
      cmdMetrics.totalDuration += context.duration
      cmdMetrics.averageDuration = cmdMetrics.totalDuration / cmdMetrics.calls
    }
    
    if (isError) {
      cmdMetrics.errors++
    }
  }

  /**
   * Add log entry
   */
  private addLog(entry: LogEntry): void {
    if (this.shouldLog(entry.level)) {
      this.logs.push(entry)
      
      if (this.logs.length > this.maxLogs) {
        this.logs.shift()
      }
    }
  }

  /**
   * Check if should log based on level
   */
  private shouldLog(level: LogEntry['level']): boolean {
    const levels: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 }
    return levels[level] >= levels[this.logLevel]
  }

  /**
   * Get current metrics
   */
  getMetrics(): HookMetrics {
    return { ...this.metrics }
  }

  /**
   * Get recent logs
   */
  getLogs(limit = 100): LogEntry[] {
    return this.logs.slice(-limit)
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalCalls: 0,
      totalDuration: 0,
      averageDuration: 0,
      errors: 0,
      errorRate: 0,
      byCommand: {},
    }
  }

  /**
   * Enable/disable hooks
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Set log level
   */
  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level
  }

  /**
   * Set max log entries
   */
  setMaxLogs(max: number): void {
    this.maxLogs = max
    while (this.logs.length > max) {
      this.logs.shift()
    }
  }
}

let hooksManager: HooksManager | null = null

export function getHooks(): HooksManager {
  if (!hooksManager) {
    hooksManager = new HooksManager()
  }
  return hooksManager
}

export function createHooks(): HooksManager {
  hooksManager = new HooksManager()
  return hooksManager
}

// ============ PRE-BUILT HOOKS ============

export function createDebugHook(): HookRegistration {
  return {
    type: 'post',
    handler: (ctx) => {
      console.debug(`[Redis Debug] ${ctx.command}`, {
        args: ctx.args,
        duration: ctx.duration,
        result: ctx.result,
      })
    },
  }
}

export function createMetricsHook(): HookRegistration {
  return {
    type: 'post',
    handler: (ctx) => {
      const hooks = getHooks()
      const metrics = hooks.getMetrics()
      
      console.info(`[Redis Metrics] ${ctx.command}: ${metrics.byCommand[ctx.command]?.calls || 0} calls, avg: ${metrics.byCommand[ctx.command]?.averageDuration || 0}ms`)
    },
  }
}

export function createSlowQueryHook(thresholdMs = 100): HookRegistration {
  return {
    type: 'post',
    handler: (ctx) => {
      if (ctx.duration && ctx.duration > thresholdMs) {
        console.warn(`[Redis Slow Query] ${ctx.command} took ${ctx.duration}ms (threshold: ${thresholdMs}ms)`, {
          args: ctx.args,
        })
      }
    },
  }
}

export function createErrorLoggingHook(): HookRegistration {
  return {
    type: 'error',
    handler: (ctx) => {
      console.error(`[Redis Error] ${ctx.command} failed:`, {
        args: ctx.args,
        error: ctx.error?.message,
        stack: ctx.error?.stack,
        duration: ctx.duration,
      })
    },
  }
}

export function createTracingHook(onTrace: (context: HookContext) => void): HookRegistration {
  return {
    type: 'post',
    handler: onTrace,
  }
}

export { HooksManager }
export default HooksManager
