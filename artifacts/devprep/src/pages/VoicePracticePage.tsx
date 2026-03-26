import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Mic,
  MicOff,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Star,
  Lightbulb,
  X,
  CheckCircle2,
  Gauge,
  ChevronDown,
  ChevronUp,
  Clock,
  RotateCcw,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  MessageSquare,
  Target,
  Zap,
  Headphones,
} from 'lucide-react'
import type { VoicePrompt } from '@/data/voicePractice'
import { progressApi } from '@/services/progressApi'

const DIFF_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: typeof Target }
> = {
  beginner: {
    label: 'Beginner',
    color: '#3fb950',
    bg: 'rgba(63,185,80,0.08)',
    border: 'rgba(63,185,80,0.2)',
    icon: Sparkles,
  },
  intermediate: {
    label: 'Intermediate',
    color: '#f7a843',
    bg: 'rgba(247,168,67,0.08)',
    border: 'rgba(247,168,67,0.2)',
    icon: Zap,
  },
  advanced: {
    label: 'Advanced',
    color: '#ff7b72',
    bg: 'rgba(255,123,114,0.08)',
    border: 'rgba(255,123,114,0.2)',
    icon: Target,
  },
}

type RecordPhase = 'idle' | 'countdown' | 'recording' | 'done'

interface VoicePracticePageProps {
  prompts: VoicePrompt[]
  channelId: string
  onVoicePractice?: (promptId: string, rating: number | null) => void
}

/* ── Circular Progress Ring ─────────────────────────────────────────── */
function CircularProgress({
  elapsed,
  max,
  phase,
}: {
  elapsed: number
  max: number
  phase: RecordPhase
}) {
  const radius = 44
  const stroke = 4
  const circ = 2 * Math.PI * radius
  const pct = Math.min(elapsed / max, 1)
  const dashOffset = circ * (1 - pct)

  const isWarning = elapsed >= max * 0.75
  const isDanger = elapsed >= max * 0.9
  const ringColor = isDanger ? '#ff7b72' : isWarning ? '#f7a843' : '#bc8cff'

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ position: 'relative', width: 104, height: 104 }}>
      <svg width={104} height={104} viewBox="0 0 104 104" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={52}
          cy={52}
          r={radius}
          fill="none"
          stroke="var(--dp-bg-3)"
          strokeWidth={stroke}
        />
        <circle
          cx={52}
          cy={52}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
        />
        {/* Gradient glow underneath */}
        <circle
          cx={52}
          cy={52}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={stroke + 6}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          opacity={0.15}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 24,
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            color: ringColor,
            lineHeight: 1,
            transition: 'color 0.3s ease',
          }}
        >
          {fmt(elapsed)}
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--dp-text-3)',
            marginTop: 2,
          }}
        >
          recording
        </span>
      </div>
    </div>
  )
}

/* ── Countdown Overlay ──────────────────────────────────────────────── */
function CountdownOverlay({ countdown }: { countdown: number }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '40px 0',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(188,140,255,0.12) 0%, transparent 70%)',
          animation: 'dp-pulse-ring 2s ease-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          fontSize: 100,
          fontWeight: 900,
          lineHeight: 1,
          background: 'linear-gradient(135deg, #bc8cff 0%, #388bfd 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'dp-bounce-in 0.4s var(--dp-ease-spring)',
          filter: 'drop-shadow(0 4px 20px rgba(188,140,255,0.3))',
        }}
      >
        {countdown}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--dp-text-2)',
          letterSpacing: '0.04em',
          opacity: 0.8,
        }}
      >
        Get ready to speak...
      </div>
    </div>
  )
}

/* ── Star Rating Button ─────────────────────────────────────────────── */
function StarButton({
  index,
  filled,
  onRate,
  hoverRating,
  onHover,
}: {
  index: number
  filled: boolean
  onRate: (n: number) => void
  hoverRating: number
  onHover: (n: number) => void
}) {
  const isActive = hoverRating ? index <= hoverRating : filled
  const size = 44

  return (
    <button
      onClick={() => onRate(index)}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(0)}
      aria-label={`Rate ${index} star${index > 1 ? 's' : ''}`}
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--dp-r-lg)',
        border: '1px solid',
        borderColor: isActive ? 'rgba(247,223,30,0.3)' : 'var(--dp-border-1)',
        background: isActive ? 'rgba(247,223,30,0.1)' : 'var(--dp-bg-2)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 150ms var(--dp-ease-spring)',
        transform: isActive ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      <Star
        size={20}
        style={{
          color: isActive ? '#f7df1e' : 'var(--dp-text-4)',
          fill: isActive ? '#f7df1e' : 'none',
          transition: 'all 150ms ease',
          filter: isActive ? 'drop-shadow(0 0 6px rgba(247,223,30,0.4))' : 'none',
        }}
      />
    </button>
  )
}

/* ── Key Points Accordion ───────────────────────────────────────────── */
function KeyPointsSection({
  points,
  isOpen,
  onToggle,
}: {
  points: string[]
  isOpen: boolean
  onToggle: () => void
}) {
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12.5,
          fontWeight: 600,
          color: isOpen ? 'var(--dp-blue)' : 'var(--dp-text-2)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: 'var(--dp-r-lg)',
          transition: 'all 150ms ease',
          ...(isOpen ? { background: 'var(--dp-blue-dim)' } : {}),
        }}
      >
        <Lightbulb size={13} style={{ color: '#f7df1e', flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left' }}>Key Points ({points.length})</span>
        <ChevronDown
          size={14}
          style={{
            transition: 'transform 200ms var(--dp-ease)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      <div
        ref={contentRef}
        style={{
          overflow: 'hidden',
          maxHeight: isOpen ? `${points.length * 48 + 16}px` : '0px',
          opacity: isOpen ? 1 : 0,
          transition: 'max-height 300ms var(--dp-ease), opacity 200ms ease',
        }}
      >
        <ul
          style={{
            margin: '8px 0 0',
            padding: '0 0 0 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {points.map((pt, i) => (
            <li
              key={i}
              style={{
                fontSize: 13,
                color: 'var(--dp-text-1)',
                lineHeight: 1.6,
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateY(0)' : 'translateY(8px)',
                transition: `opacity 250ms ease ${i * 50}ms, transform 250ms var(--dp-ease) ${i * 50}ms`,
              }}
            >
              {pt}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ── Browser Unsupported Banner ─────────────────────────────────────── */
function BrowserUnsupportedBanner() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '16px 20px',
        borderRadius: 'var(--dp-r-xl)',
        background: 'rgba(247,168,67,0.06)',
        border: '1px solid rgba(247,168,67,0.15)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--dp-r-lg)',
          background: 'rgba(247,168,67,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <AlertTriangle size={18} style={{ color: '#f7a843' }} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f7a843', marginBottom: 4 }}>
          Speech Recognition Unavailable
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--dp-text-2)', lineHeight: 1.5 }}>
          Your browser doesn't support live transcription. You can still practice with a timed
          session — use the microphone as a visual guide and self-rate when done.
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ───────────────────────────────────────────────────────── */
export function VoicePracticePage({ prompts, channelId, onVoicePractice }: VoicePracticePageProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [shuffle, setShuffle] = useState(false)
  const [order, setOrder] = useState<number[]>([])
  const [phase, setPhase] = useState<RecordPhase>('idle')
  const [countdown, setCountdown] = useState(3)
  const [elapsed, setElapsed] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [keyPointsOpen, setKeyPointsOpen] = useState(false)
  const [ratings, setRatings] = useState<Record<string, number>>(
    () => progressApi.loadSync().voice as Record<string, number>
  )
  const [srSupported, setSrSupported] = useState(true)
  const [promptTransition, setPromptTransition] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const cdRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    setRatings(progressApi.loadSync().voice as Record<string, number>)
  }, [channelId])

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setSrSupported(!!SR)
  }, [])

  useEffect(() => {
    setActiveIdx(0)
    setPhase('idle')
    setTranscript('')
    setRating(0)
    setKeyPointsOpen(false)
    setOrder(prompts.map((_, i) => i))
  }, [channelId, prompts])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (timerRef.current) clearInterval(timerRef.current)
      if (cdRef.current) clearInterval(cdRef.current)
      try {
        recognitionRef.current?.stop()
      } catch {}
    }
  }, [])

  const displayPrompts = order.map(i => prompts[i]).filter(Boolean)
  const active = displayPrompts[activeIdx]

  const go = useCallback(
    (dir: 1 | -1) => {
      setPromptTransition(true)
      setTimeout(() => {
        setActiveIdx(i => Math.max(0, Math.min(displayPrompts.length - 1, i + dir)))
        setPhase('idle')
        setTranscript('')
        setRating(0)
        setHoverRating(0)
        setKeyPointsOpen(false)
        setPromptTransition(false)
      }, 150)
    },
    [displayPrompts.length]
  )

  const doShuffle = () => {
    const arr = prompts.map((_, i) => i)
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    setOrder(arr)
    setActiveIdx(0)
    setPhase('idle')
    setTranscript('')
    setShuffle(true)
  }

  const startPractice = () => {
    setPhase('countdown')
    setCountdown(3)
    setTranscript('')
    setRating(0)
    setHoverRating(0)
    setElapsed(0)

    let cd = 3
    cdRef.current = setInterval(() => {
      cd--
      setCountdown(cd)
      if (cd <= 0) {
        clearInterval(cdRef.current!)
        setPhase('recording')

        let sec = 0
        timerRef.current = setInterval(() => {
          sec++
          setElapsed(sec)
          if (sec >= 120) {
            stopPractice()
          }
        }, 1000)

        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        if (SR) {
          const rec = new SR()
          recognitionRef.current = rec
          rec.continuous = true
          rec.interimResults = true
          rec.onresult = (e: any) => {
            let t = ''
            for (let i = e.resultIndex; i < e.results.length; i++) {
              t += e.results[i][0].transcript
            }
            if (isMountedRef.current) setTranscript(t)
          }
          try {
            rec.start()
          } catch {}
        }
      }
    }, 1000)
  }

  const stopPractice = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (cdRef.current) clearInterval(cdRef.current)
    try {
      recognitionRef.current?.stop()
    } catch {}
    setPhase('done')
  }

  const handleRate = (r: number) => {
    setRating(r)
    if (active) {
      setRatings(prev => ({ ...prev, [active.id]: r }))
      onVoicePractice?.(active.id, r)
      progressApi.saveVoice(channelId, active.id, r)
    }
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const diff = DIFF_CONFIG[active?.difficulty ?? ''] ?? DIFF_CONFIG.beginner
  const DiffIcon = diff.icon

  /* ── Empty state ─────────────────────────────────────── */
  if (prompts.length === 0) {
    return (
      <div className="dp-empty">
        <div className="dp-empty-icon">
          <Mic size={24} />
        </div>
        <div className="dp-empty-title">No voice prompts</div>
        <div className="dp-empty-desc">Switch to a different channel to practice speaking.</div>
      </div>
    )
  }

  /* ── Recording progress ──────────────────────────────── */
  const maxTime = active?.timeLimit ?? 120

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Top toolbar ─────────────────────────────────── */}
      <div className="study-toolbar" style={{ gap: 8 }}>
        <button
          onClick={
            shuffle
              ? () => {
                  setShuffle(false)
                  setOrder(prompts.map((_, i) => i))
                }
              : doShuffle
          }
          className={`study-toolbar-btn${shuffle ? ' study-toolbar-btn--active' : ''}`}
          style={{ gap: 5 }}
        >
          <Shuffle size={12} />
          <span>{shuffle ? 'Shuffled' : 'Shuffle'}</span>
        </button>

        <div style={{ flex: 1 }} />

        {/* Prompt counter pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 'var(--dp-r-full)',
            background: 'var(--dp-bg-3)',
            fontSize: 11.5,
            fontWeight: 600,
            color: 'var(--dp-text-2)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <MessageSquare size={11} style={{ color: 'var(--dp-text-4)' }} />
          <span>
            {activeIdx + 1} / {displayPrompts.length}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 2 }}>
          <button
            onClick={() => go(-1)}
            disabled={activeIdx === 0}
            className="study-toolbar-nav"
            aria-label="Previous prompt"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={() => go(1)}
            disabled={activeIdx === displayPrompts.length - 1}
            className="study-toolbar-nav"
            aria-label="Next prompt"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 32px' }}>
        <div
          style={{
            maxWidth: 640,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            opacity: promptTransition ? 0 : 1,
            transform: promptTransition ? 'translateY(8px)' : 'translateY(0)',
            transition: 'opacity 150ms ease, transform 150ms var(--dp-ease)',
          }}
        >
          {/* ── Browser unsupported notice ──────────────── */}
          {!srSupported && phase !== 'countdown' && <BrowserUnsupportedBanner />}

          {/* ── Prompt card ─────────────────────────────── */}
          <div
            style={{
              background: 'var(--dp-glass-1)',
              border: '1px solid var(--dp-border-0)',
              borderRadius: 'var(--dp-r-xl)',
              padding: '22px 24px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Ambient glow during recording */}
            {phase === 'recording' && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle, rgba(188,140,255,0.1) 0%, transparent 70%)',
                    pointerEvents: 'none',
                    animation: 'dp-pulse-ring 3s ease-out infinite',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: -30,
                    left: -30,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle, rgba(56,139,253,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none',
                    animation: 'dp-pulse-ring 3s 1s ease-out infinite',
                  }}
                />
              </>
            )}

            {/* Meta row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 10.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  padding: '3px 10px',
                  borderRadius: 'var(--dp-r-full)',
                  background: diff.bg,
                  color: diff.color,
                  border: `1px solid ${diff.border}`,
                }}
              >
                <DiffIcon size={10} />
                {diff.label}
              </span>

              {active?.domain && (
                <span
                  style={{
                    fontSize: 10.5,
                    color: 'var(--dp-text-3)',
                    padding: '3px 10px',
                    borderRadius: 'var(--dp-r-full)',
                    background: 'var(--dp-bg-3)',
                    fontWeight: 500,
                  }}
                >
                  {active.domain}
                </span>
              )}

              {active?.timeLimit && (
                <span
                  style={{
                    fontSize: 10.5,
                    color: 'var(--dp-text-3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    marginLeft: 'auto',
                  }}
                >
                  <Clock size={10} />
                  {active.timeLimit}s target
                </span>
              )}

              {active && ratings[active.id] !== undefined && (
                <div
                  style={{
                    display: 'flex',
                    gap: 1,
                    marginLeft: active?.timeLimit ? 0 : 'auto',
                  }}
                >
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={11}
                      style={{
                        color: ratings[active.id] >= s ? '#f7df1e' : 'var(--dp-text-4)',
                        fill: ratings[active.id] >= s ? '#f7df1e' : 'none',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Prompt text */}
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--dp-text-0)',
                lineHeight: 1.5,
                margin: '0 0 14px',
                letterSpacing: '-0.01em',
              }}
            >
              {active?.prompt}
            </h2>

            {/* Type badge */}
            <div style={{ marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 10.5,
                  padding: '3px 10px',
                  borderRadius: 'var(--dp-r-full)',
                  background: 'var(--dp-blue-dim)',
                  color: 'var(--dp-blue)',
                  border: '1px solid rgba(56,139,253,0.15)',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              >
                {active?.type}
              </span>
            </div>

            {/* Key points accordion */}
            {active?.keyPoints && active.keyPoints.length > 0 && (
              <KeyPointsSection
                points={active.keyPoints}
                isOpen={keyPointsOpen}
                onToggle={() => setKeyPointsOpen(v => !v)}
              />
            )}
          </div>

          {/* ── Recording zone ──────────────────────────── */}
          <div
            style={{
              background: 'var(--dp-glass-1)',
              border: '1px solid var(--dp-border-0)',
              borderRadius: 'var(--dp-r-xl)',
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              position: 'relative',
              overflow: 'hidden',
              minHeight: phase === 'recording' ? 280 : 'auto',
              transition: 'min-height 300ms var(--dp-ease)',
            }}
          >
            {/* Background gradient during recording */}
            {phase === 'recording' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(ellipse at center bottom, rgba(188,140,255,0.04) 0%, transparent 60%)',
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* ── Countdown ────────────────────────────── */}
            {phase === 'countdown' && <CountdownOverlay countdown={countdown} />}

            {/* ── Idle / Recording / Done ──────────────── */}
            {phase !== 'countdown' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 20,
                  width: '100%',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {/* Mic button or Timer ring */}
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Pulse rings when recording */}
                  {phase === 'recording' && (
                    <>
                      <div
                        style={{
                          position: 'absolute',
                          width: 120,
                          height: 120,
                          borderRadius: '50%',
                          border: '2px solid rgba(188,140,255,0.2)',
                          animation: 'dp-pulse-ring 1.5s ease-out infinite',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          width: 96,
                          height: 96,
                          borderRadius: '50%',
                          border: '2px solid rgba(188,140,255,0.3)',
                          animation: 'dp-pulse-ring 1.5s 0.5s ease-out infinite',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          width: 144,
                          height: 144,
                          borderRadius: '50%',
                          border: '1px solid rgba(56,139,253,0.1)',
                          animation: 'dp-pulse-ring 2s 1s ease-out infinite',
                        }}
                      />
                    </>
                  )}

                  {phase === 'recording' ? (
                    /* Circular timer */
                    <CircularProgress elapsed={elapsed} max={maxTime} phase={phase} />
                  ) : (
                    /* Mic button */
                    <button
                      onClick={phase === 'idle' ? startPractice : undefined}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        border: 'none',
                        cursor: phase === 'done' ? 'default' : 'pointer',
                        background:
                          phase === 'done'
                            ? 'linear-gradient(135deg, #3fb950, #2ea043)'
                            : 'linear-gradient(135deg, #388bfd 0%, #bc8cff 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow:
                          phase === 'done'
                            ? '0 0 24px rgba(63,185,80,0.3), 0 8px 24px rgba(0,0,0,0.2)'
                            : '0 0 24px rgba(56,139,253,0.3), 0 8px 24px rgba(0,0,0,0.2)',
                        transition: 'all 250ms var(--dp-ease-spring)',
                        position: 'relative',
                        zIndex: 1,
                      }}
                      aria-label={phase === 'idle' ? 'Start recording' : 'Done'}
                    >
                      {phase === 'done' ? (
                        <CheckCircle2 size={28} color="#fff" strokeWidth={2.5} />
                      ) : (
                        <Mic size={28} color="#fff" strokeWidth={2.5} />
                      )}
                    </button>
                  )}
                </div>

                {/* ── Status text ─────────────────────── */}
                {phase === 'idle' && (
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: 'var(--dp-text-1)',
                        marginBottom: 6,
                      }}
                    >
                      Ready to practice
                    </div>
                    <div
                      style={{
                        fontSize: 12.5,
                        color: 'var(--dp-text-3)',
                        lineHeight: 1.5,
                      }}
                    >
                      {srSupported
                        ? 'Tap the microphone to begin — your speech will be transcribed live'
                        : 'Tap to start your timed practice session'}
                    </div>
                  </div>
                )}

                {phase === 'recording' && (
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    {/* Animated waveform */}
                    <div className="dp-waveform dp-waveform--active" style={{ marginBottom: 16 }}>
                      {[30, 50, 80, 40, 90, 50, 20, 40, 70, 30, 60, 45].map((h, i) => (
                        <div
                          key={i}
                          className="dp-waveform-bar"
                          style={{
                            height: `${h}%`,
                            animationDelay: `${i * 0.06}s`,
                            background:
                              i % 3 === 2
                                ? 'var(--dp-purple)'
                                : 'linear-gradient(to top, var(--dp-blue), rgba(188,140,255,0.6))',
                          }}
                        />
                      ))}
                    </div>

                    {/* Live transcript */}
                    {transcript ? (
                      <div
                        style={{
                          padding: '14px 16px',
                          borderRadius: 'var(--dp-r-lg)',
                          background: 'var(--dp-bg-2)',
                          border: '1px solid var(--dp-border-1)',
                          fontSize: 13.5,
                          color: 'var(--dp-text-1)',
                          lineHeight: 1.6,
                          textAlign: 'left',
                          maxHeight: 120,
                          overflowY: 'auto',
                          position: 'relative',
                        }}
                      >
                        {/* Blinking cursor indicator */}
                        <span
                          style={{
                            display: 'inline-block',
                            width: 2,
                            height: 14,
                            background: 'var(--dp-purple)',
                            borderRadius: 1,
                            marginLeft: 2,
                            verticalAlign: 'text-bottom',
                            animation: 'glass-loading-pulse 1s ease-in-out infinite',
                          }}
                        />{' '}
                        {transcript}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '14px 16px',
                          borderRadius: 'var(--dp-r-lg)',
                          background: 'var(--dp-bg-2)',
                          border: '1px dashed var(--dp-border-1)',
                          fontSize: 12.5,
                          color: 'var(--dp-text-4)',
                          fontStyle: 'italic',
                        }}
                      >
                        Listening for speech...
                      </div>
                    )}

                    {/* Stop button */}
                    <button
                      onClick={stopPractice}
                      style={{
                        marginTop: 16,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '10px 22px',
                        borderRadius: 'var(--dp-r-full)',
                        border: '1px solid rgba(255,123,114,0.2)',
                        background: 'rgba(255,123,114,0.08)',
                        color: '#ff7b72',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 150ms ease',
                      }}
                      aria-label="Stop recording"
                    >
                      <MicOff size={14} />
                      <span>Stop Recording</span>
                    </button>
                  </div>
                )}

                {phase === 'done' && (
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    {/* Completion header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        marginBottom: 20,
                      }}
                    >
                      <CheckCircle2 size={18} style={{ color: '#3fb950' }} />
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#3fb950',
                        }}
                      >
                        Practice complete
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--dp-text-3)',
                          fontWeight: 500,
                        }}
                      >
                        · {fmt(elapsed)} recorded
                      </span>
                    </div>

                    {/* Transcript card */}
                    {transcript && (
                      <div
                        style={{
                          marginBottom: 20,
                          textAlign: 'left',
                          background: 'var(--dp-bg-2)',
                          border: '1px solid var(--dp-border-1)',
                          borderRadius: 'var(--dp-r-lg)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            padding: '10px 14px',
                            borderBottom: '1px solid var(--dp-border-1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Headphones size={12} style={{ color: 'var(--dp-text-4)' }} />
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.07em',
                              color: 'var(--dp-text-3)',
                            }}
                          >
                            Your Response
                          </span>
                        </div>
                        <div
                          style={{
                            padding: '14px 16px',
                            fontSize: 13.5,
                            color: 'var(--dp-text-1)',
                            lineHeight: 1.65,
                            maxHeight: 120,
                            overflowY: 'auto',
                          }}
                        >
                          {transcript}
                        </div>
                      </div>
                    )}

                    {/* Rating */}
                    <div style={{ marginBottom: 24 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--dp-text-2)',
                          marginBottom: 12,
                        }}
                      >
                        How did you do?
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 6,
                          justifyContent: 'center',
                        }}
                      >
                        {[1, 2, 3, 4, 5].map(r => (
                          <StarButton
                            key={r}
                            index={r}
                            filled={rating >= r}
                            onRate={handleRate}
                            hoverRating={hoverRating}
                            onHover={setHoverRating}
                          />
                        ))}
                      </div>
                      {rating > 0 && (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: 'var(--dp-text-3)',
                            animation: 'glass-fade-in 200ms ease forwards',
                          }}
                        >
                          {rating <= 2
                            ? 'Keep practicing!'
                            : rating === 3
                              ? 'Good effort!'
                              : rating === 4
                                ? 'Great job!'
                                : 'Outstanding!'}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        onClick={() => {
                          setPhase('idle')
                          setTranscript('')
                          setRating(0)
                          setHoverRating(0)
                          setElapsed(0)
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 7,
                          padding: '10px 20px',
                          borderRadius: 'var(--dp-r-full)',
                          border: '1px solid var(--dp-border-0)',
                          background: 'var(--dp-bg-3)',
                          color: 'var(--dp-text-1)',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 150ms ease',
                        }}
                      >
                        <RotateCcw size={14} />
                        <span>Try Again</span>
                      </button>
                      {activeIdx < displayPrompts.length - 1 && (
                        <button
                          onClick={() => go(1)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 7,
                            padding: '10px 20px',
                            borderRadius: 'var(--dp-r-full)',
                            border: 'none',
                            background: 'linear-gradient(135deg, #388bfd, #bc8cff)',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(56,139,253,0.25)',
                            transition: 'all 150ms ease',
                          }}
                        >
                          <span>Next Prompt</span>
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Follow-up question ──────────────────────── */}
          {active?.followUp && phase !== 'recording' && phase !== 'countdown' && (
            <div
              style={{
                background: 'var(--dp-glass-1)',
                border: '1px solid var(--dp-border-0)',
                borderRadius: 'var(--dp-r-xl)',
                padding: '16px 20px',
                animation: 'glass-fade-in-up 300ms var(--dp-ease) forwards',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 'var(--dp-r-md)',
                    background: 'var(--dp-blue-dim)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={12} style={{ color: 'var(--dp-blue)' }} />
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--dp-text-3)',
                  }}
                >
                  Follow-up Question
                </span>
              </div>
              <p
                style={{
                  fontSize: 13.5,
                  color: 'var(--dp-text-1)',
                  lineHeight: 1.65,
                  margin: 0,
                  fontStyle: 'italic',
                  paddingLeft: 32,
                }}
              >
                "{active.followUp}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
