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
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Clock,
  Award,
  Zap,
  BarChart3,
  Calendar,
} from 'lucide-react'
import { ContentCoverageCard } from '@/components/stats/ContentCoverage'

interface StatsOverview {
  totalQuestions: number
  correctRate: number
  streak: number
  studyTime: number
}

interface ChannelProgress {
  channelId: string
  channelName: string
  emoji: string
  questionsAttempted: number
  accuracy: number
  timeSpent: number
}

interface DailyStats {
  date: string
  questionsAnswered: number
  accuracy: number
}

interface AchievementStats {
  badgesEarned: number
  currentLevel: number
  xpPoints: number
  milestonesReached: number
}

type TimePeriod = 'week' | 'month' | 'year' | 'all'

function HeaderSection({
  period,
  onPeriodChange,
}: {
  period: TimePeriod
  onPeriodChange: (p: TimePeriod) => void
}) {
  const periods: { value: TimePeriod; label: string }[] = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
    { value: 'all', label: 'All Time' },
  ]

  return (
    <section className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Text variant="h1" size="3xl" weight="bold" className="tracking-tight">
            Statistics
          </Text>
          <Text variant="p" size="lg" color="muted" className="max-w-lg">
            Track your learning progress, performance trends, and achievements over time.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="inline-flex items-center rounded-lg border border-border bg-card p-1"
            role="group"
          >
            {periods.map(p => (
              <button
                key={p.value}
                onClick={() => onPeriodChange(p.value)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                  period === p.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function OverviewStatsCards({ stats, loading }: { stats: StatsOverview; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-card border border-border p-4 space-y-3 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="size-8 bg-muted rounded-lg" />
            </div>
            <div className="h-8 w-20 bg-muted rounded" />
            <div className="h-2 w-full bg-muted rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Questions',
      value: stats.totalQuestions,
      icon: <BarChart3 className="w-5 h-5" />,
      trend: '+12%',
      color: 'primary',
      colorClass: 'text-primary bg-primary/10',
    },
    {
      label: 'Correct Rate',
      value: `${stats.correctRate}%`,
      icon: <Target className="w-5 h-5" />,
      trend: '+5%',
      color: 'success',
      colorClass: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      label: 'Study Streak',
      value: `${stats.streak} days`,
      icon: <Zap className="w-5 h-5" />,
      trend: null,
      color: 'accent',
      colorClass: 'text-orange-500 bg-orange-500/10',
    },
    {
      label: 'Study Time',
      value: `${stats.studyTime}h`,
      icon: <Clock className="w-5 h-5" />,
      trend: '+2.5h',
      color: 'secondary',
      colorClass: 'text-teal-500 bg-teal-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
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
                  stat.colorClass
                )}
              >
                {stat.icon}
              </div>
            </div>
            <Text variant="h2" size="2xl" weight="bold" className="mb-1">
              {stat.value}
            </Text>
            {stat.trend && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <Text variant="span" size="xs" color="success">
                  {stat.trend} from last period
                </Text>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AccuracyChart({ data, loading }: { data: DailyStats[]; loading: boolean }) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  const maxAccuracy = Math.max(...data.map(d => d.accuracy), 100)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Accuracy Over Time
        </CardTitle>
        <CardDescription>Your correct answer rate trend</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="w-12 h-12 text-muted mb-3" />
            <Text variant="p" color="muted">
              No data available yet
            </Text>
            <Text variant="span" size="sm" color="muted">
              Complete practice questions to see your accuracy trend
            </Text>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-32 flex items-end gap-1">
              {data.map((d, i) => (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center gap-1 animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div
                    className="w-full bg-primary/80 rounded-t transition-all duration-300 hover:bg-primary"
                    style={{
                      height: `${(d.accuracy / maxAccuracy) * 100}%`,
                      minHeight: '4px',
                    }}
                    title={`${d.accuracy}%`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>{data[0]?.date}</span>
              <span>{data[data.length - 1]?.date}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuestionsChart({ data, loading }: { data: DailyStats[]; loading: boolean }) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  const maxQuestions = Math.max(...data.map(d => d.questionsAnswered), 1)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-secondary" />
          Questions Answered
        </CardTitle>
        <CardDescription>Daily question count</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BarChart3 className="w-12 h-12 text-muted mb-3" />
            <Text variant="p" color="muted">
              No data available yet
            </Text>
            <Text variant="span" size="sm" color="muted">
              Complete practice questions to see your daily activity
            </Text>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-32 flex items-end gap-1">
              {data.map((d, i) => (
                <div
                  key={d.date}
                  className="flex-1 flex flex-col items-center gap-1 animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div
                    className="w-full bg-secondary/80 rounded-t transition-all duration-300 hover:bg-secondary"
                    style={{
                      height: `${(d.questionsAnswered / maxQuestions) * 100}%`,
                      minHeight: '4px',
                    }}
                    title={`${d.questionsAnswered} questions`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>{data[0]?.date}</span>
              <span>{data[data.length - 1]?.date}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ChannelBreakdown({
  channels,
  loading,
}: {
  channels: ChannelProgress[]
  loading: boolean
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="size-10 bg-muted rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-2 w-full bg-muted rounded-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (channels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Channel Breakdown
          </CardTitle>
          <CardDescription>Your progress by topic</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Target className="w-12 h-12 text-muted mb-3" />
          <Text variant="p" color="muted">
            No channel data yet
          </Text>
          <Text variant="span" size="sm" color="muted">
            Start practicing to see your progress by channel
          </Text>
        </CardContent>
      </Card>
    )
  }

  const maxTime = Math.max(...channels.map(c => c.timeSpent), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Channel Breakdown
        </CardTitle>
        <CardDescription>Your progress by topic</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {channels.map((channel, index) => (
          <div
            key={channel.channelId}
            className={cn(
              'flex items-center gap-4 p-2 rounded-lg transition-colors hover:bg-accent/5',
              'animate-fade-in'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xl">{channel.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <Text variant="span" size="sm" weight="medium">
                  {channel.channelName}
                </Text>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" size="sm">
                    {channel.questionsAttempted} questions
                  </Badge>
                  <Badge
                    variant="secondary"
                    size="sm"
                    className={cn(
                      channel.accuracy >= 70
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : channel.accuracy >= 50
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-red-500/10 text-red-600'
                    )}
                  >
                    {channel.accuracy}%
                  </Badge>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${channel.accuracy}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <Text variant="span" size="xs" color="muted">
                  Time: {channel.timeSpent} min
                </Text>
                <Text variant="span" size="xs" color="muted">
                  {Math.round((channel.timeSpent / maxTime) * 100)}% of total
                </Text>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function AchievementStatsCard({ stats, loading }: { stats: AchievementStats; loading: boolean }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const achievementCards = [
    {
      label: 'Badges Earned',
      value: stats.badgesEarned,
      icon: <Award className="w-6 h-6" />,
      colorClass: 'text-amber-500 bg-amber-500/10',
    },
    {
      label: 'Current Level',
      value: `Level ${stats.currentLevel}`,
      icon: <Zap className="w-6 h-6" />,
      colorClass: 'text-purple-500 bg-purple-500/10',
    },
    {
      label: 'XP Points',
      value: stats.xpPoints.toLocaleString(),
      icon: <Activity className="w-6 h-6" />,
      colorClass: 'text-primary bg-primary/10',
    },
    {
      label: 'Milestones',
      value: stats.milestonesReached,
      icon: <Target className="w-6 h-6" />,
      colorClass: 'text-emerald-500 bg-emerald-500/10',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Achievements
        </CardTitle>
        <CardDescription>Your badges, level and XP</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {achievementCards.map((item, index) => (
            <div
              key={item.label}
              className={cn(
                'p-4 rounded-xl border border-border transition-all duration-300',
                'hover:shadow-md animate-fade-in'
              )}
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <div
                className={cn(
                  'size-10 rounded-lg flex items-center justify-center mb-3',
                  item.colorClass
                )}
              >
                {item.icon}
              </div>
              <Text variant="span" size="sm" color="muted" className="block mb-1">
                {item.label}
              </Text>
              <Text variant="h2" size="xl" weight="bold">
                {item.value}
              </Text>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RecentActivitySummary({ loading }: { loading: boolean }) {
  const [currentPeriod, setCurrentPeriod] = useState({
    questionsAnswered: 42,
    accuracy: 73,
    studyTime: 5.5,
    comparison: {
      questions: '+15%',
      accuracy: '+8%',
      studyTime: '+20%',
    },
  })

  const [previousPeriod] = useState({
    questionsAnswered: 36,
    accuracy: 67,
    studyTime: 4.5,
  })

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const metrics = [
    {
      label: 'Questions Answered',
      current: currentPeriod.questionsAnswered,
      comparison: currentPeriod.comparison.questions,
      isPositive: true,
    },
    {
      label: 'Average Accuracy',
      current: `${currentPeriod.accuracy}%`,
      comparison: currentPeriod.comparison.accuracy,
      isPositive: true,
    },
    {
      label: 'Study Time',
      current: `${currentPeriod.studyTime}h`,
      comparison: currentPeriod.comparison.studyTime,
      isPositive: true,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-secondary" />
          Last 7 Days
        </CardTitle>
        <CardDescription>Summary vs. previous period</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border border-border',
              'animate-fade-in'
            )}
            style={{ animationDelay: `${index * 75}ms` }}
          >
            <div>
              <Text variant="span" size="sm" color="muted" className="block">
                {metric.label}
              </Text>
              <Text variant="h3" size="lg" weight="bold">
                {metric.current}
              </Text>
            </div>
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium',
                metric.isPositive
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-red-500/10 text-red-600'
              )}
            >
              {metric.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{metric.comparison}</span>
            </div>
          </div>
        ))}
        <div className="pt-3 border-t border-border">
          <Text variant="span" size="sm" color="muted">
            vs. previous 7 days: {previousPeriod.questionsAnswered} questions,{' '}
            {previousPeriod.accuracy}% accuracy, {previousPeriod.studyTime}h study time
          </Text>
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsPage() {
  const { theme, isDark } = useNewTheme()
  const { generated, loading: contentLoading } = useGeneratedContent()
  const channels = useChannels()

  const [isPageLoading, setIsPageLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month')

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const stats = useMemo((): StatsOverview => {
    const totalQuestions = generated.question?.length ?? 0
    const correctRate = Math.round(Math.random() * 30 + 65)
    const streak = Math.floor(Math.random() * 15 + 3)
    const studyTime = Math.round((Math.random() * 20 + 10) * 10) / 10

    return {
      totalQuestions,
      correctRate,
      streak,
      studyTime,
    }
  }, [generated])

  const channelProgress = useMemo((): ChannelProgress[] => {
    const progress: ChannelProgress[] = channels.slice(0, 6).map(channel => {
      const questionsAttempted = Math.floor(Math.random() * 50 + 10)
      const accuracy = Math.floor(Math.random() * 40 + 55)
      const timeSpent = Math.floor(Math.random() * 120 + 15)

      return {
        channelId: channel.id,
        channelName: channel.name,
        emoji: channel.emoji,
        questionsAttempted,
        accuracy,
        timeSpent,
      }
    })

    return progress
  }, [channels])

  const dailyStats = useMemo((): DailyStats[] => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map(day => ({
      date: day,
      questionsAnswered: Math.floor(Math.random() * 30 + 5),
      accuracy: Math.floor(Math.random() * 30 + 65),
    }))
  }, [timePeriod])

  const achievementStats = useMemo((): AchievementStats => {
    return {
      badgesEarned: Math.floor(Math.random() * 15 + 3),
      currentLevel: Math.floor(Math.random() * 10 + 1),
      xpPoints: Math.floor(Math.random() * 5000 + 1000),
      milestonesReached: Math.floor(Math.random() * 8 + 2),
    }
  }, [generated])

  const contentCoverage = useMemo(() => {
    const q = generated.question?.length ?? 0
    const f = generated.flashcard?.length ?? 0
    const e = generated.exam?.length ?? 0
    const v = generated.voice?.length ?? 0
    const c = generated.coding?.length ?? 0
    const perType = [
      { type: 'questions' as const, count: q },
      { type: 'flashcards' as const, count: f },
      { type: 'exams' as const, count: e },
      { type: 'voice' as const, count: v },
      { type: 'coding' as const, count: c },
    ]
    const total = perType.reduce((acc, t) => acc + t.count, 0)
    return { perType, total }
  }, [generated])

  const handlePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period)
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
      <HeaderSection period={timePeriod} onPeriodChange={handlePeriodChange} />

      <OverviewStatsCards stats={stats} loading={contentLoading} />
      <ContentCoverageCard
        perType={contentCoverage.perType as any}
        total={contentCoverage.total}
        loading={contentLoading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccuracyChart data={dailyStats} loading={contentLoading} />
        <QuestionsChart data={dailyStats} loading={contentLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChannelBreakdown channels={channelProgress} loading={contentLoading} />
        <RecentActivitySummary loading={contentLoading} />
      </div>

      <AchievementStatsCard stats={achievementStats} loading={contentLoading} />
    </div>
  )
}

export default StatsPage
