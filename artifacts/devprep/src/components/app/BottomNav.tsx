import type { Section } from '@/hooks/app'

interface BottomNavProps {
  section: Section
  sectionCounts: Record<Section, number>
  onSectionChange: (section: Section) => void
}

const TABS: { id: Section; label: string; icon: string }[] = [
  { id: 'qa', label: 'Q&A', icon: '📖' },
  { id: 'flashcards', label: 'Cards', icon: '🃏' },
  { id: 'coding', label: 'Code', icon: '💻' },
  { id: 'exam', label: 'Exam', icon: '📝' },
  { id: 'voice', label: 'Voice', icon: '🎤' },
]

export function BottomNav({ section, sectionCounts, onSectionChange }: BottomNavProps) {
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-navbar"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex justify-around items-center h-16 px-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onSectionChange(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl glass-transition touch-manipulation touch-feedback relative ${
              section === tab.id
                ? 'text-primary glass-primary'
                : 'text-muted-foreground hover:text-foreground glass-subtle'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
            {sectionCounts[tab.id] > 0 && (
              <span className="absolute -mt-1 -mr-1 w-5 h-5 rounded-full glass-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {sectionCounts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
