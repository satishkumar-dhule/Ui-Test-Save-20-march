import { useState, useEffect, useCallback, useRef } from 'react'
import { useAnnounce, SkipLink, LiveRegion } from '@/hooks/useAnnounce'
import {
  Layers,
  RotateCcw,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Check,
  RefreshCw,
  Zap,
  BookOpen,
  Eye,
  EyeOff,
  Lightbulb,
  Brain,
  Target,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trophy,
  Star,
  Keyboard,
  Sparkles,
  ArrowRight,
  CircleDot,
  Hash,
} from 'lucide-react'
import type { Flashcard, CardStatus } from '@/data/flashcards'
import { MarkdownText } from '@/components/MarkdownText'
import { progressApi } from '@/services/progressApi'
import { FLASHCARD_STATUS, TIMEOUT_DURATIONS, UI_CONSTANTS } from '@/lib/constants'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'

const STATUS_CONFIG: Record<
  CardStatus,
  {
    label: string
    color: string
    bg: string
    border: string
    icon: typeof Check
    key: string
    activeBg: string
    hoverBg: string
    ringColor: string
  }
> = {
  known: {
    label: 'Know it',
    color: '#3fb950',
    bg: 'rgba(63,185,80,0.08)',
    border: 'rgba(63,185,80,0.25)',
    icon: CheckCircle2,
    key: '1',
    activeBg: 'rgba(63,185,80,0.15)',
    hoverBg: 'rgba(63,185,80,0.12)',
    ringColor: 'rgba(63,185,80,0.4)',
  },
  reviewing: {
    label: 'Review',
    color: '#f7a843',
    bg: 'rgba(247,168,67,0.08)',
    border: 'rgba(247,168,67,0.25)',
    icon: AlertTriangle,
    key: '2',
    activeBg: 'rgba(247,168,67,0.15)',
    hoverBg: 'rgba(247,168,67,0.12)',
    ringColor: 'rgba(247,168,67,0.4)',
  },
  hard: {
    label: 'Hard',
    color: '#ff7b72',
    bg: 'rgba(255,123,114,0.08)',
    border: 'rgba(255,123,114,0.25)',
    icon: XCircle,
    key: '3',
    activeBg: 'rgba(255,123,114,0.15)',
    hoverBg: 'rgba(255,123,114,0.12)',
    ringColor: 'rgba(255,123,114,0.4)',
  },
  unseen: {
    label: 'Unseen',
    color: '#8b949e',
    bg: 'rgba(139,148,158,0.06)',
    border: 'rgba(139,148,158,0.15)',
    icon: CircleDot,
    key: '',
    activeBg: 'rgba(139,148,158,0.1)',
    hoverBg: 'rgba(139,148,158,0.08)',
    ringColor: 'rgba(139,148,158,0.3)',
  },
}

interface FlashcardsPageProps {
  flashcards: Flashcard[]
  categories: string[]
  channelId: string
  onFlashcardUpdate?: (cardId: string, status: CardStatus) => void
  isLoading?: boolean
}

export function FlashcardsPage({
  flashcards,
  categories,
  channelId,
  onFlashcardUpdate,
  isLoading = false,
}: FlashcardsPageProps) {
  const [statuses, setStatuses] = useState<Record<string, CardStatus>>(
    () => progressApi.loadSync().flashcards as Record<string, CardStatus>
  )
  const [activeIdx, setActiveIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [filterCat, setFilterCat] = useState('All')
  const [order, setOrder] = useState<number[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hintVisible, setHintVisible] = useState(false)
  const [justFlipped, setJustFlipped] = useState(false)
  const { announce } = useAnnounce()

  useEffect(() => {
    setActiveIdx(0)
    setFlipped(false)
    setFilterCat('All')
    setHintVisible(false)
    setOrder(flashcards.map((_, i) => i))
    setStatuses(progressApi.loadSync().flashcards as Record<string, CardStatus>)
  }, [channelId, flashcards])

  const filtered =
    filterCat === 'All' ? flashcards : flashcards.filter(f => f.category === filterCat)
  const orderedCards = order
    .map(i => flashcards[i])
    .filter(Boolean)
    .filter(f => filterCat === 'All' || f.category === filterCat)
  const displayCards = orderedCards.length > 0 ? orderedCards : filtered
  const active = displayCards[activeIdx]

  const counts = {
    known: displayCards.filter(f => statuses[f.id] === FLASHCARD_STATUS.KNOWN).length,
    reviewing: displayCards.filter(f => statuses[f.id] === FLASHCARD_STATUS.REVIEWING).length,
    hard: displayCards.filter(f => statuses[f.id] === FLASHCARD_STATUS.HARD).length,
    unseen: displayCards.filter(f => !statuses[f.id] || statuses[f.id] === FLASHCARD_STATUS.UNSEEN)
      .length,
  }
  const progressPct =
    displayCards.length > 0
      ? Math.round(((counts.known + counts.reviewing) / displayCards.length) * 100)
      : 0
  const done =
    displayCards.length > 0 &&
    displayCards.every(f => statuses[f.id] && statuses[f.id] !== FLASHCARD_STATUS.UNSEEN)

  const go = useCallback(
    (dir: 1 | -1) => {
      setFlipped(false)
      setHintVisible(false)
      setActiveIdx(i => Math.max(0, Math.min(displayCards.length - 1, i + dir)))
      announce(
        `Card ${Math.max(0, Math.min(displayCards.length - 1, activeIdx + dir)) + 1} of ${displayCards.length}`
      )
    },
    [displayCards.length, activeIdx, announce]
  )

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
    setOrder(arr)
    setActiveIdx(0)
    setFlipped(false)
    setShuffle(true)
    setHintVisible(false)
  }

  const reset = () => {
    setStatuses({})
    setActiveIdx(0)
    setFlipped(false)
    setShuffle(false)
    setHintVisible(false)
    setOrder(flashcards.map((_, i) => i))
  }

  const handleFlip = () => {
    setFlipped(f => {
      if (!f) {
        setJustFlipped(true)
        setTimeout(() => setJustFlipped(false), 300)
      }
      return !f
    })
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && !e.target?.toString().includes('INPUT')) {
        e.preventDefault()
        handleFlip()
      }
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
      if (flipped) {
        if (e.key === '1') mark(FLASHCARD_STATUS.KNOWN)
        if (e.key === '2') mark(FLASHCARD_STATUS.REVIEWING)
        if (e.key === '3') mark(FLASHCARD_STATUS.HARD)
      }
      if (!flipped && e.key === 'h') setHintVisible(v => !v)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [go, flipped, activeIdx, displayCards.length])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-[var(--dp-border-0)] border-t-[var(--dp-green)] animate-spin" />
      </div>
    )
  }

  if (flashcards.length === 0) {
    return (
      <div className="dp-empty">
        <div className="dp-empty-icon">
          <Layers size={24} />
        </div>
        <div className="dp-empty-title">No flashcards available</div>
        <div className="dp-empty-desc">Switch to a different channel to study flashcards.</div>
      </div>
    )
  }

  const currentStatus: CardStatus = active
    ? statuses[active.id] || FLASHCARD_STATUS.UNSEEN
    : FLASHCARD_STATUS.UNSEEN

  return (
    <div className="study-page">
      <SkipLink targetId="flashcard-content">Skip to content</SkipLink>
      <LiveRegion />

      {sidebarOpen && (
        <div className="mobile-overlay md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Left panel */}
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
          <Layers size={13} style={{ color: 'var(--dp-text-3)' }} />
          <span className="study-panel-title">Flashcards</span>
          <span className="study-panel-count">{displayCards.length}</span>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto bg-none border-none cursor-pointer text-[var(--dp-text-3)] min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Progress with circular ring */}
        <div className="px-3.5 py-3 border-b border-[var(--dp-border-1)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <svg width="40" height="40" viewBox="0 0 40 40" className="dp-progress-ring">
                <circle cx="20" cy="20" r="16" className="dp-progress-ring-track" strokeWidth="3" />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  className="dp-progress-ring-fill"
                  strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - progressPct / 100)}`}
                  style={{ stroke: progressPct === 100 ? '#3fb950' : 'var(--dp-blue)' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--dp-text-0)]">
                {progressPct}%
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10.5px] text-[var(--dp-text-2)] mb-1.5">Progress</div>
              <div className="dp-progress-bar h-1.5">
                <div
                  className="dp-progress-bar-fill"
                  data-testid="flashcard-progress-bar"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-1.5 p-2.5 border-b border-[var(--dp-border-1)] flex-shrink-0">
          {(['known', 'reviewing', 'hard', 'unseen'] as CardStatus[]).map(s => {
            const c = STATUS_CONFIG[s]
            const count = counts[s]
            const Icon = c.icon
            return (
              <div
                key={s}
                className="flex items-center gap-2 p-2 rounded-[var(--dp-r-md)] bg-[var(--dp-bg-2)]"
              >
                <Icon size={12} style={{ color: c.color, flexShrink: 0 }} />
                <span className="text-[10.5px] text-[var(--dp-text-2)] flex-1 truncate">
                  {c.label}
                </span>
                <span className="text-[12px] font-bold text-[var(--dp-text-0)] tabular-nums">
                  {count}
                </span>
              </div>
            )
          })}
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="p-2.5 border-b border-[var(--dp-border-1)] flex-shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--dp-text-3)] mb-2">
              Category
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['All', ...categories].map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setFilterCat(cat)
                    setActiveIdx(0)
                    setFlipped(false)
                    setHintVisible(false)
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all duration-150 cursor-pointer min-h-[32px] ${
                    filterCat === cat
                      ? 'border-[var(--dp-blue)] bg-[var(--dp-blue-dim)] text-[var(--dp-blue)]'
                      : 'border-[var(--dp-border-1)] bg-transparent text-[var(--dp-text-2)] hover:bg-[var(--dp-bg-3)]'
                  }`}
                >
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
              <button
                key={f.id}
                className={`study-panel-item${i === activeIdx ? ' study-panel-item--active' : ''}`}
                onClick={() => {
                  setActiveIdx(i)
                  setFlipped(false)
                  setSidebarOpen(false)
                  setHintVisible(false)
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: c.color,
                    flexShrink: 0,
                  }}
                />
                <span className="study-panel-item-title" style={{ flex: 1 }}>
                  {f.front}
                </span>
                <span className="text-[10px] text-[var(--dp-text-3)] tabular-nums">#{i + 1}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main */}
      <main id="flashcard-content" className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="study-toolbar">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden flex items-center justify-center w-11 h-11 rounded-[var(--dp-r-md)] border border-[var(--dp-border-1)] bg-[var(--dp-bg-2)] text-[var(--dp-text-2)] cursor-pointer"
          >
            <Menu size={15} />
          </button>

          <button
            data-testid="flashcard-shuffle-btn"
            onClick={shuffle ? reset : doShuffle}
            className={`study-toolbar-btn${shuffle ? ' study-toolbar-btn--active' : ''}`}
          >
            <Shuffle size={12} />
            {shuffle ? 'Shuffled' : 'Shuffle'}
          </button>
          <button data-testid="flashcard-reset-btn" onClick={reset} className="study-toolbar-btn">
            <RotateCcw size={12} />
            Reset
          </button>

          <div className="flex-1" />

          {/* Card counter with visual indicator */}
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--dp-text-2)] mr-1">
            <Hash size={11} className="text-[var(--dp-text-3)]" />
            <span className="tabular-nums font-medium">{activeIdx + 1}</span>
            <span className="text-[var(--dp-text-4)]">/</span>
            <span className="tabular-nums">{displayCards.length}</span>
          </div>
          <button
            aria-label="Previous"
            onClick={() => go(-1)}
            disabled={activeIdx === 0}
            className="study-toolbar-nav"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            aria-label="Next"
            onClick={() => go(1)}
            disabled={activeIdx === displayCards.length - 1}
            className="study-toolbar-nav"
          >
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Card area */}
        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
            {/* Completion icon */}
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full bg-[var(--dp-green)] bg-opacity-10 flex items-center justify-center"
                style={{ animation: 'dp-bounce-in 0.6s var(--dp-ease-spring)' }}
              >
                <Trophy size={36} className="text-[#3fb950]" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles
                  size={16}
                  className="text-[#f7a843]"
                  style={{ animation: 'dp-fade-in 0.8s ease-out' }}
                />
              </div>
            </div>

            <div>
              <h2 className="text-[22px] font-extrabold text-[var(--dp-text-0)] mb-2">
                Deck Complete!
              </h2>
              <p className="text-[14px] text-[var(--dp-text-2)] mb-1">
                You've reviewed all {displayCards.length} cards
              </p>
            </div>

            {/* Summary cards */}
            <div className="flex gap-3 flex-wrap justify-center">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(63,185,80,0.2)] bg-[rgba(63,185,80,0.08)]">
                <CheckCircle2 size={16} className="text-[#3fb950]" />
                <span className="text-[13px] font-semibold text-[#3fb950]">{counts.known}</span>
                <span className="text-[12px] text-[var(--dp-text-2)]">Known</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(247,168,67,0.2)] bg-[rgba(247,168,67,0.08)]">
                <AlertTriangle size={16} className="text-[#f7a843]" />
                <span className="text-[13px] font-semibold text-[#f7a843]">{counts.reviewing}</span>
                <span className="text-[12px] text-[var(--dp-text-2)]">Review</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[rgba(255,123,114,0.2)] bg-[rgba(255,123,114,0.08)]">
                <XCircle size={16} className="text-[#ff7b72]" />
                <span className="text-[13px] font-semibold text-[#ff7b72]">{counts.hard}</span>
                <span className="text-[12px] text-[var(--dp-text-2)]">Hard</span>
              </div>
            </div>

            {/* Mastery meter */}
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-[11px] text-[var(--dp-text-3)] mb-1.5">
                <span>Mastery</span>
                <span className="font-semibold text-[var(--dp-text-2)] tabular-nums">
                  {displayCards.length > 0
                    ? Math.round((counts.known / displayCards.length) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="dp-progress-bar h-2">
                <div
                  className="dp-progress-bar-fill"
                  style={{
                    width: `${displayCards.length > 0 ? Math.round((counts.known / displayCards.length) * 100) : 0}%`,
                    background: 'linear-gradient(90deg, #3fb950, #2ea043)',
                  }}
                />
              </div>
            </div>

            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--dp-blue)] text-white border-none text-[14px] font-bold cursor-pointer shadow-[0_0_20px_var(--dp-blue-glow)] hover:brightness-110 active:scale-[0.97] transition-all duration-150 min-h-[48px]"
            >
              <RefreshCw size={15} /> Study Again
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 gap-5 overflow-auto">
            {/* Progress dots strip */}
            <div className="flex items-center gap-1 max-w-full overflow-x-auto py-1 px-1">
              {displayCards.slice(0, 50).map((f, i) => {
                const st = statuses[f.id] || FLASHCARD_STATUS.UNSEEN
                const c = STATUS_CONFIG[st]
                const isCurrent = i === activeIdx
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setActiveIdx(i)
                      setFlipped(false)
                      setHintVisible(false)
                    }}
                    aria-label={`Go to card ${i + 1}`}
                    className="min-w-[24px] min-h-[24px] flex items-center justify-center p-0.5 bg-transparent border-none cursor-pointer"
                  >
                    <div
                      className="rounded-full transition-all duration-200"
                      style={{
                        width: isCurrent ? 10 : 6,
                        height: isCurrent ? 10 : 6,
                        background: isCurrent
                          ? c.color
                          : st !== 'unseen'
                            ? c.color
                            : 'var(--dp-text-4)',
                        opacity: st !== 'unseen' ? 1 : 0.35,
                        boxShadow: isCurrent
                          ? `0 0 0 2px var(--dp-bg-0), 0 0 0 4px ${c.color}`
                          : 'none',
                      }}
                    />
                  </button>
                )
              })}
              {displayCards.length > 50 && (
                <span className="text-[10px] text-[var(--dp-text-3)] ml-1">
                  +{displayCards.length - 50}
                </span>
              )}
            </div>

            {/* 3D flip card */}
            <div
              className={`flip-card${flipped ? ' flipped' : ''}`}
              style={{ width: '100%', maxWidth: 560, minHeight: 300 }}
            >
              <button
                className="flip-card-inner"
                style={{ minHeight: 300, display: 'block' }}
                onClick={handleFlip}
                data-testid="flashcard-flip"
                aria-label={flipped ? 'Show question' : 'Show answer'}
                aria-pressed={flipped}
              >
                {/* Front */}
                <div
                  className="flip-card-front"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '32px 36px',
                    gap: 14,
                    minHeight: 300,
                  }}
                >
                  {/* Category badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--dp-bg-3)] border border-[var(--dp-border-0)]">
                    <BookOpen size={10} className="text-[var(--dp-text-3)]" />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--dp-text-3)]">
                      {active?.category}
                    </span>
                  </div>

                  {/* Question */}
                  <p className="text-[20px] font-bold text-[var(--dp-text-0)] text-center leading-[1.45] m-0">
                    {active?.front}
                  </p>

                  {/* Hint section */}
                  {active?.hint && (
                    <div className="w-full">
                      {!hintVisible ? (
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setHintVisible(true)
                          }}
                          className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-lg border border-dashed border-[var(--dp-border-1)] bg-transparent text-[12px] text-[var(--dp-text-3)] cursor-pointer hover:border-[var(--dp-border-0)] hover:text-[var(--dp-text-2)] hover:bg-[var(--dp-bg-2)] transition-all duration-150 min-h-[36px]"
                        >
                          <Lightbulb size={12} /> Show hint
                        </button>
                      ) : (
                        <div
                          className="px-4 py-2.5 rounded-lg bg-[var(--dp-bg-2)] border border-[var(--dp-border-0)]"
                          style={{ animation: 'dp-fade-in 0.2s ease-out' }}
                        >
                          <div className="flex items-start gap-2">
                            <Lightbulb
                              size={13}
                              className="text-[var(--dp-yellow)] flex-shrink-0 mt-0.5"
                            />
                            <p className="text-[13px] text-[var(--dp-text-2)] italic m-0 leading-relaxed text-left">
                              {active.hint}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tap hint */}
                  <p className="text-[12px] text-[var(--dp-text-3)] flex items-center gap-1.5 mt-auto pt-2">
                    <Eye size={13} />
                    <span className="hidden sm:inline">Space or click to reveal</span>
                    <span className="sm:hidden">Tap to reveal</span>
                  </p>
                </div>

                {/* Back */}
                <div
                  className="flip-card-back"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '24px 28px',
                    gap: 14,
                    minHeight: 300,
                    overflowY: 'auto',
                  }}
                >
                  {/* Answer header */}
                  <div className="flex items-center gap-2 flex-shrink-0 pb-2 border-b border-[var(--dp-border-0)]">
                    <Check size={14} className="text-[var(--dp-blue)]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--dp-blue)]">
                      Answer
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    <MarkdownText content={active?.back ?? ''} />
                    {active?.codeExample && (
                      <pre className="mt-3 text-[12px] font-['SF_Mono','Fira_Code',monospace] p-3.5 rounded-[var(--dp-r-md)] border border-[var(--dp-border-0)] bg-[var(--dp-bg-1)] overflow-x-auto leading-relaxed">
                        <code>
                          {typeof active.codeExample === 'string'
                            ? active.codeExample
                            : (active.codeExample as any).code}
                        </code>
                      </pre>
                    )}
                    {active?.mnemonic && (
                      <div className="mt-3 px-3.5 py-2.5 rounded-[var(--dp-r-md)] border border-[var(--dp-border-1)] bg-[var(--dp-blue-dim)] flex items-start gap-2">
                        <Brain size={14} className="text-[var(--dp-blue)] flex-shrink-0 mt-0.5" />
                        <span className="text-[12.5px] text-[var(--dp-text-2)] italic leading-relaxed">
                          {active.mnemonic}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Action buttons */}
            <div
              className={`flex gap-3 transition-all duration-200 ${flipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
              role="group"
              aria-label="Rate this card"
            >
              {(['hard', 'reviewing', 'known'] as CardStatus[]).map((s, i) => {
                const c = STATUS_CONFIG[s]
                const Icon = c.icon
                const isPrimary = s === 'known'
                return (
                  <button
                    key={s}
                    data-testid={`flashcard-${s}`}
                    onClick={() => mark(s)}
                    className={`
                      flex items-center gap-2 px-5 py-3 rounded-xl border cursor-pointer
                      transition-all duration-150 min-h-[48px] min-w-[44px]
                      hover:scale-[1.03] active:scale-[0.97]
                      focus-visible:outline-none focus-visible:ring-2
                      ${isPrimary ? 'font-bold' : 'font-semibold'}
                    `}
                    style={{
                      borderColor: c.border,
                      background: isPrimary ? c.activeBg : c.bg,
                      color: c.color,
                      fontSize: 13,

                      animationDelay: `${i * 50}ms`,
                    }}
                    aria-label={`Mark as ${c.label} (key: ${c.key})`}
                  >
                    <Icon size={16} />
                    <span>{c.label}</span>
                    <span className="text-[10px] opacity-50 hidden sm:inline font-normal ml-0.5">
                      {c.key}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Keyboard hint */}
            <div className="text-[11px] text-[var(--dp-text-3)] flex items-center gap-3">
              <Keyboard size={12} className="text-[var(--dp-text-4)]" />
              <span className="hidden sm:flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--dp-bg-3)] text-[10px] font-mono border border-[var(--dp-border-0)]">
                  ←→
                </kbd>{' '}
                navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--dp-bg-3)] text-[10px] font-mono border border-[var(--dp-border-0)]">
                  Space
                </kbd>{' '}
                flip
              </span>
              {flipped && (
                <>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--dp-bg-3)] text-[10px] font-mono border border-[var(--dp-border-0)]">
                      1
                    </kbd>{' '}
                    know
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--dp-bg-3)] text-[10px] font-mono border border-[var(--dp-border-0)]">
                      2
                    </kbd>{' '}
                    review
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--dp-bg-3)] text-[10px] font-mono border border-[var(--dp-border-0)]">
                      3
                    </kbd>{' '}
                    hard
                  </span>
                </>
              )}
              {!flipped && active?.hint && (
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-[var(--dp-bg-3)] text-[10px] font-mono border border-[var(--dp-border-0)]">
                    H
                  </kbd>{' '}
                  hint
                </span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
