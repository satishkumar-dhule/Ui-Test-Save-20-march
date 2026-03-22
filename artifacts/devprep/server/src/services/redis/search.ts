import { getRedisClient, isRedisAvailable } from './singleton.js'

const SEARCH_PREFIX = 'devprep:search:'
const INDEX_PREFIX = 'devprep:idx:'

export interface SearchDocument {
  id: string
  type: string
  title?: string
  content?: string
  tags?: string[]
  channel?: string
  difficulty?: string
  metadata?: Record<string, unknown>
  score?: number
}

export interface SearchResult {
  documents: SearchDocument[]
  total: number
  query: string
  took: number
}

export interface SearchOptions {
  limit?: number
  offset?: number
  fuzzy?: boolean
  filters?: SearchFilters
  sortBy?: 'relevance' | 'created' | 'score'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchFilters {
  type?: string
  channel?: string
  tags?: string[]
  difficulty?: string
  minScore?: number
  maxScore?: number
}

export interface AutocompleteSuggestion {
  term: string
  score: number
}

function buildSearchKey(index: string): string {
  return `${SEARCH_PREFIX}${index}`
}

function buildIndexKey(index: string): string {
  return `${INDEX_PREFIX}${index}`
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1)
}

function calculateRelevance(doc: SearchDocument, terms: string[]): number {
  let score = 0
  const titleTokens = doc.title ? tokenize(doc.title) : []
  const contentTokens = doc.content ? tokenize(doc.content) : []

  for (const term of terms) {
    if (titleTokens.includes(term)) {
      score += 10
    }
    if (contentTokens.includes(term)) {
      score += 5
    }
    if (doc.tags?.some(tag => tag.toLowerCase().includes(term))) {
      score += 8
    }
  }

  const titleMatches = terms.filter(t => titleTokens.includes(t)).length
  const contentMatches = terms.filter(t => contentTokens.includes(t)).length
  const totalTerms = terms.length

  if (totalTerms > 0) {
    score += (titleMatches / totalTerms) * 20
    score += (contentMatches / totalTerms) * 10
  }

  return score
}

export async function indexDocument(index: string, document: SearchDocument): Promise<boolean> {
  if (!isRedisAvailable()) return false
  const client = getRedisClient()
  if (!client) return false

  try {
    const searchKey = buildSearchKey(index)
    const indexKey = buildIndexKey(index)

    const tokens = [
      ...tokenize(document.title || ''),
      ...tokenize(document.content || ''),
      ...(document.tags || []).map(t => t.toLowerCase()),
    ]

    const pipeline = client.pipeline()

    pipeline.hset(searchKey, document.id, JSON.stringify(document))

    for (const token of tokens) {
      pipeline.sadd(`${indexKey}:token:${token}`, document.id)
      pipeline.zadd(`${indexKey}:autocomplete`, token.length === 1 ? 0 : 1, token)
    }

    if (document.tags) {
      for (const tag of document.tags) {
        pipeline.sadd(`${indexKey}:tag:${tag.toLowerCase()}`, document.id)
      }
    }

    if (document.channel) {
      pipeline.sadd(`${indexKey}:channel:${document.channel}`, document.id)
    }

    if (document.type) {
      pipeline.sadd(`${indexKey}:type:${document.type}`, document.id)
    }

    if (document.difficulty) {
      pipeline.sadd(`${indexKey}:difficulty:${document.difficulty}`, document.id)
    }

    if (document.score !== undefined) {
      pipeline.zadd(`${indexKey}:scores`, document.score, document.id)
    }

    await pipeline.exec()
    return true
  } catch (error) {
    console.error('[Search] Error indexing document:', (error as Error).message)
    return false
  }
}

export async function indexDocuments(index: string, documents: SearchDocument[]): Promise<number> {
  let indexed = 0
  for (const doc of documents) {
    const success = await indexDocument(index, doc)
    if (success) indexed++
  }
  return indexed
}

export async function removeDocument(index: string, documentId: string): Promise<boolean> {
  if (!isRedisAvailable()) return false
  const client = getRedisClient()
  if (!client) return false

  try {
    const searchKey = buildSearchKey(index)
    const indexKey = buildIndexKey(index)

    const docData = await client.hget(searchKey, documentId)
    if (!docData) return false

    const document: SearchDocument = JSON.parse(docData)
    const tokens = [
      ...tokenize(document.title || ''),
      ...tokenize(document.content || ''),
      ...(document.tags || []).map(t => t.toLowerCase()),
    ]

    const pipeline = client.pipeline()

    pipeline.hdel(searchKey, documentId)

    for (const token of tokens) {
      pipeline.srem(`${indexKey}:token:${token}`, documentId)
    }

    if (document.tags) {
      for (const tag of document.tags) {
        pipeline.srem(`${indexKey}:tag:${tag.toLowerCase()}`, documentId)
      }
    }

    if (document.channel) {
      pipeline.srem(`${indexKey}:channel:${document.channel}`, documentId)
    }

    if (document.type) {
      pipeline.srem(`${indexKey}:type:${document.type}`, documentId)
    }

    pipeline.zrem(`${indexKey}:scores`, documentId)

    await pipeline.exec()
    return true
  } catch (error) {
    console.error('[Search] Error removing document:', (error as Error).message)
    return false
  }
}

export async function search(
  index: string,
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult> {
  const startTime = Date.now()
  const {
    limit = 20,
    offset = 0,
    fuzzy = true,
    filters = {},
    sortBy = 'relevance',
    sortOrder = 'desc',
  } = options

  if (!isRedisAvailable()) {
    return { documents: [], total: 0, query, took: Date.now() - startTime }
  }
  const client = getRedisClient()
  if (!client) {
    return { documents: [], total: 0, query, took: Date.now() - startTime }
  }

  try {
    const searchKey = buildSearchKey(index)
    const indexKey = buildIndexKey(index)
    const terms = tokenize(query)

    if (terms.length === 0) {
      return { documents: [], total: 0, query, took: Date.now() - startTime }
    }

    let candidateIds = new Set<string>()
    let firstTerm = true

    for (const term of terms) {
      const matchingIds = await client.smembers(`${indexKey}:token:${term}`)

      if (fuzzy && matchingIds.length === 0) {
        const allTokens = await client.zrange(`${indexKey}:autocomplete`, 0, -1)
        for (const token of allTokens) {
          if (token.length > 2 && (term.includes(token) || token.includes(term))) {
            const fuzzyMatches = await client.smembers(`${indexKey}:token:${token}`)
            matchingIds.push(...fuzzyMatches)
          }
        }
      }

      if (firstTerm) {
        candidateIds = new Set(matchingIds)
        firstTerm = false
      } else {
        candidateIds = new Set(matchingIds.filter(id => candidateIds.has(id)))
      }
    }

    if (filters.type) {
      const typeIds = await client.smembers(`${indexKey}:type:${filters.type}`)
      candidateIds = new Set([...candidateIds].filter(id => typeIds.includes(id)))
    }

    if (filters.channel) {
      const channelIds = await client.smembers(`${indexKey}:channel:${filters.channel}`)
      candidateIds = new Set([...candidateIds].filter(id => channelIds.includes(id)))
    }

    if (filters.tags && filters.tags.length > 0) {
      const tagIdsSets = await Promise.all(
        filters.tags.map(tag => client.smembers(`${indexKey}:tag:${tag.toLowerCase()}`))
      )
      const tagIds = tagIdsSets.flat()
      candidateIds = new Set([...candidateIds].filter(id => tagIds.includes(id)))
    }

    if (filters.difficulty) {
      const diffIds = await client.smembers(`${indexKey}:difficulty:${filters.difficulty}`)
      candidateIds = new Set([...candidateIds].filter(id => diffIds.includes(id)))
    }

    const documents: SearchDocument[] = []
    for (const id of candidateIds) {
      const docData = await client.hget(searchKey, id)
      if (docData) {
        const doc: SearchDocument = JSON.parse(docData)
        const relevance = calculateRelevance(doc, terms)

        if (filters.minScore !== undefined && relevance < filters.minScore) continue
        if (filters.maxScore !== undefined && relevance > filters.maxScore) continue

        doc.score = relevance
        documents.push(doc)
      }
    }

    documents.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'relevance') {
        comparison = (b.score || 0) - (a.score || 0)
      } else if (sortBy === 'score') {
        comparison = (b.score || 0) - (a.score || 0)
      }

      return sortOrder === 'desc' ? comparison : -comparison
    })

    const total = documents.length
    const paginated = documents.slice(offset, offset + limit)

    return {
      documents: paginated,
      total,
      query,
      took: Date.now() - startTime,
    }
  } catch (error) {
    console.error('[Search] Error searching:', (error as Error).message)
    return { documents: [], total: 0, query, took: Date.now() - startTime }
  }
}

export async function autocomplete(
  index: string,
  prefix: string,
  limit: number = 10
): Promise<AutocompleteSuggestion[]> {
  if (!isRedisAvailable()) return []
  const client = getRedisClient()
  if (!client) return []

  try {
    const indexKey = buildIndexKey(index)
    const prefixLower = prefix.toLowerCase()

    const allTokens = await client.zrange(indexKey, 0, -1)
    const matchingTokens = allTokens.filter(token => token.startsWith(prefixLower))

    matchingTokens.sort((a, b) => {
      if (a.startsWith(prefixLower) && !b.startsWith(prefixLower)) return -1
      if (!a.startsWith(prefixLower) && b.startsWith(prefixLower)) return 1
      return a.length - b.length
    })

    const suggestions: AutocompleteSuggestion[] = []
    const seen = new Set<string>()

    for (const token of matchingTokens) {
      if (seen.has(token)) continue
      if (suggestions.length >= limit) break

      const docCount = await client.scard(`${indexKey}:token:${token}`)
      if (docCount > 0) {
        suggestions.push({
          term: token,
          score: docCount,
        })
        seen.add(token)
      }
    }

    return suggestions
  } catch (error) {
    console.error('[Search] Error getting autocomplete:', (error as Error).message)
    return []
  }
}

export async function getDocument(
  index: string,
  documentId: string
): Promise<SearchDocument | null> {
  if (!isRedisAvailable()) return null
  const client = getRedisClient()
  if (!client) return null

  try {
    const searchKey = buildSearchKey(index)
    const docData = await client.hget(searchKey, documentId)
    if (!docData) return null

    return JSON.parse(docData)
  } catch (error) {
    console.error('[Search] Error getting document:', (error as Error).message)
    return null
  }
}

export async function getDocumentsByTag(
  index: string,
  tag: string,
  limit: number = 20,
  offset: number = 0
): Promise<SearchDocument[]> {
  if (!isRedisAvailable()) return []
  const client = getRedisClient()
  if (!client) return []

  try {
    const searchKey = buildSearchKey(index)
    const indexKey = buildIndexKey(index)
    const tagLower = tag.toLowerCase()

    const docIds = await client.smembers(`${indexKey}:tag:${tagLower}`)
    const paginatedIds = docIds.slice(offset, offset + limit)
    const documents: SearchDocument[] = []

    for (const id of paginatedIds) {
      const docData = await client.hget(searchKey, id)
      if (docData) {
        documents.push(JSON.parse(docData))
      }
    }

    return documents
  } catch (error) {
    console.error('[Search] Error getting documents by tag:', (error as Error).message)
    return []
  }
}

export async function getDocumentsByChannel(
  index: string,
  channel: string,
  limit: number = 20,
  offset: number = 0
): Promise<SearchDocument[]> {
  if (!isRedisAvailable()) return []
  const client = getRedisClient()
  if (!client) return []

  try {
    const searchKey = buildSearchKey(index)
    const indexKey = buildIndexKey(index)

    const docIds = await client.smembers(`${indexKey}:channel:${channel}`)
    const paginatedIds = docIds.slice(offset, offset + limit)
    const documents: SearchDocument[] = []

    for (const id of paginatedIds) {
      const docData = await client.hget(searchKey, id)
      if (docData) {
        documents.push(JSON.parse(docData))
      }
    }

    return documents
  } catch (error) {
    console.error('[Search] Error getting documents by channel:', (error as Error).message)
    return []
  }
}

export async function getTopByScore(
  index: string,
  limit: number = 20,
  offset: number = 0
): Promise<SearchDocument[]> {
  if (!isRedisAvailable()) return []
  const client = getRedisClient()
  if (!client) return []

  try {
    const searchKey = buildSearchKey(index)
    const indexKey = buildIndexKey(index)

    const docIds = await client.zrevrange(`${indexKey}:scores`, offset, offset + limit - 1)
    const documents: SearchDocument[] = []

    for (const id of docIds) {
      const docData = await client.hget(searchKey, id)
      if (docData) {
        documents.push(JSON.parse(docData))
      }
    }

    return documents
  } catch (error) {
    console.error('[Search] Error getting top by score:', (error as Error).message)
    return []
  }
}

export async function getIndexStats(index: string): Promise<{
  documentCount: number
  tokenCount: number
  tagCount: number
  channelCount: number
}> {
  if (!isRedisAvailable()) {
    return { documentCount: 0, tokenCount: 0, tagCount: 0, channelCount: 0 }
  }
  const client = getRedisClient()
  if (!client) {
    return { documentCount: 0, tokenCount: 0, tagCount: 0, channelCount: 0 }
  }

  try {
    const searchKey = buildSearchKey(index)
    const indexKey = buildIndexKey(index)

    const [documentCount, tokenKeys, tagKeys, channelKeys] = await Promise.all([
      client.hlen(searchKey),
      client.keys(`${indexKey}:token:*`),
      client.keys(`${indexKey}:tag:*`),
      client.keys(`${indexKey}:channel:*`),
    ])

    return {
      documentCount,
      tokenCount: tokenKeys.length,
      tagCount: tagKeys.length,
      channelCount: channelKeys.length,
    }
  } catch (error) {
    console.error('[Search] Error getting index stats:', (error as Error).message)
    return { documentCount: 0, tokenCount: 0, tagCount: 0, channelCount: 0 }
  }
}

export async function clearIndex(index: string): Promise<boolean> {
  if (!isRedisAvailable()) return false
  const client = getRedisClient()
  if (!client) return false

  try {
    const searchKey = buildSearchKey(index)
    const indexKey = buildIndexKey(index)

    const keys = await client.keys(`${indexKey}:*`)
    if (keys.length > 0) {
      await client.del(...keys, searchKey)
    }

    return true
  } catch (error) {
    console.error('[Search] Error clearing index:', (error as Error).message)
    return false
  }
}

export async function updateDocument(
  index: string,
  documentId: string,
  updates: Partial<SearchDocument>
): Promise<boolean> {
  const existing = await getDocument(index, documentId)
  if (!existing) return false

  const updated: SearchDocument = {
    ...existing,
    ...updates,
    id: documentId,
  }

  return indexDocument(index, updated)
}

export class SearchIndex {
  private name: string

  constructor(name: string) {
    this.name = name
  }

  async index(document: SearchDocument): Promise<boolean> {
    return indexDocument(this.name, document)
  }

  async indexMany(documents: SearchDocument[]): Promise<number> {
    return indexDocuments(this.name, documents)
  }

  async remove(documentId: string): Promise<boolean> {
    return removeDocument(this.name, documentId)
  }

  async update(documentId: string, updates: Partial<SearchDocument>): Promise<boolean> {
    return updateDocument(this.name, documentId, updates)
  }

  async search(query: string, options?: SearchOptions): Promise<SearchResult> {
    return search(this.name, query, options)
  }

  async autocomplete(prefix: string, limit?: number): Promise<AutocompleteSuggestion[]> {
    return autocomplete(this.name, prefix, limit)
  }

  async get(documentId: string): Promise<SearchDocument | null> {
    return getDocument(this.name, documentId)
  }

  async getByTag(tag: string, limit?: number, offset?: number): Promise<SearchDocument[]> {
    return getDocumentsByTag(this.name, tag, limit, offset)
  }

  async getByChannel(channel: string, limit?: number, offset?: number): Promise<SearchDocument[]> {
    return getDocumentsByChannel(this.name, channel, limit, offset)
  }

  async getTop(limit?: number, offset?: number): Promise<SearchDocument[]> {
    return getTopByScore(this.name, limit, offset)
  }

  async stats(): Promise<ReturnType<typeof getIndexStats>> {
    return getIndexStats(this.name)
  }

  async clear(): Promise<boolean> {
    return clearIndex(this.name)
  }
}
