import type { Section } from '@/hooks/app'
import { BookOpen, Layers, Code, FileText, Mic } from 'lucide-react'

interface BottomNavProps {
  section: Section
  sectionCounts: Record<Section, number>
  onSectionChange: (section: Section) => void
}

const TABS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'qa', label: 'Q&A', icon: <BookOpen className="h-5 w-5" /> },
  { id: 'flashcards', label: 'Cards', icon: <Layers className="h-5 w-5" /> },
  { id: 'coding', label: 'Code', icon: <Code className="h-5 w-5" /> },
  { id: 'exam', label: 'Exam', icon: <FileText className="h-5 w-5" /> },
  { id: 'voice', label: 'Voice', icon: <Mic className="h-5 w-5" /> },
]

export function BottomNav({ section, sectionCounts, onSectionChange }: BottomNavProps) {
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex justify-around items-center h-16 px-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onSectionChange(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl touch-manipulation touch-feedback relative transition-colors ${
              section === tab.id
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
            aria-pressed={section === tab.id}
            aria-label={`${tab.label} section${sectionCounts[tab.id] > 0 ? `, ${sectionCounts[tab.id]} items` : ''}`}
          >
            <span className="text-primary">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
            {sectionCounts[tab.id] > 0 && (
              <span className="absolute top-0 right-0 -translate-y-1 -translate-x-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {sectionCounts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
