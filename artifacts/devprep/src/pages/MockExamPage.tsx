import { useState, useEffect, useRef, useCallback } from 'react'
import { useAnnounce, SkipLink, LiveRegion } from '@/hooks/useAnnounce'
import {
  Trophy,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Menu,
  GraduationCap,
  Timer,
  X,
  RotateCcw,
  Zap,
  Clock,
  Award,
  BookOpen,
  Lightbulb,
  Keyboard,
} from 'lucide-react'
import type { ExamQuestion } from '@/data/exam'
import { progressApi } from '@/services/progressApi'

type Phase = 'ready' | 'exam' | 'result' | 'review'

interface MockExamPageProps {
  questions: ExamQuestion[]
  channelId: string
  onExamComplete?: (score: number, total: number, passed: boolean, durationMs: number) => void
}

const DIFF_COLORS: Record<string, { color: string; bg: string }> = {
  easy: { color: '#3fb950', bg: 'rgba(63,185,80,0.1)' },
  medium: { color: '#f7a843', bg: 'rgba(247,168,67,0.1)' },
  hard: { color: '#ff7b72', bg: 'rgba(255,123,114,0.1)' },
}

const TOTAL_SECONDS = 45 * 60
const PASS_MARK = 72

function fmt(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

function getGrade(pct: number): string {
  if (pct >= 97) return 'A+'
  if (pct >= 93) return 'A'
  if (pct >= 90) return 'A-'
  if (pct >= 87) return 'B+'
  if (pct >= 83) return 'B'
  if (pct >= 80) return 'B-'
  if (pct >= 77) return 'C+'
  if (pct >= 73) return 'C'
  if (pct >= 70) return 'C-'
  if (pct >= 67) return 'D+'
  if (pct >= 63) return 'D'
  if (pct >= 60) return 'D-'
  return 'F'
}

function getChoiceLabel(index: number): string {
  return String.fromCharCode(65 + index)
}

export function MockExamPage({ questions, channelId, onExamComplete }: MockExamPageProps) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [examStartTime, setExamStartTime] = useState<number | null>(null)
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false)
  const [fadeKey, setFadeKey] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const answersRef = useRef<Record<number, string>>({})
  const { announce } = useAnnounce()

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    setPhase('ready')
    setCurrent(0)
    setAnswers({})
    setFlagged(new Set())
    setTimeLeft(TOTAL_SECONDS)
    setShowConfirmSubmit(false)
  }, [channelId])

  useEffect(() => {
    if (phase !== 'exam') return
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
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase])

  // Keyboard shortcuts for exam phase (1-4 to select choices)
  useEffect(() => {
    if (phase !== 'exam') return
    const handler = (e: KeyboardEvent) => {
      const key = e.key
      if (key >= '1' && key <= '4') {
        const idx = parseInt(key) - 1
        const q = questions[current]
        if (q?.choices?.[idx]) {
          setAnswers(prev => ({ ...prev, [current]: q.choices![idx].id }))
          announce(`Selected choice ${getChoiceLabel(idx)}`)
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [phase, current, questions, announce])

  const submitExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase('result')
    const durationMs = (TOTAL_SECONDS - timeLeft) * 1000
    const score = questions.reduce(
      (acc, q, i) => acc + (answersRef.current[i] === q.correct ? 1 : 0),
      0
    )
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
    const passed = pct >= PASS_MARK
    if (examStartTime && onExamComplete) onExamComplete(score, questions.length, passed, durationMs)
    progressApi.saveExam(channelId, channelId, {
      score,
      total: questions.length,
      passed,
    })
  }, [timeLeft, questions, channelId, examStartTime, onExamComplete])

  const startExam = () => {
    setPhase('exam')
    setExamStartTime(Date.now())
  }

  const navigateTo = (idx: number) => {
    setCurrent(idx)
    setFadeKey(k => k + 1)
    setSidebarOpen(false)
  }

  const answeredCount = Object.keys(answers).length
  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0)
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
  const passed = pct >= PASS_MARK
  const timeUsed = TOTAL_SECONDS - timeLeft
  const timerPct = (timeLeft / TOTAL_SECONDS) * 100
  const timerDanger = timeLeft < 5 * 60
  const timerWarning = timeLeft < 15 * 60 && !timerDanger
  const progressPct = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0

  if (questions.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-xl"
          style={{ background: 'var(--dp-bg-3)' }}
        >
          <GraduationCap size={28} style={{ color: 'var(--dp-text-3)' }} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--dp-text-0)' }}>
            No exam questions
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--dp-text-2)' }}>
            Switch to a different channel to take a mock exam.
          </p>
        </div>
      </div>
    )
  }

  /* ── READY SCREEN ── */
  if (phase === 'ready') {
    const hist = progressApi.loadSync().exams[channelId]
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-7 p-5">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,123,114,0.2), rgba(188,140,255,0.2))',
            border: '1px solid rgba(255,123,114,0.3)',
            boxShadow: '0 0 32px rgba(255,123,114,0.15)',
          }}
        >
          <GraduationCap size={36} style={{ color: '#ff7b72' }} />
        </div>

        <div className="max-w-md text-center">
          <h1
            className="mb-2 text-2xl font-extrabold tracking-tight"
            style={{ color: 'var(--dp-text-0)' }}
          >
            Mock Exam
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: 'var(--dp-text-2)' }}>
            Test your knowledge with a timed exam. You need{' '}
            <strong style={{ color: 'var(--dp-text-0)' }}>{PASS_MARK}%</strong> to pass.
          </p>
        </div>

        <div className="grid w-full max-w-md grid-cols-3 gap-3">
          {[
            { label: 'Questions', value: questions.length, icon: BookOpen },
            { label: 'Time Limit', value: '45 min', icon: Clock },
            { label: 'Pass Mark', value: `${PASS_MARK}%`, icon: Award },
          ].map(stat => (
            <div
              key={stat.label}
              className="rounded-xl border p-4 text-center"
              style={{ background: 'var(--dp-glass-1)', borderColor: 'var(--dp-border-0)' }}
            >
              <stat.icon size={20} className="mx-auto mb-2" style={{ color: 'var(--dp-text-3)' }} />
              <div className="text-xl font-extrabold" style={{ color: 'var(--dp-text-0)' }}>
                {stat.value}
              </div>
              <div className="mt-0.5 text-[11px]" style={{ color: 'var(--dp-text-3)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div
          className="w-full max-w-md rounded-xl border p-4"
          style={{ background: 'var(--dp-glass-1)', borderColor: 'var(--dp-border-1)' }}
        >
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle size={14} style={{ color: 'var(--dp-orange)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--dp-text-1)' }}>
              Before you start
            </span>
          </div>
          <ul
            className="ml-4 space-y-1 text-xs leading-relaxed"
            style={{ color: 'var(--dp-text-2)' }}
          >
            <li>Timer starts when you click &quot;Start Exam&quot;</li>
            <li>Use flags to mark questions for review</li>
            <li>You can navigate freely between questions</li>
            <li className="flex items-center gap-1.5">
              <Keyboard size={11} /> Press{' '}
              <kbd className="rounded bg-black/10 px-1 py-0.5 font-mono text-[10px]">1</kbd>–
              <kbd className="rounded bg-black/10 px-1 py-0.5 font-mono text-[10px]">4</kbd> to
              select choices
            </li>
          </ul>
        </div>

        {hist &&
          (() => {
            const histPct = hist.total > 0 ? Math.round((hist.score / hist.total) * 100) : 0
            const histDate = new Date(hist.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })
            return (
              <div
                className="flex w-full max-w-md items-center gap-3 rounded-xl border p-3"
                style={{
                  background: hist.passed ? 'rgba(63,185,80,0.06)' : 'rgba(255,123,114,0.06)',
                  borderColor: hist.passed ? 'rgba(63,185,80,0.25)' : 'rgba(255,123,114,0.25)',
                }}
              >
                {hist.passed ? (
                  <CheckCircle size={20} style={{ color: '#3fb950', flexShrink: 0 }} />
                ) : (
                  <XCircle size={20} style={{ color: '#ff7b72', flexShrink: 0 }} />
                )}
                <div>
                  <div className="text-xs font-bold" style={{ color: 'var(--dp-text-2)' }}>
                    Last Attempt · {histDate}
                  </div>
                  <div
                    className="text-sm font-bold"
                    style={{ color: hist.passed ? '#3fb950' : '#ff7b72' }}
                  >
                    {histPct}% — {hist.score}/{hist.total} correct ·{' '}
                    {hist.passed ? 'Passed' : 'Did not pass'}
                  </div>
                </div>
              </div>
            )
          })()}

        <button
          onClick={startExam}
          className="inline-flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-[15px] font-bold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, #ff7b72, #bc8cff)',
            boxShadow: '0 8px 24px rgba(255,123,114,0.35)',
            letterSpacing: '-0.2px',
          }}
          aria-label={hist ? 'Retake Exam' : 'Start Exam'}
        >
          <Zap size={16} /> {hist ? 'Retake Exam' : 'Start Exam'}
        </button>
      </div>
    )
  }

  /* ── RESULT SCREEN ── */
  if (phase === 'result') {
    const grade = getGrade(pct)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto p-5">
        {/* Score badge */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full ${passed ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}
          >
            {passed ? (
              <Trophy size={28} className="text-emerald-400" />
            ) : (
              <BookOpen size={28} className="text-red-400" />
            )}
          </div>
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${passed ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' : 'bg-red-500/15 text-red-400 border border-red-500/25'}`}
          >
            {passed ? <CheckCircle size={14} /> : <XCircle size={14} />}
            {passed ? 'PASSED' : 'NOT PASSED'}
          </div>
        </div>

        {/* Gradient percentage */}
        <div className="text-center">
          <div
            className="text-7xl font-black leading-none tracking-tighter"
            style={{
              background: passed
                ? 'linear-gradient(135deg, #3fb950, #38bdf8)'
                : 'linear-gradient(135deg, #ff7b72, #f7a843)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {pct}%
          </div>
          <div
            className="mt-2 text-5xl font-black"
            style={{ color: 'var(--dp-text-0)', opacity: 0.08 }}
          >
            {grade}
          </div>
          <div className="mt-1 text-base font-bold" style={{ color: 'var(--dp-text-0)' }}>
            {passed ? 'Exam Passed!' : 'Keep Practicing'}
          </div>
          <div className="text-sm" style={{ color: 'var(--dp-text-2)' }}>
            {score} / {questions.length} correct · {fmt(timeUsed)} used
          </div>
        </div>

        {/* Score breakdown */}
        <div
          className="w-full max-w-md rounded-2xl border p-5"
          style={{ background: 'var(--dp-glass-1)', borderColor: 'var(--dp-border-0)' }}
        >
          <div
            className="mb-4 h-2 overflow-hidden rounded-full"
            style={{ background: 'var(--dp-bg-3)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${pct}%`,
                background: passed
                  ? 'linear-gradient(90deg, #3fb950, #38bdf8)'
                  : 'linear-gradient(90deg, #ff7b72, #f7a843)',
              }}
            />
          </div>

          <div className="space-y-1">
            {questions.map((q, i) => (
              <div
                key={i}
                className="flex items-start gap-2 py-1.5"
                style={{
                  borderBottom: i < questions.length - 1 ? '1px solid var(--dp-border-2)' : 'none',
                }}
              >
                {answers[i] === q.correct ? (
                  <CheckCircle size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                )}
                <span className="text-xs" style={{ color: 'var(--dp-text-1)' }}>
                  {q.question}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setPhase('review')}
            className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors duration-150 hover:brightness-110"
            style={{
              borderColor: 'var(--dp-border-0)',
              background: 'var(--dp-bg-2)',
              color: 'var(--dp-text-1)',
            }}
          >
            <BookOpen size={14} /> Review Answers
          </button>
          <button
            onClick={() => {
              setPhase('ready')
              setAnswers({})
              setFlagged(new Set())
              setTimeLeft(TOTAL_SECONDS)
              setCurrent(0)
            }}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
            style={{ background: 'var(--dp-blue)' }}
          >
            <RotateCcw size={13} /> Retake
          </button>
        </div>
      </div>
    )
  }

  /* ── REVIEW SCREEN ── */
  if (phase === 'review') {
    return (
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          <div className="mb-1 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--dp-text-0)' }}>
                Review Answers
              </h2>
              <p className="mt-0.5 text-sm" style={{ color: 'var(--dp-text-2)' }}>
                {score}/{questions.length} correct · {pct}%
              </p>
            </div>
            <button
              onClick={() => setPhase('result')}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors duration-150 hover:brightness-110"
              style={{
                borderColor: 'var(--dp-border-1)',
                background: 'var(--dp-bg-2)',
                color: 'var(--dp-text-2)',
              }}
            >
              <ChevronLeft size={12} /> Back to Results
            </button>
          </div>

          {questions.map((q, i) => {
            const userAns = answers[i]
            const isCorrect = userAns === q.correct
            const diff = q.difficulty ? DIFF_COLORS[q.difficulty] : null
            return (
              <div
                key={i}
                className="rounded-2xl border"
                style={{
                  borderColor: isCorrect ? 'rgba(63,185,80,0.25)' : 'rgba(255,123,114,0.25)',
                  background: 'var(--dp-glass-1)',
                }}
              >
                {/* Question header */}
                <div
                  className="border-b p-4"
                  style={{
                    borderColor: isCorrect ? 'rgba(63,185,80,0.12)' : 'rgba(255,123,114,0.12)',
                  }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: 'var(--dp-text-3)' }}>
                      Q{i + 1}
                    </span>
                    {diff && (
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                        style={{ background: diff.bg, color: diff.color }}
                      >
                        {q.difficulty}
                      </span>
                    )}
                    <span
                      className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isCorrect ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}
                    >
                      {isCorrect ? <CheckCircle size={10} /> : <XCircle size={10} />}
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>
                  <p
                    className="text-sm font-semibold leading-relaxed"
                    style={{ color: 'var(--dp-text-0)' }}
                  >
                    {q.question}
                  </p>
                </div>

                {/* Choices */}
                <div className="space-y-1.5 p-4 pt-3">
                  {(q.choices || []).map(choice => {
                    const isCorrectOpt = choice.id === q.correct
                    const isUserOpt = choice.id === userAns
                    return (
                      <div
                        key={choice.id}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm"
                        style={{
                          background: isCorrectOpt
                            ? 'rgba(63,185,80,0.08)'
                            : isUserOpt && !isCorrect
                              ? 'rgba(255,123,114,0.08)'
                              : 'var(--dp-bg-2)',
                          border: `1px solid ${
                            isCorrectOpt
                              ? 'rgba(63,185,80,0.3)'
                              : isUserOpt && !isCorrect
                                ? 'rgba(255,123,114,0.3)'
                                : 'var(--dp-border-1)'
                          }`,
                          color: isCorrectOpt
                            ? '#3fb950'
                            : isUserOpt && !isCorrect
                              ? '#ff7b72'
                              : 'var(--dp-text-1)',
                        }}
                      >
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                          style={{
                            background: isCorrectOpt
                              ? 'rgba(63,185,80,0.2)'
                              : isUserOpt
                                ? 'rgba(255,123,114,0.2)'
                                : 'var(--dp-bg-3)',
                            color: isCorrectOpt
                              ? '#3fb950'
                              : isUserOpt && !isCorrect
                                ? '#ff7b72'
                                : 'var(--dp-text-3)',
                          }}
                        >
                          {choice.id}
                        </span>
                        <span className="flex-1">{choice.text}</span>
                        {isCorrectOpt && <CheckCircle size={14} className="shrink-0" />}
                        {isUserOpt && !isCorrect && <XCircle size={14} className="shrink-0" />}
                      </div>
                    )
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div
                    className="mx-4 mb-4 flex items-start gap-2 rounded-lg border p-3"
                    style={{
                      background: 'rgba(56,139,253,0.06)',
                      borderColor: 'rgba(56,139,253,0.15)',
                    }}
                  >
                    <Lightbulb
                      size={14}
                      className="mt-0.5 shrink-0"
                      style={{ color: 'var(--dp-blue)' }}
                    />
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--dp-text-1)' }}>
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /* ── EXAM SCREEN ── */
  const q = questions[current]
  return (
    <div className="study-page">
      <SkipLink targetId="exam-content">Skip to content</SkipLink>
      <LiveRegion />

      {sidebarOpen && (
        <div className="mobile-overlay md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Left panel - question grid */}
      <div
        className={`study-panel${sidebarOpen ? ' study-panel--mobile-open' : ''}`}
        style={
          sidebarOpen
            ? {
                position: 'fixed',
                top: 0,
                left: 0,
                height: '100%',
                zIndex: 40,
                display: 'flex',
                width: 270,
              }
            : {}
        }
      >
        <div className="study-panel-header">
          <GraduationCap size={13} style={{ color: 'var(--dp-text-3)' }} />
          <span className="study-panel-title">Questions</span>
          <span className="study-panel-count">
            {answeredCount}/{questions.length}
          </span>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto cursor-pointer border-none bg-transparent"
              style={{ color: 'var(--dp-text-3)' }}
              aria-label="Close sidebar"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sidebar progress with percentage */}
        <div
          className="shrink-0 border-b px-3 py-2.5"
          style={{ borderColor: 'var(--dp-border-1)' }}
        >
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold" style={{ color: 'var(--dp-text-2)' }}>
              Progress
            </span>
            <span className="text-xs font-bold" style={{ color: 'var(--dp-text-1)' }}>
              {Math.round(progressPct)}%
            </span>
          </div>
          <div
            className="h-1.5 overflow-hidden rounded-full"
            style={{ background: 'var(--dp-bg-3)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #38bdf8, #a855f7)',
              }}
            />
          </div>
        </div>

        {/* Legend */}
        <div
          className="flex gap-3 border-b px-3 py-2"
          style={{ borderColor: 'var(--dp-border-1)' }}
        >
          {[
            { color: 'var(--dp-bg-4)', label: 'Empty' },
            { color: 'var(--dp-green)', label: 'Answered' },
            { color: 'var(--dp-orange)', label: 'Flagged' },
          ].map(item => (
            <div
              key={item.label}
              className="flex items-center gap-1.5 text-[10px]"
              style={{ color: 'var(--dp-text-3)' }}
            >
              <div className="h-2 w-2 rounded-sm" style={{ background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>

        {/* Question grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="dp-exam-grid">
            {questions.map((_, i) => {
              const isAnswered = !!answers[i]
              const isFlagged = flagged.has(i)
              const isCurrent = i === current
              let style: React.CSSProperties = {}
              if (isCurrent) {
                style = {
                  background: 'var(--dp-blue)',
                  color: '#fff',
                  border: '2px solid #38bdf8',
                  boxShadow: '0 0 0 2px rgba(56,139,253,0.2)',
                }
              } else if (isFlagged) {
                style = {
                  background: 'var(--dp-orange-dim)',
                  color: 'var(--dp-orange)',
                  border: '1px solid rgba(247,168,67,0.3)',
                }
              } else if (isAnswered) {
                style = {
                  background: 'var(--dp-green-dim)',
                  color: 'var(--dp-green)',
                  border: '1px solid rgba(63,185,80,0.3)',
                }
              } else {
                style = {
                  background: 'var(--dp-bg-3)',
                  color: 'var(--dp-text-3)',
                  border: '1px solid transparent',
                }
              }
              return (
                <button
                  key={i}
                  className="dp-exam-cell transition-all duration-150"
                  style={style}
                  onClick={() => navigateTo(i)}
                  aria-label={`Question ${i + 1}${isAnswered ? ', answered' : ''}${isFlagged ? ', flagged' : ''}${isCurrent ? ', current' : ''}`}
                  aria-current={isCurrent ? 'true' : undefined}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>

        {/* Submit button in sidebar */}
        <div className="shrink-0 border-t p-3" style={{ borderColor: 'var(--dp-border-1)' }}>
          <button
            onClick={() => setShowConfirmSubmit(true)}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, #38bdf8, #a855f7)',
              boxShadow: '0 4px 12px rgba(56,139,253,0.25)',
            }}
            aria-label="Submit exam"
          >
            Submit Exam
          </button>
        </div>
      </div>

      {/* Main */}
      <main id="exam-content" className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="study-toolbar">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 'var(--dp-r-md)',
              border: '1px solid var(--dp-border-1)',
              background: 'var(--dp-bg-2)',
              color: 'var(--dp-text-2)',
              cursor: 'pointer',
            }}
            aria-label="Open question navigator"
          >
            <Menu size={15} />
          </button>

          <span className="text-sm font-bold" style={{ color: 'var(--dp-text-0)' }}>
            Q {current + 1}/{questions.length}
          </span>

          {/* Difficulty badge */}
          {q.difficulty && (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
              style={{
                background: (DIFF_COLORS[q.difficulty] || { bg: 'var(--dp-bg-3)' }).bg,
                color: (DIFF_COLORS[q.difficulty] || { color: 'var(--dp-text-3)' }).color,
              }}
            >
              {q.difficulty}
            </span>
          )}

          <div style={{ flex: 1 }} />

          {/* Timer with linear progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1.5">
                <Timer
                  size={12}
                  style={{
                    color: timerDanger ? '#ff7b72' : timerWarning ? '#f7a843' : 'var(--dp-text-3)',
                  }}
                />
                <span
                  className="font-mono text-sm font-bold"
                  style={{
                    color: timerDanger ? '#ff7b72' : timerWarning ? '#f7a843' : 'var(--dp-text-0)',
                  }}
                >
                  {fmt(timeLeft)}
                </span>
              </div>
              <div
                className="h-1 w-24 overflow-hidden rounded-full"
                style={{ background: 'var(--dp-bg-3)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-linear"
                  style={{
                    width: `${timerPct}%`,
                    background: timerDanger
                      ? 'linear-gradient(90deg, #ff7b72, #f87171)'
                      : timerWarning
                        ? 'linear-gradient(90deg, #f7a843, #fbbf24)'
                        : 'linear-gradient(90deg, #38bdf8, #a855f7)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Flag toggle with Star icon */}
          <button
            onClick={() =>
              setFlagged(prev => {
                const n = new Set(prev)
                n.has(current) ? n.delete(current) : n.add(current)
                return n
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150"
            style={{
              border: `1px solid ${flagged.has(current) ? 'rgba(245,158,11,0.4)' : 'var(--dp-border-1)'}`,
              background: flagged.has(current) ? 'rgba(245,158,11,0.12)' : 'var(--dp-bg-2)',
              color: flagged.has(current) ? '#f59e0b' : 'var(--dp-text-2)',
            }}
            aria-label={
              flagged.has(current)
                ? 'Remove flag from this question'
                : 'Flag this question for review'
            }
            aria-pressed={flagged.has(current)}
          >
            <Star size={13} fill={flagged.has(current) ? '#f59e0b' : 'none'} />
            {flagged.has(current) ? 'Flagged' : 'Flag'}
          </button>

          <button
            onClick={() => navigateTo(Math.max(0, current - 1))}
            disabled={current === 0}
            className="study-toolbar-nav"
            aria-label="Previous question"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => navigateTo(Math.min(questions.length - 1, current + 1))}
            disabled={current === questions.length - 1}
            className="study-toolbar-nav"
            aria-label="Next question"
          >
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Question content with fade transition */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          <div
            className="mx-auto flex max-w-2xl flex-col gap-5"
            key={fadeKey}
            style={{ animation: 'fadeIn 0.25s ease-out' }}
          >
            {/* Question card */}
            <div
              className="rounded-2xl border p-6"
              style={{ background: 'var(--dp-glass-1)', borderColor: 'var(--dp-border-0)' }}
            >
              <p
                className="text-lg font-semibold leading-relaxed"
                style={{ color: 'var(--dp-text-0)' }}
              >
                {q.question}
              </p>
            </div>

            {/* Choice cards with A/B/C/D labels */}
            <div className="space-y-2.5" role="radiogroup" aria-label="Answer choices">
              {(q.choices || []).map((choice, idx) => {
                const isSelected = answers[current] === choice.id
                const label = getChoiceLabel(idx)
                return (
                  <button
                    key={choice.id}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setAnswers(prev => ({ ...prev, [current]: choice.id }))}
                    className="group flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm leading-relaxed transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                    style={{
                      border: isSelected
                        ? '2px solid var(--dp-blue)'
                        : '1px solid var(--dp-border-0)',
                      background: isSelected ? 'var(--dp-blue-dim)' : 'var(--dp-glass-1)',
                      color: isSelected ? 'var(--dp-text-0)' : 'var(--dp-text-1)',
                      fontWeight: isSelected ? 600 : 400,
                      boxShadow: isSelected ? '0 0 0 3px rgba(56,139,253,0.1)' : 'none',
                    }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors duration-200"
                      style={{
                        border: isSelected
                          ? '2px solid var(--dp-blue)'
                          : '1px solid var(--dp-border-0)',
                        background: isSelected ? 'var(--dp-blue)' : 'var(--dp-bg-3)',
                        color: isSelected ? '#fff' : 'var(--dp-text-3)',
                      }}
                    >
                      {label}
                    </span>
                    <span className="flex-1">{choice.text}</span>
                    <kbd
                      className="hidden rounded px-1.5 py-0.5 font-mono text-[10px] transition-opacity group-hover:inline"
                      style={{
                        background: 'var(--dp-bg-3)',
                        color: 'var(--dp-text-3)',
                        opacity: 0.6,
                      }}
                    >
                      {idx + 1}
                    </kbd>
                  </button>
                )
              })}
            </div>

            {/* Bottom nav */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => navigateTo(Math.max(0, current - 1))}
                disabled={current === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm transition-all duration-150 hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100"
                style={{
                  borderColor: 'var(--dp-border-1)',
                  background: 'var(--dp-bg-2)',
                  color: 'var(--dp-text-2)',
                }}
              >
                <ChevronLeft size={14} /> Previous
              </button>

              {current < questions.length - 1 ? (
                <button
                  onClick={() => navigateTo(current + 1)}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-150 hover:brightness-110"
                  style={{
                    borderColor: 'rgba(56,139,253,0.2)',
                    background: 'var(--dp-blue-dim)',
                    color: 'var(--dp-blue)',
                  }}
                >
                  Next <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirmSubmit(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-bold text-white transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(135deg, #38bdf8, #a855f7)',
                    boxShadow: '0 4px 12px rgba(56,139,253,0.25)',
                  }}
                >
                  Submit Exam <CheckCircle size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Confirm submit dialog */}
      {showConfirmSubmit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div
            className="w-full max-w-sm animate-scale-in rounded-2xl border p-6"
            style={{
              background: 'var(--dp-bg-1)',
              borderColor: 'var(--dp-border-0)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
            }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: 'rgba(56,139,253,0.1)' }}
              >
                <AlertCircle size={20} style={{ color: 'var(--dp-blue)' }} />
              </div>
              <h3
                id="confirm-title"
                className="text-base font-bold"
                style={{ color: 'var(--dp-text-0)' }}
              >
                Submit Exam?
              </h3>
            </div>
            <p className="mb-2 text-sm" style={{ color: 'var(--dp-text-2)' }}>
              You have answered{' '}
              <strong style={{ color: 'var(--dp-text-0)' }}>{answeredCount}</strong> of{' '}
              <strong style={{ color: 'var(--dp-text-0)' }}>{questions.length}</strong> questions.
            </p>
            {answeredCount < questions.length && (
              <p className="mb-4 text-sm" style={{ color: 'var(--dp-orange)' }}>
                {questions.length - answeredCount} question
                {questions.length - answeredCount !== 1 ? 's' : ''} unanswered.
              </p>
            )}
            {answeredCount >= questions.length && <div className="mb-4" />}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors duration-150 hover:brightness-110"
                style={{
                  borderColor: 'var(--dp-border-1)',
                  background: 'var(--dp-bg-2)',
                  color: 'var(--dp-text-1)',
                }}
              >
                Continue Exam
              </button>
              <button
                onClick={() => {
                  setShowConfirmSubmit(false)
                  submitExam()
                }}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white transition-all duration-150 hover:brightness-110 active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(135deg, #38bdf8, #a855f7)',
                  boxShadow: '0 4px 12px rgba(56,139,253,0.25)',
                }}
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
