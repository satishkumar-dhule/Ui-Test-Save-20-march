import { useState, useEffect, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/molecules/Card/Card'
import { Text } from '@/components/atoms/Text'
import { Button, buttonVariants } from '@/components/atoms/Button/Button'
import { Badge } from '@/components/atoms/Badge'
import { DashboardSkeleton } from '@/components/ui/SkeletonLoader'
import { useNewTheme } from '@/hooks/useNewTheme'
import { useChannels } from '@/hooks/useChannels'
import { useGeneratedContent } from '@/hooks/useGeneratedContent'
import { cn } from '@/lib/utils/cn'

interface StatCard {
  label: string
  value: number | string
  icon: string
  trend?: string
  color: 'primary' | 'secondary' | 'accent' | 'success'
}

interface ActivityItem {
  id: string
  type: 'question' | 'flashcard' | 'exam' | 'quiz' | 'streak'
  title: string
  description?: string
  timestamp: string
  channel?: string
}

interface RecommendedContent {
  id: string
  type: 'question' | 'flashcard' | 'exam' | 'voice' | 'coding'
  title: string
  difficulty?: string
  channel?: string
  channelEmoji?: string
}

const StatIcons: Record<string, string> = {
  questions: '❓',
  flashcards: '📚',
  streak: '🔥',
  exams: '📝',
  voice: '🎤',
  coding: '💻',
}

const ActivityIcons: Record<string, string> = {
  question: '❓',
  flashcard: '📚',
  exam: '📝',
  quiz: '⚡',
  streak: '🔥',
}

function HeroSection({ onQuickAction }: { onQuickAction: (action: string) => void }) {
  const { theme, isDark } = useNewTheme()

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 md:p-8">
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3">
          <Text variant="h1" size="3xl" weight="bold" className="tracking-tight">
            Welcome back
          </Text>
          <Text variant="p" size="lg" color="muted" className="max-w-md">
            Ready to continue your learning journey? Pick up where you left off or explore new
            content.
          </Text>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            onClick={() => onQuickAction('practice')}
            className="shadow-lg shadow-primary/25"
          >
            Start Practice
          </Button>
          <Button variant="outline" size="lg" onClick={() => onQuickAction('generate')}>
            Generate Content
          </Button>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
    </section>
  )
}

function StatsWidget({ stats, loading }: { stats: StatCard[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-card border border-border p-4 space-y-3 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="size-8 bg-muted rounded-lg" />
            </div>
            <div className="h-8 w-16 bg-muted rounded" />
            <div className="h-2 w-full bg-muted rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  const colorMap = {
    primary: 'text-primary bg-primary/10',
    secondary: 'text-secondary bg-secondary/10',
    accent: 'text-accent bg-accent/10',
    success: 'text-emerald-500 bg-emerald-500/10',
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card
          key={stat.label}
          className={cn(
            'p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-1',
            'animate-fade-in'
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-3">
              <Text variant="span" size="sm" color="muted" className="font-medium">
                {stat.label}
              </Text>
              <div
                className={cn(
                  'size-8 rounded-lg flex items-center justify-center',
                  colorMap[stat.color]
                )}
              >
                <span className="text-lg">{StatIcons[stat.label.toLowerCase()]}</span>
              </div>
            </div>
            <Text variant="h2" size="2xl" weight="bold" className="mb-1">
              {stat.value}
            </Text>
            {stat.trend && (
              <Text
                variant="span"
                size="xs"
                color={stat.trend.startsWith('+') ? 'success' : 'destructive'}
              >
                {stat.trend} from last week
              </Text>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ActivityFeedWidget({
  activities,
  loading,
}: {
  activities: ActivityItem[]
  loading: boolean
}) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="size-8 bg-muted rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (activities.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your learning history</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-4xl mb-3">📖</span>
          <Text variant="p" color="muted">
            No recent activity yet
          </Text>
          <Text variant="span" size="sm" color="muted">
            Start practicing to see your progress here
          </Text>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your learning history</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-accent/5',
              'animate-fade-in'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm">{ActivityIcons[activity.type]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <Text variant="span" size="sm" weight="medium" className="block truncate">
                {activity.title}
              </Text>
              <div className="flex items-center gap-2">
                {activity.channel && (
                  <Badge variant="secondary" size="sm">
                    {activity.channel}
                  </Badge>
                )}
                <Text variant="span" size="xs" color="muted">
                  {activity.timestamp}
                </Text>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function RecommendedContentWidget({
  content,
  loading,
  onSelect,
}: {
  content: RecommendedContent[]
  loading: boolean
  onSelect: (item: RecommendedContent) => void
}) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (content.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Recommended</CardTitle>
          <CardDescription>Personalized for you</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <span className="text-4xl mb-3">✨</span>
          <Text variant="p" color="muted">
            No recommendations yet
          </Text>
          <Text variant="span" size="sm" color="muted">
            Complete some practice to get personalized suggestions
          </Text>
        </CardContent>
      </Card>
    )
  }

  const typeColors: Record<string, string> = {
    question: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    flashcard: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    exam: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    voice: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    coding: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recommended</CardTitle>
        <CardDescription>Personalized for you</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {content.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={cn(
                'p-3 rounded-xl border border-border text-left transition-all duration-200',
                'hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5',
                'focus:outline-none focus:ring-2 focus:ring-primary/20',
                'animate-fade-in'
              )}
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{item.channelEmoji}</span>
                <Badge variant="outline" size="sm" className={typeColors[item.type]}>
                  {item.type}
                </Badge>
              </div>
              <Text variant="span" size="sm" weight="medium" className="block truncate mb-1">
                {item.title}
              </Text>
              {item.difficulty && (
                <Text variant="span" size="xs" color="muted">
                  {item.difficulty}
                </Text>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ChannelQuickLinks({
  channels,
  loading,
}: {
  channels: Array<{ id: string; name: string; shortName: string; emoji: string; color: string }>
  loading: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-5 w-28 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 w-24 bg-muted rounded-full animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channels</CardTitle>
        <CardDescription>Quick access to topics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {channels.slice(0, 8).map((channel, index) => (
            <button
              key={channel.id}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-full',
                'border border-border transition-all duration-200',
                'hover:border-primary/50 hover:shadow-sm hover:-translate-y-0.5',
                'focus:outline-none focus:ring-2 focus:ring-primary/20',
                'animate-fade-in'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-lg">{channel.emoji}</span>
              <Text variant="span" size="sm" weight="medium">
                {channel.name}
              </Text>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { theme, isDark } = useNewTheme()
  const { generated, loading: contentLoading } = useGeneratedContent()
  const channels = useChannels()

  const [isPageLoading, setIsPageLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo((): StatCard[] => {
    const questionCount = generated.question?.length ?? 0
    const flashcardCount = generated.flashcard?.length ?? 0

    return [
      { label: 'Questions', value: questionCount, icon: '❓', trend: '+12%', color: 'primary' },
      { label: 'Flashcards', value: flashcardCount, icon: '📚', trend: '+8%', color: 'secondary' },
      { label: 'Streak', value: 7, icon: '🔥', color: 'accent' },
      { label: 'Exams', value: generated.exam?.length ?? 0, icon: '📝', color: 'success' },
    ]
  }, [generated])

  const activities = useMemo((): ActivityItem[] => {
    return [
      {
        id: '1',
        type: 'question',
        title: 'Completed 5 DevOps questions',
        timestamp: '2 hours ago',
        channel: 'DevOps',
      },
      {
        id: '2',
        type: 'flashcard',
        title: 'Reviewed Docker flashcards',
        timestamp: '5 hours ago',
        channel: 'Docker',
      },
      { id: '3', type: 'streak', title: '7 day learning streak!', timestamp: 'Yesterday' },
      {
        id: '4',
        type: 'exam',
        title: 'Started AWS Solutions Architect prep',
        timestamp: '2 days ago',
        channel: 'AWS',
      },
    ]
  }, [])

  const recommendedContent = useMemo((): RecommendedContent[] => {
    const allContent: RecommendedContent[] = []

    if (generated.question) {
      generated.question.slice(0, 2).forEach(q => {
        allContent.push({
          id: q.id as string,
          type: 'question',
          title: (q.title as string) || 'Question',
          difficulty: q.difficulty as string,
          channel: q.channelId as string,
          channelEmoji: '📝',
        })
      })
    }

    if (generated.flashcard) {
      generated.flashcard.slice(0, 2).forEach(f => {
        allContent.push({
          id: f.id as string,
          type: 'flashcard',
          title: (f.front as string) || 'Flashcard',
          channel: f.channelId as string,
          channelEmoji: '📚',
        })
      })
    }

    return allContent.slice(0, 4)
  }, [generated])

  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action)
  }

  const handleContentSelect = (item: RecommendedContent) => {
    console.log('Selected content:', item)
  }

  if (isPageLoading) {
    return (
      <div className="p-6 space-y-6">
        <DashboardSkeleton />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <HeroSection onQuickAction={handleQuickAction} />

      <StatsWidget stats={stats} loading={contentLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeedWidget activities={activities} loading={contentLoading} />
        <RecommendedContentWidget
          content={recommendedContent}
          loading={contentLoading}
          onSelect={handleContentSelect}
        />
      </div>

      <ChannelQuickLinks channels={channels} loading={contentLoading} />
    </div>
  )
}

export default DashboardPage
