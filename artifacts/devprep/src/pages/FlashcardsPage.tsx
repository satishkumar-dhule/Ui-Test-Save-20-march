import { useState, useEffect, useCallback, useRef } from 'react'
import { useAnnounce, SkipLink, LiveRegion } from '@/hooks/useAnnounce'
import { Layers, RotateCcw, Shuffle, ChevronLeft, ChevronRight, Menu, X, Check, RefreshCw, Zap, BookOpen } from 'lucide-react'
import type { Flashcard, CardStatus } from '@/data/flashcards'
import { MarkdownText } from '@/components/MarkdownText'
import { progressApi } from '@/services/progressApi'
import { FLASHCARD_STATUS, TIMEOUT_DURATIONS, UI_CONSTANTS } from '@/lib/constants'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'

const STATUS_CONFIG: Record<CardStatus, { label: string; color: string; bg: string; border: string; emoji: string; key: string }> = {
  known:     { label: 'Know it',   color: '#3fb950', bg: 'rgba(63,185,80,0.12)',   border: 'rgba(63,185,80,0.3)',    emoji: '✅', key: '1' },
  reviewing: { label: 'Review',    color: '#f7a843', bg: 'rgba(247,168,67,0.12)', border: 'rgba(247,168,67,0.3)',  emoji: '🔄', key: '2' },
  hard:      { label: 'Hard',      color: '#ff7b72', bg: 'rgba(255,123,114,0.12)', border: 'rgba(255,123,114,0.3)', emoji: '❌', key: '3' },
  unseen:    { label: 'Unseen',    color: '#8b949e', bg: 'rgba(139,148,158,0.1)',  border: 'rgba(139,148,158,0.2)', emoji: '•',  key: '' },
}

interface FlashcardsPageProps {
  flashcards: Flashcard[]
  categories: string[]
  channelId: string
  onFlashcardUpdate?: (cardId: string, status: CardStatus) => void
  isLoading?: boolean
}

export function FlashcardsPage({ flashcards, categories, channelId, onFlashcardUpdate, isLoading = false }: FlashcardsPageProps) {
  const [statuses, setStatuses] = useState<Record<string, CardStatus>>(() =>
    progressApi.loadSync().flashcards as Record<string, CardStatus>
  )
  const [activeIdx, setActiveIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [filterCat, setFilterCat] = useState('All')
  const [order, setOrder] = useState<number[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { announce } = useAnnounce()

  useEffect(() => {
    setActiveIdx(0); setFlipped(false); setFilterCat('All')
    setOrder(flashcards.map((_, i) => i))
    setStatuses(progressApi.loadSync().flashcards as Record<string, CardStatus>)
  }, [channelId, flashcards])

  const filtered = filterCat === 'All' ? flashcards : flashcards.filter(f => f.category === filterCat)
  const orderedCards = order.map(i => flashcards[i]).filter(Boolean).filter(f => filterCat === 'All' || f.category === filterCat)
  const displayCards = orderedCards.length > 0 ? orderedCards : filtered
  const active = displayCards[activeIdx]

  const counts = {
    known: displayCards.filter(f => statuses[f.id] === FLASHCARD_STATUS.KNOWN).length,
    reviewing: displayCards.filter(f => statuses[f.id] === FLASHCARD_STATUS.REVIEWING).length,
    hard: displayCards.filter(f => statuses[f.id] === FLASHCARD_STATUS.HARD).length,
    unseen: displayCards.filter(f => !statuses[f.id] || statuses[f.id] === FLASHCARD_STATUS.UNSEEN).length,
  }
  const progressPct = displayCards.length > 0 ? Math.round(((counts.known + counts.reviewing) / displayCards.length) * 100) : 0
  const done = displayCards.length > 0 && displayCards.every(f => statuses[f.id] && statuses[f.id] !== FLASHCARD_STATUS.UNSEEN)

  const go = useCallback((dir: 1 | -1) => {
    setFlipped(false)
    setActiveIdx(i => Math.max(0, Math.min(displayCards.length - 1, i + dir)))
    announce(`Card ${Math.max(0, Math.min(displayCards.length - 1, activeIdx + dir)) + 1} of ${displayCards.length}`)
  }, [displayCards.length, activeIdx, announce])

  const mark = (status: CardStatus) => {
    if (!active) return
    setStatuses(prev => ({ ...prev, [active.id]: status }))
    onFlashcardUpdate?.(active.id, status)
    progressApi.saveFlashcard(channelId, active.id, status)
    if (activeIdx < displayCards.length - 1) {
      setTimeout(() => go(1), TIMEOUT_DURATIONS.AUTO_ADVANCE_DELAY)
    }
  }

  const doShuffle = () => {
    const arr = filtered.map((_, i) => i)
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    setOrder(arr); setActiveIdx(0); setFlipped(false); setShuffle(true)
  }

  const reset = () => {
    setStatuses({}); setActiveIdx(0); setFlipped(false); setShuffle(false)
    setOrder(flashcards.map((_, i) => i))
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && !e.target?.toString().includes('INPUT')) {
        e.preventDefault(); setFlipped(f => !f)
      }
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
      if (flipped) {
        if (e.key === '1') mark(FLASHCARD_STATUS.KNOWN)
        if (e.key === '2') mark(FLASHCARD_STATUS.REVIEWING)
        if (e.key === '3') mark(FLASHCARD_STATUS.HARD)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [go, flipped, activeIdx, displayCards.length])

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--dp-border-0)', borderTopColor: 'var(--dp-green)', animation: 'dp-spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (flashcards.length === 0) {
    return (
      <div className="dp-empty">
        <div className="dp-empty-icon"><Layers size={24} /></div>
        <div className="dp-empty-title">No flashcards available</div>
        <div className="dp-empty-desc">Switch to a different channel to study flashcards.</div>
      </div>
    )
  }

  const currentStatus: CardStatus = active ? (statuses[active.id] || FLASHCARD_STATUS.UNSEEN) : FLASHCARD_STATUS.UNSEEN

  return (
    <div className="study-page">
      <SkipLink targetId="flashcard-content">Skip to content</SkipLink>
      <LiveRegion />

      {sidebarOpen && <div className="mobile-overlay md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Left panel */}
      <div className={`study-panel${sidebarOpen ? ' study-panel--mobile-open' : ''}`}
        style={sidebarOpen ? { position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 40, display: 'flex', width: 270 } : {}}>
        <div className="study-panel-header">
          <Layers size={13} style={{ color: 'var(--dp-text-3)' }} />
          <span className="study-panel-title">Flashcards</span>
          <span className="study-panel-count">{displayCards.length}</span>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dp-text-3)' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Progress */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--dp-border-1)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--dp-text-2)', marginBottom: 6 }}>
            <span>Progress</span>
            <span style={{ fontWeight: 700, color: 'var(--dp-green)' }}>{progressPct}%</span>
          </div>
          <div className="dp-progress-bar">
            <div className="dp-progress-bar-fill" data-testid="flashcard-progress-bar" style={{ width: `${progressPct}%`, background: 'var(--dp-green)' }} />
          </div>
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
          padding: '8px 10px', borderBottom: '1px solid var(--dp-border-1)', flexShrink: 0,
        }}>
          {(['known', 'reviewing', 'hard', 'unseen'] as CardStatus[]).map(s => {
            const c = STATUS_CONFIG[s]
            const count = counts[s]
            return (
              <div key={s} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px',
                borderRadius: 'var(--dp-r-md)', background: 'var(--dp-bg-2)',
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10.5, color: 'var(--dp-text-2)', flex: 1 }}>{c.label}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--dp-text-0)' }}>{count}</span>
              </div>
            )
          })}
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--dp-border-1)', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--dp-text-3)', marginBottom: 6 }}>Category</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {['All', ...categories].map(cat => (
                <button key={cat} onClick={() => { setFilterCat(cat); setActiveIdx(0); setFlipped(false) }}
                  style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 'var(--dp-r-full)',
                    border: `1px solid ${filterCat === cat ? 'var(--dp-blue)' : 'var(--dp-border-1)'}`,
                    background: filterCat === cat ? 'var(--dp-blue-dim)' : 'transparent',
                    color: filterCat === cat ? 'var(--dp-blue)' : 'var(--dp-text-2)',
                    cursor: 'pointer', transition: 'all var(--dp-dur-fast)',
                  }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card list */}
        <div className="study-panel-list" style={{ flex: 1 }}>
          {displayCards.map((f, i) => {
            const st = statuses[f.id] || FLASHCARD_STATUS.UNSEEN
            const c = STATUS_CONFIG[st]
            return (
              <button key={f.id}
                className={`study-panel-item${i === activeIdx ? ' study-panel-item--active' : ''}`}
                onClick={() => { setActiveIdx(i); setFlipped(false); setSidebarOpen(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                <span className="study-panel-item-title" style={{ flex: 1 }}>{f.front}</span>
                <span style={{ fontSize: 10, color: 'var(--dp-text-3)' }}>#{i + 1}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main */}
      <main id="flashcard-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div className="study-toolbar">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 'var(--dp-r-md)', border: '1px solid var(--dp-border-1)', background: 'var(--dp-bg-2)', color: 'var(--dp-text-2)', cursor: 'pointer' }}>
            <Menu size={15} />
          </button>

          <button data-testid="flashcard-shuffle-btn" onClick={shuffle ? reset : doShuffle}
            className={`study-toolbar-btn${shuffle ? ' study-toolbar-btn--active' : ''}`}>
            <Shuffle size={12} />{shuffle ? 'Shuffled' : 'Shuffle'}
          </button>
          <button data-testid="flashcard-reset-btn" onClick={reset} className="study-toolbar-btn">
            <RotateCcw size={12} />Reset
          </button>

          <div style={{ flex: 1 }} />

          <span style={{ fontSize: 12, color: 'var(--dp-text-2)' }}>{activeIdx + 1} / {displayCards.length}</span>
          <button aria-label="Previous" onClick={() => go(-1)} disabled={activeIdx === 0} className="study-toolbar-nav"><ChevronLeft size={13} /></button>
          <button aria-label="Next" onClick={() => go(1)} disabled={activeIdx === displayCards.length - 1} className="study-toolbar-nav"><ChevronRight size={13} /></button>
        </div>

        {/* Card area */}
        {done ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 64, lineHeight: 1, animation: 'dp-bounce-in 0.6s var(--dp-ease-spring)' }}>🎉</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--dp-text-0)', marginBottom: 8 }}>Deck Complete!</div>
              <div style={{ fontSize: 14, color: 'var(--dp-text-2)', marginBottom: 20 }}>
                <span style={{ color: '#3fb950', fontWeight: 700 }}>{counts.known}</span> known ·{' '}
                <span style={{ color: '#f7a843', fontWeight: 700 }}>{counts.reviewing}</span> reviewing ·{' '}
                <span style={{ color: '#ff7b72', fontWeight: 700 }}>{counts.hard}</span> hard
              </div>
              <button onClick={reset} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 24px', borderRadius: 'var(--dp-r-md)',
                background: 'var(--dp-blue)', color: '#fff', border: 'none',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 0 20px var(--dp-blue-glow)',
              }}>
                <RefreshCw size={14} /> Study Again
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', gap: 20, overflow: 'auto' }}>
            {/* Status dots */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {(['known', 'reviewing', 'hard', 'unseen'] as CardStatus[]).map(s => {
                const c = STATUS_CONFIG[s]
                const isCurrent = currentStatus === s
                return (
                  <div key={s} style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                    borderRadius: 'var(--dp-r-full)', fontSize: 11, fontWeight: 600,
                    border: `1px solid ${isCurrent ? c.border : 'transparent'}`,
                    background: isCurrent ? c.bg : 'transparent',
                    color: isCurrent ? c.color : 'var(--dp-text-3)',
                    transition: 'all var(--dp-dur-base)',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: isCurrent ? c.color : 'var(--dp-text-4)' }} />
                    {c.label}
                  </div>
                )
              })}
            </div>

            {/* 3D flip card */}
            <div
              className={`flip-card${flipped ? ' flipped' : ''}`}
              style={{ width: '100%', maxWidth: 540, minHeight: 280 }}
            >
              <button
                className="flip-card-inner"
                style={{ minHeight: 280, display: 'block' }}
                onClick={() => setFlipped(f => !f)}
                data-testid="flashcard-flip"
                aria-label={flipped ? 'Show question' : 'Show answer'}
                aria-pressed={flipped}
              >
                {/* Front */}
                <div className="flip-card-front" style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '28px 32px', gap: 12, minHeight: 280,
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: 'var(--dp-text-3)',
                  }}>{active?.category}</span>
                  <p style={{ fontSize: 19, fontWeight: 700, color: 'var(--dp-text-0)', textAlign: 'center', lineHeight: 1.4, margin: 0 }}>
                    {active?.front}
                  </p>
                  {active?.hint && (
                    <p style={{ fontSize: 12.5, color: 'var(--dp-text-2)', fontStyle: 'italic', textAlign: 'center' }}>
                      💡 {active.hint}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: 'var(--dp-text-3)', marginTop: 'auto' }}>
                    <span className="hidden sm:inline">Space or click to reveal</span>
                    <span className="sm:hidden">Tap to reveal</span>
                  </p>
                </div>

                {/* Back */}
                <div className="flip-card-back" style={{ display: 'flex', flexDirection: 'column', padding: '20px 24px', gap: 12, minHeight: 280, overflowY: 'auto' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dp-blue)', flexShrink: 0 }}>Answer</span>
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    <MarkdownText content={active?.back ?? ''} />
                    {active?.codeExample && (
                      <pre style={{
                        marginTop: 12, fontSize: 12, fontFamily: "'SF Mono','Fira Code',monospace",
                        padding: '10px 14px', borderRadius: 'var(--dp-r-md)',
                        border: '1px solid var(--dp-border-0)', background: 'var(--dp-bg-1)',
                        overflowX: 'auto',
                      }}>
                        <code>{typeof active.codeExample === 'string' ? active.codeExample : (active.codeExample as any).code}</code>
                      </pre>
                    )}
                    {active?.mnemonic && (
                      <div style={{
                        marginTop: 12, padding: '8px 12px', borderRadius: 'var(--dp-r-md)',
                        border: '1px solid var(--dp-border-1)', background: 'var(--dp-blue-dim)',
                        fontSize: 12.5, color: 'var(--dp-text-2)', fontStyle: 'italic',
                      }}>
                        💡 {active.mnemonic}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Action buttons */}
            {flipped && (
              <div style={{ display: 'flex', gap: 10 }} role="group" aria-label="Rate this card">
                {(['known', 'reviewing', 'hard'] as CardStatus[]).map(s => {
                  const c = STATUS_CONFIG[s]
                  return (
                    <button
                      key={s}
                      data-testid={`flashcard-${s}`}
                      onClick={() => mark(s)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '9px 18px', borderRadius: 'var(--dp-r-md)',
                        border: `1px solid ${c.border}`, background: c.bg,
                        color: c.color, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        transition: 'all var(--dp-dur-fast)',
                      }}
                      aria-label={`Mark as ${c.label} (key: ${c.key})`}
                    >
                      <span>{c.emoji}</span>
                      {c.label}
                      <span style={{ fontSize: 10, opacity: 0.6 }} className="hidden sm:inline">({c.key})</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Keyboard hint */}
            <div style={{ fontSize: 11, color: 'var(--dp-text-3)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span>← → navigate</span>
              <span>Space flip</span>
              {flipped && <><span>1 know</span><span>2 review</span><span>3 hard</span></>}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
