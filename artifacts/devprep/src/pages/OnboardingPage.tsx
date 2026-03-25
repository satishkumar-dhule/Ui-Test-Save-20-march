import { useState, useMemo, useEffect, useCallback } from 'react'
import type { JobRole, SkillLevel } from '@/data/channels'
import { JOB_ROLES, SKILL_LEVELS, JOB_ROLE_PRESETS } from '@/data/channels'
import { useChannels } from '@/hooks/useChannels'
import { ChannelCard } from '@/components/OnboardingModal'
import { useToast } from '@/hooks/use-toast'
import { Search, Sparkles, CheckCircle2, X, Zap, Filter } from 'lucide-react'

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

type TabType = 'all' | 'tech' | 'cert'

export function OnboardingPage({ onDone, initialSelected }: OnboardingPageProps) {
  const channels = useChannels()

  const [selected, setSelected] = useState<Set<string>>(() =>
    initialSelected && initialSelected.size > 0
      ? initialSelected
      : (loadDraft() ?? new Set(['javascript']))
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [activeJobRole, setActiveJobRole] = useState<JobRole | null>(null)
  const [selectedSkillLevels, setSelectedSkillLevels] = useState<Set<SkillLevel>>(new Set())
  const [activeTab, setActiveTab] = useState<TabType>('all')

  const { toast } = useToast()

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify([...selected])) } catch {}
  }, [selected])

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const handleJobRoleClick = useCallback((roleId: JobRole) => {
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
      toast({ title: `${roleLabel} preset applied`, description: `Added ${presetChannels.length} recommended channels.`, duration: 2000 })
    }
  }, [activeJobRole, toast])

  const toggleSkillLevel = useCallback((level: SkillLevel) => {
    setSelectedSkillLevels(prev => {
      const next = new Set(prev)
      next.has(level) ? next.delete(level) : next.add(level)
      return next
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setSearchQuery(''); setSelectedSkillLevels(new Set()); setActiveTab('all'); setActiveJobRole(null)
  }, [])

  const filteredChannels = useMemo(() => {
    let result = channels
    if (activeTab === 'tech') result = result.filter(ch => ch.type === 'tech')
    else if (activeTab === 'cert') result = result.filter(ch => ch.type === 'cert')
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(ch =>
        ch.name.toLowerCase().includes(q) || ch.description.toLowerCase().includes(q) || ch.id.toLowerCase().includes(q)
      )
    }
    if (selectedSkillLevels.size > 0) {
      result = result.filter(ch =>
        !ch.skillLevel || ch.skillLevel.length === 0 || ch.skillLevel.some(level => selectedSkillLevels.has(level))
      )
    }
    return result
  }, [channels, activeTab, searchQuery, selectedSkillLevels])

  const techCount = filteredChannels.filter(c => c.type === 'tech').length
  const certCount = filteredChannels.filter(c => c.type === 'cert').length
  const activeFilterCount = (searchQuery ? 1 : 0) + selectedSkillLevels.size + (activeJobRole ? 1 : 0) + (activeTab !== 'all' ? 1 : 0)

  const selectRecommended = useCallback(() => {
    const recommended = ['javascript','typescript','react','python','sql','algorithms','system-design','devops']
    setSelected(prev => { const next = new Set(prev); recommended.forEach(ch => next.add(ch)); return next })
  }, [])

  const handleDone = () => {
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    onDone(new Set(selected))
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'var(--dp-bg-0)', overflowY: 'auto',
      display: 'flex', flexDirection: 'column',
    }} data-testid="onboarding-modal">

      {/* Hero */}
      <div className="onboarding-hero">
        {/* Logo */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--dp-r-xl)',
            background: 'linear-gradient(135deg, var(--dp-blue), var(--dp-purple))',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px var(--dp-blue-glow), 0 8px 24px rgba(0,0,0,0.4)',
          }}>
            <Zap size={28} color="#fff" strokeWidth={2.5} />
          </div>
        </div>

        <h1 id="onboarding-title" data-testid="onboarding-title" style={{
          fontSize: 'clamp(26px, 4vw, 40px)', fontWeight: 900, color: 'var(--dp-text-0)',
          letterSpacing: '-1px', marginBottom: 14, lineHeight: 1.1,
        }}>
          Your interview prep,<br />
          <span style={{ background: 'linear-gradient(90deg, var(--dp-blue), var(--dp-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            perfectly tailored.
          </span>
        </h1>

        <p style={{ fontSize: 16, color: 'var(--dp-text-2)', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.65 }}>
          Pick the technologies and certifications you're preparing for. We'll focus your study content on what matters most.
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { value: `${channels.length}+`, label: 'Channels' },
            { value: '5', label: 'Study Modes' },
            { value: '1000+', label: 'Questions' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--dp-blue)' }}>{stat.value}</div>
              <div style={{ fontSize: 11.5, color: 'var(--dp-text-3)', marginTop: 1 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, maxWidth: 1200, margin: '0 auto', padding: '32px 20px 120px', width: '100%' }}>

        {/* Job role presets */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Sparkles size={14} style={{ color: 'var(--dp-blue)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dp-text-2)' }}>Quick Start Presets</span>
            <span style={{ fontSize: 12, color: 'var(--dp-text-3)' }}>Auto-select channels for your role</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {JOB_ROLES.map(role => (
              <button key={role.id} onClick={() => handleJobRoleClick(role.id)}
                aria-pressed={activeJobRole === role.id}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '16px 12px', borderRadius: 'var(--dp-r-lg)', textAlign: 'center', cursor: 'pointer',
                  border: `1px solid ${activeJobRole === role.id ? 'rgba(56,139,253,0.4)' : 'var(--dp-border-1)'}`,
                  background: activeJobRole === role.id ? 'var(--dp-blue-dim)' : 'var(--dp-glass-1)',
                  transition: 'all var(--dp-dur-fast)', position: 'relative',
                  boxShadow: activeJobRole === role.id ? 'var(--dp-shadow-blue)' : 'none',
                }}>
                {activeJobRole === role.id && (
                  <CheckCircle2 size={12} style={{ position: 'absolute', top: 8, right: 8, color: 'var(--dp-blue)' }} />
                )}
                <span style={{ fontSize: 26, marginBottom: 8 }}>{role.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dp-text-0)', lineHeight: 1.3, marginBottom: 3 }}>{role.label}</span>
                <span style={{ fontSize: 11, color: 'var(--dp-text-3)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{role.description}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Filters row */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
          padding: '12px 16px', borderRadius: 'var(--dp-r-lg)',
          background: 'var(--dp-glass-1)', border: '1px solid var(--dp-border-1)', marginBottom: 20,
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--dp-text-3)', pointerEvents: 'none' }} />
            <input
              type="search" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search channels..."
              style={{
                width: '100%', padding: '7px 10px 7px 30px', fontSize: 13,
                background: 'var(--dp-bg-2)', border: '1px solid var(--dp-border-1)',
                borderRadius: 'var(--dp-r-md)', color: 'var(--dp-text-0)', outline: 'none',
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dp-text-3)' }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Skill levels */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SKILL_LEVELS.map(level => {
              const isActive = selectedSkillLevels.has(level.id)
              return (
                <button key={level.id} onClick={() => toggleSkillLevel(level.id)} aria-pressed={isActive}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                    borderRadius: 'var(--dp-r-md)', border: `1px solid ${isActive ? 'rgba(56,139,253,0.4)' : 'var(--dp-border-1)'}`,
                    background: isActive ? 'var(--dp-blue-dim)' : 'var(--dp-bg-2)',
                    color: isActive ? 'var(--dp-blue)' : 'var(--dp-text-2)',
                    fontSize: 12.5, cursor: 'pointer', fontWeight: isActive ? 600 : 400,
                    transition: 'all var(--dp-dur-fast)',
                  }}>
                  <span>{level.emoji}</span>{level.label}
                </button>
              )
            })}
          </div>

          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 'var(--dp-r-md)', background: 'none', border: '1px solid var(--dp-border-1)', color: 'var(--dp-text-3)', fontSize: 12, cursor: 'pointer' }}>
              <X size={11} /> Clear filters ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Tabs + controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {/* Tab pills */}
          <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 'var(--dp-r-md)', background: 'var(--dp-bg-2)', border: '1px solid var(--dp-border-1)' }}>
            {[
              { id: 'all' as TabType, label: 'All', count: filteredChannels.length },
              { id: 'tech' as TabType, label: 'Tech', count: techCount },
              { id: 'cert' as TabType, label: 'Certs', count: certCount },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} aria-pressed={activeTab === tab.id}
                style={{
                  padding: '5px 14px', borderRadius: 'var(--dp-r-sm)', fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 400, cursor: 'pointer',
                  border: 'none', background: activeTab === tab.id ? 'var(--dp-bg-1)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--dp-text-0)' : 'var(--dp-text-2)',
                  transition: 'all var(--dp-dur-fast)',
                  boxShadow: activeTab === tab.id ? 'var(--dp-shadow-sm)' : 'none',
                }}>
                {tab.label}
                <span style={{ fontSize: 10.5, marginLeft: 5, color: activeTab === tab.id ? 'var(--dp-text-2)' : 'var(--dp-text-3)' }}>({tab.count})</span>
              </button>
            ))}
          </div>

          <span style={{ fontSize: 13, color: 'var(--dp-text-3)' }}>
            {filteredChannels.length} available · <strong style={{ color: 'var(--dp-text-1)' }}>{selected.size}</strong> selected
          </span>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => setSelected(new Set(filteredChannels.map(ch => ch.id)))}
              style={{ padding: '5px 12px', borderRadius: 'var(--dp-r-md)', border: '1px solid var(--dp-border-1)', background: 'var(--dp-bg-2)', color: 'var(--dp-text-2)', fontSize: 12.5, cursor: 'pointer' }}>
              Select All
            </button>
            <button onClick={() => setSelected(new Set())}
              style={{ padding: '5px 12px', borderRadius: 'var(--dp-r-md)', border: '1px solid var(--dp-border-1)', background: 'var(--dp-bg-2)', color: 'var(--dp-text-2)', fontSize: 12.5, cursor: 'pointer' }}>
              Clear
            </button>
            <button onClick={selectRecommended}
              style={{ padding: '5px 12px', borderRadius: 'var(--dp-r-md)', border: '1px solid rgba(56,139,253,0.3)', background: 'var(--dp-blue-dim)', color: 'var(--dp-blue)', fontSize: 12.5, cursor: 'pointer', fontWeight: 600 }}>
              Recommended
            </button>
          </div>
        </div>

        {/* Channel grid */}
        {filteredChannels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', borderRadius: 'var(--dp-r-xl)', border: '1px dashed var(--dp-border-1)', background: 'var(--dp-glass-1)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔎</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--dp-text-0)', marginBottom: 8 }}>No channels found</div>
            <div style={{ fontSize: 13.5, color: 'var(--dp-text-2)', marginBottom: 20 }}>Try adjusting your search or filters.</div>
            <button onClick={clearAllFilters}
              style={{ padding: '9px 22px', borderRadius: 'var(--dp-r-md)', border: 'none', background: 'var(--dp-blue)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
              Clear all filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
            {filteredChannels.map(ch => (
              <ChannelCard
                key={ch.id}
                channel={ch}
                selected={selected.has(ch.id)}
                onToggle={() => toggle(ch.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky CTA bar */}
      <div style={{
        position: 'sticky', bottom: 0, left: 0, right: 0, zIndex: 10,
        background: 'var(--dp-glass-0)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--dp-border-0)',
        padding: '14px 20px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 80, height: 4, borderRadius: 'var(--dp-r-full)', background: 'var(--dp-bg-3)' }}>
                <div style={{ height: '100%', borderRadius: 'var(--dp-r-full)', background: 'var(--dp-blue)', width: `${Math.min(100, (selected.size / Math.max(1, channels.length)) * 100 * 5)}%`, transition: 'width 0.3s var(--dp-ease)', maxWidth: '100%' }} />
              </div>
              <span style={{ fontSize: 13.5, color: 'var(--dp-text-1)' }} aria-live="polite">
                {selected.size === 0
                  ? <span style={{ color: '#ff7b72' }}>Select at least one channel</span>
                  : <><strong style={{ color: 'var(--dp-text-0)' }}>{selected.size}</strong> channel{selected.size !== 1 ? 's' : ''} selected</>
                }
              </span>
            </div>
            {selected.size > 0 && (
              <span style={{ fontSize: 12, color: 'var(--dp-text-3)' }} className="hidden sm:inline">
                Saved automatically
              </span>
            )}
          </div>

          <button
            data-testid="onboarding-done-btn"
            disabled={selected.size === 0}
            onClick={handleDone}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 28px', borderRadius: 'var(--dp-r-lg)',
              background: selected.size > 0 ? 'linear-gradient(135deg, var(--dp-blue), var(--dp-purple))' : 'var(--dp-bg-3)',
              color: selected.size > 0 ? '#fff' : 'var(--dp-text-3)',
              border: 'none', fontSize: 14.5, fontWeight: 800, cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
              boxShadow: selected.size > 0 ? 'var(--dp-shadow-blue)' : 'none',
              transition: 'all var(--dp-dur-base)', letterSpacing: '-0.2px',
              opacity: selected.size === 0 ? 0.5 : 1,
            }}
            aria-disabled={selected.size === 0}
          >
            <Zap size={15} /> Start Learning →
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingPage
