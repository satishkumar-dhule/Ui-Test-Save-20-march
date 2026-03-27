import { useState, useMemo, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Zap,
  FileQuestion,
  Mic,
  Code,
  X,
  Filter,
  Clock,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton, SkeletonLine } from '@/components/ui/skeleton'
import type { GeneratedContentItem, ContentType, ContentFilter } from '@/types/realtime'
import { contentTypeLabels, contentTypeColors } from '@/types/realtime'

interface LiveFeedProps {
  items: GeneratedContentItem[]
  loading?: boolean
  onItemClick?: (item: GeneratedContentItem) => void
  onRefresh?: () => void
  filter?: ContentFilter
  onFilterChange?: (filter: ContentFilter) => void
}

// Move icon map outside component - static reference
const contentTypeIcons: Record<ContentType, React.ReactNode> = {
  question: <FileQuestion className="w-4 h-4 text-secondary opacity-70 drop-shadow-sm" />,
  flashcard: <Sparkles className="w-4 h-4 text-secondary opacity-70 drop-shadow-sm" />,
  exam: <FileQuestion className="w-4 h-4" />,
  voice: <Mic className="w-4 h-4" />,
  coding: <Code className="w-4 h-4" />,
}

// Move utility functions outside component
const formatTimestamp = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(timestamp).toLocaleDateString()
}

const getQualityColor = (score: number): string => {
  if (score >= 0.8) return 'text-emerald-400'
  if (score >= 0.6) return 'text-blue-400'
  if (score >= 0.4) return 'text-amber-400'
  return 'text-red-400'
}

// Inner component with memo for performance
function LiveFeedInner({
  items,
  loading = false,
  onItemClick,
  onRefresh,
  filter,
  onFilterChange,
}: LiveFeedProps) {
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all')
  const [selectedChannel, setSelectedChannel] = useState<string | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Memoize filtered items to prevent recalculation on every render
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedType !== 'all' && item.type !== selectedType) return false
      if (selectedChannel !== 'all' && item.channelId !== selectedChannel) return false
      if (filter?.minQuality && item.qualityScore < filter.minQuality) return false
      return true
    })
  }, [items, selectedType, selectedChannel, filter])

  // Memoize unique channels to prevent recalculation
  const channels = useMemo(() => {
    const uniqueChannels = new Set(items.map(item => item.channelId))
    return Array.from(uniqueChannels).sort()
  }, [items])

  // Memoize hasActiveFilters to avoid recalculation
  const hasActiveFilters = selectedType !== 'all' || selectedChannel !== 'all'

  // Callback handlers with useCallback for stable references
  const handleTypeChange = useCallback(
    (type: ContentType | 'all') => {
      setSelectedType(type)
      onFilterChange?.({ ...filter, type: type === 'all' ? undefined : type })
    },
    [filter, onFilterChange]
  )

  const handleChannelChange = useCallback(
    (channel: string | 'all') => {
      setSelectedChannel(channel)
      onFilterChange?.({
        ...filter,
        channelId: channel === 'all' ? undefined : channel,
      })
    },
    [filter, onFilterChange]
  )

  const clearFilters = useCallback(() => {
    setSelectedType('all')
    setSelectedChannel('all')
    onFilterChange?.({})
  }, [onFilterChange])

  const handleItemClick = useCallback(
    (item: GeneratedContentItem) => {
      onItemClick?.(item)
    },
    [onItemClick]
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="relative">
            <TrendingUp className="w-5 h-5 text-primary" />
            <motion.span
              className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
          <h3 className="font-semibold text-sm">Live Feed</h3>
          {filteredItems.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {filteredItems.length}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn('gap-1.5', showFilters && 'bg-primary/10')}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 bg-primary rounded-full" />}
          </Button>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border/50 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Content Type</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleTypeChange('all')}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                      selectedType === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    )}
                  >
                    All
                  </button>
                  {(Object.keys(contentTypeLabels) as ContentType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => handleTypeChange(type)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5',
                        selectedType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      )}
                    >
                      {contentTypeIcons[type]}
                      {contentTypeLabels[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Channel</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleChannelChange('all')}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                      selectedChannel === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    )}
                  >
                    All
                  </button>
                  {channels.map(channel => (
                    <button
                      key={channel}
                      onClick={() => handleChannelChange(channel)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                        selectedChannel === channel
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary hover:bg-secondary/80'
                      )}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                  <X className="w-3 h-3 mr-1" />
                  Clear Filters
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton variant="avatar" className="w-8 h-8 rounded-lg" />
                  <div className="flex-1">
                    <SkeletonLine width="60%" className="mb-1" />
                    <SkeletonLine width="40%" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Zap className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h4 className="font-medium mb-1">No content yet</h4>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? 'No content matches your filters'
                : "New content will appear here as it's generated"}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <AnimatePresence initial={false}>
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    'group relative p-3 rounded-xl border transition-all cursor-pointer',
                    'bg-card/50 hover:bg-card border-border/50 hover:border-primary/30',
                    'hover:shadow-md hover:shadow-primary/5'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      className={cn(
                        'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                        contentTypeColors[item.type].split(' ')[0],
                        contentTypeColors[item.type].split(' ')[1]
                      )}
                      whileHover={{ scale: 1.1 }}
                    >
                      {contentTypeIcons[item.type]}
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] px-1.5 py-0', contentTypeColors[item.type])}
                        >
                          {contentTypeLabels[item.type]}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{item.channelId}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(item.createdAt)}
                        </span>
                      </div>

                      <h4 className="font-medium text-sm truncate mb-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>

                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {item.preview}
                      </p>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-muted-foreground" />
                          <span
                            className={cn(
                              'text-xs font-medium',
                              getQualityColor(item.qualityScore)
                            )}
                          >
                            {(item.qualityScore * 100).toFixed(0)}%
                          </span>
                        </div>

                        {item.difficulty && (
                          <span
                            className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded',
                              item.difficulty === 'easy' && 'bg-emerald-500/20 text-emerald-400',
                              item.difficulty === 'medium' && 'bg-amber-500/20 text-amber-400',
                              item.difficulty === 'hard' && 'bg-red-500/20 text-red-400'
                            )}
                          >
                            {item.difficulty}
                          </span>
                        )}

                        <div className="flex-1" />

                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <motion.div
                    className="absolute inset-0 rounded-xl border-2 border-primary/0 pointer-events-none"
                    whileHover={{ borderColor: 'rgba(var(--primary), 0.1)' }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

// Memoize LiveFeed for better performance
export const LiveFeedMemo = memo(LiveFeedInner, (prevProps, nextProps) => {
  // Custom comparison for complex prop comparisons
  return (
    prevProps.items === nextProps.items &&
    prevProps.loading === nextProps.loading &&
    prevProps.filter === nextProps.filter
  )
})

// Export both versions for backward compatibility
export { LiveFeedMemo as LiveFeed }

export function LiveFeedSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="w-20 h-4" />
        </div>
      </div>
      <div className="flex-1 p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton variant="avatar" className="w-9 h-9 rounded-lg" />
              <div className="flex-1">
                <SkeletonLine width="70%" className="mb-2" />
                <SkeletonLine width="50%" />
              </div>
            </div>
            <SkeletonLine width="90%" className="ml-11" />
            <SkeletonLine width="60%" className="ml-11" />
          </div>
        ))}
      </div>
    </div>
  )
}
