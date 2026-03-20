import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, Sparkles, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GeneratedContentItem, ContentType } from '@/types/realtime'

interface NewContentBannerProps {
  content: GeneratedContentItem | null
  onDismiss: () => void
  onView: (content: GeneratedContentItem) => void
  autoHideDelay?: number
}

const contentTypeIcons: Record<ContentType, React.ReactNode> = {
  question: <Sparkles className="w-4 h-4" />,
  flashcard: <Zap className="w-4 h-4" />,
  exam: <Zap className="w-4 h-4" />,
  voice: <Zap className="w-4 h-4" />,
  coding: <Zap className="w-4 h-4" />,
}

const contentTypeColors: Record<ContentType, string> = {
  question: 'bg-emerald-500',
  flashcard: 'bg-blue-500',
  exam: 'bg-amber-500',
  voice: 'bg-purple-500',
  coding: 'bg-cyan-500',
}

export function NewContentBanner({
  content,
  onDismiss,
  onView,
  autoHideDelay = 10000,
}: NewContentBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [timeLeft, setTimeLeft] = useState(autoHideDelay)

  useEffect(() => {
    if (!content) {
      return
    }

    setIsExpanded(false)
    setTimeLeft(autoHideDelay)

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          onDismiss()
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [content, autoHideDelay, onDismiss])

  const handleView = useCallback(() => {
    if (content) {
      setIsExpanded(true)
    }
  }, [content])

  const handleDismiss = useCallback(() => {
    setIsExpanded(false)
    onDismiss()
  }, [onDismiss])

  if (!content) return null

  const progressPercent = (timeLeft / autoHideDelay) * 100

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-2"
      >
        <div
          className={cn(
            'w-full max-w-2xl relative overflow-hidden rounded-xl border shadow-2xl',
            'bg-gradient-to-r from-background via-background to-primary/5',
            'border-primary/20 backdrop-blur-md'
          )}
        >
          <motion.div
            className={cn(
              'absolute bottom-0 left-0 h-1 transition-all duration-1000',
              contentTypeColors[content.type]
            )}
            initial={{ width: '100%' }}
            animate={{ width: `${progressPercent}%` }}
          />

          <div className="p-4">
            <div className="flex items-start gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                  contentTypeColors[content.type],
                  'text-white'
                )}
              >
                {contentTypeIcons[content.type]}
              </motion.div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide',
                      contentTypeColors[content.type],
                      'text-white'
                    )}
                  >
                    New {content.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(timeLeft / 1000)}s
                  </span>
                </div>

                <h4 className="font-semibold text-sm truncate mb-1">{content.title}</h4>

                <p className="text-xs text-muted-foreground line-clamp-2">{content.preview}</p>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-border/50"
                    >
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {content.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-secondary/50 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <span>Channel: {content.channelId}</span>
                        <span>•</span>
                        <span>
                          Quality:{' '}
                          <span
                            className={cn(
                              content.qualityScore >= 0.7
                                ? 'text-emerald-400'
                                : content.qualityScore >= 0.5
                                  ? 'text-amber-400'
                                  : 'text-red-400'
                            )}
                          >
                            {(content.qualityScore * 100).toFixed(0)}%
                          </span>
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleView}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      'bg-primary/10 hover:bg-primary/20 text-primary',
                      'border border-primary/20'
                    )}
                  >
                    {isExpanded ? 'Hide Preview' : 'View Preview'}
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </motion.div>
                  </button>

                  <button
                    onClick={() => onView(content)}
                    className={cn(
                      'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                  >
                    Go to Content
                  </button>

                  <div className="flex-1" />

                  <button
                    onClick={handleDismiss}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      'hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                    )}
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export function useNewContentBanner() {
  const [pendingContent, setPendingContent] = useState<GeneratedContentItem | null>(null)

  const showContent = useCallback((content: GeneratedContentItem) => {
    setPendingContent(content)
  }, [])

  const dismissContent = useCallback(() => {
    setPendingContent(null)
  }, [])

  return {
    content: pendingContent,
    showContent,
    dismissContent,
  }
}
