import { useMemo, useRef } from 'react'

/**
 * Merges static content with generated content, deduplicating by ID.
 * Uses a ref to cache the Set for O(1) lookups, avoiding Set recreation.
 * Returns static content reference if no generated content exists.
 */
export function useMergeContent<T extends { id: string }>(
  staticContent: T[],
  generatedContent: T[] | undefined
): T[] {
  const cacheRef = useRef<Map<string, T>>(new Map(staticContent.map(item => [item.id, item])))

  if (staticContent.length > 0) {
    cacheRef.current = new Map(staticContent.map(item => [item.id, item]))
  }

  return useMemo(() => {
    if (!generatedContent || generatedContent.length === 0) {
      return staticContent
    }
    const newItems = generatedContent.filter(item => !cacheRef.current.has(item.id))
    if (newItems.length === 0) {
      return staticContent
    }
    newItems.forEach(item => cacheRef.current.set(item.id, item))
    return [...staticContent, ...newItems]
  }, [staticContent, generatedContent])
}

/**
 * Helper type for content maps from the generated content API
 */
export type GeneratedContentMap = {
  question?: unknown[]
  flashcard?: unknown[]
  exam?: unknown[]
  voice?: unknown[]
  coding?: unknown[]
}
