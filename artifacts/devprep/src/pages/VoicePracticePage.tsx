import { useState, useEffect, useRef, useCallback } from 'react'
import { useAnnounce } from '@/hooks/useAnnounce'
import {
  Mic, MicOff, Volume2, Shuffle, ChevronLeft, ChevronRight,
  Star, Lightbulb, X, CheckCircle2, Gauge, ChevronDown, ChevronUp,
} from 'lucide-react'
import type { VoicePrompt } from '@/data/voicePractice'
import { progressApi } from '@/services/progressApi'

const DIFF_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  beginner:     { label: 'Beginner',     color: '#3fb950', bg: 'rgba(63,185,80,0.1)' },
  intermediate: { label: 'Intermediate', color: '#f7a843', bg: 'rgba(247,168,67,0.1)' },
  advanced:     { label: 'Advanced',     color: '#ff7b72', bg: 'rgba(255,123,114,0.1)' },
}

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

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const cdRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setSrSupported(!!SR)
  }, [])

  useEffect(() => {
    setActiveIdx(0); setPhase('idle'); setTranscript(''); setRating(0); setKeyPointsOpen(false)
    setOrder(prompts.map((_, i) => i))
  }, [channelId, prompts])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (timerRef.current) clearInterval(timerRef.current)
      if (cdRef.current) clearInterval(cdRef.current)
      try { recognitionRef.current?.stop() } catch {}
    }
  }, [])

  const displayPrompts = order.map(i => prompts[i]).filter(Boolean)
  const active = displayPrompts[activeIdx]

  const go = useCallback((dir: 1 | -1) => {
    setActiveIdx(i => Math.max(0, Math.min(displayPrompts.length - 1, i + dir)))
    setPhase('idle'); setTranscript(''); setRating(0); setKeyPointsOpen(false)
  }, [displayPrompts.length])

  const doShuffle = () => {
    const arr = prompts.map((_, i) => i)
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    setOrder(arr); setActiveIdx(0); setPhase('idle'); setTranscript(''); setShuffle(true)
  }

  const startPractice = () => {
    setPhase('countdown')
    setCountdown(3)
    setTranscript('')
    setRating(0)
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
          if (sec >= 120) { stopPractice(); }
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
          try { rec.start() } catch {}
        }
      }
    }, 1000)
  }

  const stopPractice = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (cdRef.current) clearInterval(cdRef.current)
    try { recognitionRef.current?.stop() } catch {}
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

  if (prompts.length === 0) {
    return (
      <div className="dp-empty">
        <div className="dp-empty-icon"><Mic size={24} /></div>
        <div className="dp-empty-title">No voice prompts</div>
        <div className="dp-empty-desc">Switch to a different channel to practice speaking.</div>
      </div>
    )
  }

  const diff = DIFF_CONFIG[active?.difficulty ?? ''] ?? DIFF_CONFIG.beginner
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top toolbar */}
      <div className="study-toolbar">
        <button onClick={shuffle ? () => { setShuffle(false); setOrder(prompts.map((_,i) => i)) } : doShuffle}
          className={`study-toolbar-btn${shuffle ? ' study-toolbar-btn--active' : ''}`}>
          <Shuffle size={12} />{shuffle ? 'Shuffled' : 'Shuffle'}
        </button>

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 12, color: 'var(--dp-text-2)' }}>{activeIdx + 1} / {displayPrompts.length}</span>
        <button onClick={() => go(-1)} disabled={activeIdx === 0} className="study-toolbar-nav"><ChevronLeft size={13} /></button>
        <button onClick={() => go(1)} disabled={activeIdx === displayPrompts.length - 1} className="study-toolbar-nav"><ChevronRight size={13} /></button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Prompt card */}
          <div style={{
            background: 'var(--dp-glass-1)', border: '1px solid var(--dp-border-0)',
            borderRadius: 'var(--dp-r-xl)', padding: '24px 26px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Ambient glow based on phase */}
            {phase === 'recording' && (
              <div style={{
                position: 'absolute', top: -40, right: -40, width: 160, height: 160,
                borderRadius: '50%', background: 'radial-gradient(circle, rgba(188,140,255,0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 'var(--dp-r-full)', background: diff.bg, color: diff.color, border: `1px solid ${diff.color}33` }}>
                  {diff.label}
                </span>
                {active?.domain && (
                  <span style={{ fontSize: 10.5, color: 'var(--dp-text-3)', padding: '2px 8px', borderRadius: 'var(--dp-r-full)', background: 'var(--dp-bg-3)' }}>
                    {active.domain}
                  </span>
                )}
                {active?.timeLimit && (
                  <span style={{ fontSize: 10.5, color: 'var(--dp-text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Gauge size={10} />{active.timeLimit}s target
                  </span>
                )}
              </div>

              {active && ratings[active.id] !== undefined && (
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={12} style={{ color: ratings[active.id] >= s ? '#f7df1e' : 'var(--dp-text-4)', fill: ratings[active.id] >= s ? '#f7df1e' : 'none' }} />
                  ))}
                </div>
              )}
            </div>

            <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--dp-text-0)', lineHeight: 1.45, margin: '0 0 16px', letterSpacing: '-0.2px' }}>
              {active?.prompt}
            </h2>

            {/* Type badge */}
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 10.5, padding: '2px 9px', borderRadius: 'var(--dp-r-full)', background: 'var(--dp-blue-dim)', color: 'var(--dp-blue)', border: '1px solid rgba(56,139,253,0.2)', fontWeight: 600, textTransform: 'capitalize' }}>
                {active?.type}
              </span>
            </div>

            {/* Key points toggle */}
            {active?.keyPoints && active.keyPoints.length > 0 && (
              <div>
                <button
                  onClick={() => setKeyPointsOpen(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--dp-text-2)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontWeight: 600 }}
                >
                  <Lightbulb size={13} style={{ color: '#f7df1e' }} />
                  Key Points
                  {keyPointsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {keyPointsOpen && (
                  <ul style={{ margin: '8px 0 0', padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {active.keyPoints.map((pt, i) => (
                      <li key={i} style={{ fontSize: 13, color: 'var(--dp-text-1)', lineHeight: 1.5 }}>{pt}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Recording zone */}
          <div style={{
            background: 'var(--dp-glass-1)', border: '1px solid var(--dp-border-0)',
            borderRadius: 'var(--dp-r-xl)', padding: '24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
          }}>
            {/* Countdown overlay */}
            {phase === 'countdown' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 72, fontWeight: 900, color: 'var(--dp-blue)', lineHeight: 1, animation: 'dp-bounce-in 0.3s var(--dp-ease-spring)' }}>
                  {countdown}
                </div>
                <div style={{ fontSize: 14, color: 'var(--dp-text-2)', marginTop: 8 }}>Get ready...</div>
              </div>
            )}

            {/* Idle / Recording / Done */}
            {phase !== 'countdown' && (
              <>
                {/* Waveform / mic button */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Pulse rings when recording */}
                  {phase === 'recording' && (
                    <>
                      <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: '2px solid rgba(188,140,255,0.3)', animation: 'dp-pulse-ring 1.5s ease-out infinite' }} />
                      <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', border: '2px solid rgba(188,140,255,0.4)', animation: 'dp-pulse-ring 1.5s 0.5s ease-out infinite' }} />
                    </>
                  )}
                  <button
                    onClick={phase === 'idle' ? startPractice : phase === 'recording' ? stopPractice : undefined}
                    style={{
                      width: 68, height: 68, borderRadius: '50%', border: 'none', cursor: phase === 'done' ? 'default' : 'pointer',
                      background: phase === 'recording'
                        ? 'linear-gradient(135deg, #bc8cff, #388bfd)'
                        : phase === 'done'
                        ? 'var(--dp-green)'
                        : 'linear-gradient(135deg, #388bfd, #bc8cff)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: phase === 'recording'
                        ? '0 0 32px rgba(188,140,255,0.5), 0 8px 20px rgba(0,0,0,0.3)'
                        : '0 8px 20px rgba(0,0,0,0.3)',
                      transition: 'all var(--dp-dur-base)',
                      position: 'relative', zIndex: 1,
                    }}
                    aria-label={phase === 'idle' ? 'Start recording' : phase === 'recording' ? 'Stop recording' : 'Done'}
                  >
                    {phase === 'done'
                      ? <CheckCircle2 size={26} color="#fff" />
                      : <Mic size={26} color="#fff" />
                    }
                  </button>
                </div>

                {/* Status text */}
                {phase === 'idle' && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dp-text-1)', marginBottom: 4 }}>Ready to practice</div>
                    <div style={{ fontSize: 12.5, color: 'var(--dp-text-3)' }}>
                      {srSupported ? 'Click the mic to start · speech will be transcribed' : 'Click to start your timed practice session'}
                    </div>
                  </div>
                )}

                {phase === 'recording' && (
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dp-purple)', marginBottom: 8 }}>
                      Recording · {fmt(elapsed)}
                    </div>

                    {/* Animated waveform */}
                    <div className="dp-waveform dp-waveform--active" style={{ marginBottom: 14 }}>
                      {[30,50,80,40,90,50,20,40,70,30].map((h, i) => (
                        <div
                          key={i}
                          className="dp-waveform-bar"
                          style={{
                            height: `${h}%`,
                            animationDelay: `${i * 0.08}s`,
                            background: i % 3 === 2 ? 'var(--dp-purple)' : 'var(--dp-blue)',
                          }}
                        />
                      ))}
                    </div>

                    {/* Live transcript */}
                    {transcript && (
                      <div style={{
                        padding: '12px 14px', borderRadius: 'var(--dp-r-md)',
                        background: 'var(--dp-bg-2)', border: '1px solid var(--dp-border-1)',
                        fontSize: 13, color: 'var(--dp-text-1)', lineHeight: 1.55, textAlign: 'left',
                        maxHeight: 120, overflowY: 'auto',
                      }}>
                        {transcript}
                      </div>
                    )}

                    <button onClick={stopPractice} style={{
                      marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 18px', borderRadius: 'var(--dp-r-md)', border: '1px solid var(--dp-border-0)',
                      background: 'var(--dp-bg-3)', color: 'var(--dp-text-1)', fontSize: 13, cursor: 'pointer',
                    }}>
                      <MicOff size={13} /> Stop
                    </button>
                  </div>
                )}

                {phase === 'done' && (
                  <div style={{ width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#3fb950', marginBottom: 16 }}>
                      ✓ Practice complete · {fmt(elapsed)} recorded
                    </div>

                    {/* Transcript */}
                    {transcript && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--dp-text-3)', marginBottom: 6, textAlign: 'left' }}>Your response</div>
                        <div style={{ padding: '12px 14px', borderRadius: 'var(--dp-r-md)', background: 'var(--dp-bg-2)', border: '1px solid var(--dp-border-1)', fontSize: 13, color: 'var(--dp-text-1)', lineHeight: 1.55, textAlign: 'left', maxHeight: 100, overflowY: 'auto' }}>
                          {transcript}
                        </div>
                      </div>
                    )}

                    {/* Rating */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12.5, color: 'var(--dp-text-2)', marginBottom: 10 }}>How did you do?</div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        {[1,2,3,4,5].map(r => (
                          <button key={r} onClick={() => handleRate(r)}
                            style={{
                              width: 40, height: 40, borderRadius: 'var(--dp-r-md)', border: '1px solid',
                              borderColor: rating >= r ? '#f7df1e44' : 'var(--dp-border-1)',
                              background: rating >= r ? 'rgba(247,223,30,0.12)' : 'var(--dp-bg-2)',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all var(--dp-dur-fast)',
                            }}>
                            <Star size={18} style={{ color: rating >= r ? '#f7df1e' : 'var(--dp-text-3)', fill: rating >= r ? '#f7df1e' : 'none' }} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                      <button onClick={() => { setPhase('idle'); setTranscript(''); setRating(0); setElapsed(0) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 'var(--dp-r-md)', border: '1px solid var(--dp-border-0)', background: 'var(--dp-bg-2)', color: 'var(--dp-text-1)', fontSize: 13, cursor: 'pointer' }}>
                        Try Again
                      </button>
                      {activeIdx < displayPrompts.length - 1 && (
                        <button onClick={() => { go(1) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 'var(--dp-r-md)', border: 'none', background: 'var(--dp-blue)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          Next Prompt <ChevronRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Follow-up question */}
          {active?.followUp && phase !== 'recording' && phase !== 'countdown' && (
            <div style={{ background: 'var(--dp-glass-1)', border: '1px solid var(--dp-border-0)', borderRadius: 'var(--dp-r-xl)', padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Volume2 size={13} style={{ color: 'var(--dp-blue)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--dp-text-3)' }}>Follow-up Question</span>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--dp-text-1)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                "{active.followUp}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
