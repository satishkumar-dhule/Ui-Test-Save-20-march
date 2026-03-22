import { getRedisClient, isRedisAvailable } from './singleton.js'

const QUEUE_PREFIX = 'devprep:queue:'
const STREAM_PREFIX = 'devprep:stream:'
const DEFAULT_JOB_TTL = 86400
const COMPLETED_JOB_TTL = 3600
const FAILED_JOB_TTL = 604800

export interface Job {
  id: string
  type: string
  data: unknown
  priority: number
  attempts: number
  maxAttempts: number
  createdAt: number
  scheduledFor?: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: unknown
  error?: string
  completedAt?: number
  failedAt?: number
}

export interface QueueOptions {
  stream?: boolean
  maxRetries?: number
  defaultJobTTL?: number
}

export interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  total: number
}

export interface EnqueueResult {
  jobId: string
  enqueued: boolean
}

function generateJobId(): string {
  return `job:${Date.now()}-${Math.random().toString(36).substring(2, 12)}`
}

export function createQueue(name: string, options: QueueOptions = {}): Queue {
  return new Queue(name, options)
}

export class Queue {
  private name: string
  private stream: boolean
  private maxRetries: number
  private defaultJobTTL: number

  constructor(name: string, options: QueueOptions = {}) {
    this.name = name
    this.stream = options.stream ?? false
    this.maxRetries = options.maxRetries ?? 3
    this.defaultJobTTL = options.defaultJobTTL ?? DEFAULT_JOB_TTL
  }

  private getQueueKey(): string {
    return `${QUEUE_PREFIX}${this.name}`
  }

  private getPriorityKey(priority: number): string {
    return `${QUEUE_PREFIX}${this.name}:priority:${priority}`
  }

  private getProcessingKey(): string {
    return `${QUEUE_PREFIX}${this.name}:processing`
  }

  private getCompletedKey(): string {
    return `${QUEUE_PREFIX}${this.name}:completed`
  }

  private getFailedKey(): string {
    return `${QUEUE_PREFIX}${this.name}:failed`
  }

  private getStreamKey(): string {
    return `${STREAM_PREFIX}${this.name}`
  }

  async enqueue(
    jobType: string,
    data: unknown,
    options: {
      priority?: number
      scheduledFor?: number
      maxAttempts?: number
      jobId?: string
    } = {}
  ): Promise<EnqueueResult> {
    if (!isRedisAvailable()) {
      return { jobId: '', enqueued: false }
    }
    const client = getRedisClient()
    if (!client) {
      return { jobId: '', enqueued: false }
    }

    const jobId = options.jobId || generateJobId()
    const priority = options.priority ?? 0
    const maxAttempts = options.maxAttempts ?? this.maxRetries
    const scheduledFor = options.scheduledFor ?? 0

    const job: Job = {
      id: jobId,
      type: jobType,
      data,
      priority,
      attempts: 0,
      maxAttempts,
      createdAt: Date.now(),
      scheduledFor: scheduledFor > 0 ? scheduledFor : undefined,
      status: 'pending',
    }

    try {
      if (this.stream) {
        const streamKey = this.getStreamKey()
        await client.xadd(streamKey, '*', 'job', JSON.stringify(job))
      } else {
        const pipeline = client.pipeline()
        const jobKey = `${QUEUE_PREFIX}${this.name}:job:${jobId}`
        const priorityKey = this.getPriorityKey(priority)
        const queueKey = this.getQueueKey()

        pipeline.set(jobKey, JSON.stringify(job), 'EX', this.defaultJobTTL)
        pipeline.zadd(queueKey, priority, jobId)

        if (scheduledFor > 0) {
          const delayKey = `${QUEUE_PREFIX}${this.name}:delayed`
          pipeline.zadd(delayKey, scheduledFor, jobId)
        }

        await pipeline.exec()
      }

      return { jobId, enqueued: true }
    } catch (error) {
      console.error('[Queue] Error enqueueing job:', (error as Error).message)
      return { jobId: '', enqueued: false }
    }
  }

  async enqueueBatch(
    jobs: Array<{
      type: string
      data: unknown
      priority?: number
      scheduledFor?: number
      maxAttempts?: number
    }>
  ): Promise<EnqueueResult[]> {
    const results: EnqueueResult[] = []

    for (const job of jobs) {
      const result = await this.enqueue(job.type, job.data, {
        priority: job.priority,
        scheduledFor: job.scheduledFor,
        maxAttempts: job.maxAttempts,
      })
      results.push(result)
    }

    return results
  }

  async dequeue(timeout: number = 0): Promise<Job | null> {
    if (!isRedisAvailable()) return null
    const client = getRedisClient()
    if (!client) return null

    try {
      if (this.stream) {
        const streamKey = this.getStreamKey()
        const result = await client.xreadgroup(
          'GROUP',
          `${this.name}-workers`,
          `worker-${Date.now()}`,
          'COUNT',
          1,
          'BLOCK',
          timeout,
          'STREAMS',
          streamKey,
          '>'
        )

        if (!result || result.length === 0) return null

        const firstResult = result[0] as [string, [string, string[]][]] | undefined
        if (!firstResult) return null

        const [, messages] = firstResult
        if (!messages || messages.length === 0) return null

        const messageEntry = messages[0] as [string, string[]]
        const [, fields] = messageEntry
        const jobData = fields[1]
        const job: Job = JSON.parse(jobData)

        return job
      } else {
        const queueKey = this.getQueueKey()
        const processingKey = this.getProcessingKey()

        const result = await client.zpopmin(queueKey)
        if (!result || result.length === 0) return null

        const [jobId, score] = result as [string, number]

        if (score > Date.now()) {
          await client.zadd(queueKey, score, jobId)
          return null
        }

        const jobKey = `${QUEUE_PREFIX}${this.name}:job:${jobId}`
        const jobData = await client.get(jobKey)

        if (!jobData) return null

        const job: Job = JSON.parse(jobData)
        job.status = 'processing'
        job.attempts += 1

        await client.set(jobKey, JSON.stringify(job), 'EX', this.defaultJobTTL)
        await client.hset(processingKey, jobId, JSON.stringify(job))

        return job
      }
    } catch (error) {
      console.error('[Queue] Error dequeuing job:', (error as Error).message)
      return null
    }
  }

  async complete(jobId: string, result?: unknown): Promise<boolean> {
    if (!isRedisAvailable()) return false
    const client = getRedisClient()
    if (!client) return false

    try {
      const jobKey = `${QUEUE_PREFIX}${this.name}:job:${jobId}`
      const processingKey = this.getProcessingKey()
      const completedKey = this.getCompletedKey()

      const jobData = await client.hget(processingKey, jobId)
      if (!jobData) return false

      const job: Job = JSON.parse(jobData)
      job.status = 'completed'
      job.result = result
      job.completedAt = Date.now()

      await client.hdel(processingKey, jobId)
      await client.zadd(completedKey, job.completedAt, jobId)
      await client.set(`${jobKey}:result`, JSON.stringify(job), 'EX', COMPLETED_JOB_TTL)

      return true
    } catch (error) {
      console.error('[Queue] Error completing job:', (error as Error).message)
      return false
    }
  }

  async fail(jobId: string, error: string): Promise<boolean> {
    if (!isRedisAvailable()) return false
    const client = getRedisClient()
    if (!client) return false

    try {
      const jobKey = `${QUEUE_PREFIX}${this.name}:job:${jobId}`
      const processingKey = this.getProcessingKey()
      const failedKey = this.getFailedKey()

      const jobData = await client.hget(processingKey, jobId)
      if (!jobData) return false

      const job: Job = JSON.parse(jobData)
      job.status = 'failed'
      job.error = error
      job.failedAt = Date.now()

      await client.hdel(processingKey, jobId)
      await client.zadd(failedKey, job.failedAt, jobId)
      await client.set(`${jobKey}:error`, JSON.stringify(job), 'EX', FAILED_JOB_TTL)

      return true
    } catch (error) {
      console.error('[Queue] Error failing job:', (error as Error).message)
      return false
    }
  }

  async retry(jobId: string): Promise<boolean> {
    if (!isRedisAvailable()) return false
    const client = getRedisClient()
    if (!client) return false

    try {
      const jobKey = `${QUEUE_PREFIX}${this.name}:job:${jobId}`
      const failedKey = this.getFailedKey()
      const queueKey = this.getQueueKey()

      const jobData = await client.get(`${jobKey}:error`)
      if (!jobData) return false

      const job: Job = JSON.parse(jobData)

      if (job.attempts >= job.maxAttempts) {
        return false
      }

      await client.zrem(failedKey, jobId)
      await client.zadd(queueKey, job.priority, jobId)

      return true
    } catch (error) {
      console.error('[Queue] Error retrying job:', (error as Error).message)
      return false
    }
  }

  async getJob(jobId: string): Promise<Job | null> {
    if (!isRedisAvailable()) return null
    const client = getRedisClient()
    if (!client) return null

    try {
      const jobKey = `${QUEUE_PREFIX}${this.name}:job:${jobId}`
      const jobData = await client.get(jobKey)
      if (!jobData) return null

      return JSON.parse(jobData)
    } catch (error) {
      console.error('[Queue] Error getting job:', (error as Error).message)
      return null
    }
  }

  async getJobResult(jobId: string): Promise<unknown | null> {
    if (!isRedisAvailable()) return null
    const client = getRedisClient()
    if (!client) return null

    try {
      const resultKey = `${QUEUE_PREFIX}${this.name}:job:${jobId}:result`
      const resultData = await client.get(resultKey)
      if (!resultData) return null

      const job: Job = JSON.parse(resultData)
      return job.result
    } catch (error) {
      console.error('[Queue] Error getting job result:', (error as Error).message)
      return null
    }
  }

  async getStats(): Promise<QueueStats> {
    if (!isRedisAvailable()) {
      return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 }
    }
    const client = getRedisClient()
    if (!client) {
      return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 }
    }

    try {
      const queueKey = this.getQueueKey()
      const processingKey = this.getProcessingKey()
      const completedKey = this.getCompletedKey()
      const failedKey = this.getFailedKey()

      const pipeline = client.pipeline()
      pipeline.zcard(queueKey)
      pipeline.hlen(processingKey)
      pipeline.zcard(completedKey)
      pipeline.zcard(failedKey)

      const results = await pipeline.exec()
      if (!results) {
        return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 }
      }

      const [pending] = results[0] as [null, number]
      const [processing] = results[1] as [null, number]
      const [completed] = results[2] as [null, number]
      const [failed] = results[3] as [null, number]

      return {
        pending: pending ?? 0,
        processing: processing ?? 0,
        completed: completed ?? 0,
        failed: failed ?? 0,
        total: (pending ?? 0) + (processing ?? 0) + (completed ?? 0) + (failed ?? 0),
      }
    } catch (error) {
      console.error('[Queue] Error getting stats:', (error as Error).message)
      return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 }
    }
  }

  async clearCompleted(): Promise<number> {
    if (!isRedisAvailable()) return 0
    const client = getRedisClient()
    if (!client) return 0

    try {
      const completedKey = this.getCompletedKey()
      const keys = await client.zrange(completedKey, 0, -1)
      if (keys.length === 0) return 0

      for (const jobId of keys) {
        const jobKey = `${QUEUE_PREFIX}${this.name}:job:${jobId}:result`
        await client.del(jobKey)
      }

      const deleted = await client.zrem(completedKey, ...keys)
      return deleted
    } catch (error) {
      console.error('[Queue] Error clearing completed:', (error as Error).message)
      return 0
    }
  }

  async clearFailed(): Promise<number> {
    if (!isRedisAvailable()) return 0
    const client = getRedisClient()
    if (!client) return 0

    try {
      const failedKey = this.getFailedKey()
      const keys = await client.zrange(failedKey, 0, -1)
      if (keys.length === 0) return 0

      for (const jobId of keys) {
        const jobKey = `${QUEUE_PREFIX}${this.name}:job:${jobId}:error`
        await client.del(jobKey)
      }

      const deleted = await client.zrem(failedKey, ...keys)
      return deleted
    } catch (error) {
      console.error('[Queue] Error clearing failed:', (error as Error).message)
      return 0
    }
  }

  async getPendingJobs(limit: number = 100, offset: number = 0): Promise<Job[]> {
    if (!isRedisAvailable()) return []
    const client = getRedisClient()
    if (!client) return []

    try {
      const queueKey = this.getQueueKey()
      const jobIds = await client.zrange(queueKey, offset, offset + limit - 1)
      const jobs: Job[] = []

      for (const jobId of jobIds) {
        const job = await this.getJob(jobId)
        if (job) {
          jobs.push(job)
        }
      }

      return jobs
    } catch (error) {
      console.error('[Queue] Error getting pending jobs:', (error as Error).message)
      return []
    }
  }

  async processDelayedJobs(): Promise<number> {
    if (!isRedisAvailable()) return 0
    const client = getRedisClient()
    if (!client) return 0

    try {
      const delayKey = `${QUEUE_PREFIX}${this.name}:delayed`
      const queueKey = this.getQueueKey()
      const now = Date.now()

      const readyJobs = await client.zrangebyscore(delayKey, 0, now)
      if (readyJobs.length === 0) return 0

      let moved = 0
      for (const jobId of readyJobs) {
        const score = await client.zscore(delayKey, jobId)
        if (score !== null) {
          await client.zadd(queueKey, 0, jobId)
          await client.zrem(delayKey, jobId)
          moved++
        }
      }

      return moved
    } catch (error) {
      console.error('[Queue] Error processing delayed jobs:', (error as Error).message)
      return 0
    }
  }
}

export function createPriorityQueue(name: string, options: QueueOptions = {}): Queue {
  return createQueue(`priority:${name}`, options)
}
