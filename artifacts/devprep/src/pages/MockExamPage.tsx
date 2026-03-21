import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Trophy,
  Flag,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Menu,
} from 'lucide-react'
import type { ExamQuestion } from '@/data/exam'
import { progressApi } from '@/services/progressApi'

type Phase = 'ready' | 'exam' | 'result' | 'review'

interface MockExamPageProps {
  questions: ExamQuestion[]
  channelId: string
  onExamComplete?: (score: number, total: number, passed: boolean, durationMs: number) => void
}

const DIFF_COLORS: Record<string, string> = {
  easy: 'hsl(var(--chart-2))',
  medium: 'hsl(var(--chart-3))',
  hard: 'hsl(var(--chart-5))',
}

export function MockExamPage({ questions, channelId, onExamComplete }: MockExamPageProps) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState(45 * 60)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [examStartTime, setExamStartTime] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const pausedTimeRef = useRef<number>(0)
  const visibilityChangeRef = useRef<number>(0)

  useEffect(() => {
    setPhase('ready')
    setCurrent(0)
    setAnswers({})
    setFlagged(new Set())
    setTimeLeft(45 * 60)
  }, [channelId])

  useEffect(() => {
    setPhase('ready')
    setCurrent(0)
    setAnswers({})
    setFlagged(new Set())
    setTimeLeft(45 * 60)
    setIsVisible(true)
  }, [channelId])

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible'
      setIsVisible(visible)
      if (!visible && phase === 'exam') {
        pausedTimeRef.current = Date.now()
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = null
      } else if (visible && phase === 'exam') {
        if (pausedTimeRef.current > 0) {
          const pausedDuration = Math.floor((Date.now() - pausedTimeRef.current) / 1000)
          visibilityChangeRef.current += pausedDuration
          pausedTimeRef.current = 0
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [phase])

  const submitExam = useCallback(() => {
    setPhase('result')
    const durationMs = (45 * 60 - timeLeft + visibilityChangeRef.current) * 1000
    const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0)
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
    const passed = pct >= 72

    if (examStartTime && onExamComplete) {
      onExamComplete(score, questions.length, passed, durationMs)
    }

    progressApi.saveExam(channelId, channelId, {
      score,
      total: questions.length,
      passed,
    })
  }, [examStartTime, onExamComplete, timeLeft, questions, answers, channelId])

  useEffect(() => {
    if (phase === 'exam' && isVisible) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!)
            submitExam()
            return 0
          }
          return t - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [phase, isVisible, submitExam])

  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0)
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
  const passed = pct >= 72

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')
  const timerPct = (timeLeft / (45 * 60)) * 100
  const timerColor =
    timerPct > 50
      ? 'hsl(var(--chart-2))'
      : timerPct > 25
        ? 'hsl(var(--chart-3))'
        : 'hsl(var(--chart-5))'

  const answeredCount = Object.keys(answers).length
  const q = questions[current]

  if (questions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Trophy size={48} className="text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No exam questions for this channel</h3>
        <p className="text-muted-foreground text-sm">
          Try AWS SAA, CKA, or switch to JavaScript/React channels.
        </p>
      </div>
    )
  }

  if (phase === 'ready') {
    const byDiff = {
      easy: questions.filter(q => q.difficulty === 'easy').length,
      medium: questions.filter(q => q.difficulty === 'medium').length,
      hard: questions.filter(q => q.difficulty === 'hard').length,
    }
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md text-center space-y-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{
              background: 'hsl(var(--chart-3) / 0.15)',
              border: '2px solid hsl(var(--chart-3) / 0.4)',
            }}
          >
            <Trophy size={28} style={{ color: 'hsl(var(--chart-3))' }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Mock Exam</h2>
            <p className="text-muted-foreground text-sm">
              {questions.length} questions · 45 minutes · 72% to pass
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(byDiff).map(([d, c]) => (
              <div key={d} className="p-3 rounded-lg border border-border bg-card text-center">
                <div className="text-lg font-bold" style={{ color: DIFF_COLORS[d] }}>
                  {c}
                </div>
                <div className="text-[11px] text-muted-foreground capitalize">{d}</div>
              </div>
            ))}
          </div>
          <button
            data-testid="exam-start-btn"
            onClick={() => {
              setExamStartTime(Date.now())
              setPhase('exam')
              setCurrent(0)
              setAnswers({})
              setFlagged(new Set())
              setTimeLeft(45 * 60)
            }}
            className="w-full py-3 rounded-lg text-sm font-bold transition-all hover:opacity-90"
            style={{
              background: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            Start Exam →
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'result') {
    const domains = [...new Set(questions.map(q => q.domain))]
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-6 text-center">
          {/* Score circle */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center"
              style={{
                borderColor: passed ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-5))',
              }}
            >
              <span
                className="text-3xl font-bold"
                style={{
                  color: passed ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-5))',
                }}
              >
                {pct}%
              </span>
              <span className="text-xs text-muted-foreground">
                {score}/{questions.length}
              </span>
            </div>
            <h2
              className="text-xl font-bold"
              style={{
                color: passed ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-5))',
              }}
            >
              {passed ? '🎉 Passed!' : 'Not yet — keep going!'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {passed
                ? 'Great work! You exceeded the 72% passing threshold.'
                : 'You need 72% to pass. Review the answers and try again.'}
            </p>
          </div>

          {/* By difficulty */}
          <div className="p-4 rounded-lg border border-border bg-card text-left space-y-3">
            {(['easy', 'medium', 'hard'] as const).map(d => {
              const dQs = questions.filter(q => q.difficulty === d)
              const dCorrect = dQs.filter(
                (q, i) => answers[questions.indexOf(q)] === q.correct
              ).length
              const dPct = dQs.length > 0 ? Math.round((dCorrect / dQs.length) * 100) : 0
              return (
                <div key={d}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize font-medium" style={{ color: DIFF_COLORS[d] }}>
                      {d}
                    </span>
                    <span className="text-muted-foreground">
                      {dCorrect}/{dQs.length}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${dPct}%`, background: DIFF_COLORS[d] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3">
            <button
              data-testid="exam-review-btn"
              onClick={() => {
                setPhase('review')
                setCurrent(0)
              }}
              className="flex-1 py-2 rounded-lg text-sm font-semibold border border-border hover:bg-muted transition-colors"
            >
              Review Answers
            </button>
            <button
              data-testid="exam-retry-btn"
              onClick={() => {
                setPhase('ready')
                setAnswers({})
                setFlagged(new Set())
              }}
              className="flex-1 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90"
              style={{
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left navigator - hidden on mobile by default, can be opened via sidebar button */}
      <div
        ref={navRef}
        className={`sidebar flex-shrink-0 flex-col border-r border-border overflow-hidden bg-card ${sidebarOpen ? 'fixed left-0 top-0 h-full z-40 flex w-72' : 'hidden md:flex'}`}
        style={{ width: 220 }}
      >
        <div className="p-3 border-b border-border">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Answered</span>
            <span>
              {answeredCount}/{questions.length}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(answeredCount / questions.length) * 100}%`,
                background: 'hsl(var(--primary))',
              }}
            />
          </div>
        </div>
        <div className="p-2 flex-1 overflow-y-auto">
          <div className="grid grid-cols-5 gap-1">
            {questions.map((_, i) => {
              const isAnswered = i in answers
              const isFlagged = flagged.has(i)
              const isCurrent = i === current
              return (
                <button
                  key={i}
                  data-testid={`exam-nav-${i}`}
                  onClick={() => {
                    setCurrent(i)
                    setSidebarOpen(false)
                  }}
                  className="h-8 text-xs font-semibold rounded border transition-all"
                  style={{
                    borderColor: isCurrent
                      ? 'hsl(var(--primary))'
                      : isFlagged
                        ? 'hsl(var(--chart-3))'
                        : 'hsl(var(--border))',
                    background: isAnswered
                      ? phase === 'review'
                        ? answers[i] === questions[i].correct
                          ? 'hsl(var(--chart-2) / 0.2)'
                          : 'hsl(var(--chart-5) / 0.2)'
                        : 'hsl(var(--primary) / 0.15)'
                      : undefined,
                    color: isCurrent ? 'hsl(var(--primary))' : undefined,
                    fontWeight: isCurrent ? 700 : undefined,
                  }}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
          <div className="mt-3 space-y-1 text-[10px] text-muted-foreground px-1">
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded border"
                style={{
                  background: 'hsl(var(--primary) / 0.15)',
                  borderColor: 'hsl(var(--border))',
                }}
              />
              Answered ({answeredCount})
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded border"
                style={{ borderColor: 'hsl(var(--border))' }}
              />
              Unanswered ({questions.length - answeredCount})
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded border"
                style={{ borderColor: 'hsl(var(--chart-3))' }}
              />
              Flagged ({flagged.size})
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div
          className="flex items-center gap-2 px-3 border-b border-border bg-card/50"
          style={{ height: 44 }}
        >
          <button
            aria-label="Open exam navigation"
            className="mob-menu md:hidden items-center justify-center w-8 h-8 rounded hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={16} />
          </button>

          {phase === 'exam' && (
            <>
              {/* Circular timer */}
              <div className="flex items-center gap-2" data-testid="exam-timer">
                <svg width={28} height={28} className="-rotate-90">
                  <circle
                    cx={14}
                    cy={14}
                    r={11}
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth={2.5}
                  />
                  <circle
                    cx={14}
                    cy={14}
                    r={11}
                    fill="none"
                    stroke={timerColor}
                    strokeWidth={2.5}
                    strokeDasharray={`${2 * Math.PI * 11}`}
                    strokeDashoffset={`${2 * Math.PI * 11 * (1 - timerPct / 100)}`}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease',
                    }}
                  />
                </svg>
                <span className="font-mono text-sm font-bold" style={{ color: timerColor }}>
                  {mm}:{ss}
                </span>
              </div>
              <button
                onClick={() =>
                  setFlagged(f => {
                    const n = new Set(f)
                    n.has(current) ? n.delete(current) : n.add(current)
                    return n
                  })
                }
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border transition-colors"
                style={{
                  borderColor: flagged.has(current) ? 'hsl(var(--chart-3))' : 'hsl(var(--border))',
                  color: flagged.has(current) ? 'hsl(var(--chart-3))' : undefined,
                  background: flagged.has(current) ? 'hsl(var(--chart-3) / 0.1)' : undefined,
                }}
              >
                <Flag size={12} /> {flagged.has(current) ? 'Flagged' : 'Flag'}
              </button>
              <button
                data-testid="exam-submit-btn"
                onClick={submitExam}
                className="ml-auto text-xs px-3 py-1 rounded font-semibold transition-all"
                style={{
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                }}
              >
                Submit Exam
              </button>
            </>
          )}
          {phase === 'review' && (
            <>
              <span className="text-xs font-semibold text-muted-foreground">Review Mode</span>
              <button
                onClick={() => setPhase('result')}
                className="ml-auto text-xs px-3 py-1 rounded border border-border hover:bg-muted transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={12} /> Back to results
              </button>
            </>
          )}
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                Question {current + 1} of {questions.length}
              </span>
              <span
                className="font-semibold uppercase px-1.5 py-0.5 rounded-full text-[10px]"
                style={{
                  background: DIFF_COLORS[q?.difficulty] + '20',
                  color: DIFF_COLORS[q?.difficulty],
                }}
              >
                {q?.difficulty}
              </span>
              <span className="text-muted-foreground">· {q?.domain}</span>
              {flagged.has(current) && (
                <span className="text-[10px] font-bold" style={{ color: 'hsl(var(--chart-3))' }}>
                  🚩 Flagged
                </span>
              )}
            </div>

            <div className="text-base font-semibold text-foreground whitespace-pre-line leading-relaxed">
              {q?.question}
            </div>

            <div className="space-y-2.5">
              {q?.choices.map(choice => {
                const isSelected = answers[current] === choice.id
                const isCorrect = choice.id === q.correct
                const isWrong = phase === 'review' && isSelected && !isCorrect
                const showCorrect = phase === 'review' && isCorrect

                return (
                  <button
                    key={choice.id}
                    data-testid={`exam-choice-${choice.id}`}
                    disabled={phase === 'review'}
                    onClick={() => setAnswers(prev => ({ ...prev, [current]: choice.id }))}
                    className="w-full text-left flex items-start gap-3 p-3.5 rounded-lg border transition-all"
                    style={{
                      borderColor: showCorrect
                        ? 'hsl(var(--chart-2))'
                        : isWrong
                          ? 'hsl(var(--chart-5))'
                          : isSelected
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--border))',
                      background: showCorrect
                        ? 'hsl(var(--chart-2) / 0.1)'
                        : isWrong
                          ? 'hsl(var(--chart-5) / 0.1)'
                          : isSelected
                            ? 'hsl(var(--primary) / 0.08)'
                            : undefined,
                    }}
                  >
                    <span
                      className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      style={{
                        borderColor: showCorrect
                          ? 'hsl(var(--chart-2))'
                          : isWrong
                            ? 'hsl(var(--chart-5))'
                            : isSelected
                              ? 'hsl(var(--primary))'
                              : 'hsl(var(--border))',
                        color: showCorrect
                          ? 'hsl(var(--chart-2))'
                          : isWrong
                            ? 'hsl(var(--chart-5))'
                            : isSelected
                              ? 'hsl(var(--primary))'
                              : 'hsl(var(--muted-foreground))',
                        background: showCorrect
                          ? 'hsl(var(--chart-2) / 0.15)'
                          : isWrong
                            ? 'hsl(var(--chart-5) / 0.15)'
                            : isSelected
                              ? 'hsl(var(--primary) / 0.15)'
                              : undefined,
                      }}
                    >
                      {phase === 'review' && showCorrect ? (
                        <CheckCircle size={14} />
                      ) : phase === 'review' && isWrong ? (
                        <XCircle size={14} />
                      ) : (
                        choice.id
                      )}
                    </span>
                    <span className="text-sm text-foreground">{choice.text}</span>
                  </button>
                )
              })}
            </div>

            {/* Explanation (review) */}
            {phase === 'review' && (
              <div
                className="flex gap-2.5 p-3.5 rounded-lg border"
                style={{
                  borderColor: 'hsl(var(--primary) / 0.3)',
                  background: 'hsl(var(--primary) / 0.06)',
                }}
              >
                <AlertCircle
                  size={16}
                  className="shrink-0 mt-0.5"
                  style={{ color: 'hsl(var(--primary))' }}
                />
                <p className="text-sm text-foreground">{q?.explanation}</p>
              </div>
            )}

            {/* Nav */}
            <div className="flex gap-3 pt-2">
              <button
                aria-label="Previous question"
                onClick={() => setCurrent(c => Math.max(0, c - 1))}
                disabled={current === 0}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded border border-border hover:bg-muted disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              {current < questions.length - 1 ? (
                <button
                  aria-label="Next question"
                  onClick={() => setCurrent(c => c + 1)}
                  className="flex items-center gap-1 ml-auto px-3 py-1.5 text-sm rounded border border-border hover:bg-muted transition-colors"
                >
                  Next <ChevronRight size={14} />
                </button>
              ) : phase === 'exam' ? (
                <button
                  aria-label="Submit exam"
                  onClick={submitExam}
                  className="ml-auto px-4 py-1.5 text-sm rounded font-bold"
                  style={{
                    background: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                  }}
                >
                  Submit Exam
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
