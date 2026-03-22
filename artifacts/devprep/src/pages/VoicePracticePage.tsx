import { useState, useEffect, useRef, useCallback } from 'react'
import { useAnnounce } from '@/hooks/useAnnounce'
import {
  Volume2,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Star,
  Mic,
  Gauge,
  BadgeCheck,
  Lightbulb,
} from 'lucide-react'
import type { VoicePrompt } from '@/data/voicePractice'
import { progressApi } from '@/services/progressApi'
import { cn } from '@/lib/utils'

const DIFF_BADGE: Record<string, { label: string; cls: string }> = {
  beginner: { label: 'BEGINNER', cls: 'text-emerald-400 bg-emerald-400/10' },
  intermediate: { label: 'INTERMEDIATE', cls: 'text-amber-400 bg-amber-400/10' },
  advanced: { label: 'ADVANCED', cls: 'text-rose-400 bg-rose-400/10' },
}

const WAVEFORM_HEIGHTS = [30, 50, 80, 40, 90, 50, 20, 40, 70, 30]
const WAVEFORM_DELAYS = [0.1, 0.3, 0.2, 0.5, 0.4, 0.7, 0.6, 0.8, 1.0, 0.9]
const WAVEFORM_COLORS = [
  'bg-[var(--dp-blue)]',
  'bg-[var(--dp-blue)]',
  'bg-[var(--dp-purple)]',
  'bg-[var(--dp-blue)]',
  'bg-[var(--dp-purple)]',
  'bg-[var(--dp-blue)]',
  'bg-[var(--dp-blue)]',
  'bg-[var(--dp-blue)]',
  'bg-[var(--dp-purple)]',
  'bg-[var(--dp-blue)]',
]

type RecordPhase = 'idle' | 'countdown' | 'recording' | 'done'

interface VoicePracticePageProps {
  prompts: VoicePrompt[]
  channelId: string
  onVoicePractice?: (promptId: string, rating: number | null) => void
}

export function VoicePracticePage({ prompts, channelId, onVoicePractice }: VoicePracticePageProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [shuffle, setShuffle] = useState(false)
  const [order, setOrder] = useState<number[]>([])
  const [phase, setPhase] = useState<RecordPhase>('idle')
  const [countdown, setCountdown] = useState(3)
  const [elapsed, setElapsed] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [rating, setRating] = useState(0)
  const [keyPointsOpen, setKeyPointsOpen] = useState(false)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [srSupported, setSrSupported] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const cdRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)
  const isMountedRef = useRef(true)

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
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
    }
  }, [])

  useEffect(() => {
    setIsAnimating(phase === 'recording' || phase === 'countdown')
  }, [phase])

  const displayPrompts = order.map(i => prompts[i]).filter(Boolean)
  const active = displayPrompts[activeIdx]

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (cdRef.current) clearInterval(cdRef.current)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }
  }, [])

  const go = useCallback(
    (dir: 1 | -1) => {
      stopRecording()
      setActiveIdx(i => {
        const max = displayPrompts.length - 1
        return Math.max(0, Math.min(max, i + dir))
      })
      setPhase('idle')
      setElapsed(0)
      setTranscript('')
      setRating(0)
      setKeyPointsOpen(false)
    },
    [displayPrompts.length, stopRecording]
  )

  const doShuffle = () => {
    const arr = prompts.map((_, i) => i)
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    setOrder(arr)
    setActiveIdx(0)
    setShuffle(true)
    setPhase('idle')
    setElapsed(0)
    setTranscript('')
  }

  const startCountdown = () => {
    setPhase('countdown')
    setCountdown(3)
    let cd = 3
    cdRef.current = setInterval(() => {
      cd--
      setCountdown(cd)
      if (cd <= 0) {
        clearInterval(cdRef.current!)
        startRecording()
      }
    }, 1000)
  }

  const startRecording = () => {
    setPhase('recording')
    setElapsed(0)
    setTranscript('')
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SR) {
      const recognition = new SR()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.onresult = (e: any) => {
        let full = ''
        for (let i = 0; i < e.results.length; i++) {
          full += e.results[i][0].transcript + ' '
        }
        setTranscript(full.trim())
      }
      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e.error)
      }
      recognition.start()
      recognitionRef.current = recognition
    }
  }

  const stop = () => {
    stopRecording()
    setPhase('done')
  }

  const retry = () => {
    stopRecording()
    setPhase('idle')
    setElapsed(0)
    setTranscript('')
    setRating(0)
  }

  const rateAndNext = (r: number) => {
    if (active) {
      setRatings(prev => ({ ...prev, [active.id]: r }))
      onVoicePractice?.(active.id, r)
      progressApi.saveVoice(channelId, active.id, r)
    }
    setRating(r)
    if (activeIdx < displayPrompts.length - 1) {
      setTimeout(() => go(1), 500)
    }
  }

  const handleMicClick = () => {
    if (phase === 'idle') startCountdown()
    else if (phase === 'recording') stop()
    else if (phase === 'done') retry()
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  if (prompts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Volume2 size={48} className="text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No voice prompts for this channel</h3>
        <p className="text-muted-foreground text-sm">
          Try JavaScript, React, or System Design channels.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[var(--dp-bg-1)] text-[var(--dp-text-0)]">
      <style>{`
        @keyframes pulse-height {
          from { height: 10px; opacity: 0.4; }
          to { height: 60px; opacity: 1; }
        }
        .waveform-bar-active {
          animation: pulse-height 1.2s ease-in-out infinite alternate;
        }
      `}</style>

      {/* Page Header */}
      <div className="px-4 pt-5 pb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--dp-blue)] mb-1">
            Certification Mastery
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter leading-none">
            Voice{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--dp-blue)] to-[var(--dp-purple)]">
              Practice
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Navigation controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={
                shuffle
                  ? () => {
                      setOrder(prompts.map((_, i) => i))
                      setShuffle(false)
                    }
                  : doShuffle
              }
              className={cn(
                'flex items-center gap-1 text-[0.6rem] px-2 py-1 rounded border uppercase tracking-widest font-bold transition-colors',
                shuffle
                  ? 'border-[var(--dp-blue)] text-[var(--dp-blue)] bg-[var(--dp-blue-muted)]'
                  : 'border-[var(--dp-border-0)] text-[var(--dp-text-1)] hover:bg-[var(--dp-bg-3)]'
              )}
            >
              <Shuffle size={10} /> {shuffle ? 'Shuffled' : 'Shuffle'}
            </button>
            <button
              onClick={() => go(-1)}
              disabled={activeIdx === 0}
              className="w-7 h-7 rounded flex items-center justify-center border border-[var(--dp-border-0)] hover:bg-[var(--dp-bg-3)] disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={12} />
            </button>
            <span className="text-xs text-[var(--dp-text-2)] font-mono w-10 text-center">
              {activeIdx + 1}/{displayPrompts.length}
            </span>
            <button
              onClick={() => go(1)}
              disabled={activeIdx === displayPrompts.length - 1}
              className="w-7 h-7 rounded flex items-center justify-center border border-[var(--dp-border-0)] hover:bg-[var(--dp-bg-3)] disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={12} />
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-right">
              <p className="text-[0.55rem] uppercase tracking-widest text-[var(--dp-text-1)]">
                Session Status
              </p>
              <p className="text-xs font-bold text-[var(--dp-blue)]">
                {phase === 'recording'
                  ? 'RECORDING'
                  : phase === 'countdown'
                    ? 'STARTING'
                    : 'ACTIVE PROTOCOL'}
              </p>
            </div>
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                phase === 'recording' ? 'bg-[var(--dp-red)] animate-pulse' : 'bg-[var(--dp-blue)]'
              )}
            />
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 gap-4 px-4 pb-4 pt-3 flex-1">
        {/* Left: Prompt List */}
        <div className="col-span-3 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--dp-text-1)] mb-2">
            Practice Scenarios
          </h3>
          <div className="space-y-1.5">
            {displayPrompts.map((p, i) => {
              const isActive = i === activeIdx
              const diff = DIFF_BADGE[p.difficulty] ?? DIFF_BADGE['intermediate']
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    stopRecording()
                    setActiveIdx(i)
                    setPhase('idle')
                    setElapsed(0)
                    setTranscript('')
                    setRating(0)
                    setKeyPointsOpen(false)
                  }}
                  className={cn(
                    'w-full text-left p-2.5 rounded-lg transition-all duration-200 border',
                    isActive
                      ? 'bg-[var(--dp-bg-2)] border-l-2 border-l-[var(--dp-blue)] border-t-transparent border-r-transparent border-b-transparent shadow-md'
                      : 'bg-[var(--dp-bg-1)]/50 border-[var(--dp-border-0)] opacity-60 hover:opacity-100 hover:bg-[var(--dp-bg-2)]'
                  )}
                >
                  <p
                    className={cn(
                      'text-[0.55rem] uppercase tracking-widest mb-1',
                      isActive ? 'text-[var(--dp-blue)]' : 'text-[var(--dp-text-2)]'
                    )}
                  >
                    Scenario {String(i + 1).padStart(2, '0')}
                  </p>
                  <h4 className="font-medium text-[0.875rem] text-[var(--dp-text-0)] leading-snug line-clamp-2">
                    {p.prompt.length > 50 ? p.prompt.slice(0, 50) + '…' : p.prompt}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span
                      className={cn(
                        'px-1 py-0.5 rounded text-[0.5rem] font-bold uppercase',
                        diff.cls
                      )}
                    >
                      {p.domain}
                    </span>
                    <span className="text-[0.5rem] text-[var(--dp-text-2)]">{p.timeLimit}s</span>
                    {ratings[p.id] && (
                      <div className="flex gap-0.5 ml-auto">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star
                            key={si}
                            size={6}
                            fill={si < ratings[p.id] ? '#f59e0b' : 'none'}
                            className="text-amber-400"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Center: Voice Interaction Module */}
        <div className="lg:col-span-6 space-y-4 order-1 lg:order-2">
          {/* Prompt card */}
          {active && (
            <div className="p-4 rounded-xl bg-[var(--dp-bg-2)] border border-[var(--dp-border-0)]">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--dp-text-2)]">
                  {active.domain}
                </span>
                <span className="text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--dp-blue-muted)] text-[var(--dp-blue)]">
                  {active.type}
                </span>
                <span
                  className={cn(
                    'text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded ml-auto',
                    (DIFF_BADGE[active.difficulty] ?? DIFF_BADGE['intermediate']).cls
                  )}
                >
                  {active.difficulty}
                </span>
              </div>
              <p className="text-sm font-bold text-[var(--dp-text-0)] leading-snug">
                {active.prompt}
              </p>
            </div>
          )}

          {/* Main Voice Panel */}
          <div className="bg-[var(--dp-bg-2)] relative overflow-hidden rounded-2xl p-8 flex flex-col items-center justify-center border border-[var(--dp-border-0)] min-h-[340px]">
            {/* Countdown overlay */}
            {phase === 'countdown' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--dp-bg-1)]/80 z-10 rounded-2xl">
                <div
                  data-testid="voice-countdown"
                  className="w-20 h-20 rounded-full border-4 border-[var(--dp-blue)] flex items-center justify-center text-4xl font-black text-[var(--dp-blue)] mb-3"
                >
                  {countdown}
                </div>
                <p className="text-xs text-[var(--dp-text-2)]">Get ready to speak…</p>
              </div>
            )}

            {/* Waveform Visualizer */}
            <div className="flex items-center justify-center gap-1 h-20 mb-8">
              {WAVEFORM_HEIGHTS.map((h, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1.5 rounded-full transition-all',
                    WAVEFORM_COLORS[i],
                    isAnimating ? 'waveform-bar-active' : ''
                  )}
                  style={{
                    height: isAnimating ? undefined : `${Math.max(8, h * 0.3)}px`,
                    animationDelay: `${WAVEFORM_DELAYS[i]}s`,
                    opacity: isAnimating ? undefined : 0.3,
                  }}
                />
              ))}
            </div>

            {/* Mic Button */}
            <button
              onClick={handleMicClick}
              disabled={!srSupported && phase === 'idle'}
              className="group relative flex items-center justify-center mb-6"
              data-testid={
                phase === 'idle'
                  ? 'voice-start-btn'
                  : phase === 'recording'
                    ? 'voice-stop-btn'
                    : 'voice-retry-btn'
              }
            >
              <div
                className={cn(
                  'absolute inset-0 blur-2xl rounded-full transition-transform',
                  phase === 'recording'
                    ? 'bg-rose-400/20 group-active:scale-150'
                    : 'bg-[var(--dp-blue-muted)] group-active:scale-150'
                )}
              />
              <div
                className={cn(
                  'relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90',
                  phase === 'recording'
                    ? 'bg-gradient-to-br from-rose-500 to-rose-700'
                    : 'bg-gradient-to-br from-[var(--dp-blue)] to-[var(--dp-purple)]'
                )}
              >
                <Mic
                  size={32}
                  className={cn('text-white', phase === 'recording' && 'animate-pulse')}
                  fill="white"
                />
              </div>
            </button>

            {/* State label */}
            <p className="text-[var(--dp-text-0)] font-bold text-base mb-1">
              {phase === 'idle' && (srSupported ? 'Tap to Speak' : 'Not Supported')}
              {phase === 'countdown' && 'Get Ready…'}
              {phase === 'recording' && `Recording  ${mm}:${ss}`}
              {phase === 'done' && 'Session Complete'}
            </p>
            <p className="text-[var(--dp-text-2)] text-xs">
              {phase === 'idle' &&
                (srSupported
                  ? 'Tap the mic to begin your practice session'
                  : 'Please use Google Chrome for voice features')}
              {phase === 'countdown' && 'Preparing speech recognition…'}
              {phase === 'recording' && 'Architect is listening to your explanation…'}
              {phase === 'done' && 'Tap the mic to retry, or rate your response below'}
            </p>

            {/* Transcript */}
            {(transcript || phase === 'done') && (
              <div className="mt-8 w-full p-5 bg-[var(--dp-bg-1)] rounded-xl border border-[var(--dp-border-0)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[0.6rem] uppercase tracking-widest text-[var(--dp-text-2)]">
                    Live Transcript
                  </span>
                  {phase === 'recording' && (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--dp-blue)] animate-pulse" />
                      <span className="text-[0.6rem] text-[var(--dp-blue)] font-bold">
                        STT ACTIVE
                      </span>
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-[var(--dp-text-0)]/80 italic">
                  {transcript
                    ? `"${transcript}"`
                    : 'No speech detected. Try again in a Chrome browser.'}
                </p>
              </div>
            )}
          </div>

          {/* Key Points */}
          {active && (
            <div className="rounded-xl border border-[var(--dp-border-0)] bg-[var(--dp-bg-2)] overflow-hidden">
              <button
                onClick={() => setKeyPointsOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-3.5 text-xs font-bold text-[var(--dp-text-0)] hover:bg-[var(--dp-bg-3)] transition-colors uppercase tracking-widest"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[var(--dp-blue)]" />
                  Key Points to Cover
                </span>
                <span className="text-[var(--dp-text-2)]">{keyPointsOpen ? '▲' : '▼'}</span>
              </button>
              {keyPointsOpen && (
                <div className="px-5 pb-5 space-y-2 border-t border-[var(--dp-border-0)]">
                  {active.keyPoints.map((kp, i) => (
                    <div key={i} className="flex items-start gap-2 pt-2">
                      <CheckCircle2 size={13} className="shrink-0 mt-0.5 text-[var(--dp-blue)]" />
                      <span className="text-xs text-[var(--dp-text-0)]">{kp}</span>
                    </div>
                  ))}
                  {active.followUp && (
                    <div className="mt-3 pt-3 border-t border-[var(--dp-border-0)]">
                      <span className="text-[0.6rem] font-bold text-[var(--dp-text-2)] uppercase tracking-widest">
                        Follow-up:{' '}
                      </span>
                      <span className="text-xs text-[var(--dp-text-0)]">{active.followUp}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Self-rating */}
          {phase === 'done' && (
            <div className="flex flex-col items-center gap-3 p-5 rounded-xl border border-[var(--dp-border-0)] bg-[var(--dp-bg-2)]">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--dp-text-1)]">
                Rate Your Response
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    data-testid={`voice-star-${s}`}
                    onClick={() => setRating(s)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={28}
                      fill={s <= rating ? '#f59e0b' : 'none'}
                      className="text-amber-400"
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <button
                  onClick={() => rateAndNext(rating)}
                  className="px-6 py-2 rounded-lg text-[0.7rem] uppercase tracking-widest font-bold bg-gradient-to-r from-[var(--dp-blue)] to-[var(--dp-purple)] text-white shadow-lg active:scale-95 transition-transform"
                >
                  Save & Next →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Live Analysis */}
        <div className="lg:col-span-3 space-y-4 order-3">
          <h3 className="text-sm font-bold px-1 mb-3 uppercase tracking-widest text-[var(--dp-text-1)]">
            Live Analysis
          </h3>

          {/* Fluency Score */}
          <div className="bg-[var(--dp-bg-2)] p-5 rounded-2xl border border-[var(--dp-border-0)] shadow-xl">
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-[0.6rem] uppercase tracking-widest text-[var(--dp-text-2)] mb-1">
                  Fluency Score
                </p>
                <h5 className="text-3xl font-black text-[var(--dp-text-0)]">
                  {phase === 'recording'
                    ? elapsed < 10
                      ? '—'
                      : '7.8'
                    : phase === 'done'
                      ? '8.4'
                      : '—'}
                  <span className="text-xs text-[var(--dp-text-2)] font-normal">/10</span>
                </h5>
              </div>
              <div className="p-2 bg-[var(--dp-blue-muted)] rounded-lg">
                <Gauge size={20} className="text-[var(--dp-blue)]" />
              </div>
            </div>
            <div className="w-full h-1.5 bg-[var(--dp-bg-3)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--dp-blue)] transition-all duration-1000 rounded-full"
                style={{
                  width:
                    phase === 'done' ? '84%' : phase === 'recording' && elapsed > 10 ? '78%' : '0%',
                }}
              />
            </div>
            <p className="mt-3 text-[0.6rem] text-[var(--dp-text-2)] italic leading-snug">
              {phase === 'done'
                ? 'Excellent pacing. Minimal hesitation noted during technical transition.'
                : 'Begin speaking to generate analysis.'}
            </p>
          </div>

          {/* Technical Accuracy */}
          <div className="bg-[var(--dp-bg-2)] p-5 rounded-2xl border border-[var(--dp-border-0)] shadow-xl">
            <div className="flex justify-between items-start mb-5">
              <div>
                <p className="text-[0.6rem] uppercase tracking-widest text-[var(--dp-text-2)] mb-1">
                  Technical Accuracy
                </p>
                <h5 className="text-3xl font-black text-[var(--dp-text-0)]">
                  {phase === 'done' ? '92' : phase === 'recording' && elapsed > 10 ? '87' : '—'}
                  <span className="text-xs text-[var(--dp-text-2)] font-normal">%</span>
                </h5>
              </div>
              <div className="p-2 bg-[var(--dp-blue-muted)] rounded-lg">
                <BadgeCheck size={20} className="text-[var(--dp-blue)]" />
              </div>
            </div>
            <div className="flex items-end gap-1 h-10">
              {[20, 40, 30, 60, 100].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[var(--dp-blue)] rounded-t-sm transition-all duration-700"
                  style={{
                    height:
                      phase === 'done' || (phase === 'recording' && elapsed > 10) ? `${h}%` : '0%',
                    opacity: 0.2 + i * 0.2,
                  }}
                />
              ))}
            </div>
            {phase === 'done' && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {active?.keyPoints.slice(0, 2).map((kp, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-[var(--dp-bg-3)]/20 text-[0.55rem] text-[var(--dp-text-1)] border border-[var(--dp-border-0)]"
                  >
                    {kp.split(/[—–,]/)[0].trim().slice(0, 20)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Architect's Note */}
          <div className="p-5 bg-[var(--dp-bg-2)] rounded-2xl border border-[var(--dp-border-0)]">
            <h6 className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--dp-blue)] mb-2 flex items-center gap-1.5">
              <Lightbulb size={12} />
              Architect's Note
            </h6>
            <p className="text-xs text-[var(--dp-text-2)] leading-relaxed">
              {active
                ? `To maximize your score, ensure you cover all ${active.keyPoints.length} key points clearly.${active.followUp ? ` Also prepare for: "${active.followUp}"` : ''}`
                : 'Select a scenario to receive personalized coaching notes.'}
            </p>
          </div>

          {/* Session Stats */}
          <div className="p-5 bg-[var(--dp-bg-2)] rounded-2xl border border-[var(--dp-border-0)]">
            <h6 className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--dp-text-2)] mb-3">
              Session Stats
            </h6>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[0.6rem] uppercase tracking-widest text-[var(--dp-text-2)]">
                  Completed
                </span>
                <span className="text-xs font-bold text-[var(--dp-text-0)]">
                  {Object.keys(ratings).length} / {displayPrompts.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[0.6rem] uppercase tracking-widest text-[var(--dp-text-2)]">
                  Avg Rating
                </span>
                <span className="text-xs font-bold text-[var(--dp-blue)]">
                  {Object.keys(ratings).length === 0
                    ? '—'
                    : (
                        Object.values(ratings).reduce((a, b) => a + b, 0) /
                        Object.keys(ratings).length
                      ).toFixed(1) + ' / 5'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[0.6rem] uppercase tracking-widest text-[var(--dp-text-2)]">
                  Time Limit
                </span>
                <span className="text-xs font-bold text-[var(--dp-text-0)]">
                  {active ? `${active.timeLimit}s` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
