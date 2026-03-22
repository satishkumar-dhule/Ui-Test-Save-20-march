import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Layout } from '@/components/layouts/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/molecules/Card'
import { Badge } from '@/components/atoms'
import { contentApi } from '@/lib/api/endpoints'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
}

export function ExamPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({})
  const [showResults, setShowResults] = useState(false)
  const [timeLeft, setTimeLeft] = useState(1800) // 30 minutes in seconds

  const { data, isLoading } = useQuery({
    queryKey: ['exam-questions'],
    queryFn: () => contentApi.getByType('exam'),
  })

  const questions: Question[] = (data?.data || []).map(item => ({
    id: item.id,
    question: (item.data.question as string) || 'Untitled Question',
    options: (item.data.options as string[]) || [],
    correctAnswer: (item.data.correctAnswer as number) || 0,
    explanation: (item.data.explanation as string) || '',
    difficulty: (item.data.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
    tags: (item.data.tags as string[]) || [],
  }))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer)
          setShowResults(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex,
    }))
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleSubmit = () => {
    setShowResults(true)
  }

  const calculateScore = () => {
    let correct = 0
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct++
      }
    })
    return correct
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-muted rounded mb-4 mx-auto" />
            <div className="h-4 w-64 bg-muted rounded mx-auto" />
          </div>
        </div>
      </Layout>
    )
  }

  if (showResults) {
    const score = calculateScore()
    const percentage = Math.round((score / questions.length) * 100)

    return (
      <Layout title="Exam Results">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Exam Complete!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold mb-2">{percentage}%</div>
                <p className="text-xl text-muted-foreground">
                  You answered {score} out of {questions.length} questions correctly
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div className="text-2xl font-bold text-green-600">{score}</div>
                  <div className="text-sm text-green-600">Correct Answers</div>
                </div>
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <div className="text-2xl font-bold text-red-600">{questions.length - score}</div>
                  <div className="text-sm text-red-600">Incorrect Answers</div>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
                  <div className="text-sm text-blue-600">Total Questions</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Question Review</h3>
                {questions.map((q, index) => (
                  <div key={q.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium">Question {index + 1}</span>
                      <Badge
                        variant={
                          selectedAnswers[q.id] === q.correctAnswer ? 'default' : 'destructive'
                        }
                      >
                        {selectedAnswers[q.id] === q.correctAnswer ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </div>
                    <p className="text-sm mb-2">{q.question}</p>
                    <p className="text-sm text-muted-foreground">
                      Correct answer: {q.options[q.correctAnswer]}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-4">
                <button
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                  onClick={() => (window.location.href = '/')}
                >
                  Back to Dashboard
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  onClick={() => window.location.reload()}
                >
                  Retake Exam
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Mock Exam">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Exam Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">JavaScript Fundamentals Exam</h1>
            <p className="text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold">{formatTime(timeLeft)}</div>
            <div className="text-sm text-muted-foreground">Time Remaining</div>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Current Question */}
        {questions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="outline">{questions[currentQuestion].difficulty}</Badge>
                <div className="flex gap-2">
                  {questions[currentQuestion].tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <CardTitle className="text-xl mt-4">{questions[currentQuestion].question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  className={`w-full p-4 text-left rounded-lg border transition-colors ${
                    selectedAnswers[questions[currentQuestion].id] === index
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleAnswerSelect(questions[currentQuestion].id, index)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswers[questions[currentQuestion].id] === index
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {selectedAnswers[questions[currentQuestion].id] === index && (
                        <div className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </button>

          <div className="flex gap-2">
            {currentQuestion === questions.length - 1 ? (
              <button
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                onClick={handleSubmit}
              >
                Submit Exam
              </button>
            ) : (
              <button
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                onClick={handleNext}
              >
                Next Question
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div className="mt-8">
          <h3 className="font-medium mb-3">Question Navigator</h3>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, index) => (
              <button
                key={q.id}
                className={`w-10 h-10 rounded-lg border flex items-center justify-center font-medium transition-colors ${
                  currentQuestion === index
                    ? 'border-primary bg-primary text-primary-foreground'
                    : selectedAnswers[q.id] !== undefined
                      ? 'border-primary/50 bg-primary/5'
                      : 'hover:border-primary/50'
                }`}
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
