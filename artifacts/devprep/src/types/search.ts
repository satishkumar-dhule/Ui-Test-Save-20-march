export type SearchResultType = 'flashcard' | 'question' | 'coding' | 'voice' | 'exam'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  preview: string
  channelId?: string
  score?: number
  matchedIn?: 'title' | 'body' | 'both'
  tags?: string[]
  difficulty?: string
}

export interface SearchGroup {
  title: string
  results: SearchResult[]
}
