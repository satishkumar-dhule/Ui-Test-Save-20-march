import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  TrendingUp,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  FileQuestion,
  Sparkles,
  Mic,
  Code,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LiveFeed, LiveFeedSkeleton } from '@/components/LiveFeed'
import type {
  GeneratedContentItem,
  ContentType,
  ContentActivity,
  ConnectionStatus,
} from '@/types/realtime'
import { contentTypeLabels, contentTypeColors } from '@/types/realtime'

interface RealtimeDashboardProps {
  onNavigateToContent?: (item: GeneratedContentItem) => void
}

const connectionStatusConfig: Record<
  ConnectionStatus,
  { icon: React.ReactNode; color: string; label: string }
> = {
  connected: {
    icon: <Wifi className="w-4 h-4" />,
    color: 'text-emerald-400',
    label: 'Connected',
  },
  connecting: {
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    color: 'text-amber-400',
    label: 'Connecting...',
  },
  disconnected: {
    icon: <WifiOff className="w-4 h-4" />,
    color: 'text-red-400',
    label: 'Disconnected',
  },
  reconnecting: {
    icon: <RefreshCw className="w-4 h-4 animate-spin" />,
    color: 'text-amber-400',
    label: 'Reconnecting...',
  },
}

const contentTypeIcons: Record<ContentType, React.ReactNode> = {
  question: <FileQuestion className="w-5 h-5" />,
  flashcard: <Sparkles className="w-5 h-5" />,
  exam: <FileQuestion className="w-5 h-5" />,
  voice: <Mic className="w-5 h-5" />,
  coding: <Code className="w-5 h-5" />,
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

function generateMockData(): {
  items: GeneratedContentItem[]
  activities: ContentActivity[]
} {
  const titles: Record<ContentType, string[]> = {
    question: [
      'How does the event loop handle microtasks?',
      'Explain closure scope in JavaScript',
      'What is the difference between var and let?',
    ],
    flashcard: [
      'What is hoisting in JavaScript?',
      'Explain the prototype chain',
      'What are the phases of the event loop?',
    ],
    exam: [
      'JavaScript Event Loop MCQ',
      'React Hooks Fundamentals',
      'Async/Await Interview Questions',
    ],
    voice: [
      'Explain React useEffect cleanup',
      'Describe the useMemo dependency array',
      'Walk through async/await error handling',
    ],
    coding: [
      'Implement a debounce function',
      'Create a deep clone utility',
      'Build a custom useState hook',
    ],
  }

  const channels = ['javascript', 'react', 'algorithms', 'devops', 'aws-saa', 'kubernetes']

  const items: GeneratedContentItem[] = []
  const activities: ContentActivity[] = []

  for (let i = 0; i < 20; i++) {
    const types: ContentType[] = ['question', 'flashcard', 'exam', 'voice', 'coding']
    const type = types[Math.floor(Math.random() * types.length)]
    const channelId = channels[Math.floor(Math.random() * channels.length)]
    const titleList = titles[type]
    const title = titleList[Math.floor(Math.random() * titleList.length)]
    const timestamp = Date.now() - Math.random() * 3600000

    const item: GeneratedContentItem = {
      id: `gen-${i}`,
      type,
      channelId,
      title,
      preview: `Generated content for ${channelId} - ${type} practice material with detailed explanations and examples.`,
      qualityScore: 0.5 + Math.random() * 0.45,
      createdAt: timestamp,
      tags: [type, channelId, 'generated'],
      difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
    }

    items.push(item)

    activities.push({
      id: `act-${i}`,
      type,
      channelId,
      title,
      timestamp,
      status: Math.random() > 0.1 ? 'success' : 'failed',
      durationMs: Math.floor(1000 + Math.random() * 5000),
    })
  }

  return { items: items.sort((a, b) => b.createdAt - a.createdAt), activities }
}

export function RealtimeDashboard({ onNavigateToContent }: RealtimeDashboardProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [feedItems, setFeedItems] = useState<GeneratedContentItem[]>([])
  const [activities, setActivities] = useState<ContentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [newItemsCount, setNewItemsCount] = useState(0)
  const [activeTab, setActiveTab] = useState<'feed' | 'stats' | 'activity'>('feed')

  useEffect(() => {
    const mockData = generateMockData()
    setFeedItems(mockData.items)
    setActivities(mockData.activities)

    const statusTimeout = setTimeout(() => {
      setLoading(false)
      setConnectionStatus('connected')
    }, 1500)

    return () => clearTimeout(statusTimeout)
  }, [])

  useEffect(() => {
    if (connectionStatus !== 'connected') return

    const interval = setInterval(() => {
      const types: ContentType[] = ['question', 'flashcard', 'exam', 'voice', 'coding']
      const type = types[Math.floor(Math.random() * types.length)]
      const newItem: GeneratedContentItem = {
        id: `gen-${Date.now()}`,
        type,
        channelId: ['javascript', 'react', 'algorithms'][Math.floor(Math.random() * 3)],
        title: `New ${type} content generated`,
        preview: 'Freshly generated content ready for practice.',
        qualityScore: 0.5 + Math.random() * 0.45,
        createdAt: Date.now(),
        tags: [type],
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
      }

      setFeedItems(prev => [newItem, ...prev.slice(0, 19)])
      setNewItemsCount(prev => prev + 1)
    }, 15000)

    return () => clearInterval(interval)
  }, [connectionStatus])

  const stats = useMemo(() => {
    const byType: Record<ContentType, number> = {
      question: 0,
      flashcard: 0,
      exam: 0,
      voice: 0,
      coding: 0,
    }
    const byChannel: Record<string, number> = {}

    feedItems.forEach(item => {
      byType[item.type]++
      byChannel[item.channelId] = (byChannel[item.channelId] || 0) + 1
    })

    const avgQuality =
      feedItems.reduce((sum, item) => sum + item.qualityScore, 0) / feedItems.length || 0

    return {
      total: feedItems.length,
      byType,
      byChannel,
      avgQuality,
      recentCount: newItemsCount,
    }
  }, [feedItems, newItemsCount])

  const handleRefresh = useCallback(() => {
    setLoading(true)
    setConnectionStatus('connecting')
    setTimeout(() => {
      const mockData = generateMockData()
      setFeedItems(mockData.items)
      setActivities(mockData.activities)
      setLoading(false)
      setConnectionStatus('connected')
    }, 1000)
  }, [])

  const handleItemClick = useCallback(
    (item: GeneratedContentItem) => {
      onNavigateToContent?.(item)
    },
    [onNavigateToContent]
  )

  const statusConfig = connectionStatusConfig[connectionStatus]

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex-shrink-0 border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  'bg-gradient-to-br from-primary/20 to-primary/5',
                  'border border-primary/20'
                )}
              >
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <motion.div
                className={cn('absolute -bottom-1 -right-1', statusConfig.color)}
                animate={
                  connectionStatus === 'connected'
                    ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }
                    : {}
                }
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {statusConfig.icon}
              </motion.div>
            </motion.div>

            <div>
              <h1 className="text-xl font-bold">Realtime Dashboard</h1>
              <div className="flex items-center gap-2 text-sm">
                <span className={cn('flex items-center gap-1', statusConfig.color)}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">{stats.total} items total</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {newItemsCount > 0 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1">
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    +{newItemsCount}
                  </motion.span>
                  New
                </Badge>
              </motion.div>
            )}

            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex px-6 pb-3 gap-1">
          {(['feed', 'stats', 'activity'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'feed' && feedItems.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {feedItems.length}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full"
            >
              {loading ? (
                <LiveFeedSkeleton />
              ) : (
                <LiveFeed
                  items={feedItems}
                  onItemClick={handleItemClick}
                  onRefresh={handleRefresh}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-y-auto p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.recentCount} new today
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Average Quality
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div className="text-3xl font-bold">
                        {(stats.avgQuality * 100).toFixed(0)}%
                      </div>
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Across all content</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Connection
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className={cn('flex items-center gap-2', statusConfig.color)}>
                        {statusConfig.icon}
                        <span className="text-2xl font-bold">{statusConfig.label}</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">WebSocket status</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Content by Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(Object.keys(stats.byType) as ContentType[]).map(type => {
                        const count = stats.byType[type]
                        const percent = stats.total > 0 ? (count / stats.total) * 100 : 0
                        return (
                          <div key={type} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className={contentTypeColors[type]}>
                                  {contentTypeIcons[type]}
                                </span>
                                <span>{contentTypeLabels[type]}</span>
                              </div>
                              <span className="font-medium">{count}</span>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className={cn(
                                  'h-full rounded-full',
                                  type === 'question' && 'bg-emerald-500',
                                  type === 'flashcard' && 'bg-blue-500',
                                  type === 'exam' && 'bg-amber-500',
                                  type === 'voice' && 'bg-purple-500',
                                  type === 'coding' && 'bg-cyan-500'
                                )}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Content by Channel
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.byChannel)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 8)
                        .map(([channel, count]) => (
                          <div
                            key={channel}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                          >
                            <span className="text-sm font-medium capitalize">{channel}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{count}</span>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-y-auto p-6"
            >
              <div className="space-y-3">
                {activities.slice(0, 30).map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center gap-4 p-3 rounded-xl border bg-card/50 hover:bg-card transition-colors"
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        contentTypeColors[activity.type]
                      )}
                    >
                      {contentTypeIcons[activity.type]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{activity.channelId}</span>
                        <span>•</span>
                        <span className="capitalize">{activity.type}</span>
                        {activity.durationMs && (
                          <>
                            <span>•</span>
                            <span>{(activity.durationMs / 1000).toFixed(1)}s</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {activity.status === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
