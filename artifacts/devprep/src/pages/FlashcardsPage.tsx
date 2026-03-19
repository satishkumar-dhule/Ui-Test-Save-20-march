import { useState, useEffect, useCallback } from "react";
import {
  Layers,
  RotateCcw,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import type { Flashcard, CardStatus } from "@/data/flashcards";
import { progressApi } from "@/services/progressApi";
import {
  Skeleton,
  SkeletonGroup,
  SkeletonLine,
} from "@/components/ui/skeleton";
import {
  FLASHCARD_STATUS,
  TIMEOUT_DURATIONS,
  UI_CONSTANTS,
} from "@/lib/constants";

const STATUS_COLORS: Record<CardStatus, string> = {
  known: "hsl(var(--chart-2))",
  reviewing: "hsl(var(--chart-3))",
  hard: "hsl(var(--chart-5))",
  unseen: "hsl(var(--muted-foreground))",
};

const STATUS_LABELS: Record<CardStatus, string> = {
  known: "Known",
  reviewing: "Reviewing",
  hard: "Hard",
  unseen: "Unseen",
};

// Keyboard shortcuts mapped to status
const KEYBOARD_STATUS_MAP: Record<string, CardStatus> = {
  "1": FLASHCARD_STATUS.KNOWN,
  "2": FLASHCARD_STATUS.REVIEWING,
  "3": FLASHCARD_STATUS.HARD,
};

// Navigation direction constants
const NAVIGATION = {
  NEXT: 1 as const,
  PREVIOUS: -1 as const,
};

interface FlashcardsPageProps {
  flashcards: Flashcard[];
  categories: string[];
  channelId: string;
  onFlashcardUpdate?: (cardId: string, status: CardStatus) => void;
  isLoading?: boolean;
}

function FlashcardSkeleton() {
  return (
    <div 
      className="w-full max-w-xl" 
      style={{ perspective: UI_CONSTANTS.FLASHCARD_PERSPECTIVE }}
    >
      <div
        className="rounded-xl border border-border bg-card p-6"
        style={{ minHeight: UI_CONSTANTS.FLASHCARD_MIN_HEIGHT }}
      >
        <Skeleton variant="text" className="w-20 h-3 mb-4" />
        <Skeleton variant="heading" className="w-full mb-3" />
        <Skeleton variant="text" className="w-3/4 mx-auto mb-2" />
        <Skeleton variant="text" className="w-1/2 mx-auto mb-4" />
        <Skeleton variant="text" className="w-32 mx-auto" />
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex-shrink-0 flex-col border-r border-border overflow-hidden bg-card w-72 hidden md:flex">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Skeleton variant="text" className="w-20 h-4" />
          <Skeleton variant="text" className="w-8 h-5 ml-auto rounded-full" />
        </div>
      </div>
      <div className="px-4 py-3 border-b border-border">
        <Skeleton variant="text" className="w-24 h-2 mb-2" />
        <Skeleton variant="text" className="w-full h-1.5 rounded-full" />
      </div>
      <div className="flex-1 p-3 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2.5">
            <Skeleton variant="avatar" className="w-2 h-2 rounded-full" />
            <Skeleton variant="text" className="flex-1 h-3" />
            <Skeleton variant="text" className="w-6 h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FlashcardsPage({
  flashcards,
  categories,
  channelId,
  onFlashcardUpdate,
  isLoading = false,
}: FlashcardsPageProps) {
  const [statuses, setStatuses] = useState<Record<string, CardStatus>>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [filterCat, setFilterCat] = useState("All");
  const [order, setOrder] = useState<number[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setActiveIdx(0);
    setFlipped(false);
    setFilterCat("All");
    const idxs = flashcards.map((_, i) => i);
    setOrder(idxs);
  }, [channelId, flashcards]);

  const filtered =
    filterCat === "All"
      ? flashcards
      : flashcards.filter((f) => f.category === filterCat);
  const orderedCards = order
    .map((i) => flashcards[i])
    .filter(Boolean)
    .filter((f) => filterCat === "All" || f.category === filterCat);
  const displayCards = orderedCards.length > 0 ? orderedCards : filtered;
  const active = displayCards[activeIdx];

  const knownCount = displayCards.filter(
    (f) => statuses[f.id] === FLASHCARD_STATUS.KNOWN,
  ).length;
  const reviewingCount = displayCards.filter(
    (f) => statuses[f.id] === FLASHCARD_STATUS.REVIEWING,
  ).length;
  const hardCount = displayCards.filter(
    (f) => statuses[f.id] === FLASHCARD_STATUS.HARD,
  ).length;
  const unseenCount = displayCards.filter(
    (f) => !statuses[f.id] || statuses[f.id] === FLASHCARD_STATUS.UNSEEN,
  ).length;
  const progressPct =
    displayCards.length > 0
      ? Math.round(((knownCount + reviewingCount) / displayCards.length) * 100)
      : 0;

  const done =
    displayCards.length > 0 &&
    displayCards.every((f) => statuses[f.id] && statuses[f.id] !== FLASHCARD_STATUS.UNSEEN);

  const go = useCallback((dir: 1 | -1) => {
    setFlipped(false);
    setActiveIdx((i) => {
      const max = displayCards.length - 1;
      return Math.max(0, Math.min(max, i + dir));
    });
  }, [displayCards.length]);

  const mark = (status: CardStatus) => {
    if (!active) return;
    setStatuses((prev) => ({ ...prev, [active.id]: status }));
    onFlashcardUpdate?.(active.id, status);
    progressApi.saveFlashcard(channelId, active.id, status);
    if (activeIdx < displayCards.length - 1) {
      setTimeout(() => go(NAVIGATION.NEXT), TIMEOUT_DURATIONS.AUTO_ADVANCE_DELAY);
    }
  };

  const doShuffle = () => {
    const arr = filtered.map((_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOrder(arr);
    setActiveIdx(0);
    setFlipped(false);
    setShuffle(true);
  };

  const reset = () => {
    setStatuses({});
    setActiveIdx(0);
    setFlipped(false);
    setShuffle(false);
    setOrder(flashcards.map((_, i) => i));
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        if (document.activeElement?.closest(".flip-card")) {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }
      if (e.key === "ArrowLeft") go(NAVIGATION.PREVIOUS);
      if (e.key === "ArrowRight") go(NAVIGATION.NEXT);
      
      // Handle status marking with keyboard shortcuts
      const status = KEYBOARD_STATUS_MAP[e.key];
      if (status && flipped) {
        mark(status);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go, flipped, active]);

  if (isLoading) {
    return (
      <div className="flex flex-1 h-full overflow-hidden">
        <SidebarSkeleton />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className="flex items-center gap-2 px-4 border-b border-border bg-card/50"
            style={{ height: UI_CONSTANTS.SECTION_TABS_HEIGHT }}
          >
            <Skeleton variant="text" className="w-8 h-8 rounded" />
            <Skeleton variant="text" className="w-20 h-7 rounded" />
            <Skeleton variant="text" className="w-16 h-7 rounded" />
            <Skeleton variant="text" className="w-16 ml-auto h-7 rounded" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 overflow-auto">
            <FlashcardSkeleton />
            <div className="flex gap-2">
              <Skeleton variant="text" className="w-20 h-6 rounded-full" />
              <Skeleton variant="text" className="w-20 h-6 rounded-full" />
              <Skeleton variant="text" className="w-20 h-6 rounded-full" />
              <Skeleton variant="text" className="w-20 h-6 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Layers size={48} className="text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No flashcards for this channel
        </h3>
      </div>
    );
  }

  const currentStatus: CardStatus = active
    ? statuses[active.id] || FLASHCARD_STATUS.UNSEEN
    : FLASHCARD_STATUS.UNSEEN;

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div
        className={`sidebar flex-shrink-0 flex-col border-r border-border overflow-hidden bg-card ${sidebarOpen ? "fixed left-0 top-0 h-full z-40 flex w-72" : "hidden md:flex"}`}
        style={{ width: UI_CONSTANTS.SIDEBAR_WIDTH }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Layers size={14} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">
            Flashcards
          </span>
          <span className="ml-auto text-[10px] font-bold bg-primary/15 text-primary px-1.5 rounded-full">
            {displayCards.length}
          </span>
        </div>

        {/* Progress */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
            <span>Progress</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              data-testid="flashcard-progress-bar"
              className="h-full rounded-full transition-all"
              style={{
                width: `${progressPct}%`,
                background: "hsl(var(--primary))",
              }}
            />
          </div>
        </div>

        {/* Status grid */}
        <div className="grid grid-cols-2 gap-1.5 p-3 border-b border-border">
          {([
            FLASHCARD_STATUS.KNOWN,
            FLASHCARD_STATUS.REVIEWING,
            FLASHCARD_STATUS.HARD,
            FLASHCARD_STATUS.UNSEEN,
          ] as CardStatus[]).map((s) => {
            const count =
              s === FLASHCARD_STATUS.UNSEEN
                ? unseenCount
                : s === FLASHCARD_STATUS.KNOWN
                  ? knownCount
                  : s === FLASHCARD_STATUS.REVIEWING
                    ? reviewingCount
                    : hardCount;
            return (
              <div
                key={s}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-muted/30"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: STATUS_COLORS[s] }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {STATUS_LABELS[s]}
                </span>
                <span className="ml-auto text-[11px] font-bold text-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="p-3 border-b border-border">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
              Category
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["All", ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setFilterCat(cat);
                    setActiveIdx(0);
                    setFlipped(false);
                  }}
                  className="text-[11px] px-2 py-0.5 rounded-full border transition-colors"
                  style={{
                    borderColor:
                      filterCat === cat
                        ? "hsl(var(--primary))"
                        : "hsl(var(--border))",
                    color:
                      filterCat === cat ? "hsl(var(--primary))" : undefined,
                    background:
                      filterCat === cat
                        ? "hsl(var(--primary) / 0.1)"
                        : undefined,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card list */}
        <div className="flex-1 overflow-y-auto">
          {displayCards.map((f, i) => {
            const st = statuses[f.id] || FLASHCARD_STATUS.UNSEEN;
            return (
              <button
                key={f.id}
                onClick={() => {
                  setActiveIdx(i);
                  setFlipped(false);
                  setSidebarOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 transition-colors hover:bg-muted/50 border-l-2 flex items-center gap-2"
                style={{
                  borderLeftColor:
                    i === activeIdx ? "hsl(var(--primary))" : "transparent",
                  background:
                    i === activeIdx ? "hsl(var(--primary) / 0.06)" : undefined,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: STATUS_COLORS[st] }}
                />
                <span className="text-xs text-foreground line-clamp-2 flex-1">
                  {f.front}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  #{i + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div
          className="flex items-center gap-2 px-4 border-b border-border bg-card/50"
          style={{ height: UI_CONSTANTS.SECTION_TABS_HEIGHT }}
        >
          <button
            aria-label="Open sidebar menu"
            className="mob-menu md:hidden items-center justify-center w-8 h-8 rounded hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={16} />
          </button>
          <button
            data-testid="flashcard-shuffle-btn"
            onClick={shuffle ? reset : doShuffle}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-border hover:bg-muted transition-colors"
            style={{ color: shuffle ? "hsl(var(--primary))" : undefined }}
          >
            <Shuffle size={12} /> {shuffle ? "Shuffled" : "Shuffle"}
          </button>
          <button
            data-testid="flashcard-reset-btn"
            onClick={reset}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border border-border hover:bg-muted transition-colors text-muted-foreground"
          >
            <RotateCcw size={12} /> Reset
          </button>
          <span className="text-xs text-muted-foreground ml-auto">
            {activeIdx + 1} / {displayCards.length}
          </span>
          <button
            aria-label="Previous flashcard"
            onClick={() => go(NAVIGATION.PREVIOUS)}
            disabled={activeIdx === 0}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            aria-label="Next flashcard"
            onClick={() => go(NAVIGATION.NEXT)}
            disabled={activeIdx === displayCards.length - 1}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Card area */}
        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
            <div className="text-5xl">🎉</div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Deck Complete!
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Known:{" "}
                <span style={{ color: STATUS_COLORS.known }}>{knownCount}</span>{" "}
                · Reviewing:{" "}
                <span style={{ color: STATUS_COLORS.reviewing }}>
                  {reviewingCount}
                </span>{" "}
                · Hard:{" "}
                <span style={{ color: STATUS_COLORS.hard }}>{hardCount}</span>
              </p>
              <button
                onClick={reset}
                className="px-5 py-2 rounded-lg text-sm font-bold"
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                Restart →
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4 overflow-auto">
            {/* 3D flip card - 60fps optimized */}
            <div
              className={`w-full max-w-xl flip-card ${flipped ? "flipped" : ""}`}
              style={{ perspective: UI_CONSTANTS.FLASHCARD_PERSPECTIVE }}
            >
              <button
                className="flip-card-inner w-full cursor-pointer"
                style={{ minHeight: UI_CONSTANTS.FLASHCARD_MIN_HEIGHT }}
                onClick={() => setFlipped((f) => !f)}
                data-testid="flashcard-flip"
                aria-label={flipped ? "Show question side" : "Show answer side"}
                aria-pressed={flipped}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    setFlipped((f) => !f);
                  }
                }}
              >
                {/* Front */}
                <div className="flip-card-front rounded-xl border border-border bg-card flex flex-col items-center justify-center p-6 gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {active?.category}
                  </span>
                  <p className="text-lg font-bold text-foreground text-center leading-snug">
                    {active?.front}
                  </p>
                  {active?.hint && (
                    <p className="text-xs text-muted-foreground italic">
                      Hint: {active.hint}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-auto">
                    <span className="hidden sm:inline">
                      Click or press Space to reveal answer
                    </span>
                    <span className="sm:hidden">Tap to reveal answer</span>
                  </p>
                </div>
                {/* Back */}
                <div className="flip-card-back rounded-xl border border-border bg-card flex flex-col p-6 gap-3">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "hsl(var(--primary))" }}
                  >
                    ANSWER
                  </span>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {active?.back}
                  </p>
                  {active?.codeExample && (
                    <pre className="text-xs font-mono p-3 rounded-lg bg-muted text-foreground overflow-x-auto">
                      {active.codeExample.code}
                    </pre>
                  )}
                </div>
              </button>
            </div>

            {/* Status chips */}
            <div className="flex gap-2">
              {([
                FLASHCARD_STATUS.KNOWN,
                FLASHCARD_STATUS.REVIEWING,
                FLASHCARD_STATUS.HARD,
                FLASHCARD_STATUS.UNSEEN,
              ] as CardStatus[]).map(
                (s) => (
                  <span
                    key={s}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      borderColor:
                        STATUS_COLORS[s] + (currentStatus === s ? "ff" : "44"),
                      color:
                        currentStatus === s
                          ? STATUS_COLORS[s]
                          : "hsl(var(--muted-foreground))",
                      background:
                        currentStatus === s
                          ? STATUS_COLORS[s] + "20"
                          : undefined,
                    }}
                  >
                    {STATUS_LABELS[s]}
                  </span>
                ),
              )}
            </div>

            {/* Action buttons - 44px touch targets */}
            {flipped && (
              <div
                className="flex gap-3"
                role="group"
                aria-label="Mark card status"
              >
                <button
                  data-testid="flashcard-known"
                  onClick={() => mark(FLASHCARD_STATUS.KNOWN)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all btn-micro touch-target"
                  style={{
                    borderColor: STATUS_COLORS.known + "66",
                    color: STATUS_COLORS.known,
                    background: STATUS_COLORS.known + "15",
                  }}
                  aria-label="Mark as known (shortcut: 1)"
                >
                  <span aria-hidden="true">✅</span> Know it{" "}
                  <span className="hidden sm:inline text-xs opacity-60 ml-1">
                    (1)
                  </span>
                </button>
                <button
                  data-testid="flashcard-reviewing"
                  onClick={() => mark(FLASHCARD_STATUS.REVIEWING)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all btn-micro touch-target"
                  style={{
                    borderColor: STATUS_COLORS.reviewing + "66",
                    color: STATUS_COLORS.reviewing,
                    background: STATUS_COLORS.reviewing + "15",
                  }}
                  aria-label="Mark for review (shortcut: 2)"
                >
                  <span aria-hidden="true">🔄</span> Review{" "}
                  <span className="hidden sm:inline text-xs opacity-60 ml-1">
                    (2)
                  </span>
                </button>
                <button
                  data-testid="flashcard-hard"
                  onClick={() => mark(FLASHCARD_STATUS.HARD)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all btn-micro touch-target"
                  style={{
                    borderColor: STATUS_COLORS.hard + "66",
                    color: STATUS_COLORS.hard,
                    background: STATUS_COLORS.hard + "15",
                  }}
                  aria-label="Mark as hard (shortcut: 3)"
                >
                  <span aria-hidden="true">❌</span> Hard{" "}
                  <span className="hidden sm:inline text-xs opacity-60 ml-1">
                    (3)
                  </span>
                </button>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Space = flip · ← / → navigate
              {flipped ? " · 1=Know 2=Review 3=Hard" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
