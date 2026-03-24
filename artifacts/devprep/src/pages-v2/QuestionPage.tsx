import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/molecules/Card/Card'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button/Button'
import { Text } from '@/components/atoms/Text'
import { ProgressBar } from '@/components/molecules/ProgressBar/ProgressBar'
import { useNewTheme } from '@/hooks/useNewTheme'
import { useGeneratedContent, type GeneratedContentMap } from '@/hooks/useGeneratedContent'
import { cn } from '@/lib/utils/cn'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Keyboard,
  Eye,
  EyeOff,
  Circle,
  CircleCheck,
} from 'lucide-react'

type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'easy' | 'medium' | 'hard'

interface Question {
  id: string
  title: string
  question?: string
  answer?: string
  explanation?: string
  difficulty: QuestionDifficulty
  tags: string[]
  channelId?: string
  sections?: Array<{ type: string; content: string }>
  number?: number
  votes?: number
  views?: string
}

interface QuestionPageProps {
  questionId?: string
  channelId?: string
}

const difficultyColors: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
> = {
  easy: 'success',
  beginner: 'success',
  medium: 'warning',
  intermediate: 'warning',
  hard: 'destructive',
  advanced: 'destructive',
}

const difficultyLabels: Record<string, string> = {
  easy: 'Easy',
  beginner: 'Easy',
  medium: 'Medium',
  intermediate: 'Medium',
  hard: 'Hard',
  advanced: 'Hard',
}

function KeyboardHint() {
  const [showHint, setShowHint] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowHint(!showHint)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Show keyboard shortcuts"
      >
        <Keyboard className="w-3.5 h-3.5" />
        <span>Shortcuts</span>
      </button>

      {showHint && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          <Card className="p-4 min-w-[200px] shadow-lg border border-border">
            <Text variant="span" size="sm" weight="semibold" className="block mb-2">
              Keyboard Shortcuts
            </Text>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex justify-between">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Space</kbd>
                <span>Toggle answer</span>
              </li>
              <li className="flex justify-between">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">1-3</kbd>
                <span>Rate difficulty</span>
              </li>
              <li className="flex justify-between">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">←</kbd>
                <span>Previous</span>
              </li>
              <li className="flex justify-between">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">→</kbd>
                <span>Next</span>
              </li>
              <li className="flex justify-between">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">C</kbd>
                <span>Mark complete</span>
              </li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  )
}

function QuestionCard({
  question,
  showAnswer,
  onToggleAnswer,
  onMarkComplete,
  isCompleted,
}: {
  question: Question
  showAnswer: boolean
  onToggleAnswer: () => void
  onMarkComplete: () => void
  isCompleted: boolean
}) {
  const { isDark } = useNewTheme()

  return (
    <Card className="w-full animate-fade-in" variant="elevated" padding="lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant={difficultyColors[question.difficulty]} size="sm">
              {difficultyLabels[question.difficulty]}
            </Badge>
            {question.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
          {isCompleted && (
            <Badge variant="success" size="sm" className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Completed
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl leading-relaxed">{question.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <Markdown remarkPlugins={[remarkGfm]}>{question.question}</Markdown>
        </div>

        {showAnswer && question.answer && (
          <div className="animate-slide-down">
            <div className="border-t border-border pt-4">
              <Text variant="span" size="sm" weight="semibold" className="block mb-2 text-primary">
                Answer
              </Text>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Markdown remarkPlugins={[remarkGfm]}>{question.answer}</Markdown>
              </div>
            </div>

            {question.explanation && (
              <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                <Text variant="span" size="sm" weight="semibold" className="block mb-2">
                  Explanation
                </Text>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Markdown remarkPlugins={[remarkGfm]}>{question.explanation}</Markdown>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-wrap gap-3 pt-4 border-t border-border">
        <Button
          variant={showAnswer ? 'secondary' : 'default'}
          onClick={onToggleAnswer}
          leftIcon={showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        >
          {showAnswer ? 'Hide Answer' : 'Show Answer'}
        </Button>

        <Button
          variant={isCompleted ? 'outline' : 'default'}
          onClick={onMarkComplete}
          leftIcon={
            isCompleted ? <CircleCheck className="w-4 h-4" /> : <Circle className="w-4 h-4" />
          }
          className={cn(isCompleted && 'border-success text-success hover:bg-success/10')}
        >
          {isCompleted ? 'Completed' : 'Mark Complete'}
        </Button>
      </CardFooter>
    </Card>
  )
}

function DifficultyRating({
  questionId,
  currentRating,
  onRate,
}: {
  questionId: string
  currentRating: number | null
  onRate: (questionId: string, rating: number) => void
}) {
  const ratings = [
    { value: 1, label: 'Easy', icon: '😊', color: 'text-success' },
    { value: 2, label: 'Medium', icon: '🤔', color: 'text-warning' },
    { value: 3, label: 'Hard', icon: '😓', color: 'text-destructive' },
  ]

  return (
    <div className="flex items-center gap-2">
      <Text variant="span" size="sm" color="muted" className="mr-1">
        Rate:
      </Text>
      {ratings.map(r => (
        <button
          key={r.value}
          onClick={() => onRate(questionId, r.value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-200',
            'border border-border hover:border-primary/50 hover:scale-105',
            currentRating === r.value && 'ring-2 ring-primary ring-offset-2'
          )}
          aria-label={`Rate as ${r.label}`}
        >
          <span>{r.icon}</span>
          <span className={cn(r.color)}>{r.label}</span>
        </button>
      ))}
    </div>
  )
}

function NavigationControls({
  currentIndex,
  total,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: {
  currentIndex: number
  total: number
  onPrevious: () => void
  onNext: () => void
  hasPrevious: boolean
  hasNext: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={!hasPrevious}
        leftIcon={<ChevronLeft className="w-4 h-4" />}
      >
        Previous
      </Button>

      <Text variant="span" size="sm" color="muted">
        {currentIndex + 1} of {total}
      </Text>

      <Button
        variant="outline"
        onClick={onNext}
        disabled={!hasNext}
        rightIcon={<ChevronRight className="w-4 h-4" />}
      >
        Next
      </Button>
    </div>
  )
}

function ProgressIndicator({
  currentIndex,
  total,
  completedIndices,
}: {
  currentIndex: number
  total: number
  completedIndices: Set<number>
}) {
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0
  const completedCount = completedIndices.size

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Text variant="span" size="sm" color="muted">
          Progress
        </Text>
        <Text variant="span" size="sm" color="muted">
          {completedCount} / {total} completed
        </Text>
      </div>
      <ProgressBar value={progress} className="h-2" />
    </div>
  )
}

function QuestionNavigator({
  questions,
  currentIndex,
  completedIndices,
  onSelect,
}: {
  questions: Question[]
  currentIndex: number
  completedIndices: Set<number>
  onSelect: (index: number) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <Text variant="span" size="sm" weight="medium">
          Question Navigator
        </Text>
        <ChevronRight className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-90')} />
      </button>

      {isExpanded && (
        <div className="mt-3 grid grid-cols-5 gap-2 max-h-[200px] overflow-y-auto">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => onSelect(idx)}
              className={cn(
                'relative w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all',
                'border hover:border-primary/50 hover:scale-105',
                idx === currentIndex && 'ring-2 ring-primary ring-offset-2 bg-primary/10',
                completedIndices.has(idx) && 'border-success bg-success/10',
                !completedIndices.has(idx) && idx !== currentIndex && 'border-border'
              )}
              aria-label={`Go to question ${idx + 1}`}
            >
              {idx + 1}
              {completedIndices.has(idx) && (
                <CircleCheck className="absolute -top-1 -right-1 w-3.5 h-3.5 text-success" />
              )}
            </button>
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
          <span className="text-3xl">❓</span>
        </div>
        <CardTitle>No Questions Found</CardTitle>
        <CardDescription>
          There are no questions available for this selection. Try changing your filters or generate
          new content.
        </CardDescription>
        <Button onClick={onGoBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Go Back
        </Button>
      </div>
    </Card>
  )
}

export function QuestionPage({ questionId, channelId }: QuestionPageProps) {
  const { theme, isDark } = useNewTheme()
  const { generated, loading } = useGeneratedContent()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [completedQuestions, setCompletedQuestions] = useState<Set<string>>(new Set())
  const [ratings, setRatings] = useState<Map<string, number>>(new Map())

  const questions = useMemo(() => {
    let list: Question[] = []

    if (generated.question) {
      list = (generated.question as Question[]).filter(q => {
        if (channelId && q.channelId !== channelId) return false
        return true
      })
    }

    if (questionId) {
      const idx = list.findIndex(q => q.id === questionId)
      if (idx !== -1) setCurrentIndex(idx)
    }

    return list
  }, [generated, channelId, questionId])

  const currentQuestion = questions[currentIndex]
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < questions.length - 1

  const completedIndices = useMemo(() => {
    const set = new Set<number>()
    questions.forEach((q, idx) => {
      if (completedQuestions.has(q.id)) set.add(idx)
    })
    return set
  }, [questions, completedQuestions])

  const handlePrevious = useCallback(() => {
    if (hasPrevious) {
      setCurrentIndex(prev => prev - 1)
      setShowAnswer(false)
    }
  }, [hasPrevious])

  const handleNext = useCallback(() => {
    if (hasNext) {
      setCurrentIndex(prev => prev + 1)
      setShowAnswer(false)
    }
  }, [hasNext])

  const handleToggleAnswer = useCallback(() => {
    setShowAnswer(prev => !prev)
  }, [])

  const handleMarkComplete = useCallback(() => {
    if (!currentQuestion) return

    setCompletedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id)
      } else {
        next.add(currentQuestion.id)
      }
      return next
    })
  }, [currentQuestion])

  const handleRate = useCallback((questionId: string, rating: number) => {
    setRatings(prev => {
      const next = new Map(prev)
      if (next.get(questionId) === rating) {
        next.delete(questionId)
      } else {
        next.set(questionId, rating)
      }
      return next
    })
  }, [])

  const handleSelectQuestion = useCallback((index: number) => {
    setCurrentIndex(index)
    setShowAnswer(false)
  }, [])

  const handleGoBack = useCallback(() => {
    console.log('Navigate back to content library')
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentQuestion) return

      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case ' ':
          e.preventDefault()
          setShowAnswer(prev => !prev)
          break
        case 'ArrowLeft':
          e.preventDefault()
          handlePrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          handleNext()
          break
        case 'c':
        case 'C':
          e.preventDefault()
          handleMarkComplete()
          break
        case '1':
        case '2':
        case '3':
          e.preventDefault()
          handleRate(currentQuestion.id, parseInt(e.key))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentQuestion, handlePrevious, handleNext, handleMarkComplete, handleRate])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-32 w-full bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return <EmptyState onGoBack={handleGoBack} />
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Library
        </Button>
        <KeyboardHint />
      </div>

      <ProgressIndicator
        currentIndex={currentIndex}
        total={questions.length}
        completedIndices={completedIndices}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <QuestionCard
            question={currentQuestion}
            showAnswer={showAnswer}
            onToggleAnswer={handleToggleAnswer}
            onMarkComplete={handleMarkComplete}
            isCompleted={completedQuestions.has(currentQuestion.id)}
          />

          <div className="mt-6">
            <NavigationControls
              currentIndex={currentIndex}
              total={questions.length}
              onPrevious={handlePrevious}
              onNext={handleNext}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
            />
          </div>

          <div className="mt-6">
            <DifficultyRating
              questionId={currentQuestion.id}
              currentRating={ratings.get(currentQuestion.id) ?? null}
              onRate={handleRate}
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          <QuestionNavigator
            questions={questions}
            currentIndex={currentIndex}
            completedIndices={completedIndices}
            onSelect={handleSelectQuestion}
          />

          <Card className="mt-4 p-4">
            <Text variant="span" size="sm" weight="semibold" className="block mb-3">
              Session Stats
            </Text>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">
                  {completedQuestions.size} / {questions.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-medium">{questions.length - completedQuestions.size}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default QuestionPage
