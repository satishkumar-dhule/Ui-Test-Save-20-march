import type { Section } from "@/hooks/app/useAppState";

interface SectionTabsProps {
  section: Section;
  sectionCounts: Record<Section, number>;
  onSectionChange: (section: Section) => void;
}

/**
 * Section navigation tabs (Q&A, Flashcards, Coding, Exam, Voice)
 */
export function SectionTabs({
  section,
  sectionCounts,
  onSectionChange,
}: SectionTabsProps) {
  const tabs: { id: Section; label: string; emoji: string }[] = [
    { id: "qa", label: "Q&A", emoji: "📖" },
    { id: "flashcards", label: "Flashcards", emoji: "🃏" },
    { id: "coding", label: "Coding", emoji: "💻" },
    { id: "exam", label: "Mock Exam", emoji: "📝" },
    { id: "voice", label: "Voice", emoji: "🎤" },
  ];

  return (
    <div
      className="flex-shrink-0 flex items-center border-b border-border px-4 gap-0.5 bg-background overflow-x-auto"
      style={{ height: 44 }}
      data-testid="section-tabs"
    >
      {tabs.map((tab) => (
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

/**
 * Individual section tab button
 */
function SectionTab({
  tab,
  isActive,
  count,
  onClick,
}: {
  tab: { id: Section; label: string; emoji: string };
  isActive: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      key={tab.id}
      data-testid={`section-tab-${tab.id}`}
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 h-11 text-sm transition-all shrink-0"
      style={{
        borderBottom: `2px solid ${isActive ? "hsl(var(--chart-3))" : "transparent"}`,
        fontWeight: isActive ? 600 : 400,
      }}
    >
      <span
        className={isActive ? "text-foreground" : "text-muted-foreground"}
      >
        {tab.emoji} {tab.label}
      </span>
      {count > 0 && (
        <CountBadge isActive={isActive} count={count} />
      )}
    </button>
  );
}

/**
 * Count badge displayed next to section tab
 */
function CountBadge({ isActive, count }: { isActive: boolean; count: number }) {
  return (
    <span
      className="text-[10px] font-bold px-1.5 rounded-full"
      style={{
        background: isActive
          ? "hsl(var(--chart-3) / 0.2)"
          : "hsl(var(--muted))",
        color: isActive
          ? "hsl(var(--chart-3))"
          : "hsl(var(--muted-foreground))",
      }}
    >
      {count}
    </span>
  );
}
