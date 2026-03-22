import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card'
import { Badge } from '@/components/atoms'
import type { ContentItem } from '@/lib/api/endpoints'

interface ContentListProps {
  content: ContentItem[]
  isLoading?: boolean
  error?: Error
}

export function ContentList({ content, isLoading, error }: ContentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 w-3/4 rounded bg-muted"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-muted"></div>
                <div className="h-3 w-5/6 rounded bg-muted"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        Error loading content: {error.message}
      </div>
    )
  }

  if (content.length === 0) {
    return (
      <div className="rounded-lg border border-muted p-8 text-center text-muted-foreground">
        No content available for this channel.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {content.map(item => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{getTitle(item)}</CardTitle>
              <Badge variant="secondary" className="ml-2">
                {item.content_type}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{getPreview(item)}</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Quality: {Math.round(item.quality_score * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(item.created_at * 1000).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function getTitle(item: ContentItem): string {
  const data = item.data
  switch (item.content_type) {
    case 'question':
      return (data.question as string) || 'Question'
    case 'flashcard':
      return (data.front as string) || 'Flashcard'
    case 'exam':
      return (data.title as string) || 'Exam Question'
    case 'voice':
      return (data.prompt as string) || 'Voice Practice'
    case 'coding':
      return (data.title as string) || 'Coding Challenge'
    default:
      return item.id
  }
}

function getPreview(item: ContentItem): string {
  const data = item.data
  switch (item.content_type) {
    case 'question':
      return data.answer ? String(data.answer).slice(0, 150) + '...' : ''
    case 'flashcard':
      return data.back ? String(data.back).slice(0, 150) + '...' : ''
    case 'exam':
      return data.options ? (data.options as string[]).join(' / ').slice(0, 150) + '...' : ''
    case 'voice':
      return data.keyPoints ? (data.keyPoints as string[]).join(', ').slice(0, 150) + '...' : ''
    case 'coding':
      return data.description ? String(data.description).slice(0, 150) + '...' : ''
    default:
      return ''
  }
}
