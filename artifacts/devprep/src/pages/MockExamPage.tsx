import { useState, useEffect, useRef, useCallback } from 'react'
import { useAnnounce, SkipLink, LiveRegion } from '@/hooks/useAnnounce'
import {
  Trophy, Flag, ChevronLeft, ChevronRight, AlertCircle,
  CheckCircle, XCircle, Menu, GraduationCap, Timer, X, RotateCcw, Zap,
} from 'lucide-react'
import type { ExamQuestion } from '@/data/exam'
import { progressApi } from '@/services/progressApi'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'

type Phase = 'ready' | 'exam' | 'result' | 'review'

interface MockExamPageProps {
  questions: ExamQuestion[]
  channelId: string
  onExamComplete?: (score: number, total: number, passed: boolean, durationMs: number) => void
}

const DIFF_COLORS: Record<string, { color: string; bg: string }> = {
  easy:   { color: '#3fb950', bg: 'rgba(63,185,80,0.1)' },
  medium: { color: '#f7a843', bg: 'rgba(247,168,67,0.1)' },
  hard:   { color: '#ff7b72', bg: 'rgba(255,123,114,0.1)' },
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export function MockExamPage({ questions, channelId, onExamComplete }: MockExamPageProps) {
  const [phase, setPhase] = useState<Phase>('ready')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState(45 * 60)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [examStartTime, setExamStartTime] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const answersRef = useRef<Record<number, string>>({})
  const visibilityPausedRef = useRef(0)
  const { announce } = useAnnounce()

  useEffect(() => { answersRef.current = answers }, [answers])

  useEffect(() => {
    setPhase('ready'); setCurrent(0); setAnswers({})
    setFlagged(new Set()); setTimeLeft(45 * 60)
  }, [channelId])

  useEffect(() => {
    if (phase !== 'exam') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); submitExam(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  const submitExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setPhase('result')
    const durationMs = (45 * 60 - timeLeft) * 1000
    const score = questions.reduce((acc, q, i) => acc + (answersRef.current[i] === q.correct ? 1 : 0), 0)
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
    const passed = pct >= 72
    if (examStartTime && onExamComplete) onExamComplete(score, questions.length, passed, durationMs)
    progressApi.saveExam(channelId, channelId, {
      score, total: questions.length, passed,
    })
  }, [timeLeft, questions, channelId, examStartTime, onExamComplete])

  const startExam = () => {
    setPhase('exam')
    setExamStartTime(Date.now())
  }

  const answeredCount = Object.keys(answers).length
  const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0)
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
  const passed = pct >= 72
  const timeUsed = 45 * 60 - timeLeft
  const timerDanger = timeLeft < 5 * 60
  const timerWarning = timeLeft < 15 * 60 && !timerDanger

  if (questions.length === 0) {
    return (
      <div className="dp-empty">
        <div className="dp-empty-icon"><GraduationCap size={24} /></div>
        <div className="dp-empty-title">No exam questions</div>
        <div className="dp-empty-desc">Switch to a different channel to take a mock exam.</div>
      </div>
    )
  }

  /* ── READY SCREEN ── */
  if (phase === 'ready') {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', gap: 28 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 'var(--dp-r-xl)',
          background: 'linear-gradient(135deg, rgba(255,123,114,0.2), rgba(188,140,255,0.2))',
          border: '1px solid rgba(255,123,114,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 32px rgba(255,123,114,0.15)',
        }}>
          <GraduationCap size={36} style={{ color: '#ff7b72' }} />
        </div>

        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--dp-text-0)', marginBottom: 10, letterSpacing: '-0.5px' }}>
            Mock Exam
          </h1>
          <p style={{ fontSize: 15, color: 'var(--dp-text-2)', lineHeight: 1.6 }}>
            Test your knowledge with a timed exam. You need <strong style={{ color: 'var(--dp-text-0)' }}>72%</strong> to pass.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '100%', maxWidth: 420 }}>
          {[
            { label: 'Questions', value: questions.length, icon: '📝' },
            { label: 'Time Limit', value: '45 min', icon: '⏱️' },
            { label: 'Pass Mark', value: '72%', icon: '🎯' },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'var(--dp-glass-1)', border: '1px solid var(--dp-border-0)',
              borderRadius: 'var(--dp-r-lg)', padding: '16px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--dp-text-0)' }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: 'var(--dp-text-3)', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--dp-glass-1)', border: '1px solid var(--dp-border-1)', borderRadius: 'var(--dp-r-lg)', padding: '14px 18px', maxWidth: 420, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertCircle size={14} style={{ color: 'var(--dp-orange)' }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--dp-text-1)' }}>Before you start</span>
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: 12.5, color: 'var(--dp-text-2)', lineHeight: 1.7 }}>
            <li>Timer starts when you click "Start Exam"</li>
            <li>Use flags to mark questions for review</li>
            <li>You can navigate freely between questions</li>
          </ul>
        </div>

        <button
          onClick={startExam}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '13px 32px', borderRadius: 'var(--dp-r-lg)',
            background: 'linear-gradient(135deg, #ff7b72, #bc8cff)',
            color: '#fff', border: 'none', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 8px 24px rgba(255,123,114,0.35)',
            transition: 'all var(--dp-dur-base)', letterSpacing: '-0.2px',
          }}
        >
          <Zap size={16} /> Start Exam
        </button>
      </div>
    )
  }

  /* ── RESULT SCREEN ── */
  if (phase === 'result') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', gap: 24 }}>
        <div style={{ fontSize: 64, lineHeight: 1, animation: 'dp-bounce-in 0.7s var(--dp-ease-spring)' }}>
          {passed ? '🏆' : '📚'}
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: '-4px', lineHeight: 1, color: passed ? '#3fb950' : '#ff7b72', marginBottom: 4 }}>
            {pct}%
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--dp-text-0)', marginBottom: 6 }}>
            {passed ? 'Exam Passed! 🎉' : 'Keep Practicing'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--dp-text-2)' }}>
            {score} / {questions.length} correct · {fmt(timeUsed)} used
          </div>
        </div>

        {/* Score breakdown */}
        <div style={{
          width: '100%', maxWidth: 400,
          background: 'var(--dp-glass-1)', border: '1px solid var(--dp-border-0)',
          borderRadius: 'var(--dp-r-xl)', padding: '20px 24px',
        }}>
          <div style={{ height: 8, borderRadius: 'var(--dp-r-full)', background: 'var(--dp-bg-3)', marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 'var(--dp-r-full)', width: `${pct}%`, background: passed ? 'var(--dp-green)' : 'var(--dp-red)', transition: 'width 1s var(--dp-ease)' }} />
          </div>

          {questions.map((q, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0', borderBottom: i < questions.length - 1 ? '1px solid var(--dp-border-2)' : 'none' }}>
              {answers[i] === q.correct
                ? <CheckCircle size={14} style={{ color: '#3fb950', flexShrink: 0, marginTop: 1 }} />
                : <XCircle size={14} style={{ color: '#ff7b72', flexShrink: 0, marginTop: 1 }} />
              }
              <span style={{ fontSize: 12.5, color: 'var(--dp-text-1)', flex: 1 }}>{q.question}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setPhase('review')} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px',
            borderRadius: 'var(--dp-r-md)', border: '1px solid var(--dp-border-0)',
            background: 'var(--dp-bg-2)', color: 'var(--dp-text-1)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            Review Answers
          </button>
          <button onClick={() => { setPhase('ready'); setAnswers({}); setFlagged(new Set()); setTimeLeft(45*60); setCurrent(0) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px',
              borderRadius: 'var(--dp-r-md)', border: 'none',
              background: 'var(--dp-blue)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
            <RotateCcw size={13} /> Retake
          </button>
        </div>
      </div>
    )
  }

  /* ── REVIEW SCREEN ── */
  if (phase === 'review') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--dp-text-0)', margin: 0 }}>Review Answers</h2>
              <p style={{ fontSize: 13, color: 'var(--dp-text-2)', margin: '4px 0 0' }}>{score}/{questions.length} correct · {pct}%</p>
            </div>
            <button onClick={() => setPhase('result')} style={{ background: 'none', border: '1px solid var(--dp-border-1)', borderRadius: 'var(--dp-r-md)', padding: '6px 12px', fontSize: 12, color: 'var(--dp-text-2)', cursor: 'pointer' }}>
              ← Back
            </button>
          </div>

          {questions.map((q, i) => {
            const userAns = answers[i]
            const isCorrect = userAns === q.correct
            return (
              <div key={i} style={{
                background: 'var(--dp-glass-1)', border: `1px solid ${isCorrect ? 'rgba(63,185,80,0.25)' : 'rgba(255,123,114,0.25)'}`,
                borderRadius: 'var(--dp-r-xl)', padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                  {isCorrect
                    ? <CheckCircle size={16} style={{ color: '#3fb950', flexShrink: 0, marginTop: 2 }} />
                    : <XCircle size={16} style={{ color: '#ff7b72', flexShrink: 0, marginTop: 2 }} />
                  }
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--dp-text-0)', margin: 0, lineHeight: 1.5 }}>{q.question}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 26 }}>
                  {(q.choices || []).map((choice) => {
                    const isCorrectOpt = choice.id === q.correct
                    const isUserOpt = choice.id === userAns
                    let bg = 'var(--dp-bg-2)'
                    let border = 'var(--dp-border-1)'
                    let color = 'var(--dp-text-1)'
                    if (isCorrectOpt) { bg = 'rgba(63,185,80,0.08)'; border = 'rgba(63,185,80,0.3)'; color = '#3fb950' }
                    else if (isUserOpt && !isCorrect) { bg = 'rgba(255,123,114,0.08)'; border = 'rgba(255,123,114,0.3)'; color = '#ff7b72' }
                    return (
                      <div key={choice.id} style={{ padding: '6px 12px', borderRadius: 'var(--dp-r-md)', border: `1px solid ${border}`, background: bg, fontSize: 13, color, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isCorrectOpt && <CheckCircle size={12} />}
                        {isUserOpt && !isCorrect && <XCircle size={12} />}
                        <span style={{ fontWeight: 600, marginRight: 4 }}>{choice.id}.</span> {choice.text}
                      </div>
                    )
                  })}
                </div>
                {q.explanation && (
                  <div style={{ marginLeft: 26, marginTop: 10, padding: '8px 12px', borderRadius: 'var(--dp-r-md)', background: 'var(--dp-blue-dim)', border: '1px solid rgba(56,139,253,0.2)', fontSize: 12.5, color: 'var(--dp-text-1)', lineHeight: 1.5 }}>
                    💡 {q.explanation}
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

      {sidebarOpen && <div className="mobile-overlay md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Left panel - question grid */}
      <div className={`study-panel${sidebarOpen ? ' study-panel--mobile-open' : ''}`}
        style={sidebarOpen ? { position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 40, display: 'flex', width: 270 } : {}}>
        <div className="study-panel-header">
          <GraduationCap size={13} style={{ color: 'var(--dp-text-3)' }} />
          <span className="study-panel-title">Questions</span>
          <span className="study-panel-count">{answeredCount}/{questions.length}</span>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dp-text-3)' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Progress */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--dp-border-1)', flexShrink: 0 }}>
          <div className="dp-progress-bar">
            <div className="dp-progress-bar-fill" style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, padding: '8px 12px', borderBottom: '1px solid var(--dp-border-1)', flexShrink: 0 }}>
          {[
            { color: 'var(--dp-bg-4)', label: 'Unanswered' },
            { color: 'var(--dp-green)', label: 'Answered' },
            { color: 'var(--dp-orange)', label: 'Flagged' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--dp-text-3)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>

        {/* Question grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          <div className="dp-exam-grid">
            {questions.map((_, i) => {
              const isAnswered = !!answers[i]
              const isFlagged = flagged.has(i)
              const isCurrent = i === current
              let bg = 'var(--dp-bg-3)'
              let color = 'var(--dp-text-3)'
              let borderColor = 'transparent'
              if (isCurrent) { bg = 'var(--dp-blue)'; color = '#fff' }
              else if (isFlagged) { bg = 'var(--dp-orange-dim)'; color = 'var(--dp-orange)'; borderColor = 'rgba(247,168,67,0.3)' }
              else if (isAnswered) { bg = 'var(--dp-green-dim)'; color = 'var(--dp-green)'; borderColor = 'rgba(63,185,80,0.3)' }
              return (
                <button key={i}
                  className="dp-exam-cell"
                  style={{ background: bg, color, border: `1px solid ${borderColor}` }}
                  onClick={() => { setCurrent(i); setSidebarOpen(false) }}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ padding: '10px 12px', borderTop: '1px solid var(--dp-border-1)', flexShrink: 0 }}>
          <button onClick={submitExam} style={{
            width: '100%', padding: '9px', borderRadius: 'var(--dp-r-md)',
            background: answeredCount === questions.length ? 'var(--dp-green)' : 'var(--dp-bg-3)',
            color: answeredCount === questions.length ? '#fff' : 'var(--dp-text-2)',
            border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            transition: 'all var(--dp-dur-base)',
          }}>
            Submit Exam
          </button>
        </div>
      </div>

      {/* Main */}
      <main id="exam-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div className="study-toolbar">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 'var(--dp-r-md)', border: '1px solid var(--dp-border-1)', background: 'var(--dp-bg-2)', color: 'var(--dp-text-2)', cursor: 'pointer' }}>
            <Menu size={15} />
          </button>

          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dp-text-0)' }}>Q {current + 1}/{questions.length}</span>
          {q.difficulty && (
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 'var(--dp-r-full)', background: (DIFF_COLORS[q.difficulty] || { bg: 'var(--dp-bg-3)' }).bg, color: (DIFF_COLORS[q.difficulty] || { color: 'var(--dp-text-3)' }).color }}>
              {q.difficulty}
            </span>
          )}

          <div style={{ flex: 1 }} />

          {/* Timer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 'var(--dp-r-full)',
            background: timerDanger ? 'rgba(255,123,114,0.15)' : timerWarning ? 'rgba(247,168,67,0.12)' : 'var(--dp-bg-2)',
            border: `1px solid ${timerDanger ? 'rgba(255,123,114,0.3)' : timerWarning ? 'rgba(247,168,67,0.25)' : 'var(--dp-border-1)'}`,
          }}>
            <Timer size={12} style={{ color: timerDanger ? '#ff7b72' : timerWarning ? '#f7a843' : 'var(--dp-text-3)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: timerDanger ? '#ff7b72' : timerWarning ? '#f7a843' : 'var(--dp-text-0)' }}>
              {fmt(timeLeft)}
            </span>
          </div>

          <button
            onClick={() => setFlagged(prev => { const n = new Set(prev); n.has(current) ? n.delete(current) : n.add(current); return n })}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 'var(--dp-r-md)', border: `1px solid ${flagged.has(current) ? 'rgba(247,168,67,0.3)' : 'var(--dp-border-1)'}`, background: flagged.has(current) ? 'var(--dp-orange-dim)' : 'var(--dp-bg-2)', color: flagged.has(current) ? 'var(--dp-orange)' : 'var(--dp-text-2)', fontSize: 11.5, cursor: 'pointer', transition: 'all var(--dp-dur-fast)' }}
          >
            <Flag size={12} />{flagged.has(current) ? 'Flagged' : 'Flag'}
          </button>

          <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} className="study-toolbar-nav"><ChevronLeft size={13} /></button>
          <button onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))} disabled={current === questions.length - 1} className="study-toolbar-nav"><ChevronRight size={13} /></button>
        </div>

        {/* Question */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'var(--dp-glass-1)', border: '1px solid var(--dp-border-0)',
              borderRadius: 'var(--dp-r-xl)', padding: '22px 24px',
            }}>
              <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--dp-text-0)', lineHeight: 1.55, margin: 0 }}>
                {q.question}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(q.choices || []).map((choice) => {
                const isSelected = answers[current] === choice.id
                return (
                  <button
                    key={choice.id}
                    onClick={() => setAnswers(prev => ({ ...prev, [current]: choice.id }))}
                    style={{
                      width: '100%', textAlign: 'left', padding: '13px 16px',
                      borderRadius: 'var(--dp-r-lg)', cursor: 'pointer',
                      border: isSelected ? '2px solid var(--dp-blue)' : '1px solid var(--dp-border-0)',
                      background: isSelected ? 'var(--dp-blue-dim)' : 'var(--dp-glass-1)',
                      color: isSelected ? 'var(--dp-text-0)' : 'var(--dp-text-1)',
                      fontSize: 14, lineHeight: 1.5, fontWeight: isSelected ? 600 : 400,
                      transition: 'all var(--dp-dur-fast)',
                      boxShadow: isSelected ? '0 0 0 1px var(--dp-blue-dim)' : 'none',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', border: isSelected ? `2px solid var(--dp-blue)` : '1px solid var(--dp-border-0)', background: isSelected ? 'var(--dp-blue)' : 'transparent', color: isSelected ? '#fff' : 'var(--dp-text-3)', fontSize: 11, fontWeight: 700, marginRight: 10, flexShrink: 0 }}>
                      {choice.id}
                    </span>
                    {choice.text}
                  </button>
                )
              })}
            </div>

            {/* Bottom nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
              <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--dp-r-md)', border: '1px solid var(--dp-border-1)', background: 'var(--dp-bg-2)', color: 'var(--dp-text-2)', fontSize: 13, cursor: 'pointer', opacity: current === 0 ? 0.4 : 1 }}>
                <ChevronLeft size={14} /> Previous
              </button>

              {current < questions.length - 1 ? (
                <button onClick={() => setCurrent(c => c + 1)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--dp-r-md)', border: '1px solid var(--dp-blue-dim)', background: 'var(--dp-blue-dim)', color: 'var(--dp-blue)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Next <ChevronRight size={14} />
                </button>
              ) : (
                <button onClick={submitExam}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 'var(--dp-r-md)', border: 'none', background: 'var(--dp-green)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Submit Exam ✓
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
