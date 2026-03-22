export type SearchResultType = 'flashcard' | 'question' | 'coding' | 'voice' | 'exam'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  preview: string
  channelId?: string
}

export interface SearchGroup {
  title: string
  results: SearchResult[]
}
