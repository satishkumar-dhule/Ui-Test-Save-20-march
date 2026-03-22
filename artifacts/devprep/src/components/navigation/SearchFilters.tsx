import { useState, useEffect } from 'react'
import { Filter, X, Hash, Tag, Layers, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useChannels } from '@/hooks/useChannels'
import type { ContentType } from '@/stores/types'

interface SearchFilters {
  channels: string[]
  types: ContentType[]
  difficulties: string[]
  tags: string[]
}

interface SearchFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
}

const contentTypes: { value: ContentType; label: string }[] = [
  { value: 'question', label: 'Questions' },
  { value: 'flashcard', label: 'Flashcards' },
  { value: 'exam', label: 'Exams' },
  { value: 'voice', label: 'Voice' },
  { value: 'coding', label: 'Coding' },
]

const difficulties = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

export function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
  const [expanded, setExpanded] = useState(true)
  const { channels = [] } = useChannels()
  
  // Common tags extracted from filters
  const commonTags = [
    'javascript', 'typescript', 'react', 'nodejs', 'python', 
    'docker', 'kubernetes', 'aws', 'terraform', 'devops'
  ]
  
  const toggleArrayFilter = <T,>(key: keyof SearchFilters, value: T) => {
    const current = filters[key] as T[]
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    
    onFiltersChange({
      ...filters,
      [key]: updated,
    })
  }
  
  const clearAllFilters = () => {
    onFiltersChange({
      channels: [],
      types: [],
      difficulties: [],
      tags: [],
    })
  }
  
  const activeFiltersCount = 
    filters.channels.length + 
    filters.types.length + 
    filters.difficulties.length + 
    filters.tags.length
  
  return (
    <div className="border-b bg-muted/30">
      {/* Filter header */}
      <div className="flex items-center justify-between px-4 py-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium"
          aria-label={expanded ? "Collapse filters" : "Expand filters"}
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </button>
        
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>
      
      {/* Filter options */}
      {expanded && (
        <div className="px-4 pb-3 space-y-4">
          {/* Channels */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Channels
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {channels.map((channel: any) => (
                <Button
                  key={channel.id}
                  variant={filters.channels.includes(channel.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayFilter('channels', channel.id)}
                  className="h-7 text-xs"
                >
                  {channel.name}
                  {filters.channels.includes(channel.id) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Content Types */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Layers className="h-3 w-3" />
              Content Type
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {contentTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={filters.types.includes(type.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayFilter('types', type.value)}
                  className="h-7 text-xs"
                >
                  {type.label}
                  {filters.types.includes(type.value) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Difficulty */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Difficulty
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {difficulties.map((diff) => (
                <Button
                  key={diff.value}
                  variant={filters.difficulties.includes(diff.value) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayFilter('difficulties', diff.value)}
                  className="h-7 text-xs"
                >
                  {diff.label}
                  {filters.difficulties.includes(diff.value) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Tags */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Tags
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {commonTags.map((tag) => (
                <Button
                  key={tag}
                  variant={filters.tags.includes(tag) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayFilter('tags', tag)}
                  className="h-7 text-xs"
                >
                  {tag}
                  {filters.tags.includes(tag) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Active filters summary */}
          {activeFiltersCount > 0 && (
            <div className="pt-2 border-t">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                Active Filters ({activeFiltersCount})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {filters.channels.map((channelId) => (
                  <Badge key={channelId} variant="secondary" className="gap-1">
                    <Hash className="h-3 w-3" />
                    {channelId}
                    <button
                      onClick={() => toggleArrayFilter('channels', channelId)}
                      className="ml-1 hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.types.map((type) => (
                  <Badge key={type} variant="secondary" className="gap-1">
                    <Layers className="h-3 w-3" />
                    {type}
                    <button
                      onClick={() => toggleArrayFilter('types', type)}
                      className="ml-1 hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.difficulties.map((diff) => (
                  <Badge key={diff} variant="secondary" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {diff}
                    <button
                      onClick={() => toggleArrayFilter('difficulties', diff)}
                      className="ml-1 hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {filters.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                    <button
                      onClick={() => toggleArrayFilter('tags', tag)}
                      className="ml-1 hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}