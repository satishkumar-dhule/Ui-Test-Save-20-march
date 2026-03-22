import { z, ZodSchema } from 'zod'

const DEFAULT_COMPRESSION_THRESHOLD = 1024

interface SerializedData<T> {
  data: T
  compressed: boolean
  schemaVersion: string
  timestamp: number
}

interface CompressionOptions {
  threshold?: number
  level?: number
}

const CompressionEncoding = {
  NONE: 'none',
  GZIP: 'gzip',
  DEFLATE: 'deflate',
  BROTLI: 'brotli',
} as const

type CompressionType = (typeof CompressionEncoding)[keyof typeof CompressionEncoding]

async function compress(
  data: string,
  encoding: CompressionType = CompressionEncoding.GZIP,
  level = 6
): Promise<Buffer> {
  const zlib = await import('zlib')

  const input = Buffer.from(data, 'utf-8')

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream: any = encoding === CompressionEncoding.GZIP
      ? zlib.createGzip({ level })
      : encoding === CompressionEncoding.DEFLATE
        ? zlib.createDeflate({ level })
        : encoding === CompressionEncoding.BROTLI
          ? zlib.createBrotliCompress({ params: { [2]: level } })
          : null

    if (!stream) {
      resolve(input)
      return
    }

    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
    stream.write(input)
    stream.end()
  })
}

async function decompress(data: Buffer, encoding: CompressionType): Promise<string> {
  if (encoding === CompressionEncoding.NONE) {
    return data.toString('utf-8')
  }

  const zlib = await import('zlib')

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream: any = encoding === CompressionEncoding.GZIP
      ? zlib.createGunzip()
      : encoding === CompressionEncoding.DEFLATE
        ? zlib.createInflate()
        : encoding === CompressionEncoding.BROTLI
          ? zlib.createBrotliDecompress()
          : null

    if (!stream) {
      resolve(data.toString('utf-8'))
      return
    }

    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    stream.on('error', reject)
    stream.write(data)
    stream.end()
  })
}

function serialize<T>(data: T, schemaVersion = '1.0'): string {
  return JSON.stringify({
    data,
    compressed: false,
    schemaVersion,
    timestamp: Date.now(),
  })
}

async function serializeWithCompression<T>(
  data: T,
  options: CompressionOptions = {}
): Promise<string> {
  const { threshold = DEFAULT_COMPRESSION_THRESHOLD, level = 6 } = options
  const json = JSON.stringify(data)
  const bytes = new TextEncoder().encode(json)

  if (bytes.length < threshold) {
    return serialize(data)
  }

  const compressed = await compress(json, CompressionEncoding.GZIP, level)
  const wrapper = {
    data: compressed.toString('base64'),
    compressed: true,
    encoding: CompressionEncoding.GZIP,
    schemaVersion: '1.0',
    timestamp: Date.now(),
  }

  return JSON.stringify(wrapper)
}

function deserialize<T>(serialized: string): SerializedData<T> | null {
  try {
    const parsed = JSON.parse(serialized) as SerializedData<T> & { encoding?: string }
    return {
      data: parsed.data,
      compressed: parsed.compressed || false,
      schemaVersion: parsed.schemaVersion,
      timestamp: parsed.timestamp,
    }
  } catch (error) {
    console.warn('[Serializer] Deserialize error:', (error as Error).message)
    return null
  }
}

async function deserializeWithCompression<T>(serialized: string): Promise<T | null> {
  try {
    const parsed = JSON.parse(serialized)

    if (!parsed.compressed) {
      return parsed.data as T
    }

    const encoding = (parsed.encoding as CompressionType) || CompressionEncoding.GZIP
    const buffer = Buffer.from(parsed.data, 'base64')
    const decompressed = await decompress(buffer, encoding)
    const result = JSON.parse(decompressed)

    return result as T
  } catch (error) {
    console.warn('[Serializer] Decompress error:', (error as Error).message)
    return null
  }
}

function createSchemaValidator<T>(
  schema: ZodSchema<T>,
  options: { strict?: boolean; onError?: (error: z.ZodError) => void } = {}
) {
  const { strict = false, onError } = options

  return {
    validate(data: unknown): { valid: boolean; data?: T; errors?: z.ZodError } {
      const result = schema.safeParse(data)

      if (result.success) {
        return { valid: true, data: result.data }
      }

      if (onError) {
        onError(result.error)
      }

      return {
        valid: false,
        errors: result.error,
      }
    },

    safeParse(data: unknown, fallback: T): T {
      const result = schema.safeParse(data)
      return result.success ? result.data : fallback
    },

    parseOrThrow(data: unknown): T {
      return schema.parse(data)
    },

    validateOrThrow(data: unknown): T {
      return schema.parse(data)
    },
  }
}

function createCachedSerializer<T>(
  schema: ZodSchema<T>,
  options: {
    schemaVersion?: string
    compression?: boolean
    compressionOptions?: CompressionOptions
    strict?: boolean
  } = {}
) {
  const {
    schemaVersion = '1.0',
    compression = true,
    compressionOptions = {},
    strict = false,
  } = options

  const validator = createSchemaValidator(schema, { strict })

  return {
    async serialize(data: T): Promise<string> {
      if (compression) {
        return serializeWithCompression(data, compressionOptions)
      }
      return serialize(data)
    },

    async deserialize(serialized: string): Promise<T | null> {
      let parsed: unknown

      if (compression) {
        parsed = await deserializeWithCompression(serialized)
      } else {
        const deserialized = deserialize<T>(serialized)
        parsed = deserialized?.data
      }

      if (!parsed) return null

      const validation = validator.validate(parsed)
      return validation.valid ? validation.data! : null
    },

    validate(data: unknown) {
      return validator.validate(data)
    },

    async serializeAndValidate(data: unknown): Promise<{ valid: boolean; serialized?: string }> {
      const validation = validator.validate(data)
      if (!validation.valid) {
        return { valid: false }
      }

      try {
        const serialized = await this.serialize(validation.data!)
        return { valid: true, serialized }
      } catch (error) {
        console.warn('[CachedSerializer] Serialization failed:', (error as Error).message)
        return { valid: false }
      }
    },
  }
}

const ContentSchema = z.object({
  id: z.string(),
  type: z.enum(['question', 'flashcard', 'exam', 'voice', 'coding']),
  channelId: z.string(),
  data: z.unknown(),
  tags: z.array(z.string()).optional(),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
})

const ChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()),
  icon: z.string().optional(),
  contentCount: z.number().optional(),
})

const StatsSchema = z.object({
  totalQuestions: z.number(),
  totalFlashcards: z.number(),
  totalExams: z.number(),
  totalVoice: z.number(),
  totalCoding: z.number(),
  lastUpdated: z.number(),
})

type ValidatedContent = z.infer<typeof ContentSchema>
type ValidatedChannel = z.infer<typeof ChannelSchema>
type ValidatedStats = z.infer<typeof StatsSchema>

const ContentSerializer = createCachedSerializer(ContentSchema, {
  schemaVersion: 'content-v1',
  compression: true,
  compressionOptions: { threshold: 512 },
  strict: false,
})

const ChannelSerializer = createCachedSerializer(ChannelSchema, {
  schemaVersion: 'channel-v1',
  compression: true,
  strict: false,
})

const StatsSerializer = createCachedSerializer(StatsSchema, {
  schemaVersion: 'stats-v1',
  compression: false,
  strict: false,
})

function estimateSize(data: unknown): number {
  return new TextEncoder().encode(JSON.stringify(data)).length
}

function shouldCompress(data: unknown, threshold = DEFAULT_COMPRESSION_THRESHOLD): boolean {
  return estimateSize(data) >= threshold
}

function batchSerialize<T>(
  items: T[],
  serializer: ReturnType<typeof createCachedSerializer<T>>
): Promise<string[]> {
  return Promise.all(items.map(item => serializer.serialize(item)))
}

async function batchDeserialize<T>(
  serialized: string[],
  serializer: ReturnType<typeof createCachedSerializer<T>>
): Promise<(T | null)[]> {
  return Promise.all(serialized.map(s => serializer.deserialize(s)))
}

export {
  serialize,
  serializeWithCompression,
  deserialize,
  deserializeWithCompression,
  compress,
  decompress,
  type CompressionType,
  type CompressionOptions,
  CompressionEncoding,
  createSchemaValidator,
  createCachedSerializer,
  ContentSerializer,
  ChannelSerializer,
  StatsSerializer,
  estimateSize,
  shouldCompress,
  batchSerialize,
  batchDeserialize,
  type ValidatedContent,
  type ValidatedChannel,
  type ValidatedStats,
  ContentSchema,
  ChannelSchema,
  StatsSchema,
  type SerializedData,
}
