import { useState, useMemo, useEffect, useCallback } from 'react'
import type { JobRole, SkillLevel } from '@/data/channels'
import { JOB_ROLES, SKILL_LEVELS, JOB_ROLE_PRESETS } from '@/data/channels'
import { useChannels } from '@/hooks/useChannels'
import { ChannelCard } from '@/components/OnboardingModal'

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
  } catch {
    // Ignore parse errors
  }
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

  // Persist draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify([...selected]))
    } catch {
      // Ignore storage errors
    }
  }, [selected])

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
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
      }
    },
    [activeJobRole]
  )

  const toggleSkillLevel = useCallback((level: SkillLevel) => {
    setSelectedSkillLevels(prev => {
      const next = new Set(prev)
      if (next.has(level)) {
        next.delete(level)
      } else {
        next.add(level)
      }
      return next
    })
  }, [])

  // Filter channels based on tab, search, and skill level
  const filteredChannels = useMemo(() => {
    let result = channels

    // Tab filter
    if (activeTab === 'tech') {
      result = result.filter(ch => ch.type === 'tech')
    } else if (activeTab === 'cert') {
      result = result.filter(ch => ch.type === 'cert')
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        ch =>
          ch.name.toLowerCase().includes(q) ||
          ch.description.toLowerCase().includes(q) ||
          ch.id.toLowerCase().includes(q)
      )
    }

    // Skill level filter (OR logic - show channels matching any selected level)
    if (selectedSkillLevels.size > 0) {
      result = result.filter(
        ch => ch.skillLevel?.some(level => selectedSkillLevels.has(level)) ?? false
      )
    }

    return result
  }, [channels, activeTab, searchQuery, selectedSkillLevels])

  const techCount = filteredChannels.filter(c => c.type === 'tech').length
  const certCount = filteredChannels.filter(c => c.type === 'cert').length

  const selectAll = useCallback(() => {
    setSelected(new Set(filteredChannels.map(ch => ch.id)))
  }, [filteredChannels])

  const clearAll = useCallback(() => {
    setSelected(new Set())
  }, [])

  const selectRecommended = useCallback(() => {
    const recommended: string[] = [
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
    } catch {
      // Ignore storage errors
    }
    onDone(new Set(selected))
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-y-auto">
      {/* Hero Section */}
      <div className="border-b border-border" style={{ background: 'hsl(var(--sidebar))' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
          {/* Animated Target Icon */}
          <div className="mb-6 inline-block">
            <div className="relative">
              <div
                className="text-6xl sm:text-7xl animate-pulse"
                style={{
                  animationDuration: '2s',
                  animationTimingFunction: 'cubic-bezier(0.4, 0, 0.6, 1)',
                }}
                aria-hidden="true"
              >
                🎯
              </div>
              <div
                className="absolute inset-0 text-6xl sm:text-7xl blur-xl opacity-30"
                aria-hidden="true"
              >
                🎯
              </div>
            </div>
          </div>

          <h1 id="onboarding-title" className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Welcome to DevPrep
          </h1>
          <p
            id="onboarding-description"
            className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed"
          >
            Choose the tech topics and certifications you want to prep for. You'll only see content
            for your selected tracks.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 min-h-full pb-24">
        {/* Job Role Quick Presets */}
        <section aria-labelledby="job-role-heading" className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span
              id="job-role-heading"
              className="text-xs font-bold text-muted-foreground tracking-widest uppercase"
            >
              Job Role Presets
            </span>
            <span className="text-xs text-muted-foreground/60">
              Click to auto-select relevant channels
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {JOB_ROLES.map(role => (
              <button
                key={role.id}
                onClick={() => handleJobRoleClick(role.id)}
                className={`
                  flex flex-col items-center p-4 rounded-xl border text-center
                  transition-all duration-200 cursor-pointer btn-micro touch-target
                  ${
                    activeJobRole === role.id
                      ? 'border-primary/50 bg-primary/10 shadow-lg shadow-primary/10'
                      : 'border-border bg-card hover:border-border hover:shadow-md'
                  }
                `}
                aria-pressed={activeJobRole === role.id}
              >
                <span className="text-2xl mb-2" aria-hidden="true">
                  {role.emoji}
                </span>
                <span className="text-sm font-semibold text-foreground leading-tight mb-0.5">
                  {role.label}
                </span>
                <span className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                  {role.description}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Skill Level Filter */}
        <section aria-labelledby="skill-level-heading" className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span
              id="skill-level-heading"
              className="text-xs font-bold text-muted-foreground tracking-widest uppercase"
            >
              Skill Level
            </span>
            <span className="text-xs text-muted-foreground/60">
              Filter by experience (OR logic)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SKILL_LEVELS.map(level => {
              const isActive = selectedSkillLevels.has(level.id)
              return (
                <button
                  key={level.id}
                  onClick={() => toggleSkillLevel(level.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium
                    transition-all duration-200 cursor-pointer btn-micro touch-target
                    ${
                      isActive
                        ? 'border-primary/50 bg-primary/10 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-border'
                    }
                  `}
                  aria-pressed={isActive}
                >
                  <span aria-hidden="true">{level.emoji}</span>
                  <span>{level.label}</span>
                </button>
              )
            })}
            {selectedSkillLevels.size > 0 && (
              <button
                onClick={() => setSelectedSkillLevels(new Set())}
                className="flex items-center gap-1 px-3 py-2.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear filter
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            )}
          </div>
        </section>

        {/* Search Bar */}
        <section aria-labelledby="search-heading" className="mb-8">
          <div className="relative max-w-md">
            <span id="search-heading" className="sr-only">
              Search channels
            </span>
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search channels by name, description, or ID..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Clear search"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            )}
          </div>
        </section>

        {/* Category Tabs */}
        <section aria-labelledby="channels-heading">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span
                id="channels-heading"
                className="text-xs font-bold text-muted-foreground tracking-widest uppercase"
              >
                Channels
              </span>
              <span className="text-xs text-muted-foreground/60">
                {filteredChannels.length} available
              </span>
            </div>

            {/* Smart Select Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-card text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                Select All
              </button>
              <button
                onClick={clearAll}
                className="px-3 py-1.5 rounded-md text-xs font-medium border border-border bg-card text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                Clear
              </button>
              <button
                onClick={selectRecommended}
                className="px-3 py-1.5 rounded-md text-xs font-medium border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                Recommended
              </button>
            </div>
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-1 p-1 rounded-lg bg-muted/50 mb-6 w-fit">
            {[
              { id: 'all' as TabType, label: 'All', count: filteredChannels.length },
              { id: 'tech' as TabType, label: 'Tech Topics', count: techCount },
              { id: 'cert' as TabType, label: 'Certifications', count: certCount },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all
                  ${
                    activeTab === tab.id
                      ? 'bg-card text-foreground shadow-sm border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  }
                `}
                aria-pressed={activeTab === tab.id}
              >
                {tab.label}
                <span className="ml-1.5 text-xs text-muted-foreground/60">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Channels Grid */}
          {filteredChannels.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-xl">
              <div className="text-4xl mb-3" aria-hidden="true">
                🔍
              </div>
              <p className="text-muted-foreground text-sm">No channels match your filters.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        </section>
      </div>

      {/* Sticky Bottom Bar */}
      <div
        className="sticky bottom-0 left-0 right-0 border-t border-border px-4 py-4 sm:px-6 z-10"
        style={{
          background: 'hsl(var(--card) / 0.95)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {selected.size === 0 ? (
              <span className="text-destructive">Select at least one track to continue</span>
            ) : (
              <>
                <span className="font-semibold text-foreground">{selected.size}</span> track
                {selected.size === 1 ? '' : 's'} selected
              </>
            )}
          </span>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-muted-foreground/60">
              {selected.size > 0 && 'Your selection is saved automatically'}
            </span>
            <button
              data-testid="onboarding-done-btn"
              disabled={selected.size === 0}
              onClick={handleDone}
              className="px-6 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed btn-micro touch-target"
              style={{
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
              }}
              aria-disabled={selected.size === 0}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Bottom spacing for fixed bar */}
      <div className="h-20" />
    </div>
  )
}

export default OnboardingPage
