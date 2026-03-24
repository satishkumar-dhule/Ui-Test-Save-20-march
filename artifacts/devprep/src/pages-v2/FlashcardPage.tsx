import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card/Card'
import { Text } from '@/components/atoms/Text'
import { Button, buttonVariants } from '@/components/atoms/Button/Button'
import { Badge } from '@/components/atoms/Badge'
import { cn } from '@/lib/utils/cn'
import type { Flashcard } from '@/data/flashcards'

interface FlashcardPageProps {
  initialCards?: Flashcard[]
  onComplete?: (stats: FlashcardSessionStats) => void
}

interface FlashcardSessionStats {
  totalCards: number
  again: number
  hard: number
  good: number
  easy: number
  duration: number
}

interface SM2Data {
  easeFactor: number
  interval: number
  repetitions: number
  dueDate: number
  lastReviewed: number
}

const INTERVALS = {
  again: 1 * 60 * 1000,
  hard: 10 * 60 * 1000,
  good: 1,
  easy: 1,
} as const

type Rating = 'again' | 'hard' | 'good' | 'easy'

const ratingConfig = {
  again: {
    label: 'Again',
    color: 'bg-red-500 hover:bg-red-600',
    shortKey: '1',
    feedback: 'See you soon!',
  },
  hard: {
    label: 'Hard',
    color: 'bg-orange-500 hover:bg-orange-600',
    shortKey: '2',
    feedback: 'Review soon',
  },
  good: {
    label: 'Good',
    color: 'bg-green-500 hover:bg-green-600',
    shortKey: '3',
    feedback: 'Got it!',
  },
  easy: {
    label: 'Easy',
    color: 'bg-blue-500 hover:bg-blue-600',
    shortKey: '4',
    feedback: 'Perfect!',
  },
}

function calculateSM2(rating: Rating, prevData?: SM2Data): SM2Data {
  const defaultData: SM2Data = {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: Date.now(),
    lastReviewed: Date.now(),
  }

  const data = prevData ?? defaultData

  if (rating === 'again') {
    return {
      ...data,
      repetitions: 0,
      interval: INTERVALS.again,
      dueDate: Date.now() + INTERVALS.again,
      lastReviewed: Date.now(),
    }
  }

  if (rating === 'hard') {
    return {
      ...data,
      repetitions: data.repetitions > 0 ? data.repetitions : 1,
      easeFactor: Math.max(1.3, data.easeFactor - 0.15),
      interval: INTERVALS.hard,
      dueDate: Date.now() + INTERVALS.hard,
      lastReviewed: Date.now(),
    }
  }

  const easeFactorChange = rating === 'easy' ? 0.15 : 0
  const newEaseFactor = Math.max(1.3, data.easeFactor + easeFactorChange)

  const intervalMultiplier = rating === 'easy' ? 2 : 1
  const newInterval =
    data.interval === 0 ? 1 : Math.round(data.interval * newEaseFactor * intervalMultiplier)

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: data.repetitions + 1,
    dueDate: Date.now() + newInterval * 24 * 60 * 60 * 1000,
    lastReviewed: Date.now(),
  }
}

function FlashcardCard({
  card,
  isFlipped,
  onFlip,
}: {
  card: Flashcard
  isFlipped: boolean
  onFlip: () => void
}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return (
    <div
      className="relative w-full max-w-xl mx-auto perspective-1000"
      style={{ perspective: '1000px' }}
    >
      <div
        className={cn(
          'relative w-full min-h-[320px] cursor-pointer transition-all duration-400',
          'preserve-3d',
          isFlipped ? 'rotate-y-180' : ''
        )}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transitionDuration: prefersReducedMotion ? '0ms' : '400ms',
        }}
        onClick={onFlip}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? 'Show question' : 'Show answer'}
        onKeyDown={e => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault()
            onFlip()
          }
        }}
      >
        <Card
          className={cn(
            'absolute inset-0 w-full h-full backface-hidden',
            'border-2 border-border hover:border-primary/30',
            'transition-all duration-300',
            prefersReducedMotion ? 'opacity-100' : ''
          )}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="flex-1 flex items-center justify-center">
              <Text variant="h2" size="2xl" weight="semibold" className="leading-relaxed">
                {card.front}
              </Text>
            </div>
            <div className="mt-6 flex flex-col items-center gap-2">
              {card.tags && card.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {card.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <Text variant="span" size="sm" color="muted" className="mt-2">
                Tap or press Space to reveal answer
              </Text>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'absolute inset-0 w-full h-full backface-hidden rotate-y-180',
            'border-2 border-primary/50 bg-primary/5',
            prefersReducedMotion ? 'opacity-100' : ''
          )}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Text variant="h2" size="xl" weight="medium" className="leading-relaxed">
                {card.back}
              </Text>
              {card.codeExample && (
                <pre className="mt-4 p-4 bg-muted rounded-lg overflow-x-auto text-left max-w-full">
                  <code className="text-sm font-mono text-text-primary">
                    {card.codeExample.code}
                  </code>
                </pre>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RatingButtons({
  onRate,
  disabled,
  showFeedback,
}: {
  onRate: (rating: Rating) => void
  disabled: boolean
  showFeedback: { rating: Rating; show: boolean }
}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {(Object.keys(ratingConfig) as Rating[]).map(rating => {
        const config = ratingConfig[rating]
        const isActive = showFeedback.show && showFeedback.rating === rating

        return (
          <Button
            key={rating}
            onClick={() => onRate(rating)}
            disabled={disabled}
            className={cn(
              'min-w-[80px] transition-all duration-200',
              config.color,
              'text-white font-medium',
              disabled && 'opacity-50 cursor-not-allowed',
              prefersReducedMotion ? '' : 'hover:scale-105 active:scale-95',
              isActive && 'ring-4 ring-offset-2 ring-primary animate-pulse'
            )}
            style={{
              transitionDuration: prefersReducedMotion ? '0ms' : '200ms',
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <span>{config.label}</span>
              <Text variant="span" size="xs" className="opacity-75">
                [{config.shortKey}]
              </Text>
            </div>
          </Button>
        )
      })}
    </div>
  )
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = total > 0 ? (current / total) * 100 : 0

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <Text variant="span" size="sm" color="muted">
          Card {current + 1} of {total}
        </Text>
        <Text variant="span" size="sm" color="muted">
          {Math.round(progress)}% complete
        </Text>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}

function SM2Info({ data }: { data?: SM2Data }) {
  if (!data) {
    return (
      <div className="text-center">
        <Badge variant="outline" size="sm">
          New card
        </Badge>
      </div>
    )
  }

  const nextReview = data.dueDate - Date.now()
  const nextReviewText =
    nextReview > 0
      ? nextReview < 60 * 60 * 1000
        ? `${Math.round(nextReview / 60000)}m`
        : `${Math.round(nextReview / 3600000)}h`
      : 'Now'

  return (
    <div className="flex items-center justify-center gap-4">
      <div className="flex flex-col items-center">
        <Text variant="span" size="xs" color="muted">
          Interval
        </Text>
        <Text variant="span" size="sm" weight="medium">
          {data.interval === 0 ? 'New' : `${data.interval}d`}
        </Text>
      </div>
      <div className="flex flex-col items-center">
        <Text variant="span" size="xs" color="muted">
          Ease
        </Text>
        <Text variant="span" size="sm" weight="medium">
          {data.easeFactor.toFixed(1)}
        </Text>
      </div>
      <div className="flex flex-col items-center">
        <Text variant="span" size="xs" color="muted">
          Next
        </Text>
        <Text variant="span" size="sm" weight="medium">
          {nextReviewText}
        </Text>
      </div>
    </div>
  )
}

function SessionComplete({
  stats,
  onRestart,
  onFinish,
}: {
  stats: FlashcardSessionStats
  onRestart: () => void
  onFinish: () => void
}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
  }, [])

  return (
    <div className="text-center py-12 animate-fade-in">
      <div
        className={cn(
          'mx-auto w-24 h-24 mb-6 rounded-full flex items-center justify-center',
          'bg-success/20 text-success',
          prefersReducedMotion ? '' : 'animate-bounce'
        )}
        style={{
          animationDuration: prefersReducedMotion ? '0ms' : '800ms',
        }}
      >
        <span className="text-5xl">✓</span>
      </div>

      <Text variant="h1" size="3xl" weight="bold" className="mb-4">
        Session Complete!
      </Text>

      <Text variant="p" size="lg" color="muted" className="mb-8">
        Great work! You reviewed {stats.totalCards} cards
      </Text>

      <Card className="max-w-md mx-auto mb-8">
        <CardHeader>
          <CardTitle>Session Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <Text variant="span" size="2xl" weight="bold" className="text-red-600">
                {stats.again}
              </Text>
              <Text variant="span" size="sm" color="muted" className="block">
                Again
              </Text>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Text variant="span" size="2xl" weight="bold" className="text-orange-600">
                {stats.hard}
              </Text>
              <Text variant="span" size="sm" color="muted" className="block">
                Hard
              </Text>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Text variant="span" size="2xl" weight="bold" className="text-green-600">
                {stats.good}
              </Text>
              <Text variant="span" size="sm" color="muted" className="block">
                Good
              </Text>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Text variant="span" size="2xl" weight="bold" className="text-blue-600">
                {stats.easy}
              </Text>
              <Text variant="span" size="sm" color="muted" className="block">
                Easy
              </Text>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <Text variant="span" size="sm" color="muted">
              Time: {Math.floor(stats.duration / 60000)}m{' '}
              {Math.round((stats.duration % 60000) / 1000)}s
            </Text>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button variant="outline" size="lg" onClick={onRestart}>
          Review Again
        </Button>
        <Button size="lg" onClick={onFinish}>
          Take a Break
        </Button>
      </div>
    </div>
  )
}

function useKeyboardShortcuts({
  onFlip,
  onRate,
  enabled,
}: {
  onFlip: () => void
  onRate: (rating: Rating) => void
  enabled: boolean
}) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        onFlip()
      } else if (e.key >= '1' && e.key <= '4') {
        const ratings: Rating[] = ['again', 'hard', 'good', 'easy']
        const index = parseInt(e.key) - 1
        onRate(ratings[index])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onFlip, onRate, enabled])
}

export function FlashcardPage({ initialCards, onComplete }: FlashcardPageProps) {
  const defaultCards: Flashcard[] = initialCards ?? []

  const [cards, setCards] = useState<Flashcard[]>(defaultCards)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [cardProgress, setCardProgress] = useState<Record<string, SM2Data>>({})
  const [showFeedback, setShowFeedback] = useState<{ rating: Rating; show: boolean }>({
    rating: 'good',
    show: false,
  })
  const [sessionStats, setSessionStats] = useState<Omit<FlashcardSessionStats, 'duration'>>({
    totalCards: 0,
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  })
  const [startTime] = useState(Date.now())
  const [isSessionComplete, setIsSessionComplete] = useState(false)

  const currentCard = cards[currentIndex]
  const currentSM2 = currentCard ? cardProgress[currentCard.id] : undefined

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev)
  }, [])

  const handleRate = useCallback(
    (rating: Rating) => {
      if (!currentCard) return

      const newSM2 = calculateSM2(rating, currentSM2)

      setCardProgress(prev => ({
        ...prev,
        [currentCard.id]: newSM2,
      }))

      setSessionStats(prev => ({
        ...prev,
        totalCards: prev.totalCards + 1,
        [rating]: prev[rating] + 1,
      }))

      setShowFeedback({ rating, show: true })

      setTimeout(() => {
        setShowFeedback({ rating, show: false })

        if (currentIndex < cards.length - 1) {
          setCurrentIndex(prev => prev + 1)
          setIsFlipped(false)
        } else {
          const duration = Date.now() - startTime
          setIsSessionComplete(true)
          onComplete?.({
            totalCards: sessionStats.totalCards + 1,
            again: rating === 'again' ? sessionStats.again + 1 : sessionStats.again,
            hard: rating === 'hard' ? sessionStats.hard + 1 : sessionStats.hard,
            good: rating === 'good' ? sessionStats.good + 1 : sessionStats.good,
            easy: rating === 'easy' ? sessionStats.easy + 1 : sessionStats.easy,
            duration,
          })
        }
      }, 500)
    },
    [currentCard, currentSM2, currentIndex, cards.length, sessionStats, startTime, onComplete]
  )

  const handleRestart = useCallback(() => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setSessionStats({ totalCards: 0, again: 0, hard: 0, good: 0, easy: 0 })
    setIsSessionComplete(false)
  }, [])

  const handleFinish = useCallback(() => {
    console.log('Session finished')
  }, [])

  useKeyboardShortcuts({
    onFlip: handleFlip,
    onRate: handleRate,
    enabled: isFlipped && !isSessionComplete,
  })

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="text-center">
          <span className="text-6xl mb-4 block">📚</span>
          <Text variant="h2" size="xl" weight="semibold" className="mb-2">
            No Flashcards Available
          </Text>
          <Text variant="p" color="muted" className="mb-6">
            Generate some content or add flashcards to start studying.
          </Text>
          <Button>Generate Content</Button>
        </div>
      </div>
    )
  }

  if (isSessionComplete) {
    return (
      <div className="p-4 md:p-6">
        <SessionComplete
          stats={{
            ...sessionStats,
            duration: Date.now() - startTime,
          }}
          onRestart={handleRestart}
          onFinish={handleFinish}
        />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="text-center">
        <Text variant="h1" size="2xl" weight="bold" className="mb-2">
          Flashcard Review
        </Text>
        <Text variant="p" color="muted">
          Test your knowledge and track your progress
        </Text>
      </div>

      <ProgressBar current={currentIndex} total={cards.length} />

      <div className="flex justify-center mb-4">
        <SM2Info data={currentSM2} />
      </div>

      {currentCard && (
        <FlashcardCard card={currentCard} isFlipped={isFlipped} onFlip={handleFlip} />
      )}

      <div className="mt-6">
        <RatingButtons onRate={handleRate} disabled={!isFlipped} showFeedback={showFeedback} />
        {showFeedback.show && (
          <Text
            variant="p"
            size="sm"
            className={cn(
              'text-center mt-4 animate-fade-in',
              showFeedback.rating === 'again' && 'text-red-500',
              showFeedback.rating === 'hard' && 'text-orange-500',
              showFeedback.rating === 'good' && 'text-green-500',
              showFeedback.rating === 'easy' && 'text-blue-500'
            )}
          >
            {ratingConfig[showFeedback.rating].feedback}
          </Text>
        )}
      </div>

      <div className="text-center mt-8">
        <Text variant="span" size="xs" color="muted">
          Keyboard: Space to flip • 1-4 to rate
        </Text>
      </div>
    </div>
  )
}

export default FlashcardPage
