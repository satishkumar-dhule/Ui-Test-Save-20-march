import { useState, useMemo, useCallback } from 'react'
import { useLocation } from 'wouter'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/molecules/Card/Card'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button/Button'
import { Input } from '@/components/atoms/Input'
import { ProgressBar } from '@/components/molecules/ProgressBar/ProgressBar'
import { useNewTheme } from '@/hooks/useNewTheme'
import { useChannels } from '@/hooks/useChannels'
import { useGeneratedContent } from '@/hooks/useGeneratedContent'
import { cn } from '@/lib/utils/cn'
import { ArrowLeft, Search, HelpCircle, BookOpen, FileText, Mic, Code, Inbox } from 'lucide-react'

type ContentTypeFilter = 'all' | 'question' | 'flashcard' | 'exam' | 'voice' | 'coding'

interface ContentTypeConfig {
  id: ContentTypeFilter
  label: string
  icon: React.ReactNode
  color: string
}

const contentTypes: ContentTypeConfig[] = [
  { id: 'all', label: 'All', icon: <Inbox className="w-4 h-4" />, color: 'text-muted-foreground' },
  {
    id: 'question',
    label: 'Questions',
    icon: <HelpCircle className="w-4 h-4" />,
    color: 'text-blue-500',
  },
  {
    id: 'flashcard',
    label: 'Flashcards',
    icon: <BookOpen className="w-4 h-4" />,
    color: 'text-emerald-500',
  },
  { id: 'exam', label: 'Exams', icon: <FileText className="w-4 h-4" />, color: 'text-amber-500' },
  { id: 'voice', label: 'Voice', icon: <Mic className="w-4 h-4" />, color: 'text-purple-500' },
  { id: 'coding', label: 'Coding', icon: <Code className="w-4 h-4" />, color: 'text-rose-500' },
]

function ChannelHeader({
  channel,
}: {
  channel: ReturnType<typeof useChannels>['channels'][0] | undefined
}) {
  const { isDark } = useNewTheme()

  if (!channel) return null

  return (
    <Card className="p-6" variant="elevated">
      <div className="flex items-start gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{ backgroundColor: isDark ? `${channel.color}20` : `${channel.color}15` }}
        >
          {channel.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <CardTitle className="text-2xl">{channel.name}</CardTitle>
            <Badge variant="secondary" size="sm">
              {channel.type === 'cert' ? 'Certification' : 'Technology'}
            </Badge>
          </div>
          <CardDescription className="text-base">{channel.description}</CardDescription>
          {channel.tagFilter && channel.tagFilter.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {channel.tagFilter.slice(0, 5).map((tag: string) => (
                <Badge key={tag} variant="outline" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function ProgressBreakdown({
  generated,
}: {
  generated: ReturnType<typeof useGeneratedContent>['generated']
}) {
  const counts = useMemo(() => {
    const allContent = [
      ...(generated.question || []),
      ...(generated.flashcard || []),
      ...(generated.exam || []),
      ...(generated.voice || []),
      ...(generated.coding || []),
    ]

    return {
      question: (generated.question as any[])?.length || 0,
      flashcard: (generated.flashcard as any[])?.length || 0,
      exam: (generated.exam as any[])?.length || 0,
      voice: (generated.voice as any[])?.length || 0,
      coding: (generated.coding as any[])?.length || 0,
    }
  }, [generated])

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  const breakdown: { type: ContentTypeFilter; count: number; percent: number }[] = [
    {
      type: 'question',
      count: counts.question,
      percent: total > 0 ? (counts.question / total) * 100 : 0,
    },
    {
      type: 'flashcard',
      count: counts.flashcard,
      percent: total > 0 ? (counts.flashcard / total) * 100 : 0,
    },
    { type: 'exam', count: counts.exam, percent: total > 0 ? (counts.exam / total) * 100 : 0 },
    { type: 'voice', count: counts.voice, percent: total > 0 ? (counts.voice / total) * 100 : 0 },
    {
      type: 'coding',
      count: counts.coding,
      percent: total > 0 ? (counts.coding / total) * 100 : 0,
    },
  ]

  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Content Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {breakdown.map(item => {
          const config = contentTypes.find(c => c.id === item.type)
          return (
            <div key={item.type} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className={cn('flex items-center gap-2', config?.color)}>
                  {config?.icon}
                  {config?.label}
                </span>
                <span className="text-muted-foreground">
                  {item.count} ({Math.round(item.percent)}%)
                </span>
              </div>
              <ProgressBar value={item.percent} className="h-1.5" />
            </div>
          )
        })}
        <div className="pt-2 border-t border-border mt-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Total</span>
            <span>{total} items</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ContentTypeTabs({
  activeFilter,
  onFilterChange,
  counts,
}: {
  activeFilter: ContentTypeFilter
  onFilterChange: (filter: ContentTypeFilter) => void
  counts: Record<ContentTypeFilter, number>
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {contentTypes.map(config => {
        const isActive = activeFilter === config.id
        const count = counts[config.id]

        return (
          <Button
            key={config.id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange(config.id)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <span className={cn(isActive && 'text-white/80', config.color)}>{config.icon}</span>
            {config.label}
            <Badge variant={isActive ? 'secondary' : 'outline'} size="sm" className="ml-1">
              {count}
            </Badge>
          </Button>
        )
      })}
    </div>
  )
}

function ContentItemCard({ item }: { item: any }) {
  const title = item.title || item.question || 'Untitled'
  const description = item.answer || item.explanation || item.data?.description || ''

  const difficulty = item.difficulty || item.data?.difficulty
  const tags = item.tags || item.data?.tags || []

  const difficultyVariant =
    difficulty === 'easy' || difficulty === 'beginner'
      ? 'success'
      : difficulty === 'medium' || difficulty === 'intermediate'
        ? 'warning'
        : difficulty === 'hard' || difficulty === 'advanced'
          ? 'destructive'
          : 'secondary'

  return (
    <Card
      className="p-4 hover:border-primary/50 transition-colors cursor-pointer"
      variant="interactive"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <CardTitle className="text-base line-clamp-2">{title}</CardTitle>
        {difficulty && (
          <Badge variant={difficultyVariant} size="sm">
            {difficulty}
          </Badge>
        )}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 4).map((tag: string) => (
            <Badge key={tag} variant="outline" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  )
}

function EmptyState({ onGoBack }: { onGoBack: () => void }) {
  return (
    <Card className="p-12">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Inbox className="w-8 h-8 text-muted-foreground" />
        </div>
        <CardTitle>No Content Found</CardTitle>
        <CardDescription>
          There is no content available for this channel yet. Generate some content to get started.
        </CardDescription>
        <Button onClick={onGoBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Back to Dashboard
        </Button>
      </div>
    </Card>
  )
}

export function ChannelPage() {
  const [location, navigate] = useLocation()
  const channelId = location.split('/channels/')[1]?.split('/')[0] || null

  const handleGoBack = useCallback(() => {
    navigate('/dashboard')
  }, [navigate])
  const { channels } = useChannels()
  const { generated, loading } = useGeneratedContent()

  const [filter, setFilter] = useState<ContentTypeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const channel = useMemo(() => {
    return channels.find(c => c.id === channelId)
  }, [channels, channelId])

  const allContent = useMemo(() => {
    const channelFilter = channel?.tagFilter || []

    const items: any[] = [
      ...(generated.question || []),
      ...(generated.flashcard || []),
      ...(generated.exam || []),
      ...(generated.voice || []),
      ...(generated.coding || []),
    ]

    return items.filter(item => {
      if (channelFilter.length > 0) {
        const itemTags = item.tags || []
        const hasTag = channelFilter.some(tag => itemTags.includes(tag))
        const channelMatch = item.channelId === channelId
        if (!hasTag && !channelMatch) return false
      } else if (channelId) {
        const itemTags = item.tags || []
        const hasTag = itemTags.includes(channelId)
        const channelMatch = item.channelId === channelId
        if (!hasTag && !channelMatch) return false
      }
      return true
    })
  }, [generated, channelId, channel])

  const filteredContent = useMemo(() => {
    let items = allContent

    if (filter !== 'all') {
      items = items.filter(item => {
        if (filter === 'question')
          return !!(generated.question as any[])?.find(q => q.id === item.id)
        if (filter === 'flashcard')
          return !!(generated.flashcard as any[])?.find(f => f.id === item.id)
        if (filter === 'exam') return !!(generated.exam as any[])?.find(e => e.id === item.id)
        if (filter === 'voice') return !!(generated.voice as any[])?.find(v => v.id === item.id)
        if (filter === 'coding') return !!(generated.coding as any[])?.find(c => c.id === item.id)
        return true
      })
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      items = items.filter(item => {
        const title = (item.title || item.question || '').toLowerCase()
        const desc = (item.answer || item.explanation || '').toLowerCase()
        const tags = (item.tags || []).join(' ').toLowerCase()
        return title.includes(query) || desc.includes(query) || tags.includes(query)
      })
    }

    return items
  }, [allContent, filter, searchQuery, generated])

  const counts = useMemo(() => {
    const result: Record<ContentTypeFilter, number> = {
      all: allContent.length,
      question:
        (generated.question as any[])?.filter((q: any) => {
          if (channel?.tagFilter?.length) {
            const tags = q.tags || []
            return channel.tagFilter.some(t => tags.includes(t)) || q.channelId === channelId
          }
          return q.channelId === channelId || (q.tags || []).includes(channelId || '')
        }).length || 0,
      flashcard:
        (generated.flashcard as any[])?.filter((f: any) => {
          if (channel?.tagFilter?.length) {
            const tags = f.tags || []
            return channel.tagFilter.some(t => tags.includes(t)) || f.channelId === channelId
          }
          return f.channelId === channelId || (f.tags || []).includes(channelId || '')
        }).length || 0,
      exam: (generated.exam as any[])?.filter((e: any) => e.channelId === channelId).length || 0,
      voice: (generated.voice as any[])?.filter((v: any) => v.channelId === channelId).length || 0,
      coding:
        (generated.coding as any[])?.filter((c: any) => {
          if (channel?.tagFilter?.length) {
            const tags = c.tags || []
            return channel.tagFilter.some(t => tags.includes(t)) || c.channelId === channelId
          }
          return c.channelId === channelId || (c.tags || []).includes(channelId || '')
        }).length || 0,
    }
    return result
  }, [allContent, generated, channelId, channel])

  if (!channel) {
    return (
      <div className="p-6">
        <EmptyState onGoBack={handleGoBack} />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleGoBack}
        leftIcon={<ArrowLeft className="w-4 h-4" />}
      >
        Back to Dashboard
      </Button>

      <ChannelHeader channel={channel} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <ContentTypeTabs activeFilter={filter} onFilterChange={setFilter} counts={counts} />
            <div className="w-full sm:w-72">
              <Input
                type="search"
                placeholder="Search content..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                leftElement={<Search className="w-4 h-4" />}
                rightElement={
                  searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  )
                }
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-full bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                  </div>
                </Card>
              ))}
            </div>
          ) : filteredContent.length === 0 ? (
            <EmptyState onGoBack={handleGoBack} />
          ) : (
            <div className="grid gap-4">
              {filteredContent.map(item => (
                <ContentItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            <ProgressBreakdown generated={generated} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChannelPage
