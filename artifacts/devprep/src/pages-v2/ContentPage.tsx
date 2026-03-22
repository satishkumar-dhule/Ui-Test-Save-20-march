import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ContentLayout } from '@/components/layouts/ContentLayout'
import { Button } from '@/components/atoms/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card'
import { Badge } from '@/components/atoms/Badge'
import { contentApi } from '@/lib/api/endpoints'

type ContentType = 'question' | 'flashcard' | 'exam' | 'voice' | 'coding'

export function ContentPage() {
  const [activeType, setActiveType] = useState<ContentType>('question')
  const [selectedChannel, setSelectedChannel] = useState<string>('all')

  const { data, isLoading, error } = useQuery({
    queryKey: ['content', activeType, selectedChannel],
    queryFn: () => contentApi.getByType(activeType),
  })

  const content = data?.data || []

  const contentTypes: Array<{ type: ContentType; label: string; icon: string }> = [
    { type: 'question', label: 'Questions', icon: '❓' },
    { type: 'flashcard', label: 'Flashcards', icon: '🎴' },
    { type: 'exam', label: 'Exams', icon: '📝' },
    { type: 'voice', label: 'Voice Practice', icon: '🎤' },
    { type: 'coding', label: 'Coding Challenges', icon: '💻' },
  ]

  const channels = [
    { id: 'all', name: 'All Channels' },
    { id: 'javascript', name: 'JavaScript' },
    { id: 'react', name: 'React' },
    { id: 'python', name: 'Python' },
    { id: 'devops', name: 'DevOps' },
    { id: 'system-design', name: 'System Design' },
  ]

  return (
    <ContentLayout
      title="Content Library"
      description="Browse and study technical interview content across all topics"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Content' },
      ]}
      sidebar={
        <div className="space-y-6">
          {/* Content Type Filter */}
          <div>
            <h3 className="font-medium mb-3">Content Type</h3>
            <div className="space-y-1">
              {contentTypes.map((item) => (
                <Button
                  key={item.type}
                  variant={activeType === item.type ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveType(item.type)}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Channel Filter */}
          <div>
            <h3 className="font-medium mb-3">Channel</h3>
            <div className="space-y-1">
              {channels.map((channel) => (
                <Button
                  key={channel.id}
                  variant={selectedChannel === channel.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedChannel(channel.id)}
                >
                  {channel.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="pt-4 border-t">
            <h3 className="font-medium mb-3">Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Items</span>
                <span className="font-medium">{content.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">In Progress</span>
                <span className="font-medium">0</span>
              </div>
            </div>
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">Error loading content</h3>
          <p className="text-muted-foreground mt-1">Please try again later</p>
        </div>
      ) : content.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No content found</h3>
          <p className="text-muted-foreground mt-1">Try selecting a different channel or content type</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {content.map((item: any) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg line-clamp-2">
                    {item.title || item.question || 'Untitled'}
                  </CardTitle>
                  <Badge variant="outline" className="ml-2 shrink-0">
                    {item.difficulty || 'Medium'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {item.description || item.content || 'No description available'}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {item.tags?.slice(0, 3).map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm">
                    Study →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </ContentLayout>
  )
}