import type { Section } from '@/hooks/app/useAppState'
import { useEffect, useRef, useState } from 'react'

interface SectionTabsProps {
  section: Section
  sectionCounts: Record<Section, number>
  onSectionChange: (section: Section) => void
}

const TABS: { id: Section; label: string; icon: string }[] = [
  { id: 'qa', label: 'Q & A', icon: '📖' },
  { id: 'flashcards', label: 'Flashcards', icon: '🃏' },
  { id: 'coding', label: 'Coding', icon: '💻' },
  { id: 'exam', label: 'Exam', icon: '📝' },
  { id: 'voice', label: 'Voice Lab', icon: '🎤' },
]

export function SectionTabs({ section, sectionCounts, onSectionChange }: SectionTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(false)

  useEffect(() => {
    const updateScrollState = () => {
      if (!tabsRef.current) return
      const container = tabsRef.current
      setShowLeft(container.scrollLeft > 20)
      setShowRight(container.scrollWidth - container.scrollLeft - container.clientWidth > 20)
    }

    const handleScroll = () => updateScrollState()
    const handleResize = () => updateScrollState()

    tabsRef.current?.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)

    // Initial check
    updateScrollState()

    return () => {
      tabsRef.current?.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const scrollLeft = () => {
    tabsRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
  }

  const scrollRight = () => {
    tabsRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
  }

  return (
    <div
      className="relative flex-shrink-0 flex items-center border-b border-border/50 px-4 bg-background overflow-x-hidden min-h-[56px]"
      data-testid="section-tabs"
    >
      <div className="flex-1 overflow-x-auto pb-1" ref={tabsRef}>
        <div className="flex items-center gap-0 px-2">
          {TABS.map(tab => (
            <SectionTab
              key={tab.id}
              tab={tab}
              isActive={section === tab.id}
              count={sectionCounts[tab.id]}
              onClick={() => onSectionChange(tab.id)}
            />
          ))}
        </div>
      </div>
      {showLeft && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-0 bottom-0 flex items-center justify-center px-2 z-10 text-muted-foreground hover:text-primary transition-colors duration-150"
          aria-label="Scroll left"
        >
          <span className="text-xs">›</span>
        </button>
      )}
      {showRight && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-0 bottom-0 flex items-center justify-center px-2 z-10 text-muted-foreground hover:text-primary transition-colors duration-150"
          aria-label="Scroll right"
        >
          <span className="text-xs">‹</span>
        </button>
      )}
    </div>
  )
}

function SectionTab({
  tab,
  isActive,
  count,
  onClick,
}: {
  tab: { id: Section; label: string; icon: string }
  isActive: boolean
  count: number
  onClick: () => void
}) {
  return (
    <button
      data-testid={`section-tab-${tab.id}`}
      onClick={onClick}
      className="relative flex items-center gap-2 px-4 h-full shrink-0 transition-all duration-200 group"
      aria-label={`${tab.label} section`}
    >
      <span className="text-sm font-medium uppercase tracking-wider">{tab.label}</span>
      {count > 0 && (
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full transition-all duration-150"
          style={{
            background: isActive ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
            color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
          }}
        >
          {count}
        </span>
      )}
      {/* Active underline */}
      <span
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full transition-all duration-200"
        style={{
          background: isActive ? 'hsl(var(--primary) / 0.5)' : 'transparent',
        }}
      />
    </button>
  )
}
