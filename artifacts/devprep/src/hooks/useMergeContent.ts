import { useMemo } from 'react'

/**
 * Content merger that combines static and generated (API) content.
 *
 * Strategy:
 * - Generated (API) content takes priority for items with the same ID.
 * - Static content is included for any items whose IDs don't appear in generated content.
 * - This ensures channels without API content still show their static fallback,
 *   while channels with API content get the richer generated data.
 */
export function useMergeContent<T extends { id: string }>(
  staticContent: T[],
  generatedContent: T[] | undefined
): T[] {
  return useMemo(() => {
    // If no generated content at all, return static
    if (!generatedContent || generatedContent.length === 0) {
      return staticContent
    }
    // If no static content, return generated
    if (staticContent.length === 0) {
      return generatedContent
    }
    // Merge: generated items first, then static items not already present
    const genIds = new Set(generatedContent.map(item => item.id))
    const uniqueStatic = staticContent.filter(item => !genIds.has(item.id))
    return [...generatedContent, ...uniqueStatic]
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
