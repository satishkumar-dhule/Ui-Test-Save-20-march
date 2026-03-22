import { FileText, HelpCircle, Mic, Code, BookOpen, Hash, Clock, Star, Tag } from 'lucide-react'
import { CommandItem, CommandGroup, CommandSeparator } from '@/components/ui/command'
import type { ContentType } from '@/stores/types'

interface SearchResult {
  id: string
  title: string
  description: string
  type: ContentType
  channelId: string
  tags: string[]
  score: number
  url: string
}

interface SearchFilters {
  channels: string[]
  types: ContentType[]
  difficulties: string[]
  tags: string[]
}

interface SearchResultsProps {
  results: SearchResult[]
  selectedIndex: number
  onSelect: (result: SearchResult) => void
  filters: SearchFilters
}

const typeIcons: Record<ContentType, React.ReactNode> = {
  question: <HelpCircle className="h-4 w-4" />,
  flashcard: <FileText className="h-4 w-4" />,
  exam: <BookOpen className="h-4 w-4" />,
  voice: <Mic className="h-4 w-4" />,
  coding: <Code className="h-4 w-4" />,
}

const typeLabels: Record<ContentType, string> = {
  question: 'Question',
  flashcard: 'Flashcard',
  exam: 'Exam',
  voice: 'Voice',
  coding: 'Coding',
}

export function SearchResults({ results, selectedIndex, onSelect, filters }: SearchResultsProps) {
  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {} as Record<ContentType, SearchResult[]>)
  
  // Calculate current index offset
  let currentIndex = 0
  
  return (
    <>
      {/* Results header */}
      <div className="px-4 py-2 text-xs text-muted-foreground border-b">
        <div className="flex items-center justify-between">
          <span>{results.length} results found</span>
          <div className="flex gap-2">
            {filters.channels.length > 0 && (
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {filters.channels.length} channel{filters.channels.length > 1 ? 's' : ''}
              </span>
            )}
            {filters.types.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {filters.types.length} type{filters.types.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Grouped results */}
      {Object.entries(groupedResults).map(([type, typeResults]) => {
        const startIndex = currentIndex
        currentIndex += typeResults.length
        
        return (
          <CommandGroup 
            key={type} 
            heading={`${typeLabels[type as ContentType]} (${typeResults.length})`}
          >
            {typeResults.map((result, idx) => {
              const itemIndex = startIndex + idx
              const isSelected = selectedIndex === itemIndex
              
              return (
                <CommandItem
                  key={result.id}
                  onSelect={() => onSelect(result)}
                  data-cmdk-item
                  data-selected={isSelected}
                  className="cursor-pointer flex items-start gap-3 py-3"
                >
                  <div className="flex-shrink-0 mt-1">
                    {typeIcons[result.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">
                        {result.title}
                      </h4>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {result.channelId}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                      {result.description}
                    </p>
                    {result.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {result.tags.slice(0, 3).map(tag => (
                          <span 
                            key={tag} 
                            className="text-xs bg-secondary/50 text-secondary-foreground px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {result.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{result.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    <Star className="h-3 w-3 inline mr-1 text-yellow-500" />
                    {result.score}
                  </div>
                </CommandItem>
              )
            })}
          </CommandGroup>
        )
      })}
      
      {/* No filters active message */}
      {results.length > 0 && (
        <CommandSeparator />
      )}
    </>
  )
}