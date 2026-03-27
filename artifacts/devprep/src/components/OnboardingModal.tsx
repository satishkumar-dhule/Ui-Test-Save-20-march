import { useState, useMemo, useRef, useEffect } from 'react'
import type { Channel } from '@/data/channels'
import { useChannels } from '@/hooks/useChannels'

function CheckIcon({ size = 12, color }: { size?: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="2,8 6,12 14,4" />
    </svg>
  )
}

export function ChannelCard({
  channel,
  selected,
  onToggle,
}: {
  channel: Channel
  selected: boolean
  onToggle: () => void
}) {
  const cardRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (document.activeElement === cardRef.current) {
          e.preventDefault()
          onToggle()
        }
      }
    }

    const card = cardRef.current
    card?.addEventListener('keydown', handleKeyDown as EventListener)
    return () => card?.removeEventListener('keydown', handleKeyDown as EventListener)
  }, [onToggle])

  return (
    <button
      ref={cardRef}
      onClick={onToggle}
      data-testid={`onboarding-channel-${channel.id}`}
      className="glass-subtle flex items-start gap-3 p-3 rounded-xl text-left w-full glass-transition cursor-pointer btn-micro touch-target"
      style={{
        borderColor: selected ? channel.color + '66' : undefined,
        background: selected ? channel.color + '0f' : undefined,
        boxShadow: selected ? `0 0 0 1px ${channel.color}33` : undefined,
      }}
      role="checkbox"
      aria-checked={selected}
      aria-label={`${channel.name} - ${channel.description}`}
      tabIndex={0}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
        style={{
          background: channel.color + '22',
          border: `1px solid ${channel.color}44`,
        }}
        aria-hidden="true"
      >
        {channel.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm font-semibold text-foreground leading-tight">
            {channel.name}
          </span>
          {channel.certCode && (
            <span
              className="glass-badge"
              style={{
                color: channel.color,
                background: channel.color + '20',
                border: `1px solid ${channel.color}44`,
              }}
            >
              {channel.certCode}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
          {channel.description}
        </p>
      </div>
      <div
        className="w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 transition-all duration-150"
        style={{
          border: `1.5px solid ${selected ? channel.color : 'hsl(var(--border))'}`,
          background: selected ? channel.color : 'transparent',
        }}
        aria-hidden="true"
      >
        {selected && <CheckIcon color="#fff" />}
      </div>
    </button>
  )
}

interface OnboardingModalProps {
  onDone: (selected: Set<string>) => void
  initialSelected?: Set<string>
  theme?: 'dark' | 'light'
}

const DRAFT_KEY = 'devprep:onboarding-draft'

function loadDraft(): Set<string> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const arr = JSON.parse(raw)
    if (Array.isArray(arr) && arr.length > 0) return new Set(arr)
  } catch {
    /* ignore */
  }
  return null
}

export function OnboardingModal({ onDone, initialSelected }: OnboardingModalProps) {
  const channels = useChannels()
  const techChannels = useMemo(() => channels.filter(c => c.type === 'tech'), [channels])
  const certChannels = useMemo(() => channels.filter(c => c.type === 'cert'), [channels])

  const [selected, setSelected] = useState<Set<string>>(() => {
    if (initialSelected && initialSelected.size > 0) {
      return initialSelected
    }
    const draft = loadDraft()
    if (draft && draft.size > 0) {
      return draft
    }
    return new Set(['javascript'])
  })
  const modalRef = useRef<HTMLDivElement>(null)
  const doneButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    doneButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Persist in-progress selections to localStorage so a refresh doesn't lose work
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify([...selected]))
    } catch {
      /* ignore */
    }
  }, [selected])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleDone = () => {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      /* ignore */
    }
    onDone(new Set(selected))
  }

  const techSelected = techChannels.filter(c => selected.has(c.id)).length
  const certSelected = certChannels.filter(c => selected.has(c.id)).length

  return (
    <div
      className="glass-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-description"
    >
      <div
        ref={modalRef}
        className="glass-card-lg w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}
        data-testid="onboarding-modal"
      >
        {/* Hero header */}
        <div
          className="px-6 pt-8 pb-6 border-b border-border text-center"
          style={{ background: 'hsl(var(--sidebar))' }}
        >
          <div className="text-4xl mb-3" aria-hidden="true">
            🎯
          </div>
          <h1 id="onboarding-title" className="text-xl font-bold text-foreground mb-1">
            Welcome to DevPrep
          </h1>
          <p id="onboarding-description" className="text-sm text-muted-foreground max-w-md mx-auto">
            Choose the tech topics and certifications you want to prep for. You'll only see content
            for your selected tracks.
          </p>
        </div>

        {/* Channel selection */}
        <div className="overflow-y-auto flex-1">
          <div className="px-6 py-4">
            <div
              className="flex items-center gap-2 mb-3"
              role="group"
              aria-label="Tech Topics selection"
            >
              <span className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">
                Tech Topics
              </span>
              {techSelected > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 rounded-full bg-primary/15 text-primary"
                  aria-live="polite"
                >
                  {techSelected} selected
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {techChannels.map(ch => (
                <ChannelCard
                  key={ch.id}
                  channel={ch}
                  selected={selected.has(ch.id)}
                  onToggle={() => toggle(ch.id)}
                />
              ))}
            </div>
          </div>

          <div className="px-6 pb-6">
            <div
              className="flex items-center gap-2 mb-3"
              role="group"
              aria-label="Certifications selection"
            >
              <span className="text-[11px] font-bold text-muted-foreground tracking-widest uppercase">
                Certifications
              </span>
              {certSelected > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 rounded-full"
                  style={{
                    background: 'hsl(var(--chart-3) / 0.15)',
                    color: 'hsl(var(--chart-3))',
                  }}
                  aria-live="polite"
                >
                  {certSelected} selected
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {certChannels.map(ch => (
                <ChannelCard
                  key={ch.id}
                  channel={ch}
                  selected={selected.has(ch.id)}
                  onToggle={() => toggle(ch.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t border-border flex items-center justify-between gap-4"
          style={{ background: 'hsl(var(--sidebar))' }}
        >
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {selected.size === 0
              ? 'Select at least one track to continue'
              : `${selected.size} track${selected.size === 1 ? '' : 's'} selected`}
          </span>
          <button
            ref={doneButtonRef}
            data-testid="onboarding-done-btn"
            disabled={selected.size === 0}
            onClick={handleDone}
            className="px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed btn-micro touch-target"
            style={{
              background: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
            }}
            aria-disabled={selected.size === 0}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
