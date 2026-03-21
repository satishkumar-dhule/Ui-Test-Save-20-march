import type { Section } from "@/hooks/app/useAppState";

interface SectionTabsProps {
  section: Section;
  sectionCounts: Record<Section, number>;
  onSectionChange: (section: Section) => void;
}

const TABS: { id: Section; label: string; icon: string }[] = [
  { id: "qa",         label: "Q & A",      icon: "📖" },
  { id: "flashcards", label: "Flashcards",  icon: "🃏" },
  { id: "coding",     label: "Coding",      icon: "💻" },
  { id: "exam",       label: "Exam",        icon: "📝" },
  { id: "voice",      label: "Voice Lab",   icon: "🎤" },
];

export function SectionTabs({ section, sectionCounts, onSectionChange }: SectionTabsProps) {
  return (
    <div
      className="flex-shrink-0 flex items-center border-b border-border/50 px-4 gap-0 bg-background overflow-x-auto"
      style={{ height: 42 }}
      data-testid="section-tabs"
    >
      {TABS.map((tab) => (
        <SectionTab
          key={tab.id}
          tab={tab}
          isActive={section === tab.id}
          count={sectionCounts[tab.id]}
          onClick={() => onSectionChange(tab.id)}
        />
      ))}
    </div>
  );
}

function SectionTab({
  tab,
  isActive,
  count,
  onClick,
}: {
  tab: { id: Section; label: string; icon: string };
  isActive: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      data-testid={`section-tab-${tab.id}`}
      onClick={onClick}
      className="relative flex items-center gap-1.5 px-3 h-full shrink-0 transition-colors duration-150 group"
      style={{
        color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
      }}
    >
      <span className="text-[10px] uppercase tracking-widest font-bold">
        {tab.label}
      </span>
      {count > 0 && (
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-colors"
          style={{
            background: isActive
              ? "hsl(var(--primary) / 0.15)"
              : "hsl(var(--muted))",
            color: isActive
              ? "hsl(var(--primary))"
              : "hsl(var(--muted-foreground))",
          }}
        >
          {count}
        </span>
      )}
      {/* Active underline */}
      <span
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full transition-all duration-150"
        style={{
          background: isActive ? "hsl(var(--primary) / 0.5)" : "transparent",
        }}
      />
    </button>
  );
}
