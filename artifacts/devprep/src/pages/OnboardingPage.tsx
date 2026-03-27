import { useState, useMemo, useEffect, useCallback } from 'react'
import type { JobRole, SkillLevel } from '@/data/channels'
import { JOB_ROLES, SKILL_LEVELS, JOB_ROLE_PRESETS } from '@/data/channels'
import { useChannels } from '@/hooks/useChannels'
import { useToast } from '@/hooks/use-toast'
import {
  Zap,
  Check,
  ChevronRight,
  ChevronLeft,
  Search,
  X,
  Sparkles,
  Rocket,
  BookOpen,
  Award,
  Filter,
  ArrowRight,
  CheckCircle2,
  Circle,
  Code2,
  Shield,
  Database,
  Globe,
  Cpu,
  Server,
  Terminal,
  Layers,
  Braces,
  FileCode2,
  Boxes,
  Container,
  Network,
  Binary,
  GitBranch,
  Cloud,
  Lock,
  GraduationCap,
  Mountain,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

/* ── Channel ID → Lucide icon map ────────────────────────────────────── */
const CHANNEL_ICONS: Record<string, LucideIcon> = {
  javascript: Zap,
  typescript: FileCode2,
  react: Code2,
  vue: Globe,
  angular: Braces,
  node: Server,
  python: Terminal,
  java: Cpu,
  go: Zap,
  rust: Shield,
  algorithms: Binary,
  'system-design': Layers,
  devops: Workflow,
  kubernetes: Container,
  networking: Network,
  sql: Database,
  postgresql: Database,
  docker: Boxes,
  'aws-saa': Cloud,
  'aws-dev': Cloud,
  'aws-ai': Cloud,
  cka: GraduationCap,
  terraform: Mountain,
}

/* Fallback for channels not in the map */
function getChannelIcon(id: string): LucideIcon {
  return CHANNEL_ICONS[id] || BookOpen
}

/* ── Job role icon map ─────────────────────────────────────────────── */
const JOB_ROLE_ICONS: Record<string, LucideIcon> = {
  frontend: Code2,
  backend: Server,
  fullstack: Layers,
  devops: Workflow,
  'data-ai': Database,
  mobile: Globe,
  security: Lock,
  'engineering-manager': GitBranch,
  systems: Cpu,
}

/* ── Skill level icon map ──────────────────────────────────────────── */
const SKILL_LEVEL_ICONS: Record<string, LucideIcon> = {
  beginner: Sparkles,
  intermediate: Rocket,
  advanced: Award,
}

interface OnboardingPageProps {
  onDone: (selected: Set<string>) => void
  initialSelected?: Set<string>
}

const DRAFT_KEY = 'devprep:onboarding-draft'

function loadDraft(): Set<string> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const arr = JSON.parse(raw)
    if (Array.isArray(arr) && arr.length > 0) return new Set(arr)
  } catch {}
  return null
}

type Step = 'welcome' | 'presets' | 'channels' | 'review'

/* ──────────────────────────────────────────────────────────────────── */

export function OnboardingPage({ onDone, initialSelected }: OnboardingPageProps) {
  const { channels } = useChannels()
  const { toast } = useToast()

  const [selected, setSelected] = useState<Set<string>>(() =>
    initialSelected && initialSelected.size > 0
      ? initialSelected
      : (loadDraft() ?? new Set(['javascript']))
  )
  const [step, setStep] = useState<Step>('welcome')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'tech' | 'cert'>('all')
  const [activeJobRole, setActiveJobRole] = useState<JobRole | null>(null)

  /* persist draft */
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify([...selected]))
    } catch {}
  }, [selected])

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const handleJobRoleClick = useCallback(
    (roleId: JobRole) => {
      if (activeJobRole === roleId) {
        setActiveJobRole(null)
      } else {
        setActiveJobRole(roleId)
        const presetChannels = JOB_ROLE_PRESETS[roleId] || []
        setSelected(prev => {
          const next = new Set(prev)
          presetChannels.forEach(ch => next.add(ch))
          return next
        })
        const roleLabel = JOB_ROLES.find(r => r.id === roleId)?.label || roleId
        toast({
          title: `${roleLabel} preset applied`,
          description: `Added ${presetChannels.length} recommended channels.`,
          duration: 2000,
        })
      }
    },
    [activeJobRole, toast]
  )

  const clearAllFilters = useCallback(() => {
    setSearchQuery('')
    setActiveTab('all')
  }, [])

  const filteredChannels = useMemo(() => {
    let result = channels
    if (activeTab === 'tech') result = result.filter(ch => ch.type === 'tech')
    else if (activeTab === 'cert') result = result.filter(ch => ch.type === 'cert')
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        ch =>
          ch.name.toLowerCase().includes(q) ||
          ch.description.toLowerCase().includes(q) ||
          ch.id.toLowerCase().includes(q)
      )
    }
    return result
  }, [channels, activeTab, searchQuery])

  const techCount = filteredChannels.filter(c => c.type === 'tech').length
  const certCount = filteredChannels.filter(c => c.type === 'cert').length

  const selectRecommended = useCallback(() => {
    const recommended = [
      'javascript',
      'typescript',
      'react',
      'python',
      'sql',
      'algorithms',
      'system-design',
      'devops',
    ]
    setSelected(prev => {
      const next = new Set(prev)
      recommended.forEach(ch => next.add(ch))
      return next
    })
  }, [])

  const handleDone = () => {
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {}
    onDone(new Set(selected))
  }

  const stepIndex: Record<Step, number> = { welcome: 0, presets: 1, channels: 2, review: 3 }
  const steps: { id: Step; label: string; icon: LucideIcon }[] = [
    { id: 'welcome', label: 'Welcome', icon: Sparkles },
    { id: 'presets', label: 'Quick Start', icon: Rocket },
    { id: 'channels', label: 'Channels', icon: BookOpen },
    { id: 'review', label: 'Review', icon: CheckCircle2 },
  ]

  const currentIdx = stepIndex[step]
  const progress = ((currentIdx + 1) / steps.length) * 100

  const goNext = () => {
    const order: Step[] = ['welcome', 'presets', 'channels', 'review']
    const next = currentIdx + 1
    if (next < order.length) setStep(order[next])
  }
  const goPrev = () => {
    const order: Step[] = ['welcome', 'presets', 'channels', 'review']
    const prev = currentIdx - 1
    if (prev >= 0) setStep(order[prev])
  }

  /* ── render ──────────────────────────────────────────────────────── */

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'var(--dp-bg-0)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
      data-testid="onboarding-modal"
    >
      {/* ── Progress bar ─────────────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--dp-glass-0)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--dp-border-1)',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 24px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            {steps.map((s, i) => {
              const Icon = s.icon
              const active = i === currentIdx
              const done = i < currentIdx
              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flex: i < steps.length - 1 ? 1 : undefined,
                  }}
                >
                  <button
                    onClick={() => setStep(s.id)}
                    aria-label={`Go to step ${i + 1}: ${s.label}`}
                    aria-current={active ? 'step' : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderRadius: 'var(--dp-r-md)',
                      border: 'none',
                      cursor: 'pointer',
                      background: active
                        ? 'var(--dp-blue-dim)'
                        : done
                          ? 'var(--dp-bg-2)'
                          : 'transparent',
                      color: active
                        ? 'var(--dp-blue)'
                        : done
                          ? 'var(--dp-text-1)'
                          : 'var(--dp-text-3)',
                      fontWeight: active ? 700 : done ? 500 : 400,
                      fontSize: 12.5,
                      transition: 'all var(--dp-dur-fast)',
                      opacity: done || active ? 1 : 0.5,
                    }}
                  >
                    {done ? <Check size={13} /> : <Icon size={13} />}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < steps.length - 1 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        borderRadius: 1,
                        background: done ? 'var(--dp-blue)' : 'var(--dp-bg-3)',
                        transition: 'background var(--dp-dur-base)',
                      }}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <div
            style={{ height: 3, borderRadius: 2, background: 'var(--dp-bg-3)', overflow: 'hidden' }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--dp-blue), var(--dp-purple))',
                borderRadius: 2,
                transition: 'width 0.4s var(--dp-ease)',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Step content ─────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          maxWidth: 900,
          margin: '0 auto',
          padding: '32px 24px 120px',
          width: '100%',
        }}
      >
        {/* WELCOME */}
        {step === 'welcome' && (
          <div
            style={{
              textAlign: 'center',
              maxWidth: 560,
              margin: '0 auto',
              animation: 'dp-fade-in 0.3s ease-out',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 'var(--dp-r-xl)',
                background: 'linear-gradient(135deg, var(--dp-blue), var(--dp-purple))',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 48px var(--dp-blue-glow), 0 8px 32px rgba(0,0,0,0.4)',
                marginBottom: 28,
              }}
            >
              <Zap size={32} color="#fff" strokeWidth={2.5} />
            </div>
            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 900,
                color: 'var(--dp-text-0)',
                letterSpacing: '-1px',
                marginBottom: 14,
                lineHeight: 1.15,
              }}
            >
              Your interview prep,
              <br />
              <span
                style={{
                  background: 'linear-gradient(90deg, var(--dp-blue), var(--dp-purple))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                perfectly tailored.
              </span>
            </h1>
            <p
              style={{
                fontSize: 16,
                color: 'var(--dp-text-2)',
                margin: '0 auto 32px',
                lineHeight: 1.65,
              }}
            >
              Pick the technologies and certifications you're preparing for. We'll focus your study
              content on what matters most.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 28,
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: 40,
              }}
            >
              {[
                { value: `${channels.length}+`, label: 'Channels', icon: BookOpen },
                { value: '5', label: 'Study Modes', icon: Layers },
                { value: '1000+', label: 'Questions', icon: Braces },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <stat.icon size={18} style={{ color: 'var(--dp-blue)', marginBottom: 6 }} />
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--dp-text-0)' }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--dp-text-3)', marginTop: 2 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={goNext}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 36px',
                borderRadius: 'var(--dp-r-lg)',
                background: 'linear-gradient(135deg, var(--dp-blue), var(--dp-purple))',
                color: '#fff',
                border: 'none',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: 'var(--dp-shadow-blue)',
                transition: 'all var(--dp-dur-base)',
                letterSpacing: '-0.2px',
              }}
            >
              Get Started <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* PRESETS */}
        {step === 'presets' && (
          <div style={{ animation: 'dp-fade-in 0.3s ease-out' }}>
            <div style={{ marginBottom: 28 }}>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'var(--dp-text-0)',
                  marginBottom: 6,
                  letterSpacing: '-0.5px',
                }}
              >
                Quick Start Presets
              </h2>
              <p style={{ fontSize: 14, color: 'var(--dp-text-2)', lineHeight: 1.5 }}>
                Select your role to auto-populate recommended channels. You can always customize
                later.
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 10,
              }}
            >
              {JOB_ROLES.map(role => {
                const RoleIcon = JOB_ROLE_ICONS[role.id] || Code2
                const isActive = activeJobRole === role.id
                return (
                  <button
                    key={role.id}
                    onClick={() => handleJobRoleClick(role.id)}
                    aria-pressed={isActive}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '20px 14px',
                      borderRadius: 'var(--dp-r-lg)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: `1.5px solid ${isActive ? 'rgba(56,139,253,0.45)' : 'var(--dp-border-1)'}`,
                      background: isActive ? 'var(--dp-blue-dim)' : 'var(--dp-glass-1)',
                      transition: 'all var(--dp-dur-fast)',
                      position: 'relative',
                      boxShadow: isActive ? 'var(--dp-shadow-blue)' : 'none',
                    }}
                  >
                    {isActive && (
                      <CheckCircle2
                        size={14}
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          color: 'var(--dp-blue)',
                        }}
                      />
                    )}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--dp-r-md)',
                        background: isActive ? 'rgba(56,139,253,0.15)' : 'var(--dp-bg-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,
                        transition: 'all var(--dp-dur-fast)',
                      }}
                    >
                      <RoleIcon
                        size={20}
                        style={{ color: isActive ? 'var(--dp-blue)' : 'var(--dp-text-2)' }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: 'var(--dp-text-0)',
                        lineHeight: 1.3,
                        marginBottom: 4,
                      }}
                    >
                      {role.label}
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--dp-text-3)', lineHeight: 1.4 }}>
                      {role.description}
                    </span>
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 28 }}>
              <button
                onClick={selectRecommended}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  borderRadius: 'var(--dp-r-md)',
                  border: '1px solid rgba(56,139,253,0.3)',
                  background: 'var(--dp-blue-dim)',
                  color: 'var(--dp-blue)',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <Sparkles size={14} /> Use Recommended
              </button>
              <button
                onClick={goNext}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  borderRadius: 'var(--dp-r-md)',
                  border: 'none',
                  background: 'var(--dp-bg-2)',
                  color: 'var(--dp-text-1)',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Skip — choose manually <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* CHANNELS */}
        {step === 'channels' && (
          <div style={{ animation: 'dp-fade-in 0.3s ease-out' }}>
            <div style={{ marginBottom: 20 }}>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: 'var(--dp-text-0)',
                  marginBottom: 6,
                  letterSpacing: '-0.5px',
                }}
              >
                Choose Your Channels
              </h2>
              <p style={{ fontSize: 14, color: 'var(--dp-text-2)', lineHeight: 1.5 }}>
                Select the topics you want to study. Each channel includes questions, flashcards,
                and study materials.
              </p>
            </div>

            {/* Toolbar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: 'var(--dp-r-lg)',
                background: 'var(--dp-glass-1)',
                border: '1px solid var(--dp-border-1)',
                marginBottom: 16,
              }}
            >
              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
                <Search
                  size={13}
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--dp-text-3)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search channels..."
                  aria-label="Search channels"
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 32px',
                    fontSize: 13,
                    background: 'var(--dp-bg-2)',
                    border: '1px solid var(--dp-border-1)',
                    borderRadius: 'var(--dp-r-md)',
                    color: 'var(--dp-text-0)',
                    outline: 'none',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--dp-text-3)',
                      display: 'flex',
                    }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: 3,
                  padding: 3,
                  borderRadius: 'var(--dp-r-md)',
                  background: 'var(--dp-bg-2)',
                  border: '1px solid var(--dp-border-1)',
                }}
              >
                {[
                  { id: 'all' as const, label: 'All', count: filteredChannels.length },
                  { id: 'tech' as const, label: 'Tech', count: techCount },
                  { id: 'cert' as const, label: 'Certs', count: certCount },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    aria-pressed={activeTab === tab.id}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--dp-r-sm)',
                      fontSize: 12.5,
                      fontWeight: activeTab === tab.id ? 700 : 400,
                      cursor: 'pointer',
                      border: 'none',
                      background: activeTab === tab.id ? 'var(--dp-bg-1)' : 'transparent',
                      color: activeTab === tab.id ? 'var(--dp-text-0)' : 'var(--dp-text-2)',
                      transition: 'all var(--dp-dur-fast)',
                      boxShadow: activeTab === tab.id ? 'var(--dp-shadow-sm)' : 'none',
                    }}
                  >
                    {tab.label}
                    <span
                      style={{
                        fontSize: 10,
                        marginLeft: 4,
                        color: activeTab === tab.id ? 'var(--dp-text-2)' : 'var(--dp-text-3)',
                      }}
                    >
                      ({tab.count})
                    </span>
                  </button>
                ))}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                <button
                  onClick={() => setSelected(new Set(filteredChannels.map(ch => ch.id)))}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 'var(--dp-r-md)',
                    border: '1px solid var(--dp-border-1)',
                    background: 'var(--dp-bg-2)',
                    color: 'var(--dp-text-2)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 'var(--dp-r-md)',
                    border: '1px solid var(--dp-border-1)',
                    background: 'var(--dp-bg-2)',
                    color: 'var(--dp-text-2)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Clear
                </button>
                {(searchQuery || activeTab !== 'all') && (
                  <button
                    onClick={clearAllFilters}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '5px 10px',
                      borderRadius: 'var(--dp-r-md)',
                      background: 'none',
                      border: '1px solid var(--dp-border-1)',
                      color: 'var(--dp-text-3)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <X size={11} /> Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Selected count */}
            <div style={{ fontSize: 13, color: 'var(--dp-text-3)', marginBottom: 14 }}>
              {filteredChannels.length} available ·{' '}
              <strong style={{ color: 'var(--dp-text-1)' }}>{selected.size}</strong> selected
            </div>

            {/* Channel grid */}
            {filteredChannels.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 24px',
                  borderRadius: 'var(--dp-r-xl)',
                  border: '1px dashed var(--dp-border-1)',
                  background: 'var(--dp-glass-1)',
                }}
              >
                <Search size={36} style={{ color: 'var(--dp-text-3)', marginBottom: 12 }} />
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--dp-text-0)',
                    marginBottom: 8,
                  }}
                >
                  No channels found
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--dp-text-2)', marginBottom: 20 }}>
                  Try adjusting your search or filters.
                </div>
                <button
                  onClick={clearAllFilters}
                  style={{
                    padding: '9px 22px',
                    borderRadius: 'var(--dp-r-md)',
                    border: 'none',
                    background: 'var(--dp-blue)',
                    color: '#fff',
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: 10,
                }}
              >
                {filteredChannels.map(ch => (
                  <OnboardingChannelCard
                    key={ch.id}
                    channel={ch}
                    selected={selected.has(ch.id)}
                    onToggle={() => toggle(ch.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVIEW */}
        {step === 'review' && (
          <div style={{ maxWidth: 560, margin: '0 auto', animation: 'dp-fade-in 0.3s ease-out' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 'var(--dp-r-xl)',
                  background:
                    selected.size > 0
                      ? 'linear-gradient(135deg, var(--dp-blue), var(--dp-purple))'
                      : 'var(--dp-bg-3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  boxShadow: selected.size > 0 ? '0 0 32px var(--dp-blue-glow)' : 'none',
                }}
              >
                {selected.size > 0 ? (
                  <CheckCircle2 size={26} color="#fff" />
                ) : (
                  <Circle size={26} style={{ color: 'var(--dp-text-3)' }} />
                )}
              </div>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: 'var(--dp-text-0)',
                  marginBottom: 8,
                  letterSpacing: '-0.5px',
                }}
              >
                {selected.size > 0 ? "You're all set!" : 'No channels selected'}
              </h2>
              <p style={{ fontSize: 14, color: 'var(--dp-text-2)', lineHeight: 1.6 }}>
                {selected.size > 0
                  ? `You've selected ${selected.size} channel${selected.size !== 1 ? 's' : ''}. Your study content will be tailored to these topics.`
                  : 'Go back and select at least one channel to start learning.'}
              </p>
            </div>

            {selected.size > 0 && (
              <>
                {/* Selected tech channels */}
                {channels.filter(c => selected.has(c.id) && c.type === 'tech').length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--dp-text-3)',
                        marginBottom: 10,
                        paddingLeft: 4,
                      }}
                    >
                      Tech Channels
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {channels
                        .filter(c => selected.has(c.id) && c.type === 'tech')
                        .map(ch => {
                          const Icon = getChannelIcon(ch.id)
                          return (
                            <div
                              key={ch.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                borderRadius: 'var(--dp-r-md)',
                                background: ch.color + '12',
                                border: `1px solid ${ch.color}30`,
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: 'var(--dp-text-0)',
                              }}
                            >
                              <Icon size={14} style={{ color: ch.color }} />
                              {ch.name}
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Selected cert channels */}
                {channels.filter(c => selected.has(c.id) && c.type === 'cert').length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--dp-text-3)',
                        marginBottom: 10,
                        paddingLeft: 4,
                      }}
                    >
                      Certifications
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {channels
                        .filter(c => selected.has(c.id) && c.type === 'cert')
                        .map(ch => {
                          const Icon = getChannelIcon(ch.id)
                          return (
                            <div
                              key={ch.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 12px',
                                borderRadius: 'var(--dp-r-md)',
                                background: ch.color + '12',
                                border: `1px solid ${ch.color}30`,
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: 'var(--dp-text-0)',
                              }}
                            >
                              <Icon size={14} style={{ color: ch.color }} />
                              {ch.name}
                              {ch.certCode && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: 'var(--dp-purple)',
                                    fontWeight: 500,
                                  }}
                                >
                                  {ch.certCode}
                                </span>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Sticky footer nav ──────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          background: 'var(--dp-glass-0)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--dp-border-0)',
          padding: '14px 20px',
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {/* Progress indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 80,
                height: 4,
                borderRadius: 'var(--dp-r-full)',
                background: 'var(--dp-bg-3)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: 'var(--dp-r-full)',
                  background: 'var(--dp-blue)',
                  width: `${progress}%`,
                  transition: 'width 0.4s var(--dp-ease)',
                }}
              />
            </div>
            <span style={{ fontSize: 13, color: 'var(--dp-text-2)' }} aria-live="polite">
              {selected.size === 0 ? (
                <span style={{ color: '#ff7b72' }}>Select at least one channel</span>
              ) : (
                <>
                  <strong style={{ color: 'var(--dp-text-0)' }}>{selected.size}</strong> channel
                  {selected.size !== 1 ? 's' : ''}
                </>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {step !== 'welcome' && (
              <button
                onClick={goPrev}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 20px',
                  borderRadius: 'var(--dp-r-lg)',
                  border: '1px solid var(--dp-border-1)',
                  background: 'var(--dp-bg-2)',
                  color: 'var(--dp-text-1)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--dp-dur-fast)',
                }}
              >
                <ChevronLeft size={15} /> Back
              </button>
            )}

            {step === 'review' ? (
              <button
                data-testid="onboarding-done-btn"
                disabled={selected.size === 0}
                onClick={handleDone}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '11px 28px',
                  borderRadius: 'var(--dp-r-lg)',
                  background:
                    selected.size > 0
                      ? 'linear-gradient(135deg, var(--dp-blue), var(--dp-purple))'
                      : 'var(--dp-bg-3)',
                  color: selected.size > 0 ? '#fff' : 'var(--dp-text-3)',
                  border: 'none',
                  fontSize: 14.5,
                  fontWeight: 800,
                  cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
                  boxShadow: selected.size > 0 ? 'var(--dp-shadow-blue)' : 'none',
                  transition: 'all var(--dp-dur-base)',
                  letterSpacing: '-0.2px',
                  opacity: selected.size === 0 ? 0.5 : 1,
                }}
                aria-disabled={selected.size === 0}
              >
                <Rocket size={15} /> Start Learning
              </button>
            ) : (
              <button
                onClick={goNext}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 22px',
                  borderRadius: 'var(--dp-r-lg)',
                  background: 'var(--dp-bg-1)',
                  border: '1px solid var(--dp-border-1)',
                  color: 'var(--dp-text-0)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all var(--dp-dur-fast)',
                  boxShadow: 'var(--dp-shadow-sm)',
                }}
              >
                Next <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Onboarding channel card (inline) ──────────────────────────────── */

function OnboardingChannelCard({
  channel,
  selected,
  onToggle,
}: {
  channel: import('@/data/channels').Channel
  selected: boolean
  onToggle: () => void
}) {
  const Icon = getChannelIcon(channel.id)

  return (
    <button
      onClick={onToggle}
      data-testid={`onboarding-channel-${channel.id}`}
      role="checkbox"
      aria-checked={selected}
      aria-label={`${channel.name} - ${channel.description}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        borderRadius: 'var(--dp-r-lg)',
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
        border: `1.5px solid ${selected ? channel.color + '55' : 'var(--dp-border-1)'}`,
        background: selected ? channel.color + '0d' : 'var(--dp-glass-1)',
        boxShadow: selected ? `0 0 0 1px ${channel.color}22, 0 2px 8px ${channel.color}10` : 'none',
        transition: 'all var(--dp-dur-fast)',
        position: 'relative',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--dp-r-md)',
          background: channel.color + '18',
          border: `1px solid ${channel.color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} style={{ color: channel.color }} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span
            style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--dp-text-0)', lineHeight: 1.2 }}
          >
            {channel.name}
          </span>
          {channel.certCode && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: 'var(--dp-r-sm)',
                background: 'var(--dp-purple-dim)',
                color: 'var(--dp-purple)',
                border: '1px solid rgba(163,113,247,0.25)',
              }}
            >
              {channel.certCode}
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: 11.5,
            color: 'var(--dp-text-3)',
            lineHeight: 1.45,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {channel.description}
        </p>
      </div>

      {/* Checkbox */}
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 'var(--dp-r-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
          border: `1.5px solid ${selected ? channel.color : 'var(--dp-border-1)'}`,
          background: selected ? channel.color : 'transparent',
          transition: 'all var(--dp-dur-fast)',
        }}
      >
        {selected && <Check size={12} color="#fff" strokeWidth={3} />}
      </div>
    </button>
  )
}

/* Re-export aliases for backwards compat */
export { OnboardingPage as default }
