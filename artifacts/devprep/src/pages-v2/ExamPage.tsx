import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/molecules/Card/Card'
import { Heading, Text } from '@/components/atoms/Typography'
import { Button, buttonVariants } from '@/components/atoms/Button/Button'
import { Badge } from '@/components/atoms/Badge'
import { cn } from '@/lib/utils/cn'

interface ExamQuestion {
  id: string
  channelId: string
  domain: string
  question: string
  choices: { id: 'A' | 'B' | 'C' | 'D'; text: string }[]
  correct: 'A' | 'B' | 'C' | 'D'
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface ExamState {
  currentIndex: number
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>
  flagged: Set<string>
  timeRemaining: number
  isSubmitted: boolean
  startTime: number | null
}

const EXAM_DURATION = 30 * 60

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function useTimer(initialTime: number, onTimeUp: () => void) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime)

  useEffect(() => {
    if (timeRemaining <= 0) {
      onTimeUp()
      return
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, onTimeUp])

  return timeRemaining
}

function TimerDisplay({
  timeRemaining,
  onSubmit,
}: {
  timeRemaining: number
  onSubmit: () => void
}) {
  const timerState = useMemo(() => {
    if (timeRemaining <= 60) return 'critical'
    if (timeRemaining <= 300) return 'warning'
    return 'normal'
  }, [timeRemaining])

  const timerStyles = {
    normal: 'text-foreground',
    warning: 'text-amber-500',
    critical: 'text-destructive animate-pulse',
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <svg
          className={cn('w-5 h-5', timerStyles[timerState])}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className={cn('font-mono text-2xl font-bold tabular-nums', timerStyles[timerState])}>
          {formatTime(timeRemaining)}
        </span>
      </div>
      {timerState === 'critical' && (
        <Button size="sm" variant="destructive" onClick={onSubmit}>
          Submit Now
        </Button>
      )}
    </div>
  )
}

function QuestionNavigation({
  total,
  current,
  answers,
  flagged,
  onNavigate,
}: {
  total: number
  current: number
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>
  flagged: Set<string>
  onNavigate: (index: number) => void
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: total }, (_, i) => {
        const qId = `q-${i}`
        const isAnswered = answers[qId] !== undefined
        const isFlagged = flagged.has(qId)
        const isCurrent = i === current

        return (
          <button
            key={i}
            onClick={() => onNavigate(i)}
            className={cn(
              'w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200',
              'flex items-center justify-center',
              isCurrent
                ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                : isAnswered
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground hover:bg-accent',
              isFlagged && 'ring-2 ring-amber-400'
            )}
          >
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}

function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  isFlagged,
  onSelectAnswer,
  onToggleFlag,
}: {
  question: ExamQuestion
  questionNumber: number
  totalQuestions: number
  selectedAnswer?: 'A' | 'B' | 'C' | 'D'
  isFlagged: boolean
  onSelectAnswer: (answer: 'A' | 'B' | 'C' | 'D') => void
  onToggleFlag: () => void
}) {
  const difficultyVariant = {
    easy: 'success',
    medium: 'warning',
    hard: 'destructive',
  } as const

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline">{questionNumber + 1}</Badge>
          <Badge variant={difficultyVariant[question.difficulty]} size="sm">
            {question.difficulty}
          </Badge>
          <Text variant="span" size="sm" color="muted">
            {question.domain}
          </Text>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFlag}
          className={cn(isFlagged && 'text-amber-500')}
        >
          <svg
            className={cn('w-5 h-5', isFlagged && 'fill-current')}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
            />
          </svg>
        </Button>
      </div>

      <div className="space-y-2">
        <Text variant="p" size="lg" weight="medium">
          {question.question}
        </Text>
      </div>

      <div className="space-y-3">
        {question.choices.map((choice, index) => {
          const isSelected = selectedAnswer === choice.id

          return (
            <button
              key={choice.id}
              onClick={() => onSelectAnswer(choice.id)}
              className={cn(
                'w-full p-4 rounded-xl border-2 text-left transition-all duration-200',
                'flex items-center gap-4',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 hover:bg-accent/5'
              )}
            >
              <span
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {String.fromCharCode(65 + index)}
              </span>
              <Text variant="p" className="flex-1">
                {choice.text}
              </Text>
              {isSelected && (
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ResultsView({
  questions,
  answers,
  flagged,
  timeTaken,
}: {
  questions: ExamQuestion[]
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>
  flagged: Set<string>
  timeTaken: number
}) {
  const results = useMemo(() => {
    let correct = 0
    let incorrect = 0
    const details: Array<{
      question: ExamQuestion
      selected?: 'A' | 'B' | 'C' | 'D'
      isCorrect: boolean
      isFlagged: boolean
    }> = []

    questions.forEach((q, i) => {
      const qId = `q-${i}`
      const selected = answers[qId]
      const isFlagged = flagged.has(qId)
      const isCorrect = selected === q.correct

      if (isCorrect) correct++
      else incorrect++

      details.push({ question: q, selected, isCorrect, isFlagged })
    })

    const total = questions.length
    const score = Math.round((correct / total) * 100)

    return { correct, incorrect, total, score, details, timeTaken }
  }, [questions, answers, flagged])

  const passThreshold = 70
  const passed = results.score >= passThreshold

  return (
    <div className="space-y-8 animate-fade-in">
      <Card className="text-center">
        <CardContent className="pt-8">
          <div className="mb-4">
            <Badge variant={passed ? 'success' : 'destructive'} className="text-lg px-4 py-2">
              {passed ? 'Passed' : 'Failed'}
            </Badge>
          </div>
          <Heading level={1} size="5xl" weight="bold" className="mb-2">
            {results.score}%
          </Heading>
          <Text variant="p" color="muted">
            {results.correct} of {results.total} correct
          </Text>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Heading level={2} size="3xl" weight="bold" className="text-emerald-500">
              {results.correct}
            </Heading>
            <Text variant="span" color="muted">
              Correct
            </Text>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Heading level={2} size="3xl" weight="bold" className="text-destructive">
              {results.incorrect}
            </Heading>
            <Text variant="span" color="muted">
              Incorrect
            </Text>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Heading level={2} size="3xl" weight="bold" className="text-amber-500">
              {formatTime(results.timeTaken)}
            </Heading>
            <Text variant="span" color="muted">
              Time Taken
            </Text>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review Answers</CardTitle>
          <CardDescription>
            {results.details.filter(d => d.isFlagged).length} questions flagged for review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.details.map((detail, index) => (
            <div
              key={detail.question.id}
              className={cn(
                'p-4 rounded-xl border',
                detail.isCorrect
                  ? 'border-emerald-200 dark:border-emerald-800'
                  : 'border-destructive/30',
                detail.isFlagged && 'ring-2 ring-amber-400'
              )}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{index + 1}</Badge>
                  <Text variant="span" size="sm" color="muted">
                    {detail.question.domain}
                  </Text>
                </div>
                {detail.isFlagged && (
                  <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                )}
              </div>
              <Text variant="p" size="sm" className="mb-3">
                {detail.question.question}
              </Text>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Text variant="span" size="sm" weight="medium">
                    Your answer:
                  </Text>
                  <Text
                    variant="span"
                    size="sm"
                    color={detail.isCorrect ? 'success' : 'destructive'}
                  >
                    {detail.selected || 'Not answered'}{' '}
                    {!detail.isCorrect && `(${detail.question.correct})`}
                  </Text>
                </div>
                {!detail.isCorrect && (
                  <Text variant="p" size="sm" color="muted" className="bg-muted/50 p-2 rounded">
                    {detail.question.explanation}
                  </Text>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function ExamStartScreen({
  onStart,
  onPracticeMode,
  questionCount,
}: {
  onStart: () => void
  onPracticeMode: () => void
  questionCount: number
}) {
  return (
    <div className="space-y-8 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Exam Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-border">
            <Text variant="p">Total Questions</Text>
            <Text variant="p" weight="semibold">
              {questionCount}
            </Text>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <Text variant="p">Time Limit</Text>
            <Text variant="p" weight="semibold">
              30 minutes
            </Text>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border">
            <Text variant="p">Passing Score</Text>
            <Text variant="p" weight="semibold">
              70%
            </Text>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <Text variant="p" size="sm">
                Read each question carefully
              </Text>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <Text variant="p" size="sm">
                Click an option to select your answer
              </Text>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <Text variant="p" size="sm">
                Flag questions to review later
              </Text>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <Text variant="p" size="sm">
                Submit when ready
              </Text>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <Button size="lg" onClick={onStart} className="w-full">
          Begin Exam
        </Button>
        <Button variant="outline" size="lg" onClick={onPracticeMode} className="w-full">
          Practice Mode (No Timer)
        </Button>
      </div>
    </div>
  )
}

export function ExamPage() {
  const [examState, setExamState] = useState<ExamState>({
    currentIndex: 0,
    answers: {},
    flagged: new Set(),
    timeRemaining: EXAM_DURATION,
    isSubmitted: false,
    startTime: null,
  })
  const [examStarted, setExamStarted] = useState(false)
  const [practiceMode, setPracticeMode] = useState(false)

  const questions: ExamQuestion[] = useMemo(() => {
    return [
      {
        id: 'ex-js1',
        channelId: 'javascript',
        domain: 'Asynchronous JavaScript',
        question:
          'What is the output of the following code?\n\nconsole.log("A");\nsetTimeout(() => console.log("B"), 0);\nPromise.resolve().then(() => console.log("C"));\nconsole.log("D");',
        choices: [
          { id: 'A', text: 'A, B, C, D' },
          { id: 'B', text: 'A, D, B, C' },
          { id: 'C', text: 'A, D, C, B' },
          { id: 'D', text: 'A, C, D, B' },
        ],
        correct: 'C',
        explanation:
          'Synchronous code runs first (A, D), then microtasks like Promise.then (C), then macrotasks like setTimeout (B).',
        difficulty: 'medium',
      },
      {
        id: 'ex-js2',
        channelId: 'javascript',
        domain: 'Closures',
        question:
          'What does the following code log?\n\nfor (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}',
        choices: [
          { id: 'A', text: '0, 1, 2' },
          { id: 'B', text: '3, 3, 3' },
          { id: 'C', text: '0, 0, 0' },
          { id: 'D', text: 'undefined, undefined, undefined' },
        ],
        correct: 'B',
        explanation:
          'var is function-scoped, so all three callbacks share the same i. By the time they run, i is 3. Use let for block scoping.',
        difficulty: 'medium',
      },
      {
        id: 'ex-js3',
        channelId: 'javascript',
        domain: 'Types',
        question: 'Which of the following evaluates to true?',
        choices: [
          { id: 'A', text: 'null === undefined' },
          { id: 'B', text: 'NaN === NaN' },
          { id: 'C', text: "typeof null === 'null'" },
          { id: 'D', text: 'null == undefined' },
        ],
        correct: 'D',
        explanation:
          'null == undefined is true due to special coercion rules. null !== undefined (strict). typeof null === "object" (legacy bug). NaN !== NaN — use Number.isNaN().',
        difficulty: 'easy',
      },
      {
        id: 'ex-react1',
        channelId: 'react',
        domain: 'Hooks',
        question: 'When does useEffect run if no dependency array is provided?',
        choices: [
          { id: 'A', text: 'Only on mount' },
          { id: 'B', text: 'Only on unmount' },
          { id: 'C', text: 'After every render' },
          { id: 'D', text: 'Never' },
        ],
        correct: 'C',
        explanation:
          'Without a dependency array, useEffect runs after every render. An empty array [] runs only on mount/unmount. Specific deps run when those deps change.',
        difficulty: 'easy',
      },
      {
        id: 'ex-react2',
        channelId: 'react',
        domain: 'Performance',
        question: 'What does React.memo do?',
        choices: [
          { id: 'A', text: 'Memoizes a computed value' },
          { id: 'B', text: "Wraps a component to skip re-render when props haven't changed" },
          { id: 'C', text: 'Creates a memoized callback' },
          { id: 'D', text: 'Caches API responses' },
        ],
        correct: 'B',
        explanation:
          "React.memo is a higher-order component. It does a shallow comparison of props and skips re-rendering if they're equal. Pair with useCallback for stable function props.",
        difficulty: 'easy',
      },
      {
        id: 'ex-cka1',
        channelId: 'cka',
        domain: 'Architecture',
        question: 'Which Kubernetes component is responsible for scheduling pods to nodes?',
        choices: [
          { id: 'A', text: 'kube-apiserver' },
          { id: 'B', text: 'kube-scheduler' },
          { id: 'C', text: 'kube-controller-manager' },
          { id: 'D', text: 'kubelet' },
        ],
        correct: 'B',
        explanation:
          'The kube-scheduler watches for newly created Pods with no assigned node and selects a node based on resource requirements, affinity rules, and other constraints.',
        difficulty: 'easy',
      },
      {
        id: 'ex-cka2',
        channelId: 'cka',
        domain: 'Workloads',
        question: 'What is the difference between a Deployment and a StatefulSet?',
        choices: [
          { id: 'A', text: 'StatefulSet is for stateless apps; Deployment is for databases' },
          {
            id: 'B',
            text: 'Deployment manages stateless pods with interchangeable identities; StatefulSet provides stable network identities and persistent storage per pod',
          },
          { id: 'C', text: 'They are functionally identical' },
          { id: 'D', text: 'StatefulSet cannot be scaled' },
        ],
        correct: 'B',
        explanation:
          'Deployments are for stateless apps — pods are interchangeable. StatefulSets provide stable hostname, ordered deployment/scaling, and persistent volumes that stick to specific pods.',
        difficulty: 'medium',
      },
      {
        id: 'ex-saa1',
        channelId: 'aws-saa',
        domain: 'High Availability',
        question:
          'A company needs a database solution that automatically fails over to a standby in another AZ with minimal data loss. Which service fits best?',
        choices: [
          { id: 'A', text: 'Amazon RDS with Multi-AZ deployment' },
          { id: 'B', text: 'Amazon DynamoDB Global Tables' },
          { id: 'C', text: 'Amazon ElastiCache' },
          { id: 'D', text: 'Amazon Redshift' },
        ],
        correct: 'A',
        explanation:
          'RDS Multi-AZ maintains a synchronous standby replica in a different AZ. Failover is automatic and typically completes in 1-2 minutes with minimal data loss.',
        difficulty: 'easy',
      },
      {
        id: 'ex-saa2',
        channelId: 'aws-saa',
        domain: 'Storage',
        question:
          'Which S3 storage class is most cost-effective for data accessed less than once per month with retrieval in milliseconds?',
        choices: [
          { id: 'A', text: 'S3 Standard' },
          { id: 'B', text: 'S3 Standard-IA' },
          { id: 'C', text: 'S3 Glacier' },
          { id: 'D', text: 'S3 One Zone-IA' },
        ],
        correct: 'B',
        explanation:
          'S3 Standard-IA (Infrequent Access) is designed for data accessed less frequently but requires rapid access. Lower storage cost than Standard, but with per-retrieval fees.',
        difficulty: 'easy',
      },
      {
        id: 'ex-algo1',
        channelId: 'algorithms',
        domain: 'Sorting',
        question: 'What is the space complexity of merge sort?',
        choices: [
          { id: 'A', text: 'O(1)' },
          { id: 'B', text: 'O(log n)' },
          { id: 'C', text: 'O(n)' },
          { id: 'D', text: 'O(n log n)' },
        ],
        correct: 'C',
        explanation:
          'Merge sort requires O(n) auxiliary space for the temporary arrays used during the merge step. The recursion stack is O(log n) but the dominant cost is O(n).',
        difficulty: 'medium',
      },
    ]
  }, [])

  const handleTimeUp = useCallback(() => {
    setExamState(prev => ({ ...prev, isSubmitted: true }))
  }, [])

  const timeRemaining = useTimer(practiceMode ? 0 : examState.timeRemaining, handleTimeUp)

  const startExam = useCallback(() => {
    setExamStarted(true)
    setExamState(prev => ({ ...prev, startTime: Date.now() }))
  }, [])

  const startPracticeMode = useCallback(() => {
    setPracticeMode(true)
    setExamStarted(true)
    setExamState(prev => ({ ...prev, startTime: Date.now() }))
  }, [])

  const handleSelectAnswer = useCallback((answer: 'A' | 'B' | 'C' | 'D') => {
    setExamState(prev => ({
      ...prev,
      answers: { ...prev.answers, [`q-${prev.currentIndex}`]: answer },
    }))
  }, [])

  const handleToggleFlag = useCallback(() => {
    setExamState(prev => {
      const newFlagged = new Set(prev.flagged)
      const qId = `q-${prev.currentIndex}`
      if (newFlagged.has(qId)) {
        newFlagged.delete(qId)
      } else {
        newFlagged.add(qId)
      }
      return { ...prev, flagged: newFlagged }
    })
  }, [])

  const handleNavigate = useCallback((index: number) => {
    setExamState(prev => ({ ...prev, currentIndex: index }))
  }, [])

  const handleSubmit = useCallback(() => {
    setExamState(prev => ({ ...prev, isSubmitted: true }))
  }, [])

  const handleNext = useCallback(() => {
    setExamState(prev => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, questions.length - 1),
    }))
  }, [questions.length])

  const handlePrev = useCallback(() => {
    setExamState(prev => ({
      ...prev,
      currentIndex: Math.max(prev.currentIndex - 1, 0),
    }))
  }, [])

  const answeredCount = Object.keys(examState.answers).length
  const flaggedCount = examState.flagged.size
  const currentQuestion = questions[examState.currentIndex]
  const qId = `q-${examState.currentIndex}`
  const currentAnswer = examState.answers[qId]
  const isCurrentFlagged = examState.flagged.has(qId)
  const timeTaken = examState.startTime ? Math.floor((Date.now() - examState.startTime) / 1000) : 0

  if (!examStarted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8 text-center">
          <Heading level={1} size="3xl" weight="bold">
            Mock Exam
          </Heading>
          <Text variant="p" color="muted" className="mt-2">
            Test your knowledge with timed practice
          </Text>
        </div>
        <ExamStartScreen
          onStart={startExam}
          onPracticeMode={startPracticeMode}
          questionCount={questions.length}
        />
      </div>
    )
  }

  if (examState.isSubmitted) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8 text-center">
          <Heading level={1} size="3xl" weight="bold">
            Exam Complete
          </Heading>
          <Text variant="p" color="muted" className="mt-2">
            Review your results below
          </Text>
        </div>
        <ResultsView
          questions={questions}
          answers={examState.answers}
          flagged={examState.flagged}
          timeTaken={timeTaken}
        />
        <div className="mt-8 flex justify-center">
          <Button onClick={() => window.location.reload()}>Retake Exam</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Heading level={1} size="xl" weight="bold">
            Mock Exam
          </Heading>
          <Text variant="p" color="muted">
            Question {examState.currentIndex + 1} of {questions.length}
          </Text>
        </div>
        {!practiceMode && <TimerDisplay timeRemaining={timeRemaining} onSubmit={handleSubmit} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <QuestionCard
                question={currentQuestion}
                questionNumber={examState.currentIndex}
                totalQuestions={questions.length}
                selectedAnswer={currentAnswer}
                isFlagged={isCurrentFlagged}
                onSelectAnswer={handleSelectAnswer}
                onToggleFlag={handleToggleFlag}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between mt-6">
            <Button variant="outline" onClick={handlePrev} disabled={examState.currentIndex === 0}>
              Previous
            </Button>
            <div className="flex gap-3">
              {examState.currentIndex === questions.length - 1 ? (
                <Button onClick={handleSubmit}>Submit Exam</Button>
              ) : (
                <Button onClick={handleNext}>Next</Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Text variant="span" size="sm">
                    Answered
                  </Text>
                  <Text variant="span" size="sm" weight="medium">
                    {answeredCount}/{questions.length}
                  </Text>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(answeredCount / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Text variant="span" size="sm">
                  Flagged: {flaggedCount}
                </Text>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <QuestionNavigation
                total={questions.length}
                current={examState.currentIndex}
                answers={examState.answers}
                flagged={examState.flagged}
                onNavigate={handleNavigate}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ExamPage
