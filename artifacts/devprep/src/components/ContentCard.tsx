import { memo, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Clock, Sparkles } from 'lucide-react'
import type { GeneratedContentItem, ContentType } from '@/types/realtime'
import { contentTypeLabels, contentTypeColors } from '@/types/realtime'

interface ContentCardProps {
  item: GeneratedContentItem
  onClick?: () => void
  isNew?: boolean
  showQualityScore?: boolean
  className?: string
}

const getQualityColor = (score: number): string => {
  if (score >= 0.8) return 'text-emerald-400'
  if (score >= 0.6) return 'text-blue-400'
  if (score >= 0.4) return 'text-amber-400'
  return 'text-red-400'
}

const getQualityBgColor = (score: number): string => {
  if (score >= 0.8) return 'bg-emerald-500/20'
  if (score >= 0.6) return 'bg-blue-500/20'
  if (score >= 0.4) return 'bg-amber-500/20'
  return 'bg-red-500/20'
}

const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(timestamp).toLocaleDateString()
}

function ContentCard({
  item,
  onClick,
  isNew = false,
  showQualityScore = true,
  className,
}: ContentCardProps) {
  // Memoize quality color to avoid recalculation on re-renders
  const qualityColor = useMemo(() => getQualityColor(item.qualityScore), [item.qualityScore])
  const qualityBgColor = useMemo(() => getQualityBgColor(item.qualityScore), [item.qualityScore])

  // Memoize the onClick handler to maintain referential equality
  const handleClick = useCallback(() => {
    onClick?.()
  }, [onClick])

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={cn(
        'glass-card-md group relative p-4 rounded-2xl cursor-pointer touch-feedback touch-target',
        'glass-hover glass-transition',
        isNew && 'ring-2 ring-primary/20 ring-offset-2 ring-offset-background',
        className
      )}
    >
      {isNew && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2"
        >
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
            <Badge className="relative bg-primary text-primary-foreground gap-1">
              <Sparkles className="w-3 h-3" />
              NEW
            </Badge>
          </div>
        </motion.div>
      )}

      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
            contentTypeColors[item.type]
          )}
        >
          <span className="text-xs font-bold uppercase">{item.type.charAt(0)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {contentTypeLabels[item.type]}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{item.channelId}</span>
          </div>

          <h4 className="font-semibold text-sm truncate mb-1 group-hover:text-primary transition-colors">
            {item.title}
          </h4>

          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{item.preview}</p>

          <div className="flex items-center gap-3">
            {showQualityScore && (
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3 text-secondary opacity-70 drop-shadow-sm" />
                <span className={cn('text-xs font-medium', qualityColor)}>
                  {(item.qualityScore * 100).toFixed(0)}%
                </span>
                <div
                  className={cn(
                    'w-16 h-1.5 rounded-full overflow-hidden bg-secondary',
                    ' [&>div]:h-full [&>div]:rounded-full',
                    qualityBgColor
                  )}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.qualityScore * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={qualityColor}
                    style={{
                      backgroundColor: `var(--quality-color, currentColor)`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3 text-secondary opacity-70 drop-shadow-sm" />
              {formatTimeAgo(item.createdAt)}
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
          </div>
        </div>
      </div>

      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: 'linear-gradient(135deg, rgba(var(--primary), 0.05) 0%, transparent 50%)',
        }}
      />
    </motion.div>
  )
}

// Memoize ContentCard to prevent unnecessary re-renders
export const ContentCardMemo = memo(ContentCard, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.qualityScore === nextProps.item.qualityScore &&
    prevProps.item.title === nextProps.item.title &&
    prevProps.item.preview === nextProps.item.preview &&
    prevProps.isNew === nextProps.isNew &&
    prevProps.showQualityScore === nextProps.showQualityScore &&
    prevProps.className === nextProps.className
  )
})

// Also export as default name for backward compatibility
export { ContentCardMemo as ContentCard }

interface NewBadgeProps {
  pulse?: boolean
  className?: string
}

export function NewBadge({ pulse = true, className }: NewBadgeProps) {
  return (
    <div className={cn('relative inline-flex', className)}>
      {pulse && <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />}
      <Badge className="relative bg-primary text-primary-foreground gap-1">
        <Sparkles className="w-3 h-3" />
        NEW
      </Badge>
    </div>
  )
}

interface QualityIndicatorProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function QualityIndicator({
  score,
  showLabel = true,
  size = 'md',
  className,
}: QualityIndicatorProps) {
  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-1.5',
    lg: 'text-base gap-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <div className={cn('flex items-center', sizeClasses[size], className)}>
      <TrendingUp
        className={cn(iconSizes[size], getQualityColor(score), 'opacity-70 drop-shadow-sm')}
      />
      {showLabel && (
        <span className={cn('font-medium', getQualityColor(score))}>
          {(score * 100).toFixed(0)}%
        </span>
      )}
      <div
        className={cn(
          'rounded-full overflow-hidden bg-secondary',
          size === 'sm' && 'w-12 h-1',
          size === 'md' && 'w-16 h-1.5',
          size === 'lg' && 'w-20 h-2'
        )}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score * 100}%` }}
          transition={{ duration: 0.5 }}
          className={cn('h-full rounded-full', getQualityColor(score))}
        />
      </div>
    </div>
  )
}

interface HighlightAnimationProps {
  children: React.ReactNode
  isActive?: boolean
  className?: string
}

export function HighlightAnimation({
  children,
  isActive = true,
  className,
}: HighlightAnimationProps) {
  if (!isActive) return <>{children}</>

  return (
    <motion.div
      initial={{ backgroundColor: 'rgba(var(--primary), 0.3)' }}
      animate={{ backgroundColor: 'rgba(var(--primary), 0)' }}
      transition={{ duration: 2, ease: 'easeOut' }}
      className={cn('rounded-lg', className)}
    >
      {children}
    </motion.div>
  )
}

interface ContentTypeBadgeProps {
  type: ContentType
  size?: 'sm' | 'md'
  className?: string
}

export function ContentTypeBadge({ type, size = 'md', className }: ContentTypeBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0',
    md: 'text-xs px-2 py-0.5',
  }

  return (
    <Badge
      className={cn(
        'font-medium uppercase tracking-wide',
        contentTypeColors[type],
        sizeClasses[size],
        className
      )}
      variant="secondary"
    >
      {type}
    </Badge>
  )
}
